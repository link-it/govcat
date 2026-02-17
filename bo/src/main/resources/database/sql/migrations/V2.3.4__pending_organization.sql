-- Migration: Add pending organization support for user organization change requests
-- Version: 2.3.4

ALTER TABLE utenti ADD COLUMN id_organizzazione_pending BIGINT;

ALTER TABLE utenti ADD CONSTRAINT fk_utenti_org_pending
    FOREIGN KEY (id_organizzazione_pending) REFERENCES organizations(id);
