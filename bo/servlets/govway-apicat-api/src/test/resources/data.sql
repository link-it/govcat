insert into utenti(id,id_utente,email,email_aziendale,telefono,telefono_aziendale,nome,cognome,stato, referente_tecnico, ruolo) values((select nextval('seq_utenti')), 'gestore', 'm.rossi@acme.inc','m.rossi@acme.inc','0123456789','0123456789','Mario','Rossi','ABILITATO', false,'AMMINISTRATORE');
insert into utenti(id,id_utente,email,email_aziendale,telefono,telefono_aziendale,nome,cognome,stato, referente_tecnico) values((select nextval('seq_utenti')), 'xxx', 'm.rossi@acme.incx','m.rossi@acme.incx','0123456789','0123456789','Mariox','Rossix','DISABILITATO', false);
insert into utenti(id,id_utente,email,email_aziendale,telefono,telefono_aziendale,nome,cognome,stato, referente_tecnico, ruolo) values((select nextval('seq_utenti')), 'cesare', 'cesare@acme.inc','cesare@acme.inc','01234567890','01234567890','Cesare','Rossi','ABILITATO', false,'REFERENTE_SERVIZIO');
insert into utenti(id,id_utente,email,email_aziendale,telefono,telefono_aziendale,nome,cognome,stato, referente_tecnico) values((select nextval('seq_utenti')), 'colombo', 'colombo@acme.inc','colomboacme.inc','0123456789012','0123456789012','colombo','colombo','ABILITATO', false);
insert into utenti(id,id_utente,email,email_aziendale,telefono,telefono_aziendale,nome,cognome,stato, referente_tecnico, ruolo) values((select nextval('seq_utenti')), 'referente_dominio', 'ref@acme.inc','refcme.inc','01234567890123','01234567890123','referente','cognome','ABILITATO', false,'AMMINISTRATORE');
insert into utenti(id,id_utente,email,email_aziendale,telefono,telefono_aziendale,nome,cognome,stato, referente_tecnico) values((select nextval('seq_utenti')), 'barbarossa', 'bar@acme.inc','barfcme.inc','012345678901238768','012345678901238686','barbarossa','luca','ABILITATO', false);

/*insert into organizations(id,name,id_organizzazione,referente,aderente,esterna) values(1234, 'OrganizzazioneTest', '3b41189c-6245-4854-ba28-d8b4b5049bbd', true, true, false);*/

insert into utenti(id,id_utente,email,email_aziendale,telefono,telefono_aziendale,nome,cognome,stato, referente_tecnico, ruolo) values((select nextval('seq_utenti')), 'utente_referente__servizio', 'bar@acme.inc','barfcme.inc','012345678901238768','012345678901238686','referente','servizio','ABILITATO', false,'REFERENTE_SERVIZIO');
insert into utenti(id,id_utente,email,email_aziendale,telefono,telefono_aziendale,nome,cognome,stato, referente_tecnico) values((select nextval('seq_utenti')), 'utente_referente_tecnico__servizio', 'bar@acme.inc','barfcme.inc','012345678901238768','012345678901238686','referente','tecnico__servizio','ABILITATO', true);
/*insert into utenti(id,id_utente,email,email_aziendale,telefono,telefono_aziendale,nome,cognome,stato, referente_tecnico, ruolo,id_organizzazione) values((select nextval('seq_utenti')), 'utente_referente__dominio', 'bar@acme.inc','barfcme.inc','012345678901238768','012345678901238686','referente','dominio','ABILITATO', false,'REFERENTE_SERVIZIO',1234);
insert into utenti(id,id_utente,email,email_aziendale,telefono,telefono_aziendale,nome,cognome,stato, referente_tecnicoid_organizzazione) values((select nextval('seq_utenti')), 'utente_referente_tecnico__dominio', 'bar@acme.inc','barfcme.inc','012345678901238768','012345678901238686','referente','tecnico__dominio','ABILITATO', false,1234);*/
insert into utenti(id,id_utente,email,email_aziendale,telefono,telefono_aziendale,nome,cognome,stato, referente_tecnico, ruolo) values((select nextval('seq_utenti')), 'utente_referente__dominio', 'bar@acme.inc','barfcme.inc','012345678901238768','012345678901238686','referente','dominio','ABILITATO', false,'REFERENTE_SERVIZIO');
insert into utenti(id,id_utente,email,email_aziendale,telefono,telefono_aziendale,nome,cognome,stato, referente_tecnico) values((select nextval('seq_utenti')), 'utente_referente_tecnico__dominio', 'bar@acme.inc','barfcme.inc','012345678901238768','012345678901238686','referente','tecnico__dominio','ABILITATO', true);
insert into utenti(id,id_utente,email,email_aziendale,telefono,telefono_aziendale,nome,cognome, stato, referente_tecnico) values((select nextval('seq_utenti')), 'utente_qualsiasi', 'bar@acme.inc','barfcme.inc','012345678901238768','012345678901238686','utente','qualsiasi','DISABILITATO', false);
insert into utenti(id,id_utente,email,email_aziendale,telefono,telefono_aziendale,nome,cognome, stato, referente_tecnico) values((select nextval('seq_utenti')), 'utente_richiedente_servizio', 'bar@acme.inc','barfcme.inc','012345678901238768','012345678901238686','utente','richiedente_servizio','ABILITATO', true);

insert into utenti(id,id_utente,email,email_aziendale,telefono,telefono_aziendale,nome,cognome, stato, referente_tecnico) values((select nextval('seq_utenti')), 'utente_richiedente_adesione', 'bar@acme.inc','barfcme.inc','012345678901238768','012345678901238686','utente','richiedente_adesione','ABILITATO', false);
insert into utenti(id,id_utente,email,email_aziendale,telefono,telefono_aziendale,nome,cognome,stato, referente_tecnico, ruolo) values((select nextval('seq_utenti')), 'utente_referente_adesione', 'bar@acme.inc','barfcme.inc','012345678901238768','012345678901238686','referente','adesione','ABILITATO', false,'REFERENTE_SERVIZIO');
insert into utenti(id,id_utente,email,email_aziendale,telefono,telefono_aziendale,nome,cognome,stato, referente_tecnico) values((select nextval('seq_utenti')), 'utente_referente_tecnico_adesione', 'bar@acme.inc','barfcme.inc','012345678901238768','012345678901238686','referente','tecnico__adesione','ABILITATO', true);

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
