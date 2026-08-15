// lidar_fe.v - hab-bot-01 flash-LiDAR digital front end (sky130 target).
//
// The compute ledger priced this block at 0.57 mm^2 by SCALING (MB-1 cell
// density + SRAM macro density). This RTL makes the number measurable.
//
// Architecture note (why no 500 MHz clock): each SPAD microcell latches at
// most ONE timestamp per gate, and gates repeat at ms scale. So stamps are
// serialized between gates - one (channel, bin) pair per clock - and the
// histogram needs exactly one increment port. 1024 stamps drain in ~10 us
// at 100 MHz. The 2 ns bin resolution lives in the (analog) per-cell latch,
// not in this core's clock.
//
// Pipeline per gate: CLEAR -> ACCUM (streamed stamps) -> SCAN (peak search)
// -> CENTROID (3-bin sub-bin interpolation, restoring divider) -> WALK
// (fired-count -> lambda LUT correction) -> result strobe per channel.
//
// Result fixed-point: range_q8 = peak_bin*256 + frac256 - walk_q8
// (bin units, Q8; the MCU converts to metres: bin * 2 ns * c/2).
`default_nettype none

module lidar_fe #(
    parameter NCH   = 15,          // beams
    parameter NBINS = 70,          // 140 ns gate / 2 ns
    parameter CNTW  = 12,          // histogram counter width (1024 max hits)
    parameter BINW  = 7,           // ceil(log2 NBINS)
    parameter CHW   = 4            // ceil(log2 NCH)
) (
    input  wire                clk,
    input  wire                rst_n,

    // gate control
    input  wire                gate_clear,     // pulse: zero all histograms
    input  wire                accum_done,     // pulse: stamps all in, process

    // serialized stamp stream (one per clock when valid)
    input  wire                stamp_valid,
    input  wire [CHW-1:0]      stamp_ch,
    input  wire [BINW-1:0]     stamp_bin,

    // per-channel result stream
    output reg                 res_valid,
    output reg  [CHW-1:0]      res_ch,
    output reg  [BINW+8:0]     res_range_q8,   // bin index Q8, walk-corrected
    output reg  [CNTW-1:0]     res_peak_cnt,
    output reg                 busy
);

    localparam [2:0] S_IDLE = 3'd0, S_CLEAR = 3'd1, S_ACCUM = 3'd2,
                     S_SCAN = 3'd3, S_DIV = 3'd4, S_WALK = 3'd5, S_OUT = 3'd6;

    reg [2:0] state;

    // ---- histogram store: 15 per-channel BANKS ----
    // A first netlist kept one flat 1050-entry register file; synthesis was
    // fine (0.683 mm^2) but P&R died three times on GRT-0118: the flat
    // 1050:1 x 12 b read mux converges ~12,600 nets on one spot, and no
    // placement knob (routability-driven, density 0.45, 50 GRT iterations)
    // could route it. Banking is a WIRING fix, not an area fix: each bank
    // selects its own bin locally and only 12 wires leave, so the global
    // read network shrinks from 12,600 nets to 15x12 = 180. This is also
    // why real histogram chips use SRAM macros - column muxing is the
    // routability, the density is a bonus. Clears also parallelize
    // (70 cycles instead of 1050).
    reg [CNTW-1:0] fired [0:NCH-1];            // fired-cell count per channel

    reg                 bank_clear;
    wire [NCH-1:0]      bank_busy;
    wire [CNTW*NCH-1:0] bank_rd;
    reg  [CHW-1:0]      sc_ch;
    reg  [BINW-1:0]     sc_bin;

    genvar gb;
    generate
        for (gb = 0; gb < NCH; gb = gb + 1) begin : g_bank
            hist_bank #(.NBINS(NBINS), .CNTW(CNTW), .BINW(BINW)) u_bank (
                .clk(clk), .rst_n(rst_n),
                .clear(bank_clear),
                .inc_v(stamp_valid && (stamp_ch == gb[CHW-1:0])
                       && (state == S_ACCUM)),
                .inc_bin(stamp_bin),
                .rd_bin(sc_bin),
                .rd_cnt(bank_rd[gb*CNTW +: CNTW]),
                .busy(bank_busy[gb])
            );
        end
    endgenerate

    reg [CHW-1:0] clr_i;                       // fired[] clear sweep

    // per-channel scan state
    reg [CNTW-1:0] best_cnt, prev_cnt, prev2_cnt;
    reg [BINW-1:0] best_bin;
    reg [CNTW-1:0] best_l, best_r;              // neighbours of the peak
    reg [CNTW-1:0] cur_cnt_d;                   // scan pipeline reg

    // centroid divider: frac256 = 256*|R-L| / (L+P+R), sign applied at output.
    // P >= max(L,R) >= |R-L| so den >= |R-L| and the quotient is <= 256: nine
    // long-division steps with the divisor pre-shifted 8..0 are exact.
    reg  [CNTW+9:0] div_num;
    reg  [CNTW+1:0] div_den;
    reg  [8:0]      div_q;
    reg             div_sign;
    reg  [3:0]      div_i;

    // walk-correction LUT: fired count (top 5 bits of /NCH? no - per channel
    // count /32) -> Q8 bin correction. 32-entry case ROM, values from the
    // ranging Monte Carlo's walk fit (monotone, saturating).
    function [7:0] walk_q8;
        input [4:0] idx;                        // fired[ch] >> 5  (0..31 of 1024)
        begin
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
                5'd28: walk_q8 = 8'd255; 5'd29: walk_q8 = 8'd255;
                5'd30: walk_q8 = 8'd255; 5'd31: walk_q8 = 8'd255;
            endcase
        end
    endfunction

    integer k;
    wire [CNTW-1:0] cur_cnt = bank_rd[sc_ch*CNTW +: CNTW];

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state <= S_IDLE; busy <= 1'b0; res_valid <= 1'b0;
            bank_clear <= 1'b0; clr_i <= 0; sc_ch <= 0; sc_bin <= 0;
        end else begin
            res_valid <= 1'b0;
            bank_clear <= 1'b0;

            // stamp accumulation: banks handle their own increments; the
            // fired counters live here
            if (state == S_ACCUM && stamp_valid)
                fired[stamp_ch] <= fired[stamp_ch] + {{(CNTW-1){1'b0}}, 1'b1};

            case (state)
                S_IDLE: begin
                    busy <= 1'b0;
                    if (gate_clear) begin
                        state <= S_CLEAR; clr_i <= 0; busy <= 1'b1;
                        bank_clear <= 1'b1;        // all banks sweep in parallel
                    end
                end

                S_CLEAR: begin
                    if (clr_i < NCH) begin
                        fired[clr_i] <= {CNTW{1'b0}};
                        clr_i <= clr_i + 1'b1;
                    end
                    if (clr_i >= NCH && bank_busy == {NCH{1'b0}})
                        state <= S_ACCUM;
                end

                S_ACCUM: begin
                    busy <= 1'b0;                       // ready for stamps
                    if (accum_done) begin
                        state <= S_SCAN; busy <= 1'b1;
                        sc_ch <= 0; sc_bin <= 0;
                        best_cnt <= 0; best_bin <= 0; best_l <= 0; best_r <= 0;
                        prev_cnt <= 0; prev2_cnt <= 0; cur_cnt_d <= 0;
                    end
                end

                // one bin per clock; track peak and its two neighbours
                S_SCAN: begin
                    cur_cnt_d <= cur_cnt;
                    prev_cnt  <= cur_cnt_d;
                    prev2_cnt <= prev_cnt;
                    // cur_cnt_d holds bin sc_bin-1's count (pipeline by 1)
                    if (sc_bin != 0 && cur_cnt_d > best_cnt) begin
                        best_cnt <= cur_cnt_d;
                        best_bin <= sc_bin - 1'b1;
                        best_l   <= prev_cnt;           // bin-2's count = left
                        best_r   <= cur_cnt;            // current = right
                    end
                    if (sc_bin == NBINS-1) begin
                        state <= S_DIV;
                        // divider setup: num = 256*(R-L), den = L+P+R
                        div_num  <= 0; div_den <= 0;    // loaded next state
                        div_i    <= 0;
                    end
                    sc_bin <= (sc_bin == NBINS-1) ? {BINW{1'b0}} : sc_bin + 1'b1;
                end

                S_DIV: begin
                    if (div_i == 0) begin
                        div_sign <= (best_r < best_l);
                        div_num  <= (best_r < best_l)
                                    ? {best_l - best_r, 8'b0}
                                    : {best_r - best_l, 8'b0};
                        div_den  <= best_l + best_cnt + best_r;
                        div_q    <= 0;
                        div_i    <= 1;
                    end else if (div_i <= 9) begin
                        // long division, divisor shifted 8..0
                        if (div_den != 0 &&
                            div_num >= ({{8{1'b0}}, div_den} << (4'd9 - div_i))) begin
                            div_num <= div_num
                                       - ({{8{1'b0}}, div_den} << (4'd9 - div_i));
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
                    // range_q8 = bin*256 + signed frac - walk(fired)
                    res_ch       <= sc_ch;
                    res_peak_cnt <= best_cnt;
                    res_range_q8 <= ({{9{1'b0}}, best_bin, 8'b0}
                                     + (div_sign ? -{{(BINW+1){1'b0}}, div_q}
                                                 :  {{(BINW+1){1'b0}}, div_q}))
                                    - {{(BINW+1){1'b0}}, 1'b0, walk_q8(fired[sc_ch][9:5])};
                    state <= S_OUT;
                end

                S_OUT: begin
                    res_valid <= 1'b1;
                    if (sc_ch == NCH-1) begin
                        state <= S_IDLE;
                    end else begin
                        sc_ch <= sc_ch + 1'b1;
                        sc_bin <= 0;
                        best_cnt <= 0; best_bin <= 0; best_l <= 0; best_r <= 0;
                        prev_cnt <= 0; prev2_cnt <= 0; cur_cnt_d <= 0;
                        state <= S_SCAN;
                    end
                end

                default: state <= S_IDLE;
            endcase
        end
    end

endmodule

// One per-channel histogram bank: local increment decode, local clear sweep,
// local 70:1 read select - only CNTW wires leave the bank.
module hist_bank #(
    parameter NBINS = 70,
    parameter CNTW  = 12,
    parameter BINW  = 7
) (
    input  wire            clk,
    input  wire            rst_n,
    input  wire            clear,        // pulse: start internal zero sweep
    input  wire            inc_v,
    input  wire [BINW-1:0] inc_bin,
    input  wire [BINW-1:0] rd_bin,
    output wire [CNTW-1:0] rd_cnt,
    output reg             busy
);
    reg [CNTW-1:0] mem [0:NBINS-1];
    reg [BINW-1:0] ci;

    assign rd_cnt = mem[rd_bin];

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            busy <= 1'b0; ci <= 0;
        end else if (clear) begin
            busy <= 1'b1; ci <= 0;
        end else if (busy) begin
            mem[ci] <= {CNTW{1'b0}};
            if (ci == NBINS-1) busy <= 1'b0;
            ci <= ci + 1'b1;
        end else if (inc_v) begin
            mem[inc_bin] <= mem[inc_bin] + {{(CNTW-1){1'b0}}, 1'b1};
        end
    end
endmodule
`default_nettype wire
