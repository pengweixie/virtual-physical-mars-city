"""Ingest model drops from models/_inbox/ into the standard asset layout.

Drop workflow (see MODELS.md):

    models/_inbox/<asset-id>/   <- dump ANY Rodin export here: zip, glb,
                                   obj, stl, textures, mixed, whatever

Running this script (the launcher does it automatically):
  1. unzips any archives in the drop
  2. picks the best source: *pbr*.glb > any .glb > .obj(+textures) > .stl
  3. converts to models/<asset-id>/model.glb (textures baked in if needed)
  4. archives all original files to models/<asset-id>/src/
  5. registers the asset in models/manifest.json (placeholders for pos/size)

Safe to re-run: an inbox folder is only processed if model.glb was produced,
and an existing models/<asset-id>/ is never overwritten.
"""

from __future__ import annotations

import json
import shutil
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MODELS = ROOT / "models"
INBOX = MODELS / "_inbox"
MANIFEST = MODELS / "manifest.json"


def unzip_all(folder: Path) -> None:
    for z in folder.rglob("*.zip"):
        out = z.with_suffix("")
        out.mkdir(exist_ok=True)
        try:
            with zipfile.ZipFile(z) as f:
                f.extractall(out)
            print(f"  [unzip] {z.name}")
        except Exception as exc:  # noqa: BLE001
            print(f"  [warn] cannot unzip {z.name}: {exc}")


def pick_glb(folder: Path) -> Path | None:
    glbs = list(folder.rglob("*.glb"))
    if not glbs:
        return None
    pbr = [g for g in glbs if "pbr" in g.name.lower()]
    pool = pbr or glbs
    return max(pool, key=lambda p: p.stat().st_size)


def find_texture(folder: Path, key: str) -> Path | None:
    for p in folder.rglob(f"*{key}*.png"):
        return p
    return None


def convert_mesh(folder: Path, dest: Path) -> bool:
    """obj/stl (+textures) -> glb with textures baked in."""
    import trimesh
    from PIL import Image

    src = next(iter(folder.rglob("*.obj")), None) or \
          next(iter(folder.rglob("*.stl")), None)
    if src is None:
        return False
    print(f"  [convert] {src.name} -> model.glb")
    mesh = trimesh.load(src, force="mesh", process=False)
    diffuse = find_texture(folder, "diffuse")
    if src.suffix.lower() == ".obj" and diffuse is not None:
        kw = {"baseColorTexture": Image.open(diffuse)}
        pbr = find_texture(folder, "pbr")
        normal = find_texture(folder, "normal")
        if pbr:
            kw["metallicRoughnessTexture"] = Image.open(pbr)
        if normal:
            kw["normalTexture"] = Image.open(normal)
        mesh.visual.material = trimesh.visual.material.PBRMaterial(**kw)
    mesh.export(dest)
    return True


def register(asset_id: str) -> None:
    data = {"assets": []}
    if MANIFEST.exists():
        data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if any(a["id"] == asset_id for a in data["assets"]):
        return
    data["assets"].append({
        "id": asset_id,
        "name": asset_id,
        "size_m": None,          # TODO: real size from the design prompt
        "size_axis": "height",
        "pos": None,             # null -> placed by zone plan
        "rotation_deg": 0,
        "sink_m": 0.3,
        "effects": [],
    })
    MANIFEST.write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  [manifest] registered {asset_id}")


def ingest(drop: Path) -> bool:
    asset_id = drop.name
    target = MODELS / asset_id
    if target.exists():
        print(f"[skip] {asset_id}: models/{asset_id}/ already exists")
        return False
    print(f"[ingest] {asset_id}")
    unzip_all(drop)

    tmp_glb = drop / "__model_tmp.glb"
    glb = pick_glb(drop)
    if glb is not None:
        print(f"  [use] {glb.name}")
        shutil.copy2(glb, tmp_glb)
    elif not convert_mesh(drop, tmp_glb):
        print(f"  [error] no usable model (glb/obj/stl) in {asset_id}, left in inbox")
        return False

    target.mkdir(parents=True)
    src_dir = target / "src"
    src_dir.mkdir()
    shutil.move(str(tmp_glb), target / "model.glb")
    for item in list(drop.iterdir()):
        shutil.move(str(item), src_dir / item.name)
    drop.rmdir()
    register(asset_id)
    print(f"  [done] models/{asset_id}/model.glb")
    return True


def main() -> None:
    INBOX.mkdir(parents=True, exist_ok=True)
    drops = [d for d in INBOX.iterdir() if d.is_dir()]
    if not drops:
        print("inbox empty, nothing to ingest")
        return
    done = sum(ingest(d) for d in drops)
    print(f"ingested {done}/{len(drops)} asset(s)")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001 - never break the launcher
        print(f"[ingest failed: {exc}]")
        sys.exit(0)
