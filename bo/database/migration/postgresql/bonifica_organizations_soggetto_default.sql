-- ============================================================================
-- Bonifica di organizations.id_soggetto_default: riferimenti a soggetti migrati
-- ============================================================================
--
-- PROBLEMA
--   Fino alla correzione dell'Issue 335, lo spostamento di un soggetto su un'altra
--   organizzazione (PUT /soggetti/{id} con un id_organizzazione diverso) non
--   aggiornava la colonna id_soggetto_default dell'organizzazione di provenienza:
--   quest'ultima resta quindi legata ad un soggetto che non le appartiene piu'.
--   Effetti: il dettaglio dell'organizzazione espone come soggetto default un
--   soggetto altrui e, sulle versioni non ancora aggiornate, la cancellazione
--   dell'organizzazione falliva con SOG.400.HAS.DOMAINS oppure - in assenza di
--   domini - cancellava il soggetto ormai appartenente all'altra organizzazione.
--
-- COSA FA
--   Ripulisce i riferimenti obsoleti gia' presenti a DB:
--     - se l'organizzazione ha un solo soggetto aderente proprio, il default viene
--       reimpostato su quel soggetto (stesso criterio applicato da
--       OrganizzazioneService.save);
--     - negli altri casi il riferimento viene azzerato.
--   Nessun soggetto e nessuna organizzazione viene cancellato.
--
-- DOPO L'ESECUZIONE
--   Non e' necessario riavviare i servizi: la modifica riguarda solo i dati.
--   Le organizzazioni aderenti che restano senza soggetto default (elencate al
--   punto 3) vanno sistemate da interfaccia designando il soggetto default,
--   altrimenti il loro primo aggiornamento fallisce con "Impossibile aggiornare
--   l'organizzazione: impostare il soggetto di default".
--
--   Lo script e' idempotente: rieseguito dopo la bonifica non trova righe da
--   correggere (la sola tabella di backup va rimossa prima, vedi punto 4).
--
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. DIAGNOSI
-- ----------------------------------------------------------------------------

-- Organizzazioni il cui soggetto default appartiene ad un'altra organizzazione.
-- Se non restituisce righe non c'e' nulla da bonificare.
SELECT o.id                 AS id_organizzazione,
       o.name               AS organizzazione,
       o.aderente,
       s.id                 AS id_soggetto_default,
       s.nome               AS soggetto_default,
       so.name              AS organizzazione_attuale_del_soggetto
FROM organizations o
         JOIN soggetti s ON s.id = o.id_soggetto_default
         JOIN organizations so ON so.id = s.id_organizzazione
WHERE s.id_organizzazione <> o.id
ORDER BY o.id;

-- Per ciascuna di quelle organizzazioni, quanti soggetti aderenti propri restano:
-- con esattamente 1 il default viene reimpostato, altrimenti viene azzerato.
SELECT o.id   AS id_organizzazione,
       o.name AS organizzazione,
       o.aderente,
       (SELECT count(*)
        FROM soggetti sp
        WHERE sp.id_organizzazione = o.id
          AND sp.aderente) AS soggetti_aderenti_propri
FROM organizations o
         JOIN soggetti s ON s.id = o.id_soggetto_default
WHERE s.id_organizzazione <> o.id
ORDER BY o.id;


-- ----------------------------------------------------------------------------
-- 2. BONIFICA
-- ----------------------------------------------------------------------------
--
-- La tabella di backup e' creata senza DROP: se esiste gia' da un tentativo
-- precedente lo script si interrompe qui, prima di toccare i dati, e la
-- transazione viene annullata.

BEGIN;

CREATE TABLE bonifica_backup_organizations_soggetto_default AS
SELECT o.id, o.id_soggetto_default
FROM organizations o
         JOIN soggetti s ON s.id = o.id_soggetto_default
WHERE s.id_organizzazione <> o.id;

-- 2a. Organizzazioni con un unico soggetto aderente proprio: il default viene
--     reimpostato su quel soggetto.
UPDATE organizations o
SET id_soggetto_default = (SELECT sp.id
                           FROM soggetti sp
                           WHERE sp.id_organizzazione = o.id
                             AND sp.aderente)
WHERE EXISTS (SELECT 1
              FROM soggetti s
              WHERE s.id = o.id_soggetto_default
                AND s.id_organizzazione <> o.id)
  AND (SELECT count(*)
       FROM soggetti sp
       WHERE sp.id_organizzazione = o.id
         AND sp.aderente) = 1;

-- 2b. Tutti i restanti riferimenti obsoleti vengono azzerati.
UPDATE organizations o
SET id_soggetto_default = NULL
WHERE EXISTS (SELECT 1
              FROM soggetti s
              WHERE s.id = o.id_soggetto_default
                AND s.id_organizzazione <> o.id);

COMMIT;


-- ----------------------------------------------------------------------------
-- 3. VERIFICA
-- ----------------------------------------------------------------------------

-- Nessun riferimento obsoleto deve essere rimasto (atteso: 0)
SELECT count(*) AS riferimenti_obsoleti_residui
FROM organizations o
         JOIN soggetti s ON s.id = o.id_soggetto_default
WHERE s.id_organizzazione <> o.id;

-- Righe modificate dalla bonifica, con il valore precedente e quello attuale
SELECT b.id                 AS id_organizzazione,
       o.name               AS organizzazione,
       o.aderente,
       b.id_soggetto_default AS default_precedente,
       o.id_soggetto_default AS default_attuale
FROM bonifica_backup_organizations_soggetto_default b
         JOIN organizations o ON o.id = b.id
ORDER BY b.id;

-- Organizzazioni aderenti rimaste senza soggetto default: richiedono l'intervento
-- manuale descritto in testa allo script
SELECT o.id AS id_organizzazione, o.name AS organizzazione
FROM organizations o
WHERE o.aderente
  AND o.id_soggetto_default IS NULL
ORDER BY o.id;


-- ----------------------------------------------------------------------------
-- 4. PULIZIA - solo dopo aver verificato l'esito lato applicazione
-- ----------------------------------------------------------------------------

-- DROP TABLE bonifica_backup_organizations_soggetto_default;
