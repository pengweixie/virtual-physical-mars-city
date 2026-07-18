# -*- coding: utf-8 -*-
"""
Export petct_full.blend -> self-contained petct.glb for three.js.

  blender --background petct_full.blend --python export_glb.py

Content rules (per task brief):
  KEEP  : shell(fascia/housing/rear_cap/gantry_base) + bore_liner + flare glow +
          emit ring + front screens/estop/nameplate + CT rotor & payload +
          PET 37 modules + 2 end plates + 2-stage bed.
  DROP  : floor plane, all lights, all cameras, target empty, any cutbox.
  AXES  : 1 unit = 1 m; +Y up on export. Shift whole rig +1.15 in Blender Z
          so the machine base sits on z=0  ->  glTF y=0 (nothing floats/buried).
          Blender -Y (bed side) -> glTF +Z ; bore axis -> glTF Z.
  EMIT  : emissive parts prefixed emit_  (emit_glow_ring / emit_panel_l/r).
  GROUP : two parent nodes  gantry  (whole machine) and  bed  (movable couch).
Output: E:\\Claude\\mars_medical\\out\\petct.glb  (GLB binary, textures embedded).
"""
import math
import bpy
import mathutils

SRC = r".\system\blender\out\petct_full.blend"
OUT = r".\out\petct.glb"
Z_LIFT = 1.15          # raise floor(z=-1.15) to 0 -> lowest point at glTF y=0

BED_NAMES = {"tbl_base", "tbl_col1", "tbl_col2", "tbl_carriage",
             "pallet", "pad", "headrest"}

# -------------------------------------------------- open archive
bpy.ops.wm.open_mainfile(filepath=SRC)
scn = bpy.context.scene
vl = bpy.context.view_layer

# -------------------------------------------------- strip non-exported objects
def base_name(o):
    return o.name.split(".")[0]

def uses_mat(o, name):
    return o.type == "MESH" and any(
        s.material and s.material.name == name for s in o.material_slots)

drop = []
for o in list(bpy.data.objects):
    bn = base_name(o)
    if o.type in {"LIGHT", "CAMERA", "EMPTY"}:      # lights / cameras / target
        drop.append(o)
    elif o.type == "MESH" and bn in {"floor", "cutbox", "Plane"}:
        drop.append(o)
    elif uses_mat(o, "floor"):                       # floor plane (obj left named 'Plane')
        drop.append(o)
for o in drop:
    print("DROP:", o.name, o.type)
    bpy.data.objects.remove(o, do_unlink=True)

# -------------------------------------------------- brand_text -> mesh (no empty nodes)
txt = bpy.data.objects.get("brand_text")
if txt is not None:
    try:
        bpy.ops.object.select_all(action="DESELECT")
        txt.select_set(True)
        vl.objects.active = txt
        bpy.ops.object.convert(target="MESH")
        # if convert produced empty geometry, drop it rather than ship a blank
        if len(txt.data.vertices) == 0:
            bpy.data.objects.remove(txt, do_unlink=True)
            print("brand_text: empty after convert -> removed")
        else:
            print("brand_text -> MESH tris:", len(txt.data.polygons))
    except Exception as e:
        print("brand_text convert failed -> removed:", e)
        if bpy.data.objects.get("brand_text"):
            bpy.data.objects.remove(txt, do_unlink=True)

# -------------------------------------------------- emissive naming + front-screen emission
def rename(old, new):
    o = bpy.data.objects.get(old)
    if o:
        o.name = new
        print("RENAME:", old, "->", new)
    return o

rename("glow_ring", "emit_glow_ring")            # already emissive (M_GLOW)
rename("panel_l", "emit_panel_l")
rename("panel_r", "emit_panel_r")

# front screens use 'panel_glass' with no emission in the source -> give it a
# real emissive component so emit_ naming is meaningful (driveable by dusk/day).
mg = bpy.data.materials.get("panel_glass")
if mg and mg.use_nodes:
    b = mg.node_tree.nodes.get("Principled BSDF")
    if b:
        b.inputs["Emission Color"].default_value = (0.15, 0.55, 0.85, 1.0)
        b.inputs["Emission Strength"].default_value = 2.5
        print("panel_glass: emission added")

# -------------------------------------------------- bake transforms + lift +1.15 Z
meshes = [o for o in bpy.data.objects if o.type == "MESH"]
bpy.ops.object.select_all(action="DESELECT")
for o in meshes:
    o.select_set(True)
vl.objects.active = meshes[0]
# ensure scale/rotation are applied (Apply Scale requirement)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

# lift each object +Z then bake location so vertices carry world coords
for o in meshes:
    o.location.z += Z_LIFT
bpy.ops.object.select_all(action="DESELECT")
for o in meshes:
    o.select_set(True)
vl.objects.active = meshes[0]
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# -------------------------------------------------- group under gantry / bed empties
def new_empty(name):
    e = bpy.data.objects.new(name, None)      # empty, None data
    scn.collection.objects.link(e)
    e.empty_display_size = 0.2
    return e

gantry = new_empty("gantry")
bed = new_empty("bed")

for o in meshes:
    o.parent = bed if base_name(o) in BED_NAMES else gantry
    o.matrix_parent_inverse = mathutils.Matrix.Identity(4)   # empties at origin

n_bed = sum(1 for o in meshes if o.parent is bed)
print("grouped: gantry=%d  bed=%d" % (len(meshes) - n_bed, n_bed))

# -------------------------------------------------- triangle budget (eval w/ modifiers)
dg = vl.depsgraph
tri = 0
for o in meshes:
    ev = o.evaluated_get(dg)
    me = ev.to_mesh()
    me.calc_loop_triangles()
    tri += len(me.loop_triangles)
    ev.to_mesh_clear()
print("TRIANGLES:", tri)

# -------------------------------------------------- world bbox (Blender coords) -> glTF
mn = [1e9, 1e9, 1e9]
mx = [-1e9, -1e9, -1e9]
for o in meshes:
    ev = o.evaluated_get(dg)
    me = ev.to_mesh()
    for v in me.vertices:
        w = o.matrix_world @ v.co
        for i in range(3):
            mn[i] = min(mn[i], w[i]); mx[i] = max(mx[i], w[i])
    ev.to_mesh_clear()
# glTF (+Y up): gx=bx, gy=bz, gz=-by
gmin = (mn[0], mn[2], -mx[1])
gmax = (mx[0], mx[2], -mn[1])
print("BLENDER_BBOX_MIN:", ["%.3f" % x for x in mn])
print("BLENDER_BBOX_MAX:", ["%.3f" % x for x in mx])
print("GLTF_SIZE_XYZ_m: %.3f %.3f %.3f" %
      (mx[0]-mn[0], mx[2]-mn[2], mx[1]-mn[1]))
print("GLTF_Y_MIN(lowest):", "%.4f" % mn[2])   # should be ~0

# -------------------------------------------------- export GLB
import os
os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    use_selection=False,
    export_yup=True,
    export_apply=True,            # apply modifiers
    export_materials="EXPORT",
    export_cameras=False,
    export_lights=False,
    export_extras=False,
    export_normals=True,
    export_texcoords=True,
)
print("EXPORTED:", OUT)
print("EXPORT_DONE")
