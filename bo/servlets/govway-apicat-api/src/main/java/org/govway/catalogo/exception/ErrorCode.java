/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */
package org.govway.catalogo.exception;

/**
 * Enum contenente i codici di errore utilizzati nell'applicazione.
 *
 * Struttura dei codici: CATEGORIA_HTTP_STATUS[_DETTAGLIO]
 * Il metodo getCode() restituisce il formato: CATEGORIA.HTTP_STATUS[.DETTAGLIO]
 *
 * Esempi:
 * - UT_409 -> "UT.409" (Utente già esistente - ConflictException)
 * - API_404 -> "API.404" (API non trovata - NotFoundException)
 * - API_400_VISIBILITY -> "API.400.VISIBILITY" (Visibilità non consentita - BadRequestException)
 *
 * Lo status HTTP è implicito nell'eccezione utilizzata:
 * - BadRequestException -> 400
 * - NotAuthorizedException -> 401/403
 * - NotFoundException -> 404
 * - ConflictException -> 409
 * - RichiestaNonValidaSemanticamenteException -> 422
 * - InternalException -> 500
 */
public enum ErrorCode {

    // ==================== API ====================

    /** API non trovata */
    API_404("API non trovata"),

    /** API già esistente */
    API_409("API già esistente"),

    /** Visibilità allegato non consentita */
    API_400_VISIBILITY("Visibilità allegato non consentita"),

    /** Allegato duplicato */
    API_400_DUPLICATE("Allegato duplicato"),

    /** Impossibile eliminare API utilizzata in adesioni */
    API_400_DELETE("Impossibile eliminare API utilizzata in adesioni"),

    /** Allegato non trovato per l'API */
    API_404_ATTACHMENT("Allegato non trovato"),

    /** Specifica non presente */
    API_400_SPEC("Specifica non presente"),

    // ==================== SERVIZI ====================

    /** Servizio non trovato */
    SRV_404("Servizio non trovato"),

    /** Servizio già esistente */
    SRV_409("Servizio già esistente"),

    /** Utente non registrato, impossibile recuperare servizi */
    SRV_400_NOT_REGISTERED("Utente non registrato"),

    /** Immagine per il servizio non trovata */
    SRV_404_IMAGE("Immagine servizio non trovata"),

    /** Il servizio non è eliminabile */
    SRV_400_NOT_DELETABLE("Servizio non eliminabile"),

    /** Gruppo già associato al servizio */
    SRV_409_GROUP("Gruppo già associato"),

    /** Categoria non foglia, impossibile associare */
    SRV_400_CATEGORY_NOT_LEAF("Categoria non foglia"),

    /** Categoria già associata al servizio */
    SRV_409_CATEGORY("Categoria già associata"),

    /** Impossibile rimuovere utente referente del servizio */
    SRV_403_REMOVE_REFERENT("Impossibile rimuovere referente"),

    /** Impossibile aggiungere utente come referente del package */
    SRV_403_ADD_REFERENT("Impossibile aggiungere referente al package"),

    // ==================== ORGANIZZAZIONI ====================

    /** Organizzazione non trovata */
    ORG_404("Organizzazione non trovata"),

    /** Organizzazione già esistente */
    ORG_409("Organizzazione già esistente"),

    // ==================== DOMINI ====================

    /** Dominio non trovato */
    DOM_404("Dominio non trovato"),

    /** Dominio già esistente */
    DOM_409("Dominio già esistente"),

    // ==================== SOGGETTI ====================

    /** Soggetto non trovato */
    SOG_404("Soggetto non trovato"),

    /** Soggetto già esistente */
    SOG_409("Soggetto già esistente"),

    // ==================== UTENTI ====================

    /** Utente non trovato */
    UT_404("Utente non trovato"),

    /** Utente già esistente */
    UT_409("Utente già esistente"),

    /** Utente già esistente */
    UT_403("Utente non abilitato"),

    // ==================== CLASSI UTENTE ====================

    /** Classe utente non trovata */
    CLS_404("Classe utente non trovata"),

    /** Classe utente già esistente */
    CLS_409("Classe utente già esistente"),

    // ==================== CLIENT ====================

    /** Client non trovato */
    CLT_404("Client non trovato"),

    /** Client già esistente */
    CLT_409("Client già esistente"),

    /** Configurazione client non valida */
    CLT_400_CONFIG("Configurazione client non valida"),

    /** Estensione client non supportata */
    CLT_400_EXTENSION("Estensione client non supportata"),

    // ==================== ADESIONI ====================

