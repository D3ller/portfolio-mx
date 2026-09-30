@echo off
chcp 65001 >nul
title MX Flash - Admin
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js n'est pas installe. Telecharge-le sur https://nodejs.org puis relance ce fichier.
  echo.
  pause
  exit /b 1
)
node "_admin\server.js"
pause
