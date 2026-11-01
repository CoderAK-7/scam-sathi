$js = [IO.File]::ReadAllText('extension/platforms/whatsapp.js')
$lines = $js -split "`n"

# Check for optional chaining - some editors flag these without ES2019+ target
$patterns = @{
    'Optional chaining (?.)' = '\?\.'
    'Nullish coalescing (??)' = '\?\?'
    'Logical assignment (&&=, ||=, ??=)' = '(&&=|\|\|=|\?\?=)'
    'Private class fields (#)' = '(?<![a-z])#[a-zA-Z]'
    'Top-level await' = '^await\s'
}

$found = $false
foreach ($name in $patterns.Keys) {
    $pattern = $patterns[$name]
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match $pattern) {
            Write-Host ("Line " + ($i+1) + " [" + $name + "]: " + $lines[$i].Trim())
            $found = $true
        }
    }
}
if (-not $found) { Write-Host "No ES2019+ syntax issues found." }