    /** Adesione non trovata */
    ADE_404("Adesione non trovata"),

    /** Adesione già esistente */
    ADE_409("Adesione già esistente"),

    /** Stato adesione non valido per questa operazione */
    ADE_400_STATE("Stato adesione non valido"),

    /** Impossibile modificare adesione in questo stato */
    ADE_409_STATE("Impossibile modificare adesione"),

    /** Referente adesione non autorizzato */
    ADE_403_REFERENT("Referente non autorizzato"),

    // ==================== TASSONOMIE ====================

    /** Tassonomia non trovata */
    TAX_404("Tassonomia non trovata"),

    /** Tassonomia già esistente */
    TAX_409("Tassonomia già esistente"),

    // ==================== CATEGORIE ====================

    /** Categoria non trovata */
    CAT_404("Categoria non trovata"),

    /** Categoria già esistente */
    CAT_409("Categoria già esistente"),

    // ==================== GRUPPI ====================

    /** Gruppo non trovato */
    GRP_404("Gruppo non trovato"),

    /** Gruppo già esistente */
    GRP_409("Gruppo già esistente"),

    /** Impossibile eliminare gruppo utilizzato */
    GRP_400_IN_USE("Gruppo in uso, impossibile eliminare"),

    // ==================== DOCUMENTI ====================

    /** Documento non trovato */
    DOC_404("Documento non trovato"),

    /** Documento con UUID e versione non trovato */
    DOC_404_VERSION("Documento versione non trovata"),

    /** Formato documento non supportato */
    DOC_400_FORMAT("Formato documento non supportato"),

    /** Dimensione documento eccede il limite */
    DOC_400_SIZE("Dimensione documento eccede il limite"),

    /** Impossibile elaborare il documento */
    DOC_500("Impossibile elaborare documento"),

    // ==================== NOTIFICHE ====================

    /** Notifica non trovata */
    NTF_404("Notifica non trovata"),

    /** Impossibile inviare notifica */
    NTF_500("Impossibile inviare notifica"),

    /** Destinatario notifica non valido */
    NTF_400_RECIPIENT("Destinatario non valido"),

    // ==================== MONITORAGGIO ====================

    /** Dati di monitoraggio non disponibili */
    MON_404("Dati monitoraggio non disponibili"),

    /** Intervallo temporale non valido */
    MON_400_INTERVAL("Intervallo temporale non valido"),

    /** Metrica non trovata */
    MON_404_METRIC("Metrica non trovata"),

    /** Allarme non trovato */
    MON_404_ALARM("Allarme non trovato"),

    /** Configurazione allarme non valida */
    MON_400_ALARM_CONFIG("Configurazione allarme non valida"),

    /** Statistiche non disponibili */
    MON_404_STATS("Statistiche non disponibili"),

    // ==================== TRANSAZIONI ====================

    /** Transazione non trovata */
    TRX_404("Transazione non trovata"),

    // ==================== AUTENTICAZIONE/AUTORIZZAZIONE ====================

    /** Non autenticato */
    AUT_401("Autenticazione richiesta"),

    /** Non autorizzato */
    AUT_403("Accesso non autorizzato"),

    /** Utente deve avere uno dei ruoli richiesti */
    AUT_403_ROLE("Ruolo richiesto mancante"),

    /** Organizzazione interna, ma utente associato ad altra organizzazione */
    AUT_403_ORG_MISMATCH("Organizzazione utente non corrisponde"),

    /** Organizzazione interna, ma utente non associato */
    AUT_403_ORG_MISSING("Utente non associato ad organizzazione"),

    /** Accesso negato alla risorsa */
    AUT_403_RESOURCE("Accesso risorsa negato"),

    /** Token di autenticazione non valido */
    AUT_401_TOKEN("Token non valido"),

    /** Sessione scaduta */
    AUT_401_SESSION("Sessione scaduta"),

    // ==================== VALIDAZIONE ====================

    /** Campo obbligatorio mancante */
    VAL_400_REQUIRED("Campo obbligatorio mancante"),

    /** Formato campo non valido */
    VAL_400_FORMAT("Formato campo non valido"),

    /** Valore fuori dal range consentito */
    VAL_400_RANGE("Valore fuori range"),

    /** Lunghezza campo non valida */
    VAL_400_LENGTH("Lunghezza campo non valida"),

    /** Pattern non rispettato */
    VAL_400_PATTERN("Pattern non rispettato"),

    /** Data non valida */
    VAL_400_DATE("Data non valida"),

