# Installs the world-class-designer skill and its three agents (design-critic, design-brief-writer, design-spot-check) into Claude Code (Windows PowerShell).
#   .\install.ps1            -> personal install (%USERPROFILE%\.claude), available in every project
#   .\install.ps1 -Project   -> project install (.\.claude in the current directory)
param([switch]$Project)
$ErrorActionPreference = 'Stop'

$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
if ($Project) { $Root = Join-Path (Get-Location) '.claude' }
elseif ($env:CLAUDE_CONFIG_DIR) { $Root = $env:CLAUDE_CONFIG_DIR }
else { $Root = Join-Path $env:USERPROFILE '.claude' }

$Skills = Join-Path $Root 'skills'
$Agents = Join-Path $Root 'agents'
New-Item -ItemType Directory -Force -Path $Skills, $Agents | Out-Null

$Dest = Join-Path $Skills 'world-class-designer'
if (Test-Path $Dest) { Remove-Item -Recurse -Force $Dest }
Copy-Item -Recurse (Join-Path $Here 'skills\designer') $Dest
Get-ChildItem (Join-Path $Here 'agents') -Filter *.md | ForEach-Object { Copy-Item $_.FullName (Join-Path $Agents $_.Name) -Force }

Write-Host "Installed:"
Write-Host "  skill  -> $Dest\SKILL.md"
Write-Host "  agents -> $Agents\design-critic.md, design-brief-writer.md, design-spot-check.md"
Write-Host ""
Write-Host "Environment check:"
try { & node (Join-Path $Dest 'scripts\check-env.mjs') } catch { Write-Host "node is not installed or not on PATH; install Node 18+ from nodejs.org" }
Write-Host ""
Write-Host "Next: open Claude Code in a project and run  /designer landing page for <your product>"
