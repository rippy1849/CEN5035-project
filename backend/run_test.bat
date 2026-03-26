@echo off
echo Running Marketplace Backend Tests...
echo.
..\..\Project\go_dist\bin\go test ./... -v
echo.
echo Tests complete.
pause
