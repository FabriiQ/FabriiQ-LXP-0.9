# Script to rename [classId] folders to [id] to fix Next.js routing conflicts

# Define the directories to rename
$dirsToRename = @(
    "src\app\api\classes\[classId]",
    "src\app\dashboard\student\class\[classId]",
    "src\app\teacher\classes\[classId]"
)

# Function to safely rename a directory
function Rename-DirectorySafely {
    param (
        [string]$Path,
        [string]$NewName
    )

    if (Test-Path $Path) {
        Write-Host "Processing $Path..."

        # Create a temporary directory name
        $tempDir = "$Path-temp"

        # First, rename to a temporary name to avoid conflicts
        try {
            Rename-Item -Path $Path -NewName "$Path-temp" -ErrorAction Stop
            Write-Host "  Renamed to temporary directory: $tempDir"

            # Get the parent directory
            $parentDir = Split-Path -Parent $Path

            # Now rename to the final name
            $finalPath = Join-Path -Path $parentDir -ChildPath $NewName
            Rename-Item -Path $tempDir -NewName $NewName -ErrorAction Stop
            Write-Host "  Successfully renamed to: $finalPath"

            return $true
        }
        catch {
            Write-Host "  Error renaming directory: $_" -ForegroundColor Red

            # Try to restore the original directory if the temp one exists
            if (Test-Path $tempDir) {
                try {
                    Rename-Item -Path $tempDir -NewName (Split-Path -Leaf $Path) -ErrorAction Stop
                    Write-Host "  Restored original directory name" -ForegroundColor Yellow
                }
                catch {
                    Write-Host "  Failed to restore original directory name: $_" -ForegroundColor Red
                }
            }

            return $false
        }
    }
    else {
        Write-Host "Directory not found: $Path" -ForegroundColor Yellow
        return $false
    }
}

# Process each directory
foreach ($dir in $dirsToRename) {
    # Check if the directory exists
    if (Test-Path $dir) {
        # Get the parent directory
        $parentDir = Split-Path -Parent $dir

        # Create the new directory name
        $newDirName = "[id]"

        # Rename the directory
        $success = Rename-DirectorySafely -Path $dir -NewName $newDirName

        if ($success) {
            Write-Host "Successfully renamed $dir to $parentDir\$newDirName" -ForegroundColor Green
        }
        else {
            Write-Host "Failed to rename $dir" -ForegroundColor Red
        }
    }
    else {
        Write-Host "Directory not found: $dir" -ForegroundColor Yellow
    }
}

Write-Host "`nDirectory renaming complete. Now updating code references..." -ForegroundColor Cyan

# Now update code references in files
$filesToUpdate = Get-ChildItem -Path "src" -Recurse -Include "*.tsx","*.ts","*.jsx","*.js" | Where-Object { $_.FullName -notlike "*\node_modules\*" }

$replacementCount = 0

foreach ($file in $filesToUpdate) {
    $content = [string]::Join("`n", (Get-Content -Path $file.FullName))

    # Skip binary files or empty files
    if ($null -eq $content) {
        continue
    }

    # Check if the file contains references to params.classId
    if ($content -match "params\.classId" -or $content -match "params\?\.classId") {
        Write-Host "Updating references in: $($file.FullName)"

        # Replace params.classId with params.id
        $newContent = $content -replace "params\.classId", "params.id" -replace "params\?\.classId", "params?.id"

        # Replace { params: { classId: string } } with { params: { id: string } }
        $newContent = $newContent -replace "params: \{ classId: string", "params: { id: string"

        # Replace { classId: string; } with { id: string; }
        $newContent = $newContent -replace "\{ classId: string;", "{ id: string;"

        # Replace { params }: { params: { classId: string } } with { params }: { params: { id: string } }
        $newContent = $newContent -replace "\{ params \}: \{ params: \{ classId: string", "{ params }: { params: { id: string"

        # Only save if changes were made
        if ($newContent -ne $content) {
            Set-Content -Path $file.FullName -Value $newContent
            $replacementCount++
        }
    }
}

Write-Host "`nUpdated code references in $replacementCount files." -ForegroundColor Green
Write-Host "`nRenaming process complete. Please run 'npm run dev' to verify the changes." -ForegroundColor Cyan
