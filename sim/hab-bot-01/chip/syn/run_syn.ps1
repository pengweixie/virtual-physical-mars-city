# Synthesize lidar_fe to sky130 HD. Usage: pwsh syn/run_syn.ps1  (from chip/)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$yosys = "$env:OSS_CAD_SUITE\bin\yosys.exe"
if (-not (Test-Path $yosys)) { throw "yosys not found at $yosys" }

$lib = Get-ChildItem -Path "$env:USERPROFILE\.volare" `
         -Filter "sky130_fd_sc_hd__tt_025C_1v80.lib" -Recurse -ErrorAction SilentlyContinue |
       Select-Object -First 1 -ExpandProperty FullName
if (-not $lib) { throw "sky130 hd tt liberty not found" }

Copy-Item $lib "syn\sky130_hd_tt.lib" -Force
New-Item -ItemType Directory -Force syn\reports, syn\netlist | Out-Null

& $yosys -q -s syn\synth_sky130.ys
Write-Host "==================== sky130 STAT ===================="
Get-Content syn\reports\sky130_stat.txt | Select-Object -Last 40
