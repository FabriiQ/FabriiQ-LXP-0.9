$directories = @(
    "src\app\admin\system\subjects",
    "src\app\admin\system\programs",
    "src\app\admin\system\teachers",
    "src\app\admin\system\students",
    "src\app\admin\system\classes",
    "src\app\admin\system\campuses",
    "src\app\admin\campus"
)

foreach ($directory in $directories) {
    if (Test-Path $directory) {
        Write-Host "Processing directory: $directory"
        $files = Get-ChildItem -Path $directory -Recurse -Filter "*.tsx" | Where-Object { $_.FullName -notlike "*\node_modules\*" }
        
        foreach ($file in $files) {
            $content = Get-Content -Path $file.FullName -Raw
            $modified = $false
            
            # Skip files that already use React.use() for params
            if ($content -match "const unwrappedParams = (React\.)?use\(params\)") {
                Write-Host "  File already fixed: $($file.FullName)"
                continue
            }
            
            # Check if the file is a client component and uses params.id or other params properties directly
            if ($content -match "'use client';" -and ($content -match "params\.[a-zA-Z]+" -or $content -match "const [a-zA-Z]+ = params\.[a-zA-Z]+")) {
                Write-Host "  Fixing file: $($file.FullName)"
                
                # Add React.use import if needed
                if (-not ($content -match "import React,.*from ['\"]react['\"]")) {
                    if ($content -match "import React from ['\"]react['\"];") {
                        $content = $content -replace "import React from ['\"]react['\"];", "import React, { use } from 'react';"
                        $modified = $true
                    } elseif ($content -match "import \{ .* \} from ['\"]react['\"];") {
                        $content = $content -replace "import \{(.*)\} from ['\"]react['\"];", "import { use,$1 } from 'react';"
                        $modified = $true
                    } else {
                        $content = $content -replace "'use client';", "'use client';\n\nimport { use } from 'react';"
                        $modified = $true
                    }
                }
                
                # Fix the params type in the component props
                if ($content -match "export default function [a-zA-Z]+\(\{[\s\n]*params,[\s\n]*\}:[\s\n]*\{[\s\n]*params: \{[^\}]+\};[\s\n]*\}\)") {
                    $content = $content -replace "params: \{([^\}]+)\}", "params: Promise<{$1}> | {$1}"
                    $modified = $true
                }
                
                # Add the unwrapping code for direct params access
                $paramMatches = [regex]::Matches($content, "const ([a-zA-Z]+) = params\.([a-zA-Z]+)")
                if ($paramMatches.Count -gt 0) {
                    $paramsList = @()
                    foreach ($match in $paramMatches) {
                        $varName = $match.Groups[1].Value
                        $paramName = $match.Groups[2].Value
                        $paramsList += @{
                            "varName" = $varName
                            "paramName" = $paramName
                        }
                    }
                    
                    # Create the unwrapping code
                    $unwrapCode = "  // Unwrap params with React.use() to avoid the warning in Next.js 15+`n  const unwrappedParams = React.use(params);`n"
                    foreach ($param in $paramsList) {
                        $unwrapCode += "  const $($param.varName) = unwrappedParams.$($param.paramName);`n"
                    }
                    
                    # Replace each direct params access with the unwrapped version
                    foreach ($param in $paramsList) {
                        $pattern = "const $($param.varName) = params\.$($param.paramName)"
                        $content = $content -replace $pattern, $unwrapCode
                        # Only add the unwrap code once
                        $unwrapCode = ""
                    }
                    $modified = $true
                }
                
                # Fix type assertions
                if ($content -match "params\.[a-zA-Z]+ as string") {
                    $content = $content -replace "const ([a-zA-Z]+) = params\.([a-zA-Z]+) as string", "// Unwrap params with React.use() to avoid the warning in Next.js 15+`n  const unwrappedParams = React.use(params);`n  const $1 = unwrappedParams.$2"
                    $modified = $true
                }
                
                # Save the modified content if changes were made
                if ($modified) {
                    Set-Content -Path $file.FullName -Value $content
                    Write-Host "    File updated successfully"
                }
            }
        }
    } else {
        Write-Host "Directory not found: $directory"
    }
}

Write-Host "All files processed!"
