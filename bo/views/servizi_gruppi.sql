CREATE OR REPLACE VIEW SERVIZI_GRUPPI (
    ID, TIPO, TIPO_COMPONENTE, ID_ENTITA, NOME, VERSIONE, DESCRIZIONE,
    DESCRIZIONE_SINTETICA, ID_IMMAGINE, ID_GRUPPO, STATO, VISIBILITA,
    ID_RICHIEDENTE, ID_DOMINIO
) AS
SELECT
     -1 * id,  
    'GRUPPO' AS tipo,
    tipo AS tipo_componente,
    id_gruppo AS id_entita,
    nome,
    CAST(NULL AS VARCHAR) AS versione,   -- Cast NULL to match the type of VERSIONE
    descrizione,
    descrizione_sintetica,
    id_immagine,
    id_gruppo_padre AS id_gruppo,
    'pubblicato_produzione' AS stato,
    'PUBBLICO' AS visibilita,
    CAST(NULL AS INTEGER) AS id_richiedente,  -- Cast NULL for ID_RICHIEDENTE
    CAST(NULL AS INTEGER) AS id_dominio      -- Cast NULL for ID_DOMINIO
FROM gruppi
UNION
SELECT
    s.id,
    'SERVIZIO' AS tipo,
    s.tipo AS tipo_componente,
    s.id_servizio AS id_entita,
    s.nome,
    s.versione,
    s.descrizione,
    s.descrizione_sintetica,
    s.id_immagine,
    g.id_gruppo,
    s.stato,
    s.visibilita,
    s.id_richiedente,
    s.id_dominio
FROM servizi s
LEFT JOIN gruppi_servizi g
ON s.id = g.id_servizio;
