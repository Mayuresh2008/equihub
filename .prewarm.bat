@echo off
REM Pre-warm all main routes so first navigation is instant
setlocal enabledelayedexpansion
echo Pre-warming routes (this takes ~30s on first run)...
ping -n 3 127.0.0.1 >nul

for %%P in (
  "/"
  "/login"
  "/dashboard"
  "/companies"
  "/companies/c1"
  "/companies/c1/captable"
  "/companies/c1/captable"
  "/companies/c1/funding-rounds"
  "/companies/c1/esop"
  "/companies/c1/shareholders/s1"
  "/portfolio"
  "/portfolio/c1"
  "/documents"
  "/users"
  "/audit-logs"
  "/settings"
  "/notifications"
  "/ai-generator"
  "/my-company"
  "/my-captable"
  "/my-funding-rounds"
  "/my-esop"
  "/my-team"
  "/api/auth/login"
  "/api/companies"
  "/api/companies/c1/shareholders"
  "/api/companies/c1/dilution-history"
  "/api/funding-rounds"
) do (
  curl -s -o nul -w "  %%P - HTTP %%{http_code} - %%{time_total}s" "http://localhost:3001%%P"
  echo.
)

echo.
echo Pre-warm complete. All routes now cached.
endlocal
