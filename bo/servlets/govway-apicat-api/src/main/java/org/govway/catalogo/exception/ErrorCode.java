/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2025 Link.it srl (https://link.it).
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
 * Ogni codice è associato a un messaggio nel file error-messages.properties
 */
public enum ErrorCode {

    // API Errors (API_xxx)
    API_001("Visibilità allegato non consentita"),
    API_002("Allegato duplicato"),
    API_003("API non trovata"),
    API_004("API già esistente"),
    API_005("Impossibile eliminare API utilizzata in adesioni"),
    API_006("Allegato non trovato per l'API"),
    API_007("Documento con UUID e versione non trovato"),
    API_008("Specifica non presente"),
    API_009("Gruppo non esiste"),

    // Service Errors (SRV_xxx)
    SRV_001("Servizio già esistente"),
    SRV_002("Servizio non trovato"),
    SRV_003("Utente non registrato, impossibile recuperare servizi"),
    SRV_004("Immagine per il servizio non trovata"),
    SRV_005("Il servizio non è eliminabile"),
    SRV_006("Gruppo già associato al servizio"),
    SRV_007("Categoria non foglia, impossibile associare"),
    SRV_008("Categoria già associata al servizio"),
    SRV_009("Impossibile rimuovere utente referente del servizio"),
    SRV_010("Impossibile aggiungere utente come referente del package"),

    // Authorization Errors (AUTH_xxx)
    AUTH_001("Utente deve avere uno dei ruoli richiesti per eseguire la force"),
    AUTH_002("Organizzazione interna, ma utente associato ad organizzazione differente"),
    AUTH_003("Organizzazione interna, ma utente non associato ad alcuna organizzazione"),
    AUTH_004("Utente non autorizzato"),
    AUTH_005("Ruolo non autorizzato per questa operazione"),
    AUTH_006("Accesso negato alla risorsa"),
    AUTH_007("Token di autenticazione non valido"),
    AUTH_008("Sessione scaduta"),

    // Organization Errors (ORG_xxx)
    ORG_001("Organizzazione non trovata"),
    ORG_002("Organizzazione già esistente"),
    ORG_003("Dominio non trovato"),
    ORG_004("Dominio già esistente"),
    ORG_005("Soggetto non trovato"),
    ORG_006("Soggetto già esistente"),
    ORG_007("Utente non trovato"),
    ORG_008("Utente già esistente"),
    ORG_009("Classe utente non trovata"),

    // Client Errors (CLT_xxx)
    CLT_001("Client non trovato"),
    CLT_002("Client già esistente"),
    CLT_003("Configurazione client non valida"),
    CLT_004("Estensione client non supportata"),

    // Adhesion Errors (ADE_xxx)
    ADE_001("Adesione non trovata"),
    ADE_002("Adesione già esistente"),
    ADE_003("Stato adesione non valido per questa operazione"),
    ADE_004("Impossibile modificare adesione in questo stato"),
    ADE_005("Referente adesione non autorizzato"),

    // Taxonomy Errors (TAX_xxx)
    TAX_001("Tassonomia non trovata"),
    TAX_002("Tassonomia già esistente"),
    TAX_003("Categoria non trovata"),
    TAX_004("Categoria già esistente"),

    // Group Errors (GRP_xxx)
    GRP_001("Gruppo non trovato"),
    GRP_002("Gruppo già esistente"),
    GRP_003("Impossibile eliminare gruppo utilizzato"),

    // Document Errors (DOC_xxx)
    DOC_001("Documento non trovato"),
    DOC_002("Formato documento non supportato"),
    DOC_003("Dimensione documento eccede il limite"),
    DOC_004("Impossibile elaborare il documento"),

    // Notification Errors (NTF_xxx)
    NTF_001("Notifica non trovata"),
    NTF_002("Impossibile inviare notifica"),
    NTF_003("Destinatario notifica non valido"),

    // Monitoring Errors (MON_xxx)
    MON_001("Dati di monitoraggio non disponibili"),
    MON_002("Intervallo temporale non valido"),
    MON_003("Metrica non trovata"),
    MON_004("Allarme non trovato"),
    MON_005("Configurazione allarme non valida"),
    MON_006("Transazione non trovata"),
    MON_007("Statistiche non disponibili"),

    // Validation Errors (VAL_xxx)
    VAL_001("Campo obbligatorio mancante"),
    VAL_002("Formato campo non valido"),
    VAL_003("Valore fuori dal range consentito"),
    VAL_004("Lunghezza campo non valida"),
    VAL_005("Pattern non rispettato"),
    VAL_006("Data non valida"),
    VAL_007("URL non valido"),
    VAL_008("Email non valida"),
    VAL_009("Codice fiscale non valido"),
    VAL_010("Partita IVA non valida"),
    VAL_011("Richiesta non valida semanticamente"),
    VAL_012("Update entità complessa non valida semanticamente"),

    // Workflow Errors (WFL_xxx)
    WFL_001("Transizione di stato non consentita"),
    WFL_002("Workflow non trovato"),
    WFL_003("Azione workflow non autorizzata"),
    WFL_004("Stato workflow non valido"),

    // Integration Errors (INT_xxx)
    INT_001("Errore di comunicazione con servizio esterno"),
    INT_002("Timeout nella chiamata al servizio"),
    INT_003("Risposta non valida dal servizio"),
    INT_004("Servizio temporaneamente non disponibile"),
    INT_005("Errore PDND"),
    INT_006("Errore GovWay"),

    // System Errors (SYS_xxx)
    SYS_001("Errore interno del sistema"),
    SYS_002("Risorsa temporaneamente non disponibile"),
    SYS_003("Operazione non supportata"),
    SYS_004("Configurazione sistema non valida"),
    SYS_005("Errore di accesso al database"),
    SYS_006("Errore di I/O"),

    // Generic Errors (GEN_xxx)
    GEN_001("Operazione non consentita"),
    GEN_002("Risorsa non trovata"),
    GEN_003("Risorsa già esistente"),
    GEN_004("Conflitto con stato attuale"),
    GEN_005("Richiesta non valida");

    private final String description;

    ErrorCode(String description) {
        this.description = description;
    }

    /**
     * Restituisce il codice dell'errore (es. "API_001")
     */
    public String getCode() {
        return this.name();
    }

    /**
     * Restituisce la descrizione interna del codice errore (per sviluppatori)
     */
    public String getDescription() {
        return description;
    }
}