@echo off
setlocal enabledelayedexpansion

title Iniciador API - Proyecto DAM
color 0a

:: Configuración
set "SUBCARPETA_Front-SAP-Fiori-master"

:: Verifica Node.js instalado
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js no está instalado o no está en el PATH
    echo Instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

:: Navega al proyecto
cd /d "%~dp0%SUBCARPETA_PROYECTO%"

if not exist "package.json" (
    echo Error: Estructura de carpetas incorrecta
    echo El archivo .bat debe estar en:
    echo PROYECTO FINAL BACKEND + FRONT
    echo y el proyecto API en:
    echo FINAL PROJECT\%SUBCARPETA_PROYECTO%\
    pause
    exit /b 1
)

echo Iniciando API en: %cd%
npm run start
pause