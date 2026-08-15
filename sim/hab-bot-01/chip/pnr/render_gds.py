# klayout -b -r render_gds.py : render the merged layout, hiding the blanket
# well/implant/areaid layers so the macro, the PDN and the routing show.
import pya, os
HERE = os.path.dirname(__file__)
app = pya.Application.instance()
mw = app.main_window()
mw.load_layout(os.path.join(HERE, "out", "lidar_fe_sram.gds"), 0)
view = mw.current_view()
view.load_layer_props(r"$env:SKY130A\libs.tech\klayout\tech\sky130A.lyp")
view.max_hier()
HIDE = ("nwell", "pwell", "areaid", "nsdm", "psdm", "hvtp", "lvtn", "prBoundary",
        "diff", "tap", "licon", "npc", "poly")
it = view.begin_layers()
while not it.at_end():
    lp = it.current()
    nm = (lp.name or "") + " " + (lp.source or "")
    if any(h.lower() in nm.lower() for h in HIDE):
        lp2 = lp.dup(); lp2.visible = False
        view.set_layer_properties(it, lp2)
    it.next()
view.zoom_fit()
view.save_image(os.path.join(HERE, "out", "lidar_fe_sram.png"), 1500, 960)
print("RESULT rendered")
