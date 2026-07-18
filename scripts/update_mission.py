"""Fetch the latest Perseverance (Mars 2020) mission data from NASA.

Downloads the rover traverse, waypoints and the newest raw images, converts
coordinates into the local terrain frame of the processed Jezero patch, and
writes everything to data/mission/ for the viewer.

Run before starting the viewer (the launcher does it automatically);
safe to run offline — the viewer just keeps the last cached copy.

Usage:
    python scripts/update_mission.py
"""

from __future__ import annotations

import json
import ssl
import sys
import urllib.request
from pathlib import Path

import rasterio
from rasterio.crs import CRS
from rasterio.warp import transform as warp_transform

ROOT = Path(__file__).resolve().parent.parent
META = ROOT / "data" / "processed" / "meta.json"
OUT = ROOT / "data" / "mission"
PHOTOS = OUT / "photos"

WAYPOINTS_URL = "https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json"
TRAVERSE_URL = "https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_traverse.json"
IMAGES_URL = ("https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020"
              "&feedtype=json&num=48&page=0&order=sol+desc")

PHOTO_CAMERAS = {  # cameras worth showing (skip calibration/engineering shots)
    "NAVCAM_LEFT": "导航相机(左)", "NAVCAM_RIGHT": "导航相机(右)",
    "MCZ_LEFT": "Mastcam-Z(左)", "MCZ_RIGHT": "Mastcam-Z(右)",
    "FRONT_HAZCAM_LEFT_A": "前避障相机", "REAR_HAZCAM_LEFT": "后避障相机",
    "SUPERCAM_RMI": "SuperCam",
}
MAX_PHOTOS = 12
TIMEOUT = 30


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "mars-vr-viewer/1.0"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return r.read()


def main() -> None:
    meta = json.loads(META.read_text())
    left, bottom, right, top = meta["bounds_proj"]
    cx, cy = (left + right) / 2, (bottom + top) / 2
    dst_crs = CRS.from_wkt(meta["crs_wkt"])
    # same sphere as the DTM so lon/lat -> projected is self-consistent
    radius = dst_crs.to_dict().get("R") or 3394839.8133163
    src_crs = CRS.from_proj4(f"+proj=longlat +a={radius} +b={radius} +no_defs")

    def to_local(lons: list[float], lats: list[float]) -> list[tuple[float, float]]:
        xs, ys = warp_transform(src_crs, dst_crs, lons, lats)
        # viewer frame: x east, z south, origin at patch center
        return [(x - cx, cy - y) for x, y in zip(xs, ys)]

    half = (right - left) / 2
    in_bounds = lambda p: abs(p[0]) <= half and abs(p[1]) <= half

    OUT.mkdir(parents=True, exist_ok=True)
    PHOTOS.mkdir(exist_ok=True)

    print("fetching waypoints…")
    feats = json.loads(fetch(WAYPOINTS_URL))["features"]
    lons = [f["geometry"]["coordinates"][0] for f in feats]
    lats = [f["geometry"]["coordinates"][1] for f in feats]
    pts = to_local(lons, lats)
    waypoints = [{
        "sol": f["properties"].get("sol"),
        "site": f["properties"].get("site"),
        "drive": f["properties"].get("drive"),
        "x": round(p[0], 1), "z": round(p[1], 1),
        "in": in_bounds(p),
    } for f, p in zip(feats, pts)]
    cur = waypoints[-1]
    cur_props = feats[-1]["properties"]
    dist_km = (cur["x"] ** 2 + cur["z"] ** 2) ** 0.5 / 1000
    print(f"  {len(waypoints)} waypoints, rover at sol {cur['sol']}, "
          f"{dist_km:.1f} km from patch center, in_bounds={cur['in']}")

    print("fetching traverse line…")
    trav = json.loads(fetch(TRAVERSE_URL))
    line: list[list[float]] = []
    all_coords: list[list[float]] = []
    for f in trav.get("features", []):
        g = f["geometry"]
        all_coords.extend(g["coordinates"] if g["type"] == "LineString" else [
            c for part in g["coordinates"] for c in part])
    step = max(1, len(all_coords) // 4000)
    coords = all_coords[::step] + [all_coords[-1]]
    seg = to_local([c[0] for c in coords], [c[1] for c in coords])
    line.extend([round(x, 1), round(z, 1)] for x, z in seg)
    print(f"  {len(line)} traverse points (decimated from {len(all_coords)})")

    print("fetching latest images…")
    photos = []
    try:
        imgs = json.loads(fetch(IMAGES_URL))["images"]
        for img in imgs:
            cam = img["camera"]["instrument"]
            if cam not in PHOTO_CAMERAS or len(photos) >= MAX_PHOTOS:
                continue
            url = img["image_files"]["medium"]
            name = f"{len(photos):02d}.jpg"
            try:
                (PHOTOS / name).write_bytes(fetch(url))
            except Exception as exc:  # noqa: BLE001
                print(f"  [skip] {name}: {exc}")
                continue
            photos.append({
                "file": f"photos/{name}",
                "sol": img.get("sol"),
                "camera": PHOTO_CAMERAS[cam],
                "utc": (img.get("date_taken_utc") or "")[:16].replace("T", " "),
            })
        print(f"  {len(photos)} photos downloaded")
    except Exception as exc:  # noqa: BLE001 - photos are optional
        print(f"  [warn] image feed failed: {exc}")

    mission = {
        "updated_utc": __import__("datetime").datetime.now(
            __import__("datetime").timezone.utc).strftime("%Y-%m-%d %H:%M"),
        "rover": {**cur, "lon": lons[-1], "lat": lats[-1],
                  "elev": cur_props.get("elev_geoid"),
                  "dist_km": round(dist_km, 1)},
        "waypoints": waypoints,
        "traverse": line,
        "photos": photos,
    }
    (OUT / "mission.json").write_text(
        json.dumps(mission, ensure_ascii=False), encoding="utf-8")
    print(f"wrote mission.json (sol {cur['sol']}, updated {mission['updated_utc']} UTC)")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001 - never break the launcher
        print(f"[mission update failed: {exc}] viewer will use cached data if any")
        sys.exit(0)
