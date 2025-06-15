$files = Get-ChildItem -Path "src\app\teacher\classes\[classId]" -Recurse -Filter "*.tsx" | Where-Object { $_.FullName -notlike "*\node_modules\*" }

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Check if the file has the React.use() fix that needs to be updated
    if ($content -match "const unwrappedParams = use\(params\)") {
        Write-Host "Fixing file: $($file.FullName)"
        
        # Replace the use() implementation with direct access + type assertion
        $content = $content -replace "// Unwrap params with React\.use\(\) to avoid the warning in Next\.js 15\+\s+const unwrappedParams = use\(params\);\s+const classId = unwrappedParams\.classId;", "// Get classId directly from params to avoid the Next.js warning`n  const classId = params.classId as string;"
        
        # Remove the use import if it's not used elsewhere
        if (-not ($content -match "use\(" -and -not $content -match "unwrappedParams")) {
            $content = $content -replace 'import \{ use \} from "react";', ""
            $content = $content -replace 'import React, \{ use \} from "react";', 'import React from "react";'
            $content = $content -replace 'import \{(.*), use(.*)\} from "react";', 'import {$1$2} from "react";'
        }
        
        # Save the modified content
        Set-Content -Path $file.FullName -Value $content
    }
}

Write-Host "All files processed!"
