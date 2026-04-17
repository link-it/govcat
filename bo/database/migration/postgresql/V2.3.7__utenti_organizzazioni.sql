-- Migration: Supporto multi-organizzazione per utente
-- Version: 2.3.7
--
-- Introduce la tabella di associazione utenti-organizzazioni con ruolo per-organizzazione.
-- Il campo ruolo_organizzazione può essere NULL (equivalente a "nessun ruolo", utente in sola lettura).
-- Il campo organizzazione_esterna è un testo opzionale per indicare la software house di appartenenza
-- del referente tecnico.
--
-- Retrocompatibilità: la vecchia FK id_organizzazione sulla tabella utenti non viene rimossa.
-- Non vengono aggiunti constraint restrittivi sulla colonna ruolo per consentire al software
-- precedente di continuare a scrivere il valore REFERENTE_SERVIZIO durante il periodo di transizione.

-- Sequenza per la nuova tabella
CREATE SEQUENCE seq_utenti_organizzazioni START WITH 1 INCREMENT BY 1;

-- Tabella di associazione utenti-organizzazioni (many-to-many con ruolo)
CREATE TABLE utenti_organizzazioni (
    id BIGINT NOT NULL DEFAULT nextval('seq_utenti_organizzazioni'),
    id_utente BIGINT NOT NULL,
    id_organizzazione BIGINT NOT NULL,
    ruolo_organizzazione VARCHAR(255),
    CONSTRAINT pk_utenti_organizzazioni PRIMARY KEY (id),
    CONSTRAINT fk_utenti_org_utente FOREIGN KEY (id_utente) REFERENCES utenti(id),
    CONSTRAINT fk_utenti_org_organizzazione FOREIGN KEY (id_organizzazione) REFERENCES organizations(id),
    CONSTRAINT uk_utenti_org_utente_org UNIQUE (id_utente, id_organizzazione)
);

-- Nuovo campo opzionale per indicare l'organizzazione esterna del referente tecnico
ALTER TABLE utenti ADD COLUMN organizzazione_esterna VARCHAR(255);

-- Migrazione dati: per ogni utente con ruolo REFERENTE_SERVIZIO e organizzazione associata,
-- crea un'associazione nella nuova tabella con ruolo OPERATORE_API
INSERT INTO utenti_organizzazioni (id, id_utente, id_organizzazione, ruolo_organizzazione)
SELECT nextval('seq_utenti_organizzazioni'), u.id, u.id_organizzazione, 'OPERATORE_API'
FROM utenti u
WHERE u.ruolo = 'REFERENTE_SERVIZIO'
  AND u.id_organizzazione IS NOT NULL;

-- Migrazione dati: per ogni utente con ruolo NULL e organizzazione associata,
-- crea un'associazione nella nuova tabella con ruolo NULL (nessun ruolo, sola lettura)
INSERT INTO utenti_organizzazioni (id, id_utente, id_organizzazione, ruolo_organizzazione)
SELECT nextval('seq_utenti_organizzazioni'), u.id, u.id_organizzazione, NULL
FROM utenti u
WHERE u.ruolo IS NULL
  AND u.id_organizzazione IS NOT NULL;

-- Aggiorna il ruolo degli utenti migrati: REFERENTE_SERVIZIO -> RUOLO_ORGANIZZAZIONE
UPDATE utenti SET ruolo = 'RUOLO_ORGANIZZAZIONE' WHERE ruolo = 'REFERENTE_SERVIZIO';

-- Aggiorna il ruolo degli utenti senza ruolo ma con organizzazione: NULL -> RUOLO_ORGANIZZAZIONE
UPDATE utenti SET ruolo = 'RUOLO_ORGANIZZAZIONE'
WHERE ruolo IS NULL AND id_organizzazione IS NOT NULL;
