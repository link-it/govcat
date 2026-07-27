-- ============================================================================
-- Bonifica di api_auth_types.resources: da text a bytea
-- ============================================================================
--
-- PROBLEMA
--   L'entity mappa resources come byte[] (bytea su PostgreSQL). Dove la colonna
--   e' stata creata come text, PostgreSQL accetta comunque la scrittura applicando
--   un cast I/O bytea -> text: a DB non finiscono i byte, ma la loro rappresentazione
--   testuale esadecimale (\x474554...). In rilettura il driver JDBC restituisce i
--   byte di quella stringa e l'applicazione espone il valore doppiamente codificato
--   (le risorse dei gruppi auth type compaiono come \x4745... invece di
--   "GET /echo,POST /echo"). Nessun errore viene segnalato ne' in scrittura ne' in
--   lettura.
--
-- COSA FA
--   Converte la colonna a bytea decodificando i valori in doppia codifica e
--   ricodificando in UTF-8 gli eventuali valori di testo puro (righe inserite a mano
--   o da migrazioni). Nessun dato viene perso: la doppia codifica e' reversibile.
--
-- DOPO L'ESECUZIONE
--   Riavviare govcat-api (e govcat-batch): PostgreSQL invalida i piani dei prepared
--   statement al variare del tipo di una colonna, e le connessioni gia' aperte nel
--   pool possono restituire "cached plan must not change result type".
--
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. DIAGNOSI
-- ----------------------------------------------------------------------------

-- Tipo attuale della colonna: se e' gia' bytea non c'e' nulla da bonificare
SELECT data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'api_auth_types' AND column_name = 'resources';

-- Righe in doppia codifica sul totale. Da eseguire solo se la query precedente ha
-- restituito text: su una colonna bytea (quindi gia' bonificata) da' l'errore
-- "function left(bytea, integer) does not exist".
SELECT count(*) FILTER (WHERE left(resources, 2) = chr(92) || 'x') AS doppia_codifica,
       count(*)                                                    AS totale
FROM api_auth_types;


-- ----------------------------------------------------------------------------
-- 2. BONIFICA
-- ----------------------------------------------------------------------------
--
-- La tabella di backup e' creata senza DROP: se esiste gia' da un tentativo
-- precedente lo script si interrompe qui, prima di toccare i dati, e la
-- transazione viene annullata.

BEGIN;

CREATE TABLE bonifica_backup_api_auth_types_resources AS
    SELECT id, resources FROM api_auth_types;

ALTER TABLE api_auth_types
    ALTER COLUMN resources TYPE bytea
    USING CASE WHEN left(resources, 2) = chr(92) || 'x'
                    AND substring(resources FROM 3) ~ '^([0-9a-fA-F]{2})+$'
               THEN decode(substring(resources FROM 3), 'hex')   -- doppia codifica
               ELSE convert_to(resources, 'UTF8')                -- testo puro
          END;

COMMIT;


-- ----------------------------------------------------------------------------
-- 3. VERIFICA
-- ----------------------------------------------------------------------------

-- Tipo della colonna dopo la bonifica (atteso: bytea, NOT NULL preservato)
SELECT data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'api_auth_types' AND column_name = 'resources';

-- Le risorse tornano leggibili come elenco di operazioni separate da virgola
SELECT id, profilo, octet_length(resources) AS byte,
       convert_from(resources, 'UTF8') AS resources
FROM api_auth_types
ORDER BY id;

-- Nessuna riga deve essere rimasta in doppia codifica (atteso: 0)
SELECT count(*) AS ancora_doppia_codifica
FROM api_auth_types
WHERE left(convert_from(resources, 'UTF8'), 2) = chr(92) || 'x';


-- ----------------------------------------------------------------------------
-- 4. PULIZIA - solo dopo aver verificato l'esito lato applicazione
-- ----------------------------------------------------------------------------

-- DROP TABLE bonifica_backup_api_auth_types_resources;
