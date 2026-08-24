-- Migration: Ruolo PDND dell'utente (versione 2.4.5)
-- Version: 2.4.5
--
-- Introduce il ruolo dell'utente sulla PDND: valori ammessi NESSUNO e ADMIN.
-- Il campo è assegnabile da chi è autorizzato alla scrittura degli utenti (gestore ed
-- eventualmente coordinatore, in base alla configurazione amministrazione.utenti.scrittura).
--
-- Colonna nullable e senza valore di default: pienamente retrocompatibile, il valore non
-- impostato equivale a NESSUNO (normalizzazione applicata dal software in lettura). Gli
-- utenti esistenti non vengono aggiornati.

ALTER TABLE utenti ADD COLUMN ruolo_pdnd VARCHAR(255);

ALTER TABLE utenti ADD CONSTRAINT CHK_UTENTI_RUOLO_PDND
    CHECK (ruolo_pdnd IN ('NESSUNO', 'ADMIN') OR ruolo_pdnd IS NULL);
