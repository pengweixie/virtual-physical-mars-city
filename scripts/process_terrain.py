"""Convert the raw HiRISE DTM + orthoimage into viewer-ready terrain assets.

Reads the PDS3 .IMG DTM (32-bit float elevations, 1 m/px) and the matching
JP2 orthoimage, finds the largest fully-valid square window inside the DTM
strip, and writes to data/processed/:

    heights.bin   little-endian uint16 grid, row-major, north row first
    texture.jpg   orthoimage of the same window (stretched to 8-bit)
    preview.png   8-bit heightmap preview for eyeballing
    meta.json     grid size, meters per pixel, elevation range, source IDs

Usage:
    python scripts/process_terrain.py
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import rasterio
from PIL import Image
from rasterio.windows import Window, from_bounds

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "processed"

DTM_PATH = RAW / "DTEEC_045994_1985_046060_1985_U01.IMG"
ORTHO_PATH = RAW / "ESP_045994_1985_RED_C_01_ORTHO.JP2"

GRID = 1024        # output height grid (GRID x GRID vertices)
TEXTURE = 4096     # output texture size
DECIMATE = 16      # mask downsample factor used when searching for the window


def largest_valid_square(mask: np.ndarray) -> tuple[int, int, int]:
    """Return (row, col, size) of a large fully-valid square in a boolean mask.

    Works on the decimated mask; greedy search from the biggest size down,
    preferring windows near the centroid of the valid region.
    """
    integral = np.pad(mask.astype(np.int64), ((1, 0), (1, 0))).cumsum(0).cumsum(1)

    def all_valid(r: int, c: int, s: int) -> bool:
        total = (integral[r + s, c + s] - integral[r, c + s]
                 - integral[r + s, c] + integral[r, c])
        return total == s * s

    rows, cols = np.nonzero(mask)
    cr, cc = int(rows.mean()), int(cols.mean())

    size = min(mask.shape)
    while size >= 8:
        candidates = []
        step = max(1, size // 8)
        for r in range(0, mask.shape[0] - size + 1, step):
            for c in range(0, mask.shape[1] - size + 1, step):
                if all_valid(r, c, size):
                    d = (r + size // 2 - cr) ** 2 + (c + size // 2 - cc) ** 2
                    candidates.append((d, r, c))
        if candidates:
            _, r, c = min(candidates)
            return r, c, size
        size = size * 3 // 4
    raise RuntimeError("no valid square region found in DTM")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    with rasterio.open(DTM_PATH) as dtm:
        nodata = dtm.nodata if dtm.nodata is not None else -3.4028226550889045e38
        px_m = abs(dtm.transform.a)  # meters per pixel

        # find the window on a decimated grid, then scale back up
        small = dtm.read(
            1, out_shape=(dtm.height // DECIMATE, dtm.width // DECIMATE))
        mask = small > nodata / 2  # nodata is a huge negative sentinel
        r, c, s = largest_valid_square(mask)
        row, col, size = r * DECIMATE, c * DECIMATE, s * DECIMATE
        print(f"window: {size}x{size} px at row={row} col={col} "
              f"({size * px_m / 1000:.1f} km square, {px_m:.2f} m/px)")

        win = Window(col, row, size, size)
        heights = dtm.read(1, window=win, out_shape=(GRID, GRID)).astype(np.float64)
        bounds = rasterio.windows.bounds(win, dtm.transform)
        crs_wkt = dtm.crs.to_wkt() if dtm.crs else None

    valid = heights > nodata / 2
    if not valid.all():
        # stray nodata pixels from resampling at the edges: fill with the mean
        heights[~valid] = heights[valid].mean()

    lo, hi = float(heights.min()), float(heights.max())
    q = np.round((heights - lo) / (hi - lo) * 65535).astype(np.uint16)
    q.tofile(OUT / "heights.bin")
    Image.fromarray((q // 257).astype(np.uint8)).save(OUT / "preview.png")
    print(f"heights: {GRID}x{GRID}, elevation {lo:.1f}..{hi:.1f} m "
          f"(relief {hi - lo:.1f} m)")

    with rasterio.open(ORTHO_PATH) as ortho:
        owin = from_bounds(*bounds, transform=ortho.transform)
        tex = ortho.read(1, window=owin, out_shape=(TEXTURE, TEXTURE),
                         boundless=True, fill_value=0).astype(np.float32)

    nz = tex[tex > 0]
    p2, p98 = np.percentile(nz, [2, 98]) if nz.size else (0.0, 1.0)
    tex8 = np.clip((tex - p2) / max(p98 - p2, 1e-6) * 255, 0, 255).astype(np.uint8)
    # Mars tint: the RED-filter image is grayscale; color it like Jezero dust
    rgb = np.stack([
        np.clip(tex8 * 0.85 + 38, 0, 255),
        np.clip(tex8 * 0.62 + 20, 0, 255),
        np.clip(tex8 * 0.45 + 12, 0, 255),
    ], axis=-1).astype(np.uint8)
    Image.fromarray(rgb).save(OUT / "texture.jpg", quality=88)
    print(f"texture: {TEXTURE}x{TEXTURE} (stretch {p2:.0f}..{p98:.0f})")

    meta = {
        "grid": GRID,
        "size_m": size * px_m,
        "elev_min_m": lo,
        "elev_max_m": hi,
        "meters_per_px": px_m,
        "source_dtm": DTM_PATH.name,
        "source_ortho": ORTHO_PATH.name,
        "bounds_proj": list(bounds),  # (left, bottom, right, top) in DTM CRS meters
        "crs_wkt": crs_wkt,
        "site": "Jezero crater, Mars 2020 landing site (18.4N, 77.4E)",
        "credit": "NASA/JPL/University of Arizona (HiRISE), public domain",
    }
    (OUT / "meta.json").write_text(json.dumps(meta, indent=2))
    print("wrote meta.json")


if __name__ == "__main__":
    main()
