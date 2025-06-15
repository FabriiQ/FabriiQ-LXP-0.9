$files = Get-ChildItem -Path "src\app\teacher\classes\[classId]" -Recurse -Filter "*.tsx" | Where-Object { $_.FullName -notlike "*\node_modules\*" }

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Check if the file already has the React.use() fix
    if ($content -match "const unwrappedParams = use\(params\)") {
        Write-Host "File already fixed: $($file.FullName)"
        continue
    }
    
    # Check if the file uses params.classId
    if ($content -match "params\.classId") {
        Write-Host "Fixing file: $($file.FullName)"
        
        # Add the import if needed
        if (-not ($content -match "import \{.*use.*\} from ['""]react['""]")) {
            if ($content -match "import React from ['""]react['""];") {
                $content = $content -replace "import React from ['""]react['""];", "import React, { use } from 'react';"
            } elseif ($content -match "import \{ .* \} from ['""]react['""];") {
                $content = $content -replace "import \{(.*)\} from ['""]react['""];", "import {`$1, use } from 'react';"
            } else {
                $content = "import { use } from 'react';" + "`n" + $content
            }
        }
        
        # Add the unwrapping code
        $pattern = "export default (async )?function .*\(\{[\s\n]*params,[\s\n]*\}:[\s\n]*\{[\s\n]*params: \{ classId: string(; .*)?\};[\s\n]*\}\) \{"
        $replacement = "export default `$1function `$2({`n  params,`n}: {`n  params: { classId: string`$3};`n}) {`n  // Unwrap params with React.use() to avoid the warning in Next.js 15+`n  const unwrappedParams = use(params);`n  const classId = unwrappedParams.classId;`n"
        $content = $content -replace $pattern, $replacement
        
        # Replace all instances of params.classId with classId
        $content = $content -replace "params\.classId", "classId"
        
        # Save the modified content
        Set-Content -Path $file.FullName -Value $content
    }
}

Write-Host "All files processed!"
