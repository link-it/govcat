/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */
package batch;

import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;


import org.govway.catalogo.core.configurazione.ConfigurazioneAdesioneInput;
import org.govway.catalogo.core.configurazione.EsitoConfigurazioneAdesione;
import org.govway.catalogo.core.configurazione.IConfigurazioneExecutor;
import org.govway.catalogo.core.dao.repositories.ClientRepository;
import org.govway.catalogo.core.dao.repositories.UtenteRepository;
import org.govway.catalogo.core.dao.specifications.UtenteSpecification;
import org.govway.catalogo.core.dto.DTOAdesione;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.AdesioneEntity.STATO_CONFIGURAZIONE;
import org.govway.catalogo.core.orm.entity.AmbienteEnum;
import org.govway.catalogo.core.orm.entity.ClientAdesioneEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.core.orm.entity.StatoAdesioneEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.infrastructure.item.ItemProcessor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;


public class ConfigurazioneItemProcessor implements ItemProcessor<AdesioneEntity, AdesioneEntity> {

	@Value("${configurazione-automatica.batch.numeroMassimoTentativi}")
	private int numeroMassimoTentativi;
	
	@Value("${configurazione-automatica.batch.configurazioneExecutorClass}")
	private String configurazioneExecutorClass;

	@Autowired
	private UtenteRepository utenteRepository;

	@Autowired
	private ClientRepository clientRepository;

	/**
	 * Principal dell'utente usato come autore del cambio di stato solo se non e' possibile
	 * determinare dallo storico l'utente che ha richiesto la configurazione automatica.
	 * Opzionale: se vuoto non c'e' fallback.
	 */
    @Value("${configurazione-automatica.batch.utente_configuratore:}")
	String utenteConfiguratore;
	
    @Autowired
    SoggettoDTOFactory soggettoDTOFactory;
    
	@Value("${org.govway.api.catalogo.configurazione.path:/var/govcat/conf/configurazione.json}")
    String configurazioneJsonPath;

    @Autowired
	IntermediateStateService updateService;

    private final List<Map<String, String>> statoConf;


    private static final Logger logger = LoggerFactory.getLogger(ConfigurazioneItemProcessor.class);
    

    public ConfigurazioneItemProcessor(
        @Value("#{stepExecutionContext['STATO_CONF_JSON']}") String statoConfJson
        ) {
            try {
                ObjectMapper om = new ObjectMapper();
                this.statoConf = om.readValue(statoConfJson, new TypeReference<>() {});
            } catch (Exception e) {
                throw new RuntimeException("Impossibile convertire JSON in statoConf", e);
            }
        }

    
    
	@Bean(name ="configurazioneExecutorClass") 
	public IConfigurazioneExecutor configurazioneExecutor() throws Exception {
		Object obj = Class.forName(this.configurazioneExecutorClass).getDeclaredConstructor().newInstance();

		if(obj instanceof IConfigurazioneExecutor) {
			return (IConfigurazioneExecutor) obj;
		} else {
			throw new Exception("Classe ["+this.configurazioneExecutorClass+"] non implementa l'interfaccia [" + IConfigurazioneExecutor.class + "]");
		}
	}

	
	

