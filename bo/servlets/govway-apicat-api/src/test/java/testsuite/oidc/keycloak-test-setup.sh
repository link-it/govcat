#!/bin/bash

################################################################################
# Script per Setup Rapido di Keycloak per Test OIDC
#
# Questo script:
# 1. Avvia Keycloak in Docker
# 2. Attende che sia pronto
# 3. Fornisce le istruzioni per la configurazione manuale
#
# Uso: ./keycloak-test-setup.sh [start|stop|restart|status]
################################################################################

set -e

CONTAINER_NAME="keycloak-test"
KEYCLOAK_PORT=9999
KEYCLOAK_ADMIN="admin"
KEYCLOAK_ADMIN_PASSWORD="admin"
REALM_NAME="PROVA"
CLIENT_ID="govcat-api"
USERNAME="bssgnn"
USER_PASSWORD="giovannibu"

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}============================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Funzione per verificare se Docker è installato
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker non è installato. Installa Docker e riprova."
        exit 1
    fi
    print_success "Docker è installato"
}

# Funzione per verificare se il container è in esecuzione
is_running() {
    docker ps --filter "name=$CONTAINER_NAME" --format "{{.Names}}" | grep -q "$CONTAINER_NAME"
}

# Funzione per verificare se il container esiste (anche se fermo)
container_exists() {
    docker ps -a --filter "name=$CONTAINER_NAME" --format "{{.Names}}" | grep -q "$CONTAINER_NAME"
}

# Funzione per attendere che Keycloak sia pronto
wait_for_keycloak() {
    print_info "Attendo che Keycloak sia pronto (può richiedere 30-60 secondi)..."

    local max_attempts=60
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if curl -s -f "http://localhost:$KEYCLOAK_PORT" > /dev/null 2>&1; then
            print_success "Keycloak è pronto!"
            return 0
        fi

        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done

    echo ""
    print_error "Timeout: Keycloak non è diventato disponibile entro 2 minuti"
    print_info "Verifica i log con: docker logs $CONTAINER_NAME"
    return 1
}

# Funzione START
start_keycloak() {
    print_header "AVVIO KEYCLOAK PER TEST OIDC"

    check_docker

    if is_running; then
        print_warning "Keycloak è già in esecuzione"
        show_status
        return 0
    fi

    if container_exists; then
        print_info "Container esistente trovato, avvio in corso..."
        docker start "$CONTAINER_NAME"
    else
        print_info "Creazione nuovo container Keycloak..."
        docker run -d \
            --name "$CONTAINER_NAME" \
            -p "$KEYCLOAK_PORT:8080" \
            -e KEYCLOAK_ADMIN="$KEYCLOAK_ADMIN" \
            -e KEYCLOAK_ADMIN_PASSWORD="$KEYCLOAK_ADMIN_PASSWORD" \
            quay.io/keycloak/keycloak:latest \
            start-dev
    fi

    print_success "Container avviato"

    if wait_for_keycloak; then
        echo ""
        print_header "KEYCLOAK PRONTO"
        echo ""
        print_success "Admin Console: http://localhost:$KEYCLOAK_PORT"
        print_success "Username: $KEYCLOAK_ADMIN"
        print_success "Password: $KEYCLOAK_ADMIN_PASSWORD"
        echo ""
        print_warning "CONFIGURAZIONE MANUALE RICHIESTA:"
        echo ""
        echo "1. Accedi alla Admin Console"
        echo "2. Crea realm '$REALM_NAME'"
        echo "3. Crea client '$CLIENT_ID' (public, Direct Access Grants abilitato)"
        echo "4. Crea utente '$USERNAME' con password '$USER_PASSWORD'"
        echo ""
        print_info "Vedi README_OIDC_TEST.md per istruzioni dettagliate"
        echo ""
        print_info "Quando hai completato la configurazione, esegui i test con:"
        echo "  mvn test -Dtest=OidcAuthenticationIntegrationTest -Doidc.test.enabled=true"
        echo ""
    else
        print_error "Keycloak non si è avviato correttamente"
        print_info "Controlla i log con: docker logs $CONTAINER_NAME"
        return 1
    fi
}

# Funzione STOP
stop_keycloak() {
    print_header "ARRESTO KEYCLOAK"

    if ! is_running; then
        print_warning "Keycloak non è in esecuzione"
        return 0
    fi

    print_info "Arresto container..."
    docker stop "$CONTAINER_NAME"
    print_success "Keycloak arrestato"
}

# Funzione RESTART
restart_keycloak() {
    print_header "RIAVVIO KEYCLOAK"
    stop_keycloak
    echo ""
    start_keycloak
}

# Funzione STATUS
show_status() {
    print_header "STATUS KEYCLOAK"

    if is_running; then
        print_success "Keycloak è in esecuzione"
        echo ""
        echo "Container ID: $(docker ps --filter "name=$CONTAINER_NAME" --format "{{.ID}}")"
        echo "Image: $(docker ps --filter "name=$CONTAINER_NAME" --format "{{.Image}}")"
        echo "Porta: $KEYCLOAK_PORT"
        echo ""
        print_info "Admin Console: http://localhost:$KEYCLOAK_PORT"
        print_info "OIDC Configuration: http://localhost:$KEYCLOAK_PORT/realms/$REALM_NAME/.well-known/openid-configuration"
        echo ""

        # Verifica se Keycloak risponde
        if curl -s -f "http://localhost:$KEYCLOAK_PORT" > /dev/null 2>&1; then
            print_success "Keycloak risponde alle richieste HTTP"
        else
            print_warning "Keycloak non risponde (potrebbe essere ancora in avvio)"
        fi

    elif container_exists; then
        print_warning "Keycloak esiste ma non è in esecuzione"
        print_info "Avvialo con: $0 start"
    else
        print_warning "Keycloak non è configurato"
        print_info "Avvialo con: $0 start"
    fi
}

# Funzione REMOVE (rimuove completamente il container)
remove_keycloak() {
    print_header "RIMOZIONE KEYCLOAK"

    if is_running; then
        print_info "Arresto container in corso..."
        docker stop "$CONTAINER_NAME"
    fi

    if container_exists; then
        print_info "Rimozione container in corso..."
        docker rm "$CONTAINER_NAME"
        print_success "Container rimosso"
        print_warning "NOTA: Tutta la configurazione di Keycloak è stata eliminata"
    else
        print_warning "Nessun container da rimuovere"
    fi
}

# Funzione LOGS
show_logs() {
    print_header "LOGS KEYCLOAK"

    if ! container_exists; then
        print_error "Container non esiste"
        return 1
    fi

    print_info "Mostrando ultimi 50 log (premi Ctrl+C per uscire)..."
    echo ""
    docker logs -f --tail 50 "$CONTAINER_NAME"
}

# Main
case "${1:-}" in
    start)
        start_keycloak
        ;;
    stop)
        stop_keycloak
        ;;
    restart)
        restart_keycloak
        ;;
    status)
        show_status
        ;;
    remove)
        remove_keycloak
        ;;
    logs)
        show_logs
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status|remove|logs}"
        echo ""
        echo "Comandi:"
        echo "  start   - Avvia Keycloak (crea il container se non esiste)"
        echo "  stop    - Ferma Keycloak (mantiene i dati)"
        echo "  restart - Riavvia Keycloak"
        echo "  status  - Mostra lo stato di Keycloak"
        echo "  remove  - Rimuove completamente il container (elimina tutti i dati)"
        echo "  logs    - Mostra i log di Keycloak"
        echo ""
        exit 1
        ;;
esac
