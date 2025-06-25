ALTER TABLE gruppi ADD COLUMN alberatura varchar(1000);

-- Step 1: Costruisci la gerarchia con percorso_completo
WITH RECURSIVE gerarchia_gruppi AS (
    SELECT
        id,
        id_gruppo_padre,
        '#' || id AS percorso
    FROM gruppi
    WHERE id_gruppo_padre IS NULL

    UNION ALL

    SELECT
        g.id,
        g.id_gruppo_padre,
        gg.percorso || '#' || g.id
    FROM gruppi g
    INNER JOIN gerarchia_gruppi gg ON g.id_gruppo_padre = gg.id
),
-- Step 2: Seleziona solo quelli con alberatura = NULL
gruppi_da_aggiornare AS (
    SELECT
        g.id,
        g.percorso || '#' AS nuova_alberatura
    FROM gerarchia_gruppi g
    JOIN gruppi orig ON orig.id = g.id
    WHERE orig.alberatura IS NULL
)
-- Step 3: Esegui l'UPDATE
UPDATE gruppi
SET alberatura = g.nuova_alberatura
FROM gruppi_da_aggiornare g
WHERE gruppi.id = g.id;

