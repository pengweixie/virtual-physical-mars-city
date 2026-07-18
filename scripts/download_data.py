"""Download HiRISE DTM + orthoimage for the Jezero crater (Mars 2020 landing site).

Data source: NASA/JPL/University of Arizona HiRISE PDS archive (public domain).
Stereo pair: ESP_045994_1985 / ESP_046060_1985, 1 m/px DTM.

Usage:
    python scripts/download_data.py

Downloads are resumable: re-running the script continues partial files.
"""

from __future__ import annotations

import sys
import urllib.request
from pathlib import Path

BASE_URL = (
    "https://hirise-pds.lpl.arizona.edu/PDS/DTM/ESP/"
    "ORB_045900_045999/ESP_045994_1985_ESP_046060_1985/"
)

FILES = {
    # 1 m/px digital terrain model (PDS3 .IMG, 32-bit float elevations)
    "DTEEC_045994_1985_046060_1985_U01.IMG": 380_814_764,
    # 1 m/px orthorectified image matching the DTM grid ("C" = reduced scale)
    "ESP_045994_1985_RED_C_01_ORTHO.JP2": 34_413_875,
    "ESP_045994_1985_RED_C_01_ORTHO.LBL": 5_432,
}

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"

CHUNK = 1 << 20  # 1 MiB


def download(name: str, expected_size: int) -> None:
    dest = DATA_DIR / name
    tmp = dest.with_suffix(dest.suffix + ".part")

    if dest.exists() and dest.stat().st_size == expected_size:
        print(f"[skip] {name} already complete")
        return

    offset = tmp.stat().st_size if tmp.exists() else 0
    req = urllib.request.Request(BASE_URL + name)
    if offset:
        req.add_header("Range", f"bytes={offset}-")
        print(f"[resume] {name} from {offset / 1e6:.1f} MB")
    else:
        print(f"[start] {name} ({expected_size / 1e6:.1f} MB)")

    with urllib.request.urlopen(req, timeout=60) as resp:
        mode = "ab" if offset and resp.status == 206 else "wb"
        with open(tmp, mode) as f:
            done = offset if mode == "ab" else 0
            while chunk := resp.read(CHUNK):
                f.write(chunk)
                done += len(chunk)
                pct = 100 * done / expected_size
                print(f"\r  {name}: {done / 1e6:.1f}/{expected_size / 1e6:.1f} MB ({pct:.0f}%)",
                      end="", flush=True)
    print()

    actual = tmp.stat().st_size
    if actual != expected_size:
        print(f"[error] {name}: got {actual} bytes, expected {expected_size}; rerun to resume")
        sys.exit(1)
    tmp.replace(dest)
    print(f"[done] {name}")


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    for name, size in FILES.items():
        for attempt in range(1, 6):
            try:
                download(name, size)
                break
            except Exception as exc:  # noqa: BLE001 - retry any network hiccup
                print(f"\n[retry {attempt}/5] {name}: {exc}")
        else:
            print(f"[error] giving up on {name}")
            sys.exit(1)
    print("All files downloaded.")


if __name__ == "__main__":
    main()
