-- Migration: URL di invocazione aggiuntive delle API (Issue 351)
-- Version: 2.5.0
--
-- Introduce la tabella delle URL di invocazione (o di esposizione) aggiuntive di una API,
-- dalla seconda in poi. La prima URL continua a essere risolta dai campi url_invocazione e
-- url_prefix_* gia' presenti sulla gerarchia api -> servizi -> dominio -> soggetti: nessuna
-- colonna esistente viene modificata.
--
-- Script puramente additivo: la versione precedente del software ignora la nuova tabella e
-- continua a funzionare senza modifiche. Nessuno script di cleanup necessario.
--
-- I campi template_url e url_prefix_* sono opzionali: quando non valorizzati si ricade sul
-- valore risolto per la URL principale. Il caso d'uso tipico (stesso path esposto su un
-- secondo gateway, ad esempio rete interna ed esposizione internet) si configura quindi con
-- il solo prefix.
--
-- Non viene definito alcun vincolo di unicita' su (id_api, posizione): l'aggiornamento
-- sostituisce integralmente la collezione (delete + insert nello stesso flush) e Hibernate
-- emette gli insert prima dei delete. L'ordinamento e' applicativo, per posizione e id.

CREATE SEQUENCE IF NOT EXISTS seq_api_url_invocazione START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS api_url_invocazione (
    id BIGINT NOT NULL,
    id_api BIGINT NOT NULL,
    posizione INTEGER NOT NULL,
    etichetta VARCHAR(255),
    template_url VARCHAR(255),
    url_prefix_collaudo VARCHAR(255),
    url_prefix_produzione VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT fk_api_url_invocazione_api FOREIGN KEY (id_api) REFERENCES api(id)
);

-- Indice per il recupero delle URL aggiuntive della singola API
CREATE INDEX IF NOT EXISTS idx_api_url_invocazione_api ON api_url_invocazione(id_api);
