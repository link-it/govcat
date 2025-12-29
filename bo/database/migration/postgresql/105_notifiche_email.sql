-- Patch per aggiungere supporto notifiche email (Issue 105)

-- 1. Drop dei vecchi check constraint
ALTER TABLE notifiche DROP CONSTRAINT CHK_NOTIFICHE_TIPO;
ALTER TABLE notifiche DROP CONSTRAINT CHK_NOTIFICHE_TIPO_NOTIFICA;

-- 2. Creazione dei nuovi check constraint con i valori aggiornati
ALTER TABLE notifiche ADD CONSTRAINT CHK_NOTIFICHE_TIPO
    CHECK (tipo IN('COMUNICAZIONE', 'CAMBIO_STATO', 'COMUNICAZIONE_EMAIL', 'CAMBIO_STATO_EMAIL'));

ALTER TABLE notifiche ADD CONSTRAINT CHK_NOTIFICHE_TIPO_NOTIFICA
    CHECK (tipo_notifica IN('SERVIZIO', 'ADESIONE', 'SERVIZIO_EMAIL', 'ADESIONE_EMAIL'));

-- 3. Aggiunta colonna email_inviata (prima nullable)
ALTER TABLE notifiche ADD COLUMN email_inviata BOOLEAN;

-- 4. Aggiornamento notifiche esistenti: imposta email_inviata = true
UPDATE notifiche SET email_inviata = true WHERE email_inviata IS NULL;

-- 5. Imposta NOT NULL sulla colonna email_inviata
ALTER TABLE notifiche ALTER COLUMN email_inviata SET NOT NULL;
