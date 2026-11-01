$lines = [IO.File]::ReadAllLines('extension/platforms/whatsapp.js')
for ($i = 0; $i -lt $lines.Length; $i++) {
    $ln = $lines[$i]
    $count = ($ln.ToCharArray() | Where-Object { [string]$_ -eq '"' }).Count
    if ($count % 2 -ne 0) {
        Write-Host ('Line ' + ($i+1) + ' [odd-dquotes=' + $count + ']: ' + $ln.Trim())
    }
}

