@echo off
cd /d C:\riddle\equihub
set "NODE=C:\Users\MAYURE~1\AppData\Local\Temp\nodejs\node-v20.11.1-win-x64\node.exe"
set "Path=C:\Users\MAYURE~1\AppData\Local\Temp\nodejs\node-v20.11.1-win-x64;%Path%"
"C:\Users\MAYURE~1\AppData\Local\Temp\nodejs\node-v20.11.1-win-x64\node.exe" "C:\riddle\equihub\node_modules\next\dist\bin\next" dev -p 3001 > C:\riddle\equihub\.dev.log 2>&1
