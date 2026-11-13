@echo off
rem Lets phones on your Wi-Fi reach Aux Wars. Windows asks for permission once.
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Asking Windows for permission...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)
echo Allowing Aux Wars through Windows Firewall...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$node = (Get-Command node -ErrorAction SilentlyContinue).Source;" ^
  "if ($node) { Get-NetFirewallApplicationFilter -Program $node -ErrorAction SilentlyContinue | Get-NetFirewallRule -ErrorAction SilentlyContinue | Where-Object { $_.Action -eq 'Block' -and $_.Direction -eq 'Inbound' } | Remove-NetFirewallRule };" ^
  "Remove-NetFirewallRule -DisplayName 'Aux Wars' -ErrorAction SilentlyContinue;" ^
  "New-NetFirewallRule -DisplayName 'Aux Wars' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000 -Profile Any | Out-Null;" ^
  "Write-Host 'Done. Restart the game (npm start), then scan the QR code again.' -ForegroundColor Green"
echo.
pause
