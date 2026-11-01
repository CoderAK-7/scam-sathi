param([string]$FilePath = "extension/platforms/whatsapp.js")
$code = [IO.File]::ReadAllText($FilePath)

$stack  = [System.Collections.Generic.Stack[string]]::new()
$lstack = [System.Collections.Generic.Stack[int]]::new()
$inStr  = $null; $esc = $false; $inRegex = $false
$errs   = [System.Collections.Generic.List[string]]::new()
$tmpl   = [System.Collections.Generic.Stack[bool]]::new()
$line   = 1; $col = 1; $prev = ''

$n = $code.Length
for ($i = 0; $i -lt $n; $i++) {
    $ch = $code[$i]; $chS = [string]$ch
    if ($ch -eq [char]10) { $line++; $col = 0; $prev = ''; $i++; $i--; $col++; continue }
    $col++

    if ($null -ne $inStr) {
        if ($esc) { $esc = $false; continue }
        if ($ch -eq '\') { $esc = $true; continue }
        if ($ch -eq $inStr) { $inStr = $null; continue }
        if ($inStr -eq '`' -and $ch -eq '$' -and ($i+1) -lt $n -and $code[$i+1] -eq '{') {
            $i++; $col++; $stack.Push('${'); $lstack.Push($line); $tmpl.Push($true); $inStr = $null
        }
        continue
    }
    if ($inRegex) {
        if ($esc) { $esc = $false; continue }
        if ($ch -eq '\') { $esc = $true; continue }
        if ($ch -eq '/') { $inRegex = $false }
        continue
    }
    if ($ch -eq ' ' -or $ch -eq [char]9 -or $ch -eq [char]13) { continue }
    if ($ch -eq '/' -and ($i+1) -lt $n -and $code[$i+1] -eq '/') {
        while ($i -lt $n -and $code[$i] -ne [char]10) { $i++ }; $i--; continue
    }
    if ($ch -eq '/' -and ($i+1) -lt $n -and $code[$i+1] -eq '*') {
        $i += 2
        while ($i -lt ($n-1) -and -not ($code[$i] -eq '*' -and $code[$i+1] -eq '/')) { if ($code[$i] -eq [char]10) { $line++ }; $i++ }
        $i++; continue
    }
    if ($ch -eq '/') {
        $reAfter = @('(', ',', '=', '[', '!', '&', '|', '?', ':', '{', '}', ';', '')
        if ($reAfter -contains $prev) { $inRegex = $true; $prev = '/'; continue }
    }
    if ($ch -eq '"' -or $ch -eq "'" -or $ch -eq '`') { $inStr = $chS; $prev = $chS; continue }
    if ($ch -eq '{' -or $ch -eq '(' -or $ch -eq '[') { $stack.Push($chS); $lstack.Push($line); $prev = $chS; continue }
    if ($ch -eq '}' -or $ch -eq ')' -or $ch -eq ']') {
        $exp = if ($ch -eq '}') { '{' } elseif ($ch -eq ')') { '(' } else { '[' }
        if ($stack.Count -eq 0) { $errs.Add("Unexpected '$chS' at line $line") }
        else {
            $top = $stack.Pop(); $tln = $lstack.Pop()
            if ($top -eq '${' -and $ch -eq '}') { if ($tmpl.Count -gt 0) { $tmpl.Pop() | Out-Null }; $inStr = '`' }
            elseif ($top -ne $exp) { $errs.Add("Mismatched '$chS' at line $line (opened '$top' at $tln)") }
        }
        $prev = $chS; continue
    }
    $prev = $chS
}

$fname = Split-Path $FilePath -Leaf
if ($null -ne $inStr) { Write-Host "$fname : UNCLOSED QUOTE '$inStr'" }
elseif ($errs.Count -gt 0) { Write-Host "$fname : ERRORS"; $errs | ForEach-Object { Write-Host "  $_" } }
elseif ($stack.Count -gt 0) { Write-Host "$fname : UNCLOSED ($($stack.Count) delimiters)"; $stack.ToArray() | ForEach-Object { Write-Host "  '$_'" } }
else { Write-Host "$fname : OK (line $line, zero errors)" }
