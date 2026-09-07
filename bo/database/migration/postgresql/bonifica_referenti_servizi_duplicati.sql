-- ============================================================================
-- Bonifica dei referenti duplicati sui servizi (referenti_servizi)
-- ============================================================================
--
-- PROBLEMA
--   L'associazione tra utente e servizio e' unica per (id_servizio, id_referente,
--   tipo), ma il vincolo era garantito solo da un controllo applicativo eseguito
--   dentro la transazione, sulla collection dei referenti gia' caricata. Con due
--   POST /servizi/{id}/referenti sovrapposte (tipicamente il doppio click sul
--   salvataggio quando la chiamata e' lenta) entrambe le transazioni leggono lo
--   stato precedente all'insert dell'altra, superano entrambe il controllo e
--   inseriscono la stessa associazione piu' volte.
--   Il duplicato non ha effetti funzionali sulle autorizzazioni, ma l'utente
--   compare piu' volte nell'elenco referenti del servizio e viene conteggiato
--   piu' volte nelle liste paginate.
--
-- COSA FA
--   Per ogni gruppo (id_servizio, id_referente, tipo) mantiene la riga con id
--   piu' basso (la prima inserita) ed elimina le altre. Nessuna tabella
--   referenzia referenti_servizi.id, quindi la cancellazione non lascia
--   riferimenti pendenti.
--
-- QUANDO ESEGUIRLO
--   In qualsiasi momento, anche a caldo: la DELETE tocca solo le righe in
--   eccesso. Dopo il deploy della versione che serializza le POST concorrenti
--   (lock esclusivo sul servizio in createReferenteServizio) i duplicati non si
--   riformano.
--
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. DIAGNOSI
-- ----------------------------------------------------------------------------

-- Quante associazioni in eccesso sono presenti (atteso dopo la bonifica: 0)
SELECT coalesce(sum(occorrenze - 1), 0) AS righe_da_eliminare,
       count(*)                         AS gruppi_duplicati
FROM (
    SELECT id_servizio, id_referente, tipo, count(*) AS occorrenze
    FROM referenti_servizi
    WHERE id_servizio IS NOT NULL AND id_referente IS NOT NULL
    GROUP BY id_servizio, id_referente, tipo
    HAVING count(*) > 1
) d;

-- Dettaglio leggibile dei duplicati: servizio, utente, tipo referente e id delle
-- righe coinvolte (la prima dell'elenco e' quella che verra' mantenuta)
SELECT s.nome                          AS servizio,
       s.versione                      AS versione,
       u.nome || ' ' || u.cognome      AS utente,
       u.id_utente                     AS id_utente,
       rs.tipo                         AS tipo_referente,
       count(*)                        AS occorrenze,
       min(rs.id)                      AS id_mantenuto,
       array_agg(rs.id ORDER BY rs.id) AS id_presenti
FROM referenti_servizi rs
    JOIN servizi s ON s.id = rs.id_servizio
    JOIN utenti u  ON u.id = rs.id_referente
GROUP BY s.nome, s.versione, u.nome, u.cognome, u.id_utente, rs.tipo
HAVING count(*) > 1
ORDER BY s.nome, s.versione, utente, rs.tipo;


-- ----------------------------------------------------------------------------
-- 2. BONIFICA
-- ----------------------------------------------------------------------------
--
-- La tabella di backup e' creata senza DROP: se esiste gia' da un tentativo
-- precedente lo script si interrompe qui, prima di toccare i dati, e la
-- transazione viene annullata.

BEGIN;

CREATE TABLE bonifica_backup_referenti_servizi AS
    SELECT rs.*
    FROM referenti_servizi rs
    WHERE rs.id_servizio IS NOT NULL
      AND rs.id_referente IS NOT NULL
      AND rs.id > (
        SELECT min(rs2.id)
        FROM referenti_servizi rs2
        WHERE rs2.id_servizio = rs.id_servizio
          AND rs2.id_referente = rs.id_referente
          AND rs2.tipo IS NOT DISTINCT FROM rs.tipo
    );

DELETE FROM referenti_servizi rs
WHERE rs.id_servizio IS NOT NULL
  AND rs.id_referente IS NOT NULL
  AND rs.id > (
    SELECT min(rs2.id)
    FROM referenti_servizi rs2
    WHERE rs2.id_servizio = rs.id_servizio
      AND rs2.id_referente = rs.id_referente
      AND rs2.tipo IS NOT DISTINCT FROM rs.tipo
  );

COMMIT;


-- ----------------------------------------------------------------------------
-- 3. VERIFICA
-- ----------------------------------------------------------------------------

-- Nessun gruppo (id_servizio, id_referente, tipo) deve avere piu' di una riga
-- (atteso: 0 righe restituite)
SELECT id_servizio, id_referente, tipo, count(*) AS occorrenze
FROM referenti_servizi
WHERE id_servizio IS NOT NULL AND id_referente IS NOT NULL
GROUP BY id_servizio, id_referente, tipo
HAVING count(*) > 1;

-- Righe rimosse dalla bonifica
SELECT count(*) AS righe_rimosse FROM bonifica_backup_referenti_servizi;


-- ----------------------------------------------------------------------------
-- 4. PULIZIA - solo dopo aver verificato l'esito lato applicazione
-- ----------------------------------------------------------------------------

-- DROP TABLE bonifica_backup_referenti_servizi;
