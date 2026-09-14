@echo off
cd /d "%~dp0"
echo Iniciando backend FinVanguard...
node "node_modules\ts-node\dist\bin-transpile.js" --transpile-only "src/index.ts"
