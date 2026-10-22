$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$first = Read-Host 'Новый пароль (минимум 12 символов)' -AsSecureString
$second = Read-Host 'Повторите новый пароль' -AsSecureString
function ConvertTo-PlainText($secret) {
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
    try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}
try {
    $payload = @{ password = (ConvertTo-PlainText $first); confirmation = (ConvertTo-PlainText $second) } | ConvertTo-Json -Compress
    $payload | node --env-file-if-exists=.env.local scripts/change-admin-password.mjs
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
    $payload = $null
    $first.Dispose()
    $second.Dispose()
}
