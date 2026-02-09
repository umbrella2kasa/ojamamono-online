$source = "c:\Users\hi040\OjamamonoUnity\SocketIOUnity-main\Runtime\libs"
$dest = "c:\Users\hi040\OjamamonoUnity\Assets\Plugins\SocketIO\libs"

Write-Host "Restoring DLLs from $source to $dest"

$files = @(
    "System.Text.Json.dll",
    "System.Text.Json.dll.meta",
    "Microsoft.Bcl.AsyncInterfaces.dll",
    "Microsoft.Bcl.AsyncInterfaces.dll.meta",
    "System.Threading.Tasks.Extensions.dll",
    "System.Threading.Tasks.Extensions.dll.meta"
)

foreach ($file in $files) {
    Copy-Item -Path "$source\$file" -Destination "$dest\$file" -Force
    Write-Host "Restored $file"
}
