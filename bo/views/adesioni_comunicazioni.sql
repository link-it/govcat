CREATE OR REPLACE VIEW "ADESIONI_COMUNICAZIONI" ("ID", "DATA", "OGGETTO", "TESTO", "STATO", "ID_UTENTE", "ID_ADESIONE") AS 
  (
SELECT 'msg_' || messaggi_adesioni.id AS id,
messaggi_adesioni.data AS data,
messaggi_adesioni.oggetto,
messaggi_adesioni.testo,
    NULL AS stato,
messaggi_adesioni.id_utente AS id_utente,
messaggi_adesioni.id_adesione AS id_adesione
   FROM messaggi_adesioni
UNION
 SELECT 'step_'|| stati_adesione.id AS id,
stati_adesione.data,
    NULL AS oggetto,
stati_adesione.commento AS testo,
stati_adesione.stato,
stati_adesione.id_utente AS id_utente,
stati_adesione.id_adesione
   FROM stati_adesione);
