-- Migration script for registrazioni_utenti table
-- Version: 2.3.1
-- Feature: First login email verification (issue #115)

-- Sequence for registrazioni_utenti table
CREATE SEQUENCE IF NOT EXISTS seq_registrazioni_utenti START WITH 1 INCREMENT BY 1;

-- Table for tracking user registration attempts during first login
CREATE TABLE IF NOT EXISTS registrazioni_utenti (
    id BIGINT NOT NULL,
    principal VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    cognome VARCHAR(255) NOT NULL,
    email_jwt VARCHAR(255),
    email_proposta VARCHAR(255),
    codice_verifica VARCHAR(10),
    codice_verifica_scadenza TIMESTAMP,
    tentativi_verifica INTEGER DEFAULT 0,
    tentativi_totali INTEGER DEFAULT 0,
    stato VARCHAR(50) NOT NULL,
    data_creazione TIMESTAMP NOT NULL,
    data_ultimo_tentativo TIMESTAMP,
    token_id VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT chk_stato CHECK (stato IN ('PENDING', 'EMAIL_SENT', 'VERIFIED', 'COMPLETED', 'EXPIRED'))
);

-- Index on principal for quick lookup
CREATE INDEX IF NOT EXISTS idx_registrazioni_principal ON registrazioni_utenti(principal);

-- Index on token_id for session association
CREATE INDEX IF NOT EXISTS idx_registrazioni_token_id ON registrazioni_utenti(token_id);

-- Index on stato for filtering
CREATE INDEX IF NOT EXISTS idx_registrazioni_stato ON registrazioni_utenti(stato);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_registrazioni_principal_stato ON registrazioni_utenti(principal, stato);
