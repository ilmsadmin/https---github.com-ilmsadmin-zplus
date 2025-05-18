# Internationalization Validation Script
# This script validates all translations across all locales
# and checks for any missing or invalid translations.

# Get directory of this script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootPath = Split-Path -Parent $scriptPath
$messagesPath = Join-Path $rootPath "frontend\src\messages"

# Define locales and namespaces
$locales = @("en", "vi", "zh", "ja", "ar", "he")
$namespaces = @("common", "auth", "tenant")

# Colors for terminal output
function Write-ColorOutput($foregroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $foregroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success($message) {
    Write-ColorOutput Green $message
}

function Write-Warning($message) {
    Write-ColorOutput Yellow $message
}

function Write-Error($message) {
    Write-ColorOutput Red $message
}

function Write-Info($message) {
    Write-ColorOutput Cyan $message
}

Write-Info "=== Internationalization Validation ==="
Write-Info "Checking translations in $messagesPath"

# Check if all locales have the required directories
foreach ($locale in $locales) {
    $localePath = Join-Path $messagesPath $locale
    if (-not (Test-Path $localePath -PathType Container)) {
        Write-Error "Error: Missing locale directory for $locale"
        continue
    }
    
    # Check if all namespaces exist for each locale
    foreach ($namespace in $namespaces) {
        $filePath = Join-Path $localePath "$namespace.json"
        if (-not (Test-Path $filePath -PathType Leaf)) {
            Write-Error "Error: Missing namespace file $namespace.json for locale $locale"
        }
    }
}

# Get reference keys from English locale
$referenceKeys = @{}
foreach ($namespace in $namespaces) {
    $refFilePath = Join-Path $messagesPath "en\$namespace.json"
    if (Test-Path $refFilePath -PathType Leaf) {
        try {
            $content = Get-Content $refFilePath -Raw | ConvertFrom-Json -AsHashtable -Depth 100
            $referenceKeys[$namespace] = @(Get-TranslationKeys $content)
        } catch {
            Write-Error "Error reading reference file $refFilePath: $_"
        }
    } else {
        Write-Error "Reference file not found: $refFilePath"
    }
}

# Check all locales against reference keys
$totalMissing = 0
$totalExtra = 0

foreach ($locale in $locales) {
    if ($locale -eq "en") { continue } # Skip reference locale
    
    $missingInLocale = 0
    $extraInLocale = 0
    
    Write-Info "`nChecking locale: $locale"
    
    foreach ($namespace in $namespaces) {
        $filePath = Join-Path $messagesPath "$locale\$namespace.json"
        if (-not (Test-Path $filePath -PathType Leaf)) {
            Write-Error "  Missing namespace file: $namespace.json"
            continue
        }
        
        try {
            $content = Get-Content $filePath -Raw | ConvertFrom-Json -AsHashtable -Depth 100
            $localeKeys = @(Get-TranslationKeys $content)
            
            # Check for missing keys
            foreach ($key in $referenceKeys[$namespace]) {
                if ($localeKeys -notcontains $key) {
                    Write-Warning "  Missing key in $locale/$namespace: $key"
                    $missingInLocale++
                    $totalMissing++
                }
            }
            
            # Check for extra keys
            foreach ($key in $localeKeys) {
                if ($referenceKeys[$namespace] -notcontains $key) {
                    Write-Warning "  Extra key in $locale/$namespace: $key"
                    $extraInLocale++
                    $totalExtra++
                }
            }
        } catch {
            Write-Error "  Error reading file $filePath: $_"
        }
    }
    
    if ($missingInLocale -eq 0 -and $extraInLocale -eq 0) {
        Write-Success "  All translations for $locale are complete!"
    } else {
        if ($missingInLocale -gt 0) {
            Write-Warning "  $missingInLocale keys missing in $locale"
        }
        if ($extraInLocale -gt 0) {
            Write-Warning "  $extraInLocale extra keys in $locale"
        }
    }
}

Write-Info "`nSummary:"
if ($totalMissing -eq 0 -and $totalExtra -eq 0) {
    Write-Success "All translations are complete and valid!"
} else {
    if ($totalMissing -gt 0) {
        Write-Warning "Total missing keys: $totalMissing"
    }
    if ($totalExtra -gt 0) {
        Write-Warning "Total extra keys: $totalExtra"
    }
}

# Function to extract all translation keys from a nested object
function Get-TranslationKeys($obj, $prefix = "") {
    $keys = @()
    
    foreach ($key in $obj.Keys) {
        $fullKey = if ($prefix) { "$prefix.$key" } else { $key }
        
        if ($obj[$key] -is [System.Collections.Hashtable]) {
            $keys += Get-TranslationKeys $obj[$key] $fullKey
        } else {
            $keys += $fullKey
        }
    }
    
    return $keys
}

# Return success or failure
if ($totalMissing -eq 0 -and $totalExtra -eq 0) {
    exit 0
} else {
    exit 1
}
