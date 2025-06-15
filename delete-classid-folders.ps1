# Script to delete remaining [classId] folders

# Define the app directory path
$appDir = "src\app"

# Find all directories with [classId] in their name
Write-Host "Finding directories with [classId] in their name..."
$classIdDirs = Get-ChildItem -Path $appDir -Recurse -Directory | Where-Object { $_.Name -eq "[classId]" }

# Output the results
Write-Host "`nDirectories with [classId] to be deleted:"
foreach ($dir in $classIdDirs) {
    Write-Host $dir.FullName
}

# Delete each directory without confirmation
Write-Host "`nDeleting directories..."
foreach ($dir in $classIdDirs) {
    try {
        Remove-Item -Path $dir.FullName -Recurse -Force -ErrorAction Stop
        Write-Host "Successfully deleted: $($dir.FullName)" -ForegroundColor Green
    }
    catch {
        Write-Host "Failed to delete: $($dir.FullName)" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
    }
}
Write-Host "`nDeletion complete." -ForegroundColor Cyan

# Now check if any [classId] directories remain
$remainingDirs = Get-ChildItem -Path $appDir -Recurse -Directory | Where-Object { $_.Name -eq "[classId]" }
if ($remainingDirs.Count -gt 0) {
    Write-Host "`nRemaining [classId] directories:" -ForegroundColor Yellow
    foreach ($dir in $remainingDirs) {
        Write-Host $dir.FullName
    }
}
else {
    Write-Host "`nAll [classId] directories have been successfully deleted." -ForegroundColor Green
}
