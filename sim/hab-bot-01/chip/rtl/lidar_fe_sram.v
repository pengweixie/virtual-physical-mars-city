// lidar_fe_sram.v - the SRAM-backed variant of hab-bot-01's LiDAR front end.
//
// WHY THIS EXISTS. The flop-based version (lidar_fe.v) synthesizes smaller
// than the original SRAM-macro scaling estimate, and then loses eight rounds
// of place-and-route: 12.9k enable-flops put more pins in the core than the
// router can escape (chip/pnr/RESULTS.md). The campaign's own conclusion was
// that a histogram chip uses an SRAM macro not for density but because the
// macro's column muxing IS the read mux, pre-routed inside a hard block. This
// file tests that conclusion instead of asserting it.
//
// MAPPING. 15 channels x 70 bins = 1050 counters. Packed 3 x 10 bit into each
// 32-bit word puts all of them in 350 words of ONE 512x32 macro:
//     word = bin*5 + (ch/3)      (bin*5 = bin<<2 + bin; ch/3 from a 15-entry LUT)
//     slot = ch%3
// Counters saturate at 1023 rather than wrapping. That is not a compromise:
// a single 2 ns bin can only approach 1024 counts when essentially every
// microcell fires on one edge, which is the saturated close-range regime the
// ranging ledger already declares proximity-only. The saturation flag is a
// free second opinion on it.
//
// PIPELINE. Port 1 (read-only) serves accumulate reads and the peak scan;
// port 0 (rw) serves the increment write-back and the clear sweep, so the two
// never contend. Read latency is one cycle, so accumulate is a 2-stage
// read-modify-write and back-to-back stamps into the same word are covered by
// a one-deep write bypass (three in a row work too, because the bypass is
// refreshed every cycle with the value just written).
`default_nettype none

module lidar_fe_sram #(
    parameter NCH   = 15,
    parameter NBINS = 70,
    parameter CNTW  = 12,          // interface counter width (unchanged)
    parameter BINW  = 7,
    parameter CHW   = 4,
    parameter MEMW  = 10,          // stored counter width, saturating
    parameter AW    = 9
) (
    input  wire                clk,
    input  wire                rst_n,
    input  wire                gate_clear,
    input  wire                accum_done,
    input  wire                stamp_valid,
    input  wire [CHW-1:0]      stamp_ch,
    input  wire [BINW-1:0]     stamp_bin,
    output reg                 res_valid,
    output reg  [CHW-1:0]      res_ch,
    output reg  [BINW+8:0]     res_range_q8,
    output reg  [CNTW-1:0]     res_peak_cnt,
    output reg                 busy
);
    localparam [2:0] S_IDLE = 3'd0, S_CLEAR = 3'd1, S_ACCUM = 3'd2,
                     S_SCAN = 3'd3, S_DIV = 3'd4, S_WALK = 3'd5, S_OUT = 3'd6;
    localparam NWORD = 350;

    reg [2:0] state;

    // ---- address arithmetic ----
    function [1:0] ch_mod3; input [CHW-1:0] c;
        case (c)
            4'd0,4'd3,4'd6,4'd9,4'd12: ch_mod3 = 2'd0;
            4'd1,4'd4,4'd7,4'd10,4'd13: ch_mod3 = 2'd1;
            default: ch_mod3 = 2'd2;
        endcase
    endfunction
    function [2:0] ch_div3; input [CHW-1:0] c;
        case (c)
            4'd0,4'd1,4'd2: ch_div3 = 3'd0;
            4'd3,4'd4,4'd5: ch_div3 = 3'd1;
            4'd6,4'd7,4'd8: ch_div3 = 3'd2;
            4'd9,4'd10,4'd11: ch_div3 = 3'd3;
            default: ch_div3 = 3'd4;
        endcase
    endfunction
    function [AW-1:0] word_of; input [CHW-1:0] c; input [BINW-1:0] b;
        word_of = {2'b0, b, 2'b0} + {5'b0, b} + {6'b0, ch_div3(c)};   // b*5 + c/3
    endfunction

    // ---- SRAM ports ----
    // Driven COMBINATIONALLY: the macro latches every input on its own clock
    // edge, so a register here would add a second cycle of latency and the
    // read-modify-write would consume stale data (first bring-up did exactly
    // that - every peak came back as zero).
    reg              csb0, web0;
    reg  [AW-1:0]    addr0;
    reg  [31:0]      din0;
    wire [31:0]      dout0;
    reg              csb1;
    reg  [AW-1:0]    addr1;
    wire [31:0]      dout1;

    sky130_sram_2kbyte_1rw1r_32x512_8 u_mem (
        .clk0(clk), .csb0(csb0), .web0(web0), .wmask0(4'b1111),
        .addr0(addr0), .din0(din0), .dout0(dout0),
        .clk1(clk), .csb1(csb1), .addr1(addr1), .dout1(dout1));

    // ---- accumulate pipeline ----
    reg              acc_v;                 // stage-B valid
    reg  [AW-1:0]    acc_word;
    reg  [1:0]       acc_slot;
    reg  [AW-1:0]    byp_word;              // one-deep write bypass
    reg  [31:0]      byp_data;
    reg              byp_v;

    wire [31:0] base_word = (byp_v && byp_word == acc_word) ? byp_data : dout1;
    wire [MEMW-1:0] slot_val =
        (acc_slot == 2'd0) ? base_word[9:0] :
        (acc_slot == 2'd1) ? base_word[19:10] : base_word[29:20];
    wire [MEMW-1:0] slot_inc = (&slot_val) ? slot_val : slot_val + 1'b1;  // saturate
    wire [31:0] merged =
        (acc_slot == 2'd0) ? {base_word[31:10], slot_inc} :
        (acc_slot == 2'd1) ? {base_word[31:20], slot_inc, base_word[9:0]}
                           : {base_word[31:30], slot_inc, base_word[19:0]};

    reg [CNTW-1:0] fired [0:NCH-1];
    reg [AW-1:0]   clr_i;
    reg [CHW-1:0]  fclr_i;

    // ---- scan / result state ----
    reg [CHW-1:0]  sc_ch;
    reg [BINW:0]   iss;                     // 0..NBINS, one ahead of the data
    reg [MEMW-1:0] c1, c2;                  // count[b-1], count[b-2]
    reg [MEMW-1:0] best_cnt, best_l, best_r;
    reg [BINW-1:0] best_bin;

    wire [MEMW-1:0] scan_val =
        (ch_mod3(sc_ch) == 2'd0) ? dout1[9:0] :
        (ch_mod3(sc_ch) == 2'd1) ? dout1[19:10] : dout1[29:20];
    wire beat_v = (iss != 0);
    wire [BINW:0] beat_b = iss - 1'b1;      // this cycle's data is for bin beat_b

    reg [MEMW+9:0] div_num;
    reg [MEMW+1:0] div_den;
    reg [8:0]      div_q;
    reg            div_sign;
    reg [3:0]      div_i;

    function [7:0] walk_q8; input [4:0] idx;
        case (idx)
            5'd0:  walk_q8 = 8'd2;   5'd1:  walk_q8 = 8'd6;
            5'd2:  walk_q8 = 8'd11;  5'd3:  walk_q8 = 8'd16;
            5'd4:  walk_q8 = 8'd21;  5'd5:  walk_q8 = 8'd27;
            5'd6:  walk_q8 = 8'd33;  5'd7:  walk_q8 = 8'd39;
            5'd8:  walk_q8 = 8'd45;  5'd9:  walk_q8 = 8'd52;
            5'd10: walk_q8 = 8'd59;  5'd11: walk_q8 = 8'd66;
            5'd12: walk_q8 = 8'd74;  5'd13: walk_q8 = 8'd82;
            5'd14: walk_q8 = 8'd90;  5'd15: walk_q8 = 8'd99;
            5'd16: walk_q8 = 8'd108; 5'd17: walk_q8 = 8'd118;
            5'd18: walk_q8 = 8'd128; 5'd19: walk_q8 = 8'd139;
            5'd20: walk_q8 = 8'd150; 5'd21: walk_q8 = 8'd162;
            5'd22: walk_q8 = 8'd175; 5'd23: walk_q8 = 8'd188;
            5'd24: walk_q8 = 8'd202; 5'd25: walk_q8 = 8'd217;
            5'd26: walk_q8 = 8'd232; 5'd27: walk_q8 = 8'd248;
            default: walk_q8 = 8'd255;
        endcase
    endfunction

    always @* begin
        csb0 = 1'b1; web0 = 1'b1; addr0 = clr_i; din0 = 32'b0;
        csb1 = 1'b1; addr1 = {AW{1'b0}};
        if (state == S_CLEAR) begin
            csb0 = 1'b0; web0 = 1'b0; addr0 = clr_i; din0 = 32'b0;
        end else if (acc_v) begin
            csb0 = 1'b0; web0 = 1'b0; addr0 = acc_word; din0 = merged;
        end
        if (state == S_ACCUM && stamp_valid) begin
            csb1 = 1'b0; addr1 = word_of(stamp_ch, stamp_bin);
        end else if (state == S_SCAN && iss < NBINS) begin
            csb1 = 1'b0; addr1 = word_of(sc_ch, iss[BINW-1:0]);
        end
    end

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state <= S_IDLE; busy <= 1'b0; res_valid <= 1'b0;
            acc_v <= 1'b0; byp_v <= 1'b0;
            clr_i <= 0; fclr_i <= 0; sc_ch <= 0; iss <= 0;
        end else begin
            res_valid <= 1'b0;
            acc_v <= 1'b0;

            // ---------------- stage B: read-modify-write ----------------
            if (acc_v) begin
                byp_v <= 1'b1; byp_word <= acc_word; byp_data <= merged;
            end

            case (state)
                S_IDLE: begin
                    busy <= 1'b0;
                    if (gate_clear) begin
                        state <= S_CLEAR; busy <= 1'b1;
                        clr_i <= 0; fclr_i <= 0; byp_v <= 1'b0;
                    end
                end

                S_CLEAR: begin
                    if (fclr_i < NCH) begin
                        fired[fclr_i] <= {CNTW{1'b0}};
                        fclr_i <= fclr_i + 1'b1;
                    end
                    if (clr_i == NWORD - 1) state <= S_ACCUM;
                    clr_i <= clr_i + 1'b1;
                end

                S_ACCUM: begin
                    busy <= 1'b0;
                    if (stamp_valid) begin            // stage A: issue the read
                        acc_v <= 1'b1;
                        acc_word <= word_of(stamp_ch, stamp_bin);
                        acc_slot <= ch_mod3(stamp_ch);
                        fired[stamp_ch] <= fired[stamp_ch] + 1'b1;
                    end
                    if (accum_done && !acc_v && !stamp_valid) begin
                        state <= S_SCAN; busy <= 1'b1;
                        sc_ch <= 0; iss <= 0; c1 <= 0; c2 <= 0;
                        best_cnt <= 0; best_bin <= 0; best_l <= 0; best_r <= 0;
                        byp_v <= 1'b0;
                    end
                end

                // one read issued per cycle; the data for bin beat_b lands with it
                S_SCAN: begin
                    if (beat_v) begin
                        // candidate is bin beat_b-1 (value c1) with neighbours c2, scan_val
                        if (beat_b >= 1 && c1 > best_cnt) begin
                            best_cnt <= c1;
                            best_bin <= beat_b[BINW-1:0] - 1'b1;
                            best_l   <= c2;
                            best_r   <= scan_val;
                        end
                        c2 <= c1; c1 <= scan_val;
                    end
                    if (iss == NBINS) begin
                        state <= S_DIV; div_i <= 0;
                    end else begin
                        iss <= iss + 1'b1;
                    end
                end

                S_DIV: begin
                    if (div_i == 0) begin
                        div_sign <= (best_r < best_l);
                        div_num  <= (best_r < best_l) ? {best_l - best_r, 8'b0}
                                                      : {best_r - best_l, 8'b0};
                        div_den  <= best_l + best_cnt + best_r;
                        div_q    <= 0;
                        div_i    <= 1;
                    end else if (div_i <= 9) begin
                        if (div_den != 0 &&
                            div_num >= ({{8{1'b0}}, div_den} << (4'd9 - div_i))) begin
                            div_num <= div_num - ({{8{1'b0}}, div_den} << (4'd9 - div_i));
                            div_q   <= {div_q[7:0], 1'b1};
                        end else begin
                            div_q   <= {div_q[7:0], 1'b0};
                        end
                        div_i <= div_i + 1'b1;
                    end else begin
                        state <= S_WALK;
                    end
                end

                S_WALK: begin
                    res_ch       <= sc_ch;
                    res_peak_cnt <= {{(CNTW-MEMW){1'b0}}, best_cnt};
                    res_range_q8 <= ({{9{1'b0}}, best_bin, 8'b0}
                                     + (div_sign ? -{{(BINW+1){1'b0}}, div_q}
                                                 :  {{(BINW+1){1'b0}}, div_q}))
                                    - {{(BINW+1){1'b0}}, 1'b0, walk_q8(fired[sc_ch][9:5])};
                    state <= S_OUT;
                end

                S_OUT: begin
                    res_valid <= 1'b1;
                    if (sc_ch == NCH - 1) begin
                        state <= S_IDLE;
                    end else begin
                        sc_ch <= sc_ch + 1'b1;
                        iss <= 0; c1 <= 0; c2 <= 0;
                        best_cnt <= 0; best_bin <= 0; best_l <= 0; best_r <= 0;
                        state <= S_SCAN;
                    end
                end

                default: state <= S_IDLE;
            endcase
        end
    end
endmodule
`default_nettype wire
