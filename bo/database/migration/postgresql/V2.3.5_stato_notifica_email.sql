-- Patch per aggiungere stato_notifica_email e campi di tracing

-- 1. Aggiunta nuove colonne
ALTER TABLE notifiche ADD COLUMN stato_notifica_email VARCHAR(20);
ALTER TABLE notifiche ADD COLUMN timestamp_invio_email TIMESTAMP;
ALTER TABLE notifiche ADD COLUMN email_destinatario VARCHAR(255);

-- 2. Migrazione dati da email_inviata a stato_notifica_email
UPDATE notifiche
SET stato_notifica_email = CASE
    WHEN tipo IN ('COMUNICAZIONE_EMAIL', 'CAMBIO_STATO_EMAIL') AND email_inviata = true THEN 'INVIATA'
    WHEN tipo IN ('COMUNICAZIONE_EMAIL', 'CAMBIO_STATO_EMAIL') AND email_inviata = false THEN 'DA_INVIARE'
    ELSE 'NON_RICHIESTA'
END;

-- 3. Aggiunta constraint NOT NULL e CHECK
ALTER TABLE notifiche ALTER COLUMN stato_notifica_email SET NOT NULL;
ALTER TABLE notifiche ADD CONSTRAINT CHK_NOTIFICHE_STATO_EMAIL
    CHECK (stato_notifica_email IN ('NON_RICHIESTA', 'DA_INVIARE', 'INVIATA', 'ERRORE'));

-- 4. Imposta valore di default per colonna deprecata email_inviata (opzionale: fermarsi qui se non si vuole eliminare la colonna)
ALTER TABLE notifiche ALTER COLUMN email_inviata SET DEFAULT true;

-- 5. Rimozione colonna deprecata email_inviata (opzionale)
ALTER TABLE notifiche DROP COLUMN email_inviata;
