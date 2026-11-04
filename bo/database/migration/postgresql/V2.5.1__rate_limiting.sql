-- Migration: rate limiting di API e adesioni con campi dedicati (Issue 402)
-- Version: 2.5.1
--
-- Il rate limiting, finora gestibile solo come proprieta' custom dell'adesione, diventa un dato
-- strutturato:
--   api_config_rate_limiting  quote dichiarate dal servizio per la specifica di un ambiente di
--                             un'API, una riga per periodo (minuto, ora, giorno): quota totale,
--                             massimo per la somma dei fruitori, e quota fruitore, massimo per
--                             ciascun fruitore; almeno una delle due e` valorizzata
--   adesioni_rate_limiting    quota assegnata al fruitore per API, ambiente e periodo; il periodo
--                             e' uno di quelli dichiarati dal servizio per la stessa API e ambiente
--
-- Solo tabelle nuove: nessuna colonna esistente viene modificata, la versione precedente del
-- software le ignora e continua a funzionare. Le proprieta' custom di rate limiting gia'
-- valorizzate restano dove sono e non vengono migrate.
--
-- Le foreign key verso le tabelle esistenti sono ON DELETE CASCADE: la versione precedente del
-- software, che non conosce le nuove tabelle, puo' continuare a cancellare API e adesioni anche
-- se nel frattempo sono state valorizzate quote. Nessuno script di cleanup necessario.

CREATE SEQUENCE IF NOT EXISTS seq_api_config_rate_limiting START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS api_config_rate_limiting (
    id BIGINT NOT NULL,
    id_api_config BIGINT NOT NULL,
    periodo VARCHAR(255) NOT NULL,
    quota INTEGER,
    quota_fruitore INTEGER,
    PRIMARY KEY (id),
    CONSTRAINT uk_api_config_rate_limiting UNIQUE (id_api_config, periodo),
    CONSTRAINT fk_api_config_rate_limiting_config FOREIGN KEY (id_api_config) REFERENCES api_config(id) ON DELETE CASCADE
);

-- Allineamento degli ambienti su cui e` stata eseguita una stesura precedente di questo script,
-- con la sola quota totale obbligatoria: istruzioni senza effetto sulla tabella appena creata
ALTER TABLE api_config_rate_limiting ADD COLUMN IF NOT EXISTS quota_fruitore INTEGER;
ALTER TABLE api_config_rate_limiting ALTER COLUMN quota DROP NOT NULL;

CREATE SEQUENCE IF NOT EXISTS seq_adesioni_rate_limiting START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS adesioni_rate_limiting (
    id BIGINT NOT NULL,
    id_adesione BIGINT NOT NULL,
    id_api BIGINT NOT NULL,
    ambiente VARCHAR(255) NOT NULL,
    periodo VARCHAR(255) NOT NULL,
    quota INTEGER NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_adesioni_rate_limiting UNIQUE (id_adesione, id_api, ambiente, periodo),
    CONSTRAINT fk_adesioni_rate_limiting_adesione FOREIGN KEY (id_adesione) REFERENCES adesioni(id) ON DELETE CASCADE,
    CONSTRAINT fk_adesioni_rate_limiting_api FOREIGN KEY (id_api) REFERENCES api(id) ON DELETE CASCADE
);

-- Indice per il riepilogo delle quote assegnate ai fruitori di un'API (l'unique copre gia' le
-- ricerche per adesione)
CREATE INDEX IF NOT EXISTS idx_adesioni_rate_limiting_api ON adesioni_rate_limiting(id_api, ambiente, periodo);
