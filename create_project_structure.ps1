# MCP Remote Migration Project Setup
$rootPath = "A:\MCP-Migration"

# Create directory structure
$dirs = @(
    "cloudflare-servers",
    "cloudflare-servers\desktop-commander-remote",
    "cloudflare-servers\filesystem-remote", 
    "cloudflare-servers\memory-remote",
    "cloudflare-servers\azure-proxy-remote",
    "cloudflare-servers\reasoning-remote",
    "cloudflare-servers\github-remote",
    "migration-tools",
    "testing",
    "deployment"
)

foreach ($dir in $dirs) {
    $fullPath = Join-Path $rootPath $dir
    if (!(Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force
        Write-Host "Created: $fullPath" -ForegroundColor Green
    }
}

# Initialize git repo
Set-Location $rootPath
git init
git config user.name "Gustavo Mendes"
git config user.email "gustavo@voither.com"

Write-Host "Project structure created successfully!" -ForegroundColor Cyan