    /** URL non valido */
    VAL_400_URL("URL non valido"),

    /** Email non valida */
    VAL_400_EMAIL("Email non valida"),

    /** Codice fiscale non valido */
    VAL_400_CF("Codice fiscale non valido"),

    /** Partita IVA non valida */
    VAL_400_PIVA("Partita IVA non valida"),

    /** Richiesta non valida semanticamente */
    VAL_422("Richiesta non valida semanticamente"),

    /** Update entità complessa non valida semanticamente */
    VAL_422_COMPLEX("Update entità complessa non valida"),

    // ==================== WORKFLOW ====================

    /** Transizione di stato non consentita */
    WFL_400_TRANSITION("Transizione stato non consentita"),

    /** Workflow non trovato */
    WFL_404("Workflow non trovato"),

    /** Azione workflow non autorizzata */
    WFL_403_ACTION("Azione workflow non autorizzata"),

    /** Stato workflow non valido */
    WFL_400_STATE("Stato workflow non valido"),

    // ==================== INTEGRAZIONI ====================

    /** Errore di comunicazione con servizio esterno */
    INT_500_COMMUNICATION("Errore comunicazione servizio esterno"),

    /** Timeout nella chiamata al servizio */
    INT_504("Timeout chiamata servizio"),

    /** Risposta non valida dal servizio */
    INT_502("Risposta non valida da servizio"),

    /** Servizio temporaneamente non disponibile */
    INT_503("Servizio temporaneamente non disponibile"),

    /** Errore PDND */
    INT_500_PDND("Errore PDND"),

    /** Errore GovWay */
    INT_500_GOVWAY("Errore GovWay"),

    // ==================== SISTEMA ====================

    /** Errore interno del sistema */
    SYS_500("Errore interno del sistema"),

    /** Risorsa temporaneamente non disponibile */
    SYS_503("Risorsa temporaneamente non disponibile"),

    /** Operazione non supportata */
    SYS_501("Operazione non supportata"),

    /** Configurazione sistema non valida */
    SYS_500_CONFIG("Configurazione sistema non valida"),

    /** Errore di accesso al database */
    SYS_500_DB("Errore accesso database"),

    /** Errore di I/O */
    SYS_500_IO("Errore I/O"),

    // ==================== GENERICI ====================

    /** Operazione non consentita */
    GEN_400("Operazione non consentita"),

    /** Risorsa non trovata */
    GEN_404("Risorsa non trovata"),

    /** Risorsa già esistente */
    GEN_409("Risorsa già esistente"),

    /** Conflitto con stato attuale */
    GEN_409_STATE("Conflitto con stato attuale"),

    /** Richiesta non valida */
    GEN_400_REQUEST("Richiesta non valida"),

    // ==================== REGISTRAZIONE ====================

    /** Funzionalità di verifica email non abilitata */
    REG_400_NOT_ENABLED("Funzionalità di verifica email non abilitata"),

    /** Nessuna registrazione in corso per questo utente */
    REG_400_NO_REGISTRATION("Nessuna registrazione in corso"),

    /** Nessun codice di verifica inviato */
    REG_400_NO_CODE("Nessun codice di verifica inviato"),

    /** Email non ancora verificata */
    REG_400_NOT_VERIFIED("Email non ancora verificata"),

    /** Superato numero massimo tentativi di invio codice */
    REG_429_MAX_SENDS("Superato il numero massimo di tentativi di invio codice"),

    /** Codice di verifica scaduto */
    REG_410_EXPIRED("Codice di verifica scaduto"),

    /** Principal già associato ad altro utente */
    REG_409_PRINCIPAL_EXISTS("Principal già associato a un altro utente"),

    /** Email non presente nei dati di autenticazione (JWT) */
    REG_400_NO_EMAIL_JWT("Email non presente nei dati di autenticazione");

    // ==================== ATTRIBUTI E METODI ====================

    private final String description;

    ErrorCode(String description) {
        this.description = description;
    }

    /**
     * Restituisce il codice nel formato CATEGORIA.NUMERO[.DETTAGLIO]
     *
     * Esempi:
     * - UT_409 -> "UT.409"
     * - API_404 -> "API.404"
     * - API_400_VISIBILITY -> "API.400.VISIBILITY"
     *
     * @return il codice formattato con punti invece di underscore
     */
    public String getCode() {
        return this.name().replace('_', '.');
    }

    /**
     * Restituisce la descrizione interna del codice errore (per sviluppatori)
     * @return la descrizione del codice errore
     */
    public String getDescription() {
        return description;
    }
}