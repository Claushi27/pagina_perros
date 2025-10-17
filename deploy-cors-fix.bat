@echo off
echo ========================================
echo   DESPLIEGUE DE SOLUCION CORS
echo   Proyecto: awka-ddc36
echo   Plan: Spark (Gratuito) Compatible
echo ========================================
echo.

echo Verificando proyecto...
firebase use
echo.

echo [1/2] Desplegando reglas de Storage...
call firebase deploy --only storage
if %errorlevel% neq 0 (
    echo.
    echo ❌ Error al desplegar Storage rules
    echo.
    echo POSIBLE CAUSA: Firebase Storage no esta inicializado
    echo.
    echo SOLUCION:
    echo 1. Ve a: https://console.firebase.google.com/project/awka-ddc36/storage
    echo 2. Si ves un boton "Get Started", haz clic
    echo 3. Selecciona "Start in production mode"
    echo 4. Confirma la ubicacion (us-central1)
    echo 5. Haz clic en "Done"
    echo.
    echo Luego ejecuta este script nuevamente.
    echo.
    echo Lee INICIALIZAR_STORAGE.md para mas detalles.
    echo.
    pause
    exit /b %errorlevel%
)
echo ✓ Storage rules desplegadas correctamente
echo.

echo [2/2] Desplegando sitio web actualizado...
call firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo Error al desplegar Hosting
    pause
    exit /b %errorlevel%
)
echo ✓ Hosting desplegado correctamente
echo.

echo.
echo ========================================
echo   DESPLIEGUE COMPLETADO
echo ========================================
echo.
echo IMPORTANTE: Firebase Storage SDK maneja CORS automaticamente.
echo No necesitas configurar CORS manualmente con gsutil.
echo.
echo Prueba la subida de imagenes en:
echo   https://awka-ddc36.web.app/admin.html
echo.
echo Si ves errores:
echo   1. Verifica que estas autenticado como admin
echo   2. Abre la consola del navegador (F12) para ver el error exacto
echo   3. Espera 2-3 minutos para que las reglas se propaguen
echo   4. Limpia cache del navegador (Ctrl + Shift + Delete)
echo.
echo Comandos de verificacion:
echo   firebase projects:list
echo   firebase use awka-ddc36
echo.
pause
