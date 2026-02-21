-- Migration: Add pending organization support for user organization change requests
-- Version: 2.3.4

ALTER TABLE utenti ADD COLUMN id_organizzazione_pending BIGINT;

ALTER TABLE utenti ADD CONSTRAINT fk_utenti_org_pending
    FOREIGN KEY (id_organizzazione_pending) REFERENCES organizations(id);

-- Rimuove il constraint esistente relativo allo stato
ALTER TABLE utenti DROP CONSTRAINT CHK_UTENTI_STATO;

-- Se esiste un constraint come sopra e che viene cancellato allora si aggiunge il nuovo constraint con PENDING_UPDATE
ALTER TABLE utenti ADD CONSTRAINT CHK_UTENTI_STATO CHECK (stato IN ('DISABILITATO', 'NON_CONFIGURATO', 'ABILITATO', 'PENDING_UPDATE'));