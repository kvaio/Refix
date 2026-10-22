$ErrorActionPreference = 'Stop'

$adminName = Read-Host 'Nombre del administrador'
$adminEmail = Read-Host 'Correo del administrador'
$password = Read-Host 'Contraseña (mínimo 12 caracteres)' -AsSecureString
$confirmPassword = Read-Host 'Confirma la contraseña' -AsSecureString

$plainPassword = [System.Net.NetworkCredential]::new('', $password).Password
$plainConfirmation = [System.Net.NetworkCredential]::new('', $confirmPassword).Password
if ($plainPassword -ne $plainConfirmation) {
  throw 'Las contraseñas no coinciden. No se creó ninguna cuenta.'
}
if ($plainPassword.Length -lt 12) {
  throw 'La contraseña debe tener al menos 12 caracteres. No se creó ninguna cuenta.'
}

$env:ADMIN_NAME = $adminName.Trim()
$env:ADMIN_EMAIL = $adminEmail.Trim()
$env:ADMIN_PASSWORD = $plainPassword

Push-Location (Join-Path $PSScriptRoot '..')
try {
  npm run admin:create
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear la cuenta admin.' }
}
finally {
  Pop-Location
  Remove-Item Env:ADMIN_NAME, Env:ADMIN_EMAIL, Env:ADMIN_PASSWORD -ErrorAction SilentlyContinue
  Remove-Variable adminName, adminEmail, password, confirmPassword, plainPassword, plainConfirmation -ErrorAction SilentlyContinue
}
