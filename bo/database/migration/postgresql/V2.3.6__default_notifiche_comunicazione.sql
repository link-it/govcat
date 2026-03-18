-- Aumenta la dimensione della colonna ruoli_notifiche_abilitate per contenere tutti i ruoli
ALTER TABLE utenti ALTER COLUMN ruoli_notifiche_abilitate TYPE VARCHAR(1024);

-- Imposta il default per le notifiche per tutti gli utenti:
-- - tipi_notifiche_abilitate = COMUNICAZIONE (solo comunicazioni, no cambio stato e no email)
-- - tipi_entita_notifiche_abilitate = SERVIZIO,ADESIONE (tutte le entità, no email)
-- - ruoli_notifiche_abilitate = tutti i ruoli senza _EMAIL
UPDATE utenti SET
    tipi_notifiche_abilitate = 'COMUNICAZIONE',
    tipi_entita_notifiche_abilitate = 'SERVIZIO,ADESIONE',
    ruoli_notifiche_abilitate = 'SERVIZIO_REFERENTE_DOMINIO,SERVIZIO_REFERENTE_TECNICO_DOMINIO,SERVIZIO_REFERENTE_SERVIZIO,SERVIZIO_REFERENTE_TECNICO_SERVIZIO,SERVIZIO_RICHIEDENTE_SERVIZIO,ADESIONE_REFERENTE_DOMINIO,ADESIONE_REFERENTE_TECNICO_DOMINIO,ADESIONE_REFERENTE_SERVIZIO,ADESIONE_REFERENTE_TECNICO_SERVIZIO,ADESIONE_RICHIEDENTE_SERVIZIO,ADESIONE_REFERENTE_ADESIONE,ADESIONE_REFERENTE_TECNICO_ADESIONE,ADESIONE_RICHIEDENTE_ADESIONE,GESTORE,COORDINATORE';
