// Self-checking TB for lidar_fe: three independent implementations agree
// bit-for-bit - DUT (RTL) vs the reference model below (behavioral rewrite)
// vs the Python golden (tools/golden.py) via tv_exp.mem.
`timescale 1ns/1ps

module tb_lidar_fe;
    localparam NCH = 15, NBINS = 70, CNTW = 12;

    reg clk = 0, rst_n = 0;
    always #5 clk = ~clk;

    reg gate_clear = 0, accum_done = 0, stamp_valid = 0;
    reg [3:0] stamp_ch;
    reg [6:0] stamp_bin;
    wire res_valid, busy;
    wire [3:0] res_ch;
    wire [15:0] res_range_q8;
    wire [CNTW-1:0] res_peak_cnt;

    lidar_fe dut (.clk(clk), .rst_n(rst_n), .gate_clear(gate_clear),
                  .accum_done(accum_done), .stamp_valid(stamp_valid),
                  .stamp_ch(stamp_ch), .stamp_bin(stamp_bin),
                  .res_valid(res_valid), .res_ch(res_ch),
                  .res_range_q8(res_range_q8), .res_peak_cnt(res_peak_cnt),
                  .busy(busy));

    // ---------------- reference model (independent rewrite) ----------------
    integer ref_hist [0:NCH-1][0:NBINS-1];
    integer ref_fired [0:NCH-1];
    reg [7:0] WALK [0:31];
    initial begin
        WALK[0]=2;   WALK[1]=6;   WALK[2]=11;  WALK[3]=16;
        WALK[4]=21;  WALK[5]=27;  WALK[6]=33;  WALK[7]=39;
        WALK[8]=45;  WALK[9]=52;  WALK[10]=59; WALK[11]=66;
        WALK[12]=74; WALK[13]=82; WALK[14]=90; WALK[15]=99;
        WALK[16]=108;WALK[17]=118;WALK[18]=128;WALK[19]=139;
        WALK[20]=150;WALK[21]=162;WALK[22]=175;WALK[23]=188;
        WALK[24]=202;WALK[25]=217;WALK[26]=232;WALK[27]=248;
        WALK[28]=255;WALK[29]=255;WALK[30]=255;WALK[31]=255;
    end

    task ref_clear;
        integer c, b;
        begin
            for (c = 0; c < NCH; c = c + 1) begin
                ref_fired[c] = 0;
                for (b = 0; b < NBINS; b = b + 1) ref_hist[c][b] = 0;
            end
        end
    endtask

    task ref_stamp(input integer c, input integer b);
        begin
            ref_hist[c][b] = ref_hist[c][b] + 1;
            ref_fired[c] = ref_fired[c] + 1;
        end
    endtask

    function [15:0] ref_result(input integer c);
        integer b, bc, bb, l, r, den, diff, frac, w;
        reg [15:0] rng;
        begin
            bc = 0; bb = 0;
            for (b = 0; b < NBINS - 1; b = b + 1)     // last bin excluded
                if (ref_hist[c][b] > bc) begin bc = ref_hist[c][b]; bb = b; end
            l = (bb > 0) ? ref_hist[c][bb-1] : 0;
            r = (bb < NBINS-1) ? ref_hist[c][bb+1] : 0;
            den = l + bc + r;
            diff = (r > l) ? (r - l) : (l - r);
            frac = (den != 0) ? (diff * 256) / den : 0;
            w = WALK[(ref_fired[c] >> 5) & 31];
            if (r < l) rng = bb*256 - frac - w;
            else       rng = bb*256 + frac - w;
            ref_result = rng;
        end
    endfunction

    function [CNTW-1:0] ref_peak(input integer c);
        integer b, bc;
        begin
            bc = 0;
            for (b = 0; b < NBINS - 1; b = b + 1)
                if (ref_hist[c][b] > bc) bc = ref_hist[c][b];
            ref_peak = bc[CNTW-1:0];
        end
    endfunction

    // ---------------- driving helpers ----------------
    integer errors = 0;
    integer got;
    integer stim_ch [0:65535];
    integer stim_bin [0:65535];
    reg [27:0] exp_mem [0:NCH-1];
    reg [10:0] stim_raw [0:65535];
    reg exp_mem_loaded = 0;

    task do_gate_from_arrays(input integer nstamps);
        integer i, c;
        reg [15:0] exp_rng;
        begin
            @(negedge clk); gate_clear = 1;
            @(negedge clk); gate_clear = 0;
            wait (busy == 0);                       // clear sweep finished
            for (i = 0; i < nstamps; i = i + 1) begin
                @(negedge clk);
                stamp_valid = 1;
                stamp_ch = stim_ch[i];
                stamp_bin = stim_bin[i];
                if ($random % 4 == 0) begin         // random gaps
                    @(negedge clk); stamp_valid = 0;
                end
            end
            @(negedge clk); stamp_valid = 0;
            @(negedge clk); accum_done = 1;
            @(negedge clk); accum_done = 0;
            got = 0;
            while (got < NCH) begin
                @(posedge clk);
                if (res_valid) begin
                    exp_rng = ref_result(res_ch);
                    if (res_range_q8 !== exp_rng) begin
                        errors = errors + 1;
                        $display("FAIL ch %0d: rtl range %04x ref %04x",
                                 res_ch, res_range_q8, exp_rng);
                    end
                    if (res_peak_cnt !== ref_peak(res_ch)) begin
                        errors = errors + 1;
                        $display("FAIL ch %0d: rtl peak %0d ref %0d",
                                 res_ch, res_peak_cnt, ref_peak(res_ch));
                    end
                    if (exp_mem_loaded && exp_mem[res_ch][15:0] !== res_range_q8) begin
                        errors = errors + 1;
                        $display("FAIL ch %0d vs GOLDEN: rtl %04x golden %04x",
                                 res_ch, res_range_q8, exp_mem[res_ch][15:0]);
                    end
                    got = got + 1;
                end
            end
        end
    endtask

    integer n_stim, i, c, b;

    initial begin
        rst_n = 0;
        repeat (5) @(negedge clk);
        rst_n = 1;

        // --- test 1: directed - one clean spike per channel ---
        ref_clear();
        n_stim = 0;
        for (c = 0; c < NCH; c = c + 1)
            for (i = 0; i < 100 + 10*c; i = i + 1) begin
                b = 5 + 4*c;
                stim_ch[n_stim] = c; stim_bin[n_stim] = b;
                ref_stamp(c, b);
                n_stim = n_stim + 1;
            end
        exp_mem_loaded = 0;
        do_gate_from_arrays(n_stim);
        $display("test 1 (directed spikes) done, errors so far: %0d", errors);

        // --- test 2: golden random vector (three-way) ---
        ref_clear();
        for (i = 0; i < 65536; i = i + 1) stim_raw[i] = 11'h7FF;
        $readmemh("tv_stim.mem", stim_raw);
        $readmemh("tv_exp.mem", exp_mem);
        exp_mem_loaded = 1;
        n_stim = 0;
        while (stim_raw[n_stim] !== 11'h7FF && n_stim < 65536) begin
            stim_ch[n_stim] = stim_raw[n_stim][10:7];
            stim_bin[n_stim] = stim_raw[n_stim][6:0];
            ref_stamp(stim_ch[n_stim], stim_bin[n_stim]);
            n_stim = n_stim + 1;
        end
        $display("golden vector: %0d stamps", n_stim);
        do_gate_from_arrays(n_stim);
        $display("test 2 (golden three-way) done, errors so far: %0d", errors);

        // --- test 3: back-to-back gate reuse (state leakage check) ---
        ref_clear();
        n_stim = 0;
        for (c = 0; c < NCH; c = c + 1)
            for (i = 0; i < 30; i = i + 1) begin
                b = 60 - 3*c;
                stim_ch[n_stim] = c; stim_bin[n_stim] = b;
                ref_stamp(c, b);
                n_stim = n_stim + 1;
            end
        exp_mem_loaded = 0;
        do_gate_from_arrays(n_stim);
        $display("test 3 (gate reuse) done, errors so far: %0d", errors);

        if (errors == 0) $display("ALL TESTS PASS");
        else $display("TOTAL ERRORS: %0d", errors);
        $finish;
    end
endmodule
