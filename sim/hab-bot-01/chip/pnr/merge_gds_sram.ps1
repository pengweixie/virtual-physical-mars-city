# =============================================================================
# merge_gds_sram.ps1 - final GDS merge for the SRAM-backed lidar_fe.
# DEF (from the VM) + sky130 std-cell GDS + the OpenRAM macro GDS -> one GDS.
# Usage: pwsh chip\pnr\merge_gds_sram.ps1
# =============================================================================
$ErrorActionPreference = "Stop"
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent   # mars-bot
Set-Location "$root\chip"

$klayout = "C:\Program Files (x86)\KLayout\klayout_app.exe"
if (-not (Test-Path $klayout)) { throw "KLayout not found" }
$V = "$env:SKY130A\libs.ref\sky130_fd_sc_hd"
$defFile = "pnr\out\lidar_fe_sram.def"
if (-not (Test-Path $defFile)) { throw "missing $defFile" }

$wd = "pnr\out\merge_work"
New-Item -ItemType Directory -Force $wd | Out-Null

# merged.lef = tech lef + std cells + the SRAM macro; the .lyt gets an ABSOLUTE
# path because klayout's relative lef resolution silently loads nothing
Get-Content "$V\techlef\sky130_fd_sc_hd__nom.tlef", "$V\lef\sky130_fd_sc_hd.lef",
            "macros\sky130_sram_2kbyte_1rw1r_32x512_8.lef" |
    Set-Content "$wd\merged.lef" -Encoding ascii

$absWd = (Resolve-Path $wd).Path.Replace([char]92, [char]47)
(Get-Content "$env:MB1_REPO\asic\pnr\platform\sky130hd.lyt" -Raw) `
    -replace '<base-path>\./platforms/sky130hd/</base-path>', '<base-path/>' `
    -replace '<lef-files>merged\.lef</lef-files>', "<lef-files>$absWd/merged.lef</lef-files>" |
    Set-Content "$wd\sky130hd.lyt" -Encoding ascii

$absChip = (Get-Location).Path
$gds1 = "$V\gds\sky130_fd_sc_hd.gds"
$gds2 = "$absChip\macros\sky130_sram_2kbyte_1rw1r_32x512_8.gds"

Push-Location $wd
& $klayout -zz -rd "design_name=lidar_fe_sram" -rd "in_def=$absChip\$defFile" `
    -rd "in_files=$gds1 $gds2" -rd "seal_file=" -rd "config_file=" `
    -rd "out_file=$absChip\pnr\out\lidar_fe_sram.gds" `
    -rd "tech_file=$(Get-Location)\sky130hd.lyt" -rd "layer_map=" `
    -rm "$env:MB1_REPO\asic\pnr\platform\def2stream.py"
Pop-Location

if (Test-Path "pnr\out\lidar_fe_sram.gds") {
    $sz = (Get-Item "pnr\out\lidar_fe_sram.gds").Length / 1MB
    Write-Host ("GDS MERGED : chip/pnr/out/lidar_fe_sram.gds  ({0:N1} MB)" -f $sz)
} else { throw "merge failed" }
