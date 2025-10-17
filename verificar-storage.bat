@echo off
echo ========================================
echo   VERIFICACION DE FIREBASE STORAGE
echo   Proyecto: awka-ddc36
echo ========================================
echo.

echo Verificando proyecto actual...
firebase use
echo.

echo Intentando obtener informacion de Storage...
echo.
firebase deploy --only storage --dry-run
if %errorlevel% neq 0 (
    echo.
    echo ❌ FIREBASE STORAGE NO ESTA INICIALIZADO
    echo.
    echo Para inicializar Storage:
    echo.
    echo 1. Abre: https://console.firebase.google.com/project/awka-ddc36/storage
    echo.
    echo 2. Si ves un boton "Get Started":
    echo    - Haz clic en "Get Started"
    echo    - Selecciona "Start in production mode"
    echo    - Verifica ubicacion: us-central1
    echo    - Haz clic en "Done"
    echo.
    echo 3. Si ya ves el bucket pero hay error:
    echo    - Ve a la pestana "Rules"
    echo    - Haz clic en "Edit rules"
    echo    - Asegurate de que haya reglas publicadas
    echo    - Haz clic en "Publish"
    echo.
    echo 4. Despues de inicializar, ejecuta:
    echo    deploy-cors-fix.bat
    echo.
    echo Lee INICIALIZAR_STORAGE.md para guia completa
    echo.
) else (
    echo.
    echo ✅ FIREBASE STORAGE ESTA CONFIGURADO CORRECTAMENTE
    echo.
    echo Tu bucket: gs://awka-ddc36.firebasestorage.app
    echo Ubicacion: us-central1
    echo.
    echo Puedes desplegar con:
    echo   deploy-cors-fix.bat
    echo.
    echo O manualmente:
    echo   firebase deploy --only storage,hosting
    echo.
)

pause
