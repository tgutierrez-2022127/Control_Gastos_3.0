@echo off
cd /d "%~dp0"
echo Creando/actualizando usuarios de prueba...
node "node_modules\ts-node\dist\bin-transpile.js" "src/seed.ts"
