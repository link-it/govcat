CREATE OR REPLACE VIEW "SERVIZI_COMUNICAZIONI" ("ID", "DATA", "OGGETTO", "TESTO", "STATO", "ID_UTENTE", "ID_SERVIZIO") AS 
  (
SELECT 'msg_' || messaggi_servizi.id AS id,
messaggi_servizi.data AS data,
messaggi_servizi.oggetto,
messaggi_servizi.testo,
    NULL AS stato,
messaggi_servizi.id_utente AS id_utente,
messaggi_servizi.id_servizio AS id_servizio
   FROM messaggi_servizi
UNION
 SELECT 'step_' || stati_servizio.id AS id,
stati_servizio.data,
    NULL AS oggetto,
stati_servizio.commento AS testo,
stati_servizio.stato,
stati_servizio.id_utente AS id_utente,
stati_servizio.id_servizio
   FROM stati_servizio);
