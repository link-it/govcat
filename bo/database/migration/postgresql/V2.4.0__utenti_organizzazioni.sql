-- Migration: Supporto multi-organizzazione per utente (versione 2.4.0)
-- Version: 2.4.0
--
-- BREAKING CHANGES rispetto alla versione 2.3.x:
--   * rimossa la colonna utenti.id_organizzazione (FK singola): il modello multi-org
--     usa ora esclusivamente la nuova tabella utenti_organizzazioni
--   * rimossa la colonna utenti.referente_tecnico: il flag è stato eliminato dal modello.
--     Gli utenti che lo avevano impostato a true vengono migrati ad un'associazione
--     OPERATORE_API sulla loro organizzazione (se presente)
--   * il valore REFERENTE_SERVIZIO non è più ammesso nel campo ruolo
--
-- Introduce la tabella di associazione utenti-organizzazioni con ruolo per-organizzazione.
-- Il campo ruolo_organizzazione può essere NULL (equivalente a "nessun ruolo", utente in sola lettura).
-- Il campo organizzazione_esterna è un testo opzionale per indicare la software house di appartenenza
-- del referente tecnico.

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

-- ===== Migrazione dati =====

-- 1. Utenti REFERENTE_SERVIZIO con organizzazione e referente_tecnico=false:
--    associazione OPERATORE_API.
INSERT INTO utenti_organizzazioni (id, id_utente, id_organizzazione, ruolo_organizzazione)
SELECT nextval('seq_utenti_organizzazioni'), u.id, u.id_organizzazione, 'OPERATORE_API'
FROM utenti u
WHERE u.ruolo = 'REFERENTE_SERVIZIO'
  AND u.id_organizzazione IS NOT NULL
  AND u.referente_tecnico = false;

-- 2. Utenti senza ruolo (NULL) con organizzazione e referente_tecnico=false:
--    associazione con ruolo NULL (sola lettura).
INSERT INTO utenti_organizzazioni (id, id_utente, id_organizzazione, ruolo_organizzazione)
SELECT nextval('seq_utenti_organizzazioni'), u.id, u.id_organizzazione, NULL
FROM utenti u
WHERE u.ruolo IS NULL
  AND u.id_organizzazione IS NOT NULL
  AND u.referente_tecnico = false;

-- 3. Utenti con flag referente_tecnico=true e organizzazione associata (qualunque ruolo globale):
--    associazione OPERATORE_API. Anche utenti con ruolo NULL diventano OPERATORE_API.
INSERT INTO utenti_organizzazioni (id, id_utente, id_organizzazione, ruolo_organizzazione)
SELECT nextval('seq_utenti_organizzazioni'), u.id, u.id_organizzazione, 'OPERATORE_API'
FROM utenti u
WHERE u.referente_tecnico = true
  AND u.id_organizzazione IS NOT NULL;

-- 4. Aggiorna il ruolo globale: REFERENTE_SERVIZIO -> RUOLO_ORGANIZZAZIONE
UPDATE utenti SET ruolo = 'RUOLO_ORGANIZZAZIONE' WHERE ruolo = 'REFERENTE_SERVIZIO';

-- 5. Aggiorna il ruolo globale per utenti con organizzazione associata: NULL -> RUOLO_ORGANIZZAZIONE
UPDATE utenti SET ruolo = 'RUOLO_ORGANIZZAZIONE'
WHERE ruolo IS NULL AND id_organizzazione IS NOT NULL;

-- ===== Aggiornamento constraint =====

-- Sostituisci il vecchio CHECK constraint sulla colonna ruolo: rimuove REFERENTE_SERVIZIO
ALTER TABLE utenti DROP CONSTRAINT IF EXISTS CHK_UTENTI_RUOLO;
ALTER TABLE utenti ADD CONSTRAINT CHK_UTENTI_RUOLO
    CHECK (ruolo IN ('AMMINISTRATORE', 'COORDINATORE', 'RUOLO_ORGANIZZAZIONE') OR ruolo IS NULL);

-- ===== DROP campi deprecati =====

-- Rimuove il vincolo FK sulla vecchia colonna id_organizzazione (se presente)
ALTER TABLE utenti DROP CONSTRAINT IF EXISTS fk_utenti_org;
ALTER TABLE utenti DROP CONSTRAINT IF EXISTS FK_utenti_organizations;

-- Rimuove la vecchia FK singola id_organizzazione: le associazioni sono ora in utenti_organizzazioni
ALTER TABLE utenti DROP COLUMN id_organizzazione;

-- Rimuove il flag referente_tecnico: i dati sono stati migrati in associazioni OPERATORE_API
ALTER TABLE utenti DROP COLUMN referente_tecnico;
