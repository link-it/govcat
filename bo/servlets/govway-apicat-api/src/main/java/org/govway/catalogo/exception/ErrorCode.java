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

    /** API ha erogazioni, non eliminabile */
    API_400_HAS_EROGATIONS("API ha erogazioni attive"),

    /** API non trovata per il servizio */
    API_404_FOR_SERVICE("API non trovata per il servizio"),

    /** API non trovata per nome/versione/erogatore */
    API_404_BY_NAME("API non trovata per nome"),

    /** Erogazione non trovata per l'adesione */
    API_404_EROGATION("Erogazione non trovata per l'adesione"),

    /** API non trovata o non accessibile */
    API_404_ACCESS("API non trovata o non accessibile"),

    /** Allegato servizio duplicato */
    SRV_400_DUPLICATE("Allegato servizio duplicato"),

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

    /** Conflitto servizio */
    SRV_409_CONFLICT("Conflitto servizio"),

    /** Package non trovato */
    SRV_404_PACKAGE("Package non trovato"),

    /** Operazione non valida sul servizio */
    SRV_400_INVALID("Operazione non valida sul servizio"),

    // ==================== ORGANIZZAZIONI ====================

    /** Organizzazione non trovata */
    ORG_404("Organizzazione non trovata"),

    /** Organizzazione già esistente */
    ORG_409("Organizzazione già esistente"),

    /** Organizzazione ha dipendenze, non eliminabile */
    ORG_400_HAS_DEPENDENCIES("Organizzazione ha dipendenze"),

    /** Vincolo organizzazione non rispettato */
    ORG_400_CONSTRAINT_VIOLATION("Vincolo organizzazione non rispettato"),

    /** Referente dominio duplicato */
    ORG_409_REFERENT("Referente dominio duplicato"),

    /** Soggetto aderente vincolato */
    ORG_409_ADERENTE("Soggetto aderente vincolato"),

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

    /** Soggetto non trovato per nome */
    SOG_404_BY_NAME("Soggetto non trovato per nome"),

    /** Soggetto non trovato nell'organizzazione */
    SOG_404_IN_ORG("Soggetto non trovato nell'organizzazione"),

    /** Soggetto ha domini attivi */
    SOG_400_HAS_DOMAINS("Soggetto ha domini attivi"),

    /** Soggetto è il default dell'organizzazione */
    SOG_400_IS_DEFAULT("Soggetto è il default dell'organizzazione"),

    /** Soggetto non aderente */
    SOG_400_NOT_ADERENTE("Soggetto non aderente"),

    /** Soggetto di organizzazione diversa */
    SOG_400_ORG_MISMATCH("Soggetto di organizzazione diversa"),

    /** Soggetto default di organizzazione aderente, non può essere reso non aderente */
    SOG_400_DEFAULT_ORG_ADERENTE("Soggetto default di organizzazione aderente non può essere reso non aderente"),

    /** Soggetto già esistente in altra organizzazione */
    SOG_409_IN_ORG("Soggetto già esistente in altra organizzazione"),

    // ==================== UTENTI ====================

    /** Utente non trovato */
    UT_404("Utente non trovato"),

    /** Utente già esistente */
    UT_409("Utente già esistente"),

    /** Utente non abilitato */
    UT_400_NOT_ENABLED("Utente non abilitato"),

    /** Utente non appartenente all'organizzazione richiesta */
    UT_400_ORG_MISMATCH("Utente non appartenente all'organizzazione"),

    /** Utente non abilitato */
    UT_403("Utente non abilitato"),

    /** Modifica email non consentita tramite updateProfilo quando verifica è abilitata */
    UT_403_EMAIL_CHANGE("Modifica email non consentita. Utilizzare il flusso di verifica email"),

    /** Utente non trovato per nome */
    UT_404_BY_NAME("Utente non trovato per nome"),

    /** Ruolo coordinatore non abilitato nella configurazione */
    UT_400_COORDINATORE_DISABLED("Ruolo coordinatore non abilitato"),

    /** Richiesta cambio organizzazione: organizzazione di partenza obbligatoria quando l'utente ha già associazioni */
    UT_400_ORG_PARTENZA_REQUIRED("Organizzazione di partenza obbligatoria per richiesta cambio organizzazione"),

    /** Richiesta cambio organizzazione: organizzazione di partenza non corrisponde a una delle associazioni dell'utente */
    UT_400_ORG_PARTENZA_NOT_ASSOCIATED("Organizzazione di partenza non associata all'utente"),

    /** Richiesta cambio organizzazione: organizzazione di partenza coincide con quella target */
    UT_400_ORG_PARTENZA_SAME_AS_TARGET("Organizzazione di partenza e organizzazione richiesta non possono coincidere"),

    /** Richiesta cambio organizzazione: utente già associato all'organizzazione richiesta */
    UT_400_ORG_PENDING_ALREADY_ASSOCIATED("Utente già associato all'organizzazione richiesta"),

    // ==================== CLASSI UTENTE ====================

    /** Classe utente non trovata */
    CLS_404("Classe utente non trovata"),

    /** Classe utente già esistente */
    CLS_409("Classe utente già esistente"),

    // ==================== CLIENT ====================

    /** Client non trovato */
    CLT_404("Client non trovato"),

    /** Client senza adesioni valide */
    CLT_404_NO_ADHESION("Client senza adesioni valide"),

    /** Client non trovato per nome/soggetto/ambiente */
    CLT_404_BY_NAME("Client non trovato per nome"),

    /** Profilo client non trovato per adesione */
    CLT_404_PROFILE("Profilo client non trovato per adesione"),

    /** Client già configurato, non modificabile */
    CLT_400_CONFIGURED("Client già configurato"),

    /** Client ha adesioni, non modificabile */
    CLT_400_HAS_ADHESIONS("Client ha adesioni attive"),

    /** Configurazione client non valida per allarme */
    CLT_400_ALARM_CONFIG("Configurazione client non valida per allarme"),

    /** Auth type client non corrisponde al profilo */
    CLT_400_AUTH_MISMATCH("Auth type client non corrisponde al profilo"),

    /** Client duplicati nell'operazione */
    CLT_409_DUPLICATES("Client duplicati nell'operazione"),

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

    /** Adesione non trovata per contesto specifico */
    ADE_404_BY_CONTEXT("Adesione non trovata per contesto"),

    /** Stato adesione non valido per monitoraggio */
    ADE_400_STATE_MONITORING("Stato adesione non valido per monitoraggio"),

    /** Stato servizio non consente adesione */
    ADE_400_STATE_SERVICE("Stato servizio non consente adesione"),

    /** Referente adesione duplicato */
    ADE_409_REFERENT("Referente adesione duplicato"),

    /** Skip collaudo non consentito dal servizio */
    ADE_409_STATE_SKIP_COLLAUDO("Skip collaudo non consentito"),

    /** Adesione disabilitata per il servizio */
    ADE_409_STATE_DISABLED("Adesione disabilitata per il servizio"),

    /** Visibilità non consente adesione */
    ADE_409_STATE_VISIBILITY("Visibilità non consente adesione"),

    /** Soggetto non corrisponde al soggetto interno */
    ADE_409_STATE_SUBJECT_MISMATCH("Soggetto non corrisponde al soggetto interno"),

    // ==================== TASSONOMIE ====================

    /** Tassonomia non trovata */
    TAX_404("Tassonomia non trovata"),

    /** Tassonomia già esistente */
    TAX_409("Tassonomia già esistente"),

    /** Tassonomia ha categorie, non eliminabile */
    TAX_400_HAS_CATEGORIES("Tassonomia ha categorie"),

    /** Categoria padre in tassonomia diversa */
    TAX_400_CATEGORY_MISMATCH("Categoria padre in tassonomia diversa"),

    // ==================== CATEGORIE ====================

    /** Categoria non trovata */
    CAT_404("Categoria non trovata"),

    /** Categoria già esistente */
    CAT_409("Categoria già esistente"),

    /** Categoria ha sotto-categorie, non eliminabile */
    CAT_400_HAS_CHILDREN("Categoria ha sotto-categorie"),

    /** Tassonomia visibile senza categorie */
    CAT_400_EMPTY_TAXONOMY("Tassonomia visibile senza categorie"),

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

    /** Allegato non trovato per l'adesione */
    DOC_404_ALLEGATO("Allegato non trovato per l'adesione"),

    /** Allegato servizio non trovato */
    DOC_404_ALLEGATO_SERVIZIO("Allegato servizio non trovato"),

    /** Messaggio non trovato */
    DOC_404_MESSAGGIO("Messaggio non trovato"),

    /** Immagine servizio non trovata */
    DOC_404_IMAGE("Immagine non trovata per il servizio"),

    /** Formato documento non supportato */
    DOC_400_FORMAT("Formato documento non supportato"),

    /** Dimensione documento eccede il limite */
    DOC_400_SIZE("Dimensione documento eccede il limite"),

    /** Impossibile elaborare il documento */
    DOC_500("Impossibile elaborare documento"),

    // ==================== IMMAGINI ====================

    /** Formato immagine non supportato (solo JPEG e PNG) */
    IMG_400_FORMAT("Formato immagine non supportato. Sono consentiti solo JPEG e PNG"),

    /** Dimensione immagine eccede il limite configurato */
    IMG_400_SIZE("Dimensione immagine eccede il limite massimo consentito"),

    /** Impossibile elaborare l'immagine */
    IMG_500("Impossibile elaborare l'immagine"),

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

    /** Organizzazione utente non corrisponde per adesione */
    AUT_403_ORG_ADHESION("Organizzazione utente non corrisponde per adesione"),

    /** Utente non abilitato come referente */
    AUT_403_REFERENT_NOT_ELIGIBLE("Utente non abilitato come referente"),

    /** Organizzazione di sessione non abilitata come referente di servizi */
    AUT_403_ORG_NOT_REFERENTE("Organizzazione non abilitata come referente di servizi"),

    /** Organizzazione di sessione non abilitata come aderente */
    AUT_403_ORG_NOT_ADERENTE("Organizzazione non abilitata come aderente"),

    /** Un amministratore organizzazione non può assegnare il ruolo richiesto */
    AUT_403_AMM_ORG_INVALID_ROLE("Ruolo globale non assegnabile da amministratore organizzazione"),

    /** L'utente da creare deve essere associato esclusivamente all'organizzazione di sessione */
    AUT_403_AMM_ORG_INVALID_ORGS("Vincoli organizzazioni utente non soddisfatti per amministratore organizzazione"),

    /** Un amministratore organizzazione può operare solo sui domini il cui soggetto referente appartiene alla propria organizzazione di sessione */
    AUT_403_AMM_ORG_DOMINIO_FUORI_ORG("Dominio non appartenente all'organizzazione di sessione dell'amministratore"),

    /** Un amministratore organizzazione può approvare la richiesta cambio organizzazione solo quando è amministratore dell'organizzazione target */
    AUT_403_AMM_ORG_NOT_TARGET("L'amministratore non è target della richiesta di cambio organizzazione"),

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

    /** Tipo enum non valido */
    VAL_400_ENUM("Tipo enum non valido"),

    /** Origine parsing non valida */
    VAL_400_ORIGIN("Origine non valida per il parsing"),

    /** Gruppo API non valido */
    VAL_400_GROUP("Gruppo API non valido"),

    /** Ruolo API non corrispondente al gruppo */
    VAL_400_GROUP_ROLE("Ruolo API non corrispondente al gruppo"),

    /** Ambiente URL e body non corrispondenti */
    VAL_400_ENVIRONMENT_MISMATCH("Ambiente URL e body non corrispondenti"),

    /** Richiesta non valida semanticamente */
    VAL_422("Richiesta non valida semanticamente"),

    /** Update entità complessa non valida semanticamente */
    VAL_422_COMPLEX("Update entità complessa non valida"),

    /** Client non eliminabile con adesioni */
    VAL_422_CLIENT_HAS_ADHESIONS("Client non eliminabile con adesioni attive"),

    /** API non appartiene al servizio */
    VAL_422_API_SERVICE_MISMATCH("API non appartiene al servizio"),

    /** Skip collaudo non consentito */
    VAL_422_SKIP_COLLAUDO("Skip collaudo non consentito"),

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

    /** Risposta non valida con status code */
    INT_502_STATUS("Risposta non valida da servizio con status code imprevisto"),

    /** Errore comunicazione allarme */
    INT_500_ALARM("Errore comunicazione allarme"),

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

    /** Dominio ha servizi attivi */
    GEN_400_HAS_SERVICES("Dominio ha servizi attivi"),

    /** Skip collaudo vincolato */
    GEN_400_SKIP_COLLAUDO("Skip collaudo vincolato"),

    /** Tipo report non valido */
    GEN_400_REPORT_TYPE("Tipo report non valido"),

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