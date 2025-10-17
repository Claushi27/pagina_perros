#!/bin/bash

echo "========================================"
echo "  DESPLIEGUE DE SOLUCIÓN CORS"
echo "  Proyecto: awka-ddc36"
echo "  Plan: Spark (Gratuito) Compatible"
echo "========================================"
echo ""

echo "[1/2] Desplegando reglas de Storage..."
firebase deploy --only storage
if [ $? -ne 0 ]; then
    echo "❌ Error al desplegar Storage rules"
    exit 1
fi
echo "✅ Storage rules desplegadas correctamente"
echo ""

echo "[2/2] Desplegando sitio web actualizado..."
firebase deploy --only hosting
if [ $? -ne 0 ]; then
    echo "❌ Error al desplegar Hosting"
    exit 1
fi
echo "✅ Hosting desplegado correctamente"
echo ""

echo "========================================"
echo "  DESPLIEGUE COMPLETADO ✅"
echo "========================================"
echo ""
echo "IMPORTANTE: Firebase Storage SDK maneja CORS automáticamente."
echo "No necesitas configurar CORS manualmente con gsutil."
echo ""
echo "Prueba la subida de imágenes en:"
echo "  https://awka-ddc36.web.app/admin.html"
echo ""
echo "Si ves errores:"
echo "  1. Verifica que estás autenticado como admin"
echo "  2. Abre la consola del navegador (F12) para ver el error exacto"
echo "  3. Espera 2-3 minutos para que las reglas se propaguen"
echo "  4. Limpia caché del navegador (Ctrl + Shift + Delete)"
echo ""
echo "Comandos de verificación:"
echo "  firebase projects:list"
echo "  firebase use awka-ddc36"
echo ""

