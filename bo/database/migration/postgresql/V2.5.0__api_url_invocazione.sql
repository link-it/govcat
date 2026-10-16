-- Migration: URL di invocazione associate alle specifiche delle API (Issue 351)
-- Version: 2.5.0
--
-- Le URL di invocazione (o di esposizione) disponibili sono censite nella configurazione
-- (servizio.api.url_invocazione), separatamente per collaudo e produzione. Qui si salva solo
-- l'associazione fra la specifica di un ambiente (api_config) e gli identificativi delle URL
-- scelte, piu' l'identificativo riservato 'default' per la URL predefinita.
--
-- Associazione assente: vale la sola URL predefinita, quella risolta dalla gerarchia
-- api -> servizi -> dominio -> soggetti -> configurazione. Nessuna colonna esistente viene
-- modificata: la versione precedente del software ignora la nuova tabella e continua a
-- funzionare. Nessuno script di cleanup necessario.
--
-- Il DROP iniziale rimuove la tabella api_url_invocazione di una precedente stesura della
-- stessa issue (URL definite sulla singola API), mai rilasciata: e' innocuo sugli ambienti
-- che non l'hanno mai creata.

DROP TABLE IF EXISTS api_url_invocazione;
DROP SEQUENCE IF EXISTS seq_api_url_invocazione;

CREATE SEQUENCE IF NOT EXISTS seq_api_config_url_invocazione START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS api_config_url_invocazione (
    id BIGINT NOT NULL,
    id_api_config BIGINT NOT NULL,
    identificativo VARCHAR(255) NOT NULL,
    posizione INTEGER NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_api_config_url_invocazione_config FOREIGN KEY (id_api_config) REFERENCES api_config(id)
);

-- Indice per il recupero delle URL associate alla singola specifica
CREATE INDEX IF NOT EXISTS idx_api_config_url_invocazione_config ON api_config_url_invocazione(id_api_config);
