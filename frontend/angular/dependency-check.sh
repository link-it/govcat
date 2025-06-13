#!/bin/bash

# ===========================================================
# Script sicuro per eseguire Dependency-Check
# ===========================================================

set -e
set -o pipefail

# CONFIGURAZIONE
DEPENDENCY_CHECK_PATH="/home/tagliente/Documenti/Project/"
PROJECT_NAME="govshell-workspace"
OUTPUT_DIR="./dependency-check-report"

# Leggi l'API Key da variabile di ambiente
API_KEY="${NVD_API_KEY:-}"

# Funzione errore
errore() {
    echo "❌ Errore: $1" >&2
    exit 1
}

# Verifica presenza Dependency-Check
DEPENDENCY_CHECK_CMD="$DEPENDENCY_CHECK_PATH/dependency-check/bin/dependency-check.sh"
if [ ! -f "$DEPENDENCY_CHECK_CMD" ]; then
    errore "Dependency-Check non trovato in: $DEPENDENCY_CHECK_CMD"
fi

# Crea cartella output
mkdir -p "$OUTPUT_DIR"

# Comando base
CMD="\"$DEPENDENCY_CHECK_CMD\" --scan . --project \"$PROJECT_NAME\" --out \"$OUTPUT_DIR\" --format HTML"

# Aggiunta API Key se disponibile
if [ -n "$API_KEY" ]; then
    echo "ℹ️  API Key trovata nell'ambiente, la uso per aggiornare più velocemente il database NVD."
    CMD="$CMD --nvdApiKey $API_KEY"
else
    echo "⚠️  Nessuna API Key trovata, il download NVD potrebbe essere più lento."
fi

# Esecuzione
echo "🚀 Avvio Dependency-Check per il progetto: $PROJECT_NAME"
eval $CMD

# Controllo risultato
if [ $? -eq 0 ]; then
    echo "✅ Scansione completata! Report disponibile in: $OUTPUT_DIR"
else
    errore "Errore durante l'esecuzione di Dependency-Check."
fi
