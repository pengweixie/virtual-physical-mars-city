# klayout -b -r verify_gds.py : sanity-check the merged layout
import pya, os
ly = pya.Layout()
ly.read(os.path.join(os.path.dirname(__file__), "out", "lidar_fe_sram.gds"))
top = ly.top_cell()
bb = top.dbbox()
print("RESULT top_cell = %s" % top.name)
print("RESULT cells = %d" % ly.cells())
print("RESULT bbox_um = %.2f x %.2f" % (bb.width(), bb.height()))
print("RESULT layers = %d" % ly.layer_indexes().__len__())
n_macro = 0
for inst in top.each_inst():
    if "sram" in ly.cell(inst.cell_index).name:
        n_macro += 1
print("RESULT sram_instances = %d" % n_macro)
