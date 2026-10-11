@echo off
title CodeAlpha - Task 2 Social Media Platform
echo ====================================================
echo Starting Task 2: Mini Social Media Platform
echo URL: http://localhost:5001
echo ====================================================
cd /d "%~dp0Task-2-Social-Media"
start "" http://localhost:5001
node server.js
pause
