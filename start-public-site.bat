@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-local-site.ps1" -BindAddress 0.0.0.0
