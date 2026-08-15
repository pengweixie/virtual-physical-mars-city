# =============================================================================
# lidar_sram_pnr.tcl - OpenROAD P&R for the SRAM-backed LiDAR front end.
#
# The flop variant lost eight rounds here (RESULTS.md): 12.9k enable-flops,
# unroutable pin density. This variant is 1,753 standard cells and one
# OpenRAM macro - the same macro MB-1 already carried to GDS - so the
# routability claim gets tested rather than argued.
#
# Die plan: macro on the left in MY orientation (its control pins mirror to
# the right, toward the logic strip; the now-pinless edge sits near the core
# boundary), routing channels above and below it for the addr/din/dout edges.
# =============================================================================
file mkdir out
file mkdir reports

read_lef pdk/sky130_fd_sc_hd__nom.tlef
read_lef pdk/sky130_fd_sc_hd.lef
read_lef macros/sky130_sram_2kbyte_1rw1r_32x512_8.lef
read_liberty pdk/sky130_fd_sc_hd__tt_025C_1v80.lib
read_liberty macros/sky130_sram_2kbyte_1rw1r_32x512_8_TT_1p8V_25C.lib
read_verilog netlist/lidar_fe_sram.sky130.v
link_design lidar_fe_sram

set_dont_use {sky130_fd_sc_hd__probe_p_* sky130_fd_sc_hd__probec_p_* sky130_fd_sc_hd__lpflow_*}

create_clock -name clk -period 10.0 [get_ports clk]
set_clock_uncertainty 0.25 [get_clocks clk]
set_input_delay  2.0 -clock clk [get_ports {gate_clear accum_done stamp_valid stamp_ch* stamp_bin*}]
set_output_delay 2.0 -clock clk [all_outputs]
set_false_path -from [get_ports rst_n]

initialize_floorplan -die_area {0 0 1100 700} -core_area {12 12 1088 688} -site unithd
source platform/make_tracks.tcl
source platform/setRC.tcl

# ---- place the single macro through odb (works on every build) ----
set block [ord::get_db_block]
set dbu   [[ord::get_db_tech] getDbUnitsPerMicron]
set minst {}
foreach inst [$block getInsts] {
    if {[[$inst getMaster] getName] eq "sky130_sram_2kbyte_1rw1r_32x512_8"} {
        lappend minst $inst
    }
}
if {[llength $minst] != 1} { error "expected exactly 1 SRAM macro, found [llength $minst]" }
set m [lindex $minst 0]
$m setOrient MY
# Flush to the core's left edge, on the site grid (12.42 = 27 x 0.46 um site
# pitch, 100.64 = 37 x 2.72 um row height). At x=20 an 8 um sliver of rows was
# left between macro and core boundary and PDN could not power it: PDN-0179,
# the exact trap MB-1 documented.
$m setLocation [expr {int(12.42 * $dbu)}] [expr {int(100.64 * $dbu)}]
$m setPlacementStatus FIRM
puts "INFO: placed [$m getName] at (20,100) um MY FIRM"

cut_rows -halo_width_x 2 -halo_width_y 2
tapcell -distance 14 -tapcell_master sky130_fd_sc_hd__tapvpwrvgnd_1

source pdn_sram.tcl

place_pins -random -hor_layers met3 -ver_layers met2 -exclude left:*
insert_tiecells sky130_fd_sc_hd__conb_1/LO -prefix TIE_ZERO_
insert_tiecells sky130_fd_sc_hd__conb_1/HI -prefix TIE_ONE_

global_placement -density 0.30 -pad_left 2 -pad_right 2
estimate_parasitics -placement
repair_design
detailed_placement

clock_tree_synthesis -root_buf sky130_fd_sc_hd__clkbuf_16 \
    -buf_list {sky130_fd_sc_hd__clkbuf_2 sky130_fd_sc_hd__clkbuf_4 sky130_fd_sc_hd__clkbuf_8} \
    -sink_clustering_enable
set_propagated_clock [all_clocks]
detailed_placement
estimate_parasitics -placement
repair_timing -hold
detailed_placement

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
puts "antenna repair: $antmsg"

detailed_route -output_drc reports/route_drc.rpt -verbose 1
catch { check_antennas -verbose } ant
puts $ant

filler_placement {sky130_fd_sc_hd__decap_3 sky130_fd_sc_hd__decap_4 \
                  sky130_fd_sc_hd__decap_6 sky130_fd_sc_hd__decap_8 \
                  sky130_fd_sc_hd__fill_1 sky130_fd_sc_hd__fill_2 \
                  sky130_fd_sc_hd__fill_4 sky130_fd_sc_hd__fill_8}
check_placement -verbose

puts "==== final ===="
report_worst_slack -max
report_worst_slack -min
report_tns
report_design_area
report_checks -path_delay min_max -fields {slew cap input_pins} -format full_clock_expanded -group_count 2 > reports/final_timing.rpt
report_power > reports/final_power.rpt

write_def     out/lidar_fe_sram.def
write_verilog out/lidar_fe_sram_pnr.v
write_db      out/lidar_fe_sram.odb
puts "PNR COMPLETE : out/lidar_fe_sram.def"
