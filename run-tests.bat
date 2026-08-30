@echo off
setlocal
title PokeDex - Playwright Tests
cd /d "%~dp0"

where npm >nul 2>&1
if errorlevel 1 (
  echo.
  echo   Node.js is not installed or not on PATH.
  echo   Get it from https://nodejs.org then run this file again.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\@playwright\test" (
  echo.
  echo   First run - installing dependencies...
  echo.
  call npm install
  if errorlevel 1 goto failed_setup
)

echo.
echo   Checking the test browser...
call npm run setup >nul 2>&1
if errorlevel 1 goto failed_setup

:menu
cls
echo.
echo   ===========================================
echo     PokeDex - Playwright Tests
echo   ===========================================
echo.
echo     [1]  Run all tests  (desktop + mobile)
echo     [2]  Desktop only
echo     [3]  Mobile only
echo     [4]  Watch them run in a browser
echo     [5]  Interactive UI mode
echo.
echo     [6]  Open the last test report
echo     [7]  Just serve the app in a browser
echo.
echo     [Q]  Quit
echo.
set "pick="
set /p "pick=  Choose: "

if /i "%pick%"=="1" (
  set "cmd=npm test"
  goto run
)
if /i "%pick%"=="2" (
  set "cmd=npm run test:desktop"
  goto run
)
if /i "%pick%"=="3" (
  set "cmd=npm run test:mobile"
  goto run
)
if /i "%pick%"=="4" (
  set "cmd=npm run test:headed"
  goto run
)
if /i "%pick%"=="5" (
  set "cmd=npm run test:ui"
  goto run
)
if /i "%pick%"=="6" (
  set "cmd=npm run report"
  goto run
)
if /i "%pick%"=="7" goto serve
if /i "%pick%"=="q" exit /b 0
goto menu

:run
cls
echo.
echo   Running: %cmd%
echo.
call %cmd%
set "code=%errorlevel%"
echo.
if "%code%"=="0" (
  echo   ---------------------------------------
  echo     All tests passed.
  echo   ---------------------------------------
) else (
  echo   ---------------------------------------
  echo     Something failed. Choose [6] to open
  echo     the report and see which test broke.
  echo   ---------------------------------------
)
echo.
pause
goto menu

:serve
cls
echo.
echo   Serving the app at http://127.0.0.1:4173
echo   Close this window or press Ctrl+C to stop.
echo.
start "" "http://127.0.0.1:4173"
call npm run serve
pause
goto menu

:failed_setup
echo.
echo   Setup failed. Check your internet connection and try again.
echo.
pause
exit /b 1
