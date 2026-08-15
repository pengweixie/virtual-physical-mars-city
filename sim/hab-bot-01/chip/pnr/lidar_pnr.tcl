# =============================================================================
# lidar_pnr.tcl - OpenROAD place-and-route for hab-bot-01's LiDAR front end
#                 on sky130hd. Adapted from MB-1's mb1_pnr.tcl; no macros -
#                 the 12.6 kbit histogram is flop-based, so this is a pure
#                 standard-cell flow.
#
#   openroad -no_init -exit lidar_pnr.tcl   (run from ~/lidar_asic/pnr)
#
# Inputs: pdk/ (staged from mb1_asic), netlist/lidar_fe.sky130.v,
#         platform/{make_tracks.tcl,setRC.tcl}, pdn_lidar.tcl
# Die plan: synthesis area 0.683 mm^2 -> 50% utilization -> 1200x1200 die.
# The known congestion risk is the 1050-way histogram read mux.
# =============================================================================
file mkdir out
file mkdir reports

read_lef pdk/sky130_fd_sc_hd__nom.tlef
read_lef pdk/sky130_fd_sc_hd.lef
read_liberty pdk/sky130_fd_sc_hd__tt_025C_1v80.lib
read_verilog netlist/lidar_fe.sky130.v
link_design lidar_fe

set_dont_use {sky130_fd_sc_hd__probe_p_* sky130_fd_sc_hd__probec_p_* sky130_fd_sc_hd__lpflow_*}

# ---------------- constraints ----------------
# 100 MHz. Stamps arrive from the SPAD latch bank readout, synchronous.
create_clock -name clk -period 10.0 [get_ports clk]
set_clock_uncertainty 0.25 [get_clocks clk]
set_input_delay  2.0 -clock clk [get_ports {gate_clear accum_done stamp_valid stamp_ch* stamp_bin*}]
set_output_delay 2.0 -clock clk [all_outputs]
set_false_path -from [get_ports rst_n]

# ---------------- floorplan ----------------
initialize_floorplan -die_area {0 0 1200 1200} -core_area {12 12 1188 1188} \
                     -site unithd
source platform/make_tracks.tcl
source platform/setRC.tcl

tapcell -distance 14 -tapcell_master sky130_fd_sc_hd__tapvpwrvgnd_1

# ---------------- power ----------------
source pdn_lidar.tcl

# ---------------- IO + placement ----------------
place_pins -random -hor_layers met3 -ver_layers met2

insert_tiecells sky130_fd_sc_hd__conb_1/LO -prefix TIE_ZERO_
insert_tiecells sky130_fd_sc_hd__conb_1/HI -prefix TIE_ONE_

global_placement -density 0.55 -pad_left 2 -pad_right 2
estimate_parasitics -placement
repair_design
detailed_placement

# ---------------- clock tree ----------------
# 12,899 sinks: let CTS cluster aggressively
clock_tree_synthesis -root_buf sky130_fd_sc_hd__clkbuf_16 \
    -buf_list {sky130_fd_sc_hd__clkbuf_2 sky130_fd_sc_hd__clkbuf_4 sky130_fd_sc_hd__clkbuf_8} \
    -sink_clustering_enable
set_propagated_clock [all_clocks]
detailed_placement

estimate_parasitics -placement
repair_timing -hold
detailed_placement

# ---------------- routing ----------------
set_routing_layers -signal met1-met5 -clock met3-met5
global_route -congestion_iterations 30

estimate_parasitics -global_routing
repair_timing -setup
repair_timing -hold
detailed_placement
global_route -congestion_iterations 30
estimate_parasitics -global_routing
puts "==== post-repair timing ===="
report_worst_slack -max
report_worst_slack -min
report_tns

catch { repair_antennas sky130_fd_sc_hd__diode_2 -iterations 3 } antmsg
puts "antenna repair result: $antmsg"

detailed_route -output_drc reports/route_drc.rpt -verbose 1

catch { check_antennas -verbose } ant
puts $ant

# ---------------- fill + final checks ----------------
filler_placement {sky130_fd_sc_hd__decap_3 sky130_fd_sc_hd__decap_4 \
                  sky130_fd_sc_hd__decap_6 sky130_fd_sc_hd__decap_8 \
                  sky130_fd_sc_hd__fill_1 sky130_fd_sc_hd__fill_2 \
                  sky130_fd_sc_hd__fill_4 sky130_fd_sc_hd__fill_8}
check_placement -verbose

puts "==== final timing (routed, estimated parasitics) ===="
report_worst_slack -max
report_worst_slack -min
report_tns
report_design_area
report_checks -path_delay min_max -fields {slew cap input_pins} -format full_clock_expanded -group_count 2 > reports/final_timing.rpt
report_power > reports/final_power.rpt

write_def     out/lidar_fe.def
write_verilog out/lidar_fe_pnr.v
write_db      out/lidar_fe.odb
puts "PNR COMPLETE : out/lidar_fe.def"
