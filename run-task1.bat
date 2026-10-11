@echo off
title CodeAlpha - Task 1 E-commerce Store
echo ====================================================
echo Starting Task 1: Simple E-commerce Store
echo URL: http://localhost:5000
echo ====================================================
cd /d "%~dp0Task-1-Ecommerce"
start "" http://localhost:5000
node server.js
pause
