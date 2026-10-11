@echo off
title CodeAlpha FSD Runner
echo ====================================================
echo Launching Both CodeAlpha Tasks in Separate Windows
echo Task 1 (E-commerce):   http://localhost:5000
echo Task 2 (Social Media): http://localhost:5001
echo ====================================================
start "Task 1 - E-commerce" "%~dp0run-task1.bat"
start "Task 2 - Social Media" "%~dp0run-task2.bat"
echo Both servers started!
