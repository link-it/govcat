-- Migration script for email_update_verifications table
-- Version: 2.3.3
-- Feature: Email verification for profile email change

-- Sequence for email_update_verifications table
CREATE SEQUENCE IF NOT EXISTS seq_email_update_verifications START WITH 1 INCREMENT BY 1;

-- Table for tracking email change verification requests from registered users
CREATE TABLE IF NOT EXISTS email_update_verifications (
    id BIGINT NOT NULL,
    id_utente BIGINT NOT NULL,
    nuova_email VARCHAR(255) NOT NULL,
    codice_verifica VARCHAR(10),
    codice_verifica_scadenza TIMESTAMP,
    tentativi_verifica INTEGER DEFAULT 0,
    tentativi_invio INTEGER DEFAULT 0,
    stato VARCHAR(50) NOT NULL,
    data_creazione TIMESTAMP NOT NULL,
    data_ultimo_tentativo TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_email_update_utente FOREIGN KEY (id_utente) REFERENCES utenti(id),
    CONSTRAINT chk_email_update_stato CHECK (stato IN ('PENDING', 'CODE_SENT', 'VERIFIED', 'EXPIRED'))
);

-- Index on id_utente for quick lookup by user
CREATE INDEX IF NOT EXISTS idx_email_update_utente ON email_update_verifications(id_utente);

-- Index on stato for filtering
CREATE INDEX IF NOT EXISTS idx_email_update_stato ON email_update_verifications(stato);

-- Composite index for common query pattern (pending verifications per user)
CREATE INDEX IF NOT EXISTS idx_email_update_utente_stato ON email_update_verifications(id_utente, stato);