	@Override
	public AdesioneEntity process(AdesioneEntity entity) throws Exception {
		logger.info("[Processor] Configurazione della adesione [ {} ] in corso",entity.getIdAdesione());

		entity.setStatoConfigurazione(STATO_CONFIGURAZIONE.IN_CODA);
		updateService.updateIntermediateState(entity);

        logger.debug("[Processor] {} configurazioni automatiche disponibili", statoConf.size());

        String statoInConf = entity.getStato();

        String statoFinale = statoConf.stream()
            .filter(m -> statoInConf.equals(m.get("stato_in_configurazione")))
            .map(m -> m.get("stato_finale"))
            .findFirst()
            .orElse(null);

		// L'autore del cambio di stato va determinato prima di invocare GovWay: se non e' possibile
		// non si configura nulla, evitando configurazioni su GovWay non seguite dal cambio di stato.
		Optional<UtenteEntity> autore = getAutoreCambioStato(entity, statoInConf);
		if (autore.isEmpty()) {
			String messaggio = "Impossibile determinare l'utente autore del cambio di stato: nessun utente ha richiesto lo stato ["
					+ statoInConf + "] e la proprieta' configurazione-automatica.batch.utente_configuratore non indica un utente esistente";
			logger.error("[Processor] Adesione [ {} ]: {}", entity.getIdAdesione(), messaggio);
			entity.setStatoConfigurazione(STATO_CONFIGURAZIONE.KO);
			entity.setMessaggioConfigurazione(messaggio);
			return entity;
		}

		ConfigurazioneAdesioneInput conf = new ConfigurazioneAdesioneInput();
		AdesioneDTOConverter b = new AdesioneDTOConverter(entity, configurazioneJsonPath);
		b.setDto(new DTOAdesione(null, null, null, null, null, null, null, null));
		DTOAdesione c = b.converter(soggettoDTOFactory);

		conf.setAdesione(c);

		EsitoConfigurazioneAdesione configurato = configurazioneExecutor().configura(conf);

		ObjectMapper objectMapper = new ObjectMapper();
		String json = null;
		// Serialize object to JSON
		json  = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(configurato.getChiaveRestituita());

		logger.debug("[Processor] chiave restituita:  {}", json);
		logger.debug("[Processor] messaggio di errore:  {}", configurato.getMessaggioErrore());
		logger.debug("[Processor] esito:  {}", configurato.getEsito());

		if (entity.getTentativi()==null) entity.setTentativi(0);

		entity.setTentativi(entity.getTentativi()+1);
		switch (configurato.getEsito()) {
		case OK:	

			entity.setStato(statoFinale);
			StatoAdesioneEntity e = new StatoAdesioneEntity();
			e.setUuid(UUID.randomUUID().toString());
			e.setAdesione(entity);
			e.setStato(statoFinale);
			e.setData(new Date());
			e.setUtente(autore.get());
			logger.debug("# stati:  {}", entity.getStati().size());
			entity.getStati().add(e);
			entity.getStati().forEach(s -> logger.debug("[Processor] stato durante la gestione della adesione: uuid={}, stato={}, data={}", s.getUuid(), s.getStato(), s.getData()));
			entity.setStatoConfigurazione(null);
			entity.setMessaggioConfigurazione(null);

			promuoviClientConfigurati(entity, statoInConf);

			break;

		case KO_DEFINITIVO:
			entity.setStatoConfigurazione(STATO_CONFIGURAZIONE.KO);
			entity.setMessaggioConfigurazione(configurato.getMessaggioErrore());
			break;

		case KO_TEMPORANEO:
			if (entity.getTentativi() >= numeroMassimoTentativi) {
				entity.setStatoConfigurazione(STATO_CONFIGURAZIONE.FALLITA);
				entity.setMessaggioConfigurazione(configurato.getMessaggioErrore());
			} else {
				entity.setStatoConfigurazione(STATO_CONFIGURAZIONE.RETRY);
				entity.setMessaggioConfigurazione(configurato.getMessaggioErrore());
			}
			break;
		}

		logger.info("[Processor] Configurazione della adesione [ {} ] completata",entity.getIdAdesione());

		return entity;

	}

	/**
	 * Autore del cambio di stato post-configurazione: l'utente che ha portato l'adesione nello stato
	 * "in configurazione" (ultima occorrenza di quello stato nello storico); in mancanza, l'utente
	 * indicato dalla proprieta' configurazione-automatica.batch.utente_configuratore, se valorizzata.
	 */
	private Optional<UtenteEntity> getAutoreCambioStato(AdesioneEntity entity, String statoInConf) {
		Optional<UtenteEntity> richiedente = entity.getStati().stream()
				.filter(s -> statoInConf.equals(s.getStato()) && s.getData() != null)
				.max(Comparator.comparing(StatoAdesioneEntity::getData))
				.map(StatoAdesioneEntity::getUtente);
		if (richiedente.isPresent()) {
			logger.debug("[Processor] Autore del cambio di stato: utente che ha richiesto lo stato [{}]", statoInConf);
			return richiedente;
		}

		if (this.utenteConfiguratore == null || this.utenteConfiguratore.isBlank()) {
			return Optional.empty();
		}
		logger.warn("[Processor] Adesione [ {} ]: utente richiedente dello stato [{}] non presente nello storico, uso l'utente di fallback [{}]",
				entity.getIdAdesione(), statoInConf, this.utenteConfiguratore);
		UtenteSpecification utenteSpec = new UtenteSpecification();
		utenteSpec.setPrincipal(Optional.of(this.utenteConfiguratore));
		return utenteRepository.findOne(utenteSpec);
	}

	private void promuoviClientConfigurati(AdesioneEntity entity, String statoInConf) {
		AmbienteEnum ambienteConfigurazione;
		if (statoInConf.contains("collaudo")) {
			ambienteConfigurazione = AmbienteEnum.COLLAUDO;
		} else if (statoInConf.contains("produzione")) {
			ambienteConfigurazione = AmbienteEnum.PRODUZIONE;
		} else {
			logger.warn("[Processor] ambiente non determinabile dallo stato [{}], nessun client promosso", statoInConf);
			return;
		}

		for (ClientAdesioneEntity clientAdesione : entity.getClient()) {
			if (!ambienteConfigurazione.equals(clientAdesione.getAmbiente())) {
				continue;
			}
			ClientEntity clientEntity = clientAdesione.getClient();
			if (clientEntity != null && ClientEntity.StatoEnum.NUOVO.equals(clientEntity.getStato())) {
				clientEntity.setStato(ClientEntity.StatoEnum.CONFIGURATO);
				clientRepository.saveAndFlush(clientEntity);
				logger.info("[Processor] Client [{}] portato in stato CONFIGURATO", clientEntity.getNome());
			}
		}
	}
}
