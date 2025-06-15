# Script to find potentially conflicting dynamic routes in Next.js app directory

# Define the app directory path
$appDir = "src\app"

# Find all directories with [id] in their name
Write-Host "Finding directories with [id] in their name..."
$idDirs = Get-ChildItem -Path $appDir -Recurse -Directory | Where-Object { $_.Name -eq "[id]" }

# Find all directories with [classId] in their name
Write-Host "Finding directories with [classId] in their name..."
$classIdDirs = Get-ChildItem -Path $appDir -Recurse -Directory | Where-Object { $_.Name -eq "[classId]" }

# Output the results
Write-Host "`nDirectories with [id]:"
foreach ($dir in $idDirs) {
    Write-Host $dir.FullName
}

Write-Host "`nDirectories with [classId]:"
foreach ($dir in $classIdDirs) {
    Write-Host $dir.FullName
}

# Analyze potential conflicts
Write-Host "`nAnalyzing potential conflicts..."

# Extract parent paths for comparison
$idParentPaths = @()
foreach ($dir in $idDirs) {
    $parentPath = $dir.FullName.Substring(0, $dir.FullName.LastIndexOf("\[id]"))
    $normalizedPath = $parentPath.Replace($appDir, "").TrimStart("\").Replace("\", "/")
    $idParentPaths += $normalizedPath
}

$classIdParentPaths = @()
foreach ($dir in $classIdDirs) {
    $parentPath = $dir.FullName.Substring(0, $dir.FullName.LastIndexOf("\[classId]"))
    $normalizedPath = $parentPath.Replace($appDir, "").TrimStart("\").Replace("\", "/")
    $classIdParentPaths += $normalizedPath
}

# Find similar paths that might conflict
Write-Host "`nPotential conflicts:"
foreach ($idPath in $idParentPaths) {
    foreach ($classIdPath in $classIdParentPaths) {
        # Check if paths are similar (ignoring the parameter name)
        $idPathSegments = $idPath.Split("/")
        $classIdPathSegments = $classIdPath.Split("/")
        
        # If the paths have the same number of segments and similar structure
        if ($idPathSegments.Count -eq $classIdPathSegments.Count) {
            $similarSegments = 0
            for ($i = 0; $i -lt $idPathSegments.Count; $i++) {
                if ($idPathSegments[$i] -eq $classIdPathSegments[$i]) {
                    $similarSegments++
                }
            }
            
            # If most segments are similar, it might be a conflict
            if ($similarSegments -ge ($idPathSegments.Count - 1)) {
                Write-Host "Possible conflict between:"
                Write-Host "  $idPath/[id]"
                Write-Host "  $classIdPath/[classId]"
                Write-Host ""
            }
        }
    }
}
