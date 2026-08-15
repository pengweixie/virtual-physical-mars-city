# =============================================================================
# merge_gds.ps1 - final GDS merge for lidar_fe (Windows host).
# Adapted from MB-1; no macro GDS - std cells only.
# Prereq: scp the routed DEF from the VM into chip\pnr\out\ first.
# Usage:  pwsh chip\pnr\merge_gds.ps1   (any cwd)
# =============================================================================
$ErrorActionPreference = "Stop"
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent   # mars-bot
Set-Location "$root\chip"

$klayout = "C:\Program Files (x86)\KLayout\klayout_app.exe"
if (-not (Test-Path $klayout)) { throw "KLayout not found" }

$V = "$env:SKY130A\libs.ref\sky130_fd_sc_hd"
$defFile = "pnr\out\lidar_fe.def"
if (-not (Test-Path $defFile)) { throw "missing $defFile (fetch from VM first)" }

$wd = "pnr\out\merge_work"
New-Item -ItemType Directory -Force $wd | Out-Null

# merged.lef = tech lef + std cells (absolute path injected into the .lyt -
# klayout's relative lef resolution silently loads nothing, MB-1 run #5)
Get-Content "$V\techlef\sky130_fd_sc_hd__nom.tlef", "$V\lef\sky130_fd_sc_hd.lef" |
    Set-Content "$wd\merged.lef" -Encoding ascii

$absWd = ((Resolve-Path $wd).Path -replace '\\','/')
(Get-Content "$env:MB1_REPO\asic\pnr\platform\sky130hd.lyt" -Raw) `
    -replace '<base-path>\./platforms/sky130hd/</base-path>', '<base-path/>' `
    -replace '<lef-files>merged\.lef</lef-files>', "<lef-files>$absWd/merged.lef</lef-files>" |
    Set-Content "$wd\sky130hd.lyt" -Encoding ascii

$absChip = (Get-Location).Path
$gds1 = "$V\gds\sky130_fd_sc_hd.gds"

Push-Location $wd
& $klayout -zz `
    -rd "design_name=lidar_fe" `
    -rd "in_def=$absChip\$defFile" `
    -rd "in_files=$gds1" `
    -rd "seal_file=" `
    -rd "config_file=" `
    -rd "out_file=$absChip\pnr\out\lidar_fe.gds" `
    -rd "tech_file=$(Get-Location)\sky130hd.lyt" `
    -rd "layer_map=" `
    -rm "$env:MB1_REPO\asic\pnr\platform\def2stream.py"
Pop-Location

if (Test-Path "pnr\out\lidar_fe.gds") {
    $sz = (Get-Item "pnr\out\lidar_fe.gds").Length / 1MB
    Write-Host ("GDS MERGED : chip/pnr/out/lidar_fe.gds  ({0:N1} MB)" -f $sz)
} else {
    throw "merge failed - no output GDS"
}
