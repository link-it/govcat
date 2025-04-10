/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2025 Link.it srl (https://link.it).
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
package configuratore;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.TimeZone;
import java.util.stream.Collectors;

import org.govway.catalogo.core.configurazione.AbstractEsitoConfigurazione.ESITO;
import org.govway.catalogo.core.configurazione.ConfigurazioneAdesioneInput;
import org.govway.catalogo.core.configurazione.ConfigurazioneException;
import org.govway.catalogo.core.configurazione.EsitoConfigurazioneAdesione;
import org.govway.catalogo.core.configurazione.IConfigurazioneExecutor;
import org.govway.catalogo.core.dto.DTOAdesione;
import org.govway.catalogo.core.dto.DTOAdesioneAPI;
import org.govway.catalogo.core.dto.DTOApi;
import org.govway.catalogo.core.dto.DTOClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import config.GovwayConfigInvoker;
import freemarker.template.Configuration;
import freemarker.template.TemplateExceptionHandler;
import keycloak.KeycloakInvoker;
import okhttp3.HttpUrl;

/**
 * @author Tommaso Burlon (tommaso.burlon@link.it)
 * @author $Author$
 * @version $Rev$, $Date$
 */

public class ConfigurazioneExecutor implements IConfigurazioneExecutor {
	private Invokers invokers;	
	private Properties properties;
	private Logger logger = LoggerFactory.getLogger(ConfigurazioneExecutor.class);
	private Map<ScenariEnum, ScenarioCondition> scenariConditions;
	
	private void parseProperties(Properties properties) {
		Map<String, Map<String, String>> parsedProperty = ScenarioCondition.parsePropery(properties);
		
		for (ScenariEnum scenario : ScenariEnum.values()) {
			Object objectScenario = properties.get(scenario.toString());
			if(objectScenario != null) {
				String[] conditionNames = objectScenario.toString().split(",");
				ScenarioCondition[] conditions = new ScenarioCondition[conditionNames.length];
				
				for (int i = 0; i < conditions.length; i++) {
					conditions[i] = ScenarioCondition.parse(parsedProperty, conditionNames[i]);
				}
				
				scenariConditions.put(scenario, ScenarioCondition.or(conditions));
			}
		}
			
	}
	
	private void initUrl(Properties properties, Configuration cfg) throws NumberFormatException, IOException {

		String className = this.getClass().getName();
		
		String kcUsername = properties.getProperty(className+".keycloak.username");
		String kcPassword = properties.getProperty(className+".keycloak.password");
		
		KeycloakInvoker keycloakApi = new KeycloakInvoker(HttpUrl.get(properties.getProperty(className+".keycloak.url")),
				kcUsername,
				kcPassword,
				cfg);
		
		HttpUrl configAPIUrl = HttpUrl.get(properties.getProperty(className+".govwayConfig.url"));
		
		String govwayUsername = properties.getProperty(className+".govwayConfig.username");
		String govwayPassword = properties.getProperty(className+".govwayConfig.password");
		
		GovwayConfigInvoker govwayConfigClient = new GovwayConfigInvoker(configAPIUrl, cfg)
				.credentials(govwayUsername, govwayPassword);
		
		this.invokers = new Invokers(keycloakApi, govwayConfigClient);
		
	}
	
	private Configuration initTemplateConfiguration() {
		Configuration cfg = new Configuration(Configuration.VERSION_2_3_29);
		cfg.setClassForTemplateLoading(this.getClass(), "../templates/config");
		cfg.setDefaultEncoding("UTF-8");
		cfg.setTemplateExceptionHandler(TemplateExceptionHandler.RETHROW_HANDLER);
		cfg.setLogTemplateExceptions(false);
		cfg.setWrapUncheckedExceptions(true);
		cfg.setFallbackOnNullLoopVariable(false);
		cfg.setSQLDateAndTimeTimeZone(TimeZone.getDefault());
		
		return cfg;
	}
	
	public ConfigurazioneExecutor() {
		try {
			this.properties = new Properties();
			this.properties.load(ConfigurazioneExecutor.class.getResourceAsStream("../properties/govcat-configuratore.properties"));
			this.scenariConditions = new HashMap<>();
			
			Properties localProperties = new Properties();
			
			String propLocalProperties = this.getClass().getName()+".localProperties";
			this.logger.debug("localProperties path: " + propLocalProperties);
			String localPropertiesPath = this.properties.getProperty(propLocalProperties);
			
			if(localPropertiesPath != null) {
				try (FileInputStream is = new FileInputStream(localPropertiesPath)) {
					localProperties.load(is);
				} catch (FileNotFoundException e) {
					this.logger.error("properties locali non trovate, file non esistente: {}", localPropertiesPath);
				}
			} else {
				this.logger.warn("properties locali non definite");
			}
			
			this.properties.putAll(localProperties);
			
			this.parseProperties(this.properties);
			
			Configuration cfg = this.initTemplateConfiguration();
			this.initUrl(properties, cfg);
			this.logger.info("Configuratore inizializzato");
		} catch (IOException e) {
			this.logger.error("Errore nell'inizializzazione del Configuratore", e);
		}
	}
	
	
	private ConfigurazioneScenario getConfigurazioneScenario(DTOClient client, List<GruppoServizio> gruppiServizio) {
		ScenariEnum possibleScenario = null;
		for (ScenariEnum scenario : ScenariEnum.values()) {
			ScenarioCondition condition = this.scenariConditions.get(scenario);
			if (condition != null && condition.check(client.getClass().getSimpleName(), gruppiServizio.get(0).getEstensioni()))
				possibleScenario = scenario;
		}
		if (possibleScenario == null)
			return null;
		
		switch (possibleScenario) {
		case PDND:
			return new ScenarioPDND(invokers, properties).configureGovway(true);
		case PDND_VOUCHER:
			return new ScenarioPDND(invokers, properties).configureGovway(false);
		case MTLS:
			return new ScenarioTLS(invokers, properties);
		case MTLS_PDND:
			return new ScenarioTLSPDND(invokers, properties);
		case MTLS_SIGN:
			return new ScenarioTLSSign(invokers, properties);
		case SIGN:
			return new ScenarioSign(invokers, properties);
		default: return null;
		}
	}
	
	public void stampaCampi(DTOAdesione a) throws JsonProcessingException {
		// Create ObjectMapper instance
		ObjectMapper objectMapper = new ObjectMapper();
		String json = null;
		// Serialize object to JSON
		json  = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(a);

		logger.info("stampa del contenuto del dto:");
		logger.info(json);
	}

	// ***************************************** Entry point configuratore ************************************************
	@Override
	public EsitoConfigurazioneAdesione configura(ConfigurazioneAdesioneInput adesione) throws ConfigurazioneException {
		DTOAdesione dtoAdesione = adesione.getAdesione();
		
		try {
			stampaCampi(dtoAdesione);
		} catch (JsonProcessingException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		
		EsitoConfigurazioneAdesione esito = new EsitoConfigurazioneAdesione();
		List<String> messaggioErrore = new ArrayList<>();
		
		this.logger.debug("nuova richiesta configurazione");
		esito.setChiaveRestituita(new HashMap<>());
		
		// operazione preliminare unwrapping dei dati
		Map<String, DTOClient> clients = new HashMap<>();
		Map<String, List<GruppoServizio>> clientToApis = new HashMap<>();
		for (DTOClient client : dtoAdesione.getClients()) {
			clients.put(client.getNome(), client);
			clientToApis.put(client.getNome(), new ArrayList<>());
		}
		
		
		for (DTOApi api : dtoAdesione.getApi()) {	
			GruppoServizio singleAPI = new GruppoServizio()
					.adesione(dtoAdesione)
					.api(api);
			
			try {
				singleAPI.nomeAPI(this.invokers.getConfigInvoker().getNomeApiFromSingleApi(singleAPI));
			} catch (IOException e) {
				messaggioErrore.add(e.getMessage());
				this.logger.error("nome api non trovato, servizio: {}", singleAPI.getNomeServizio(), e);
				continue;
			}
			
			for (DTOAdesioneAPI adesioneApi : api.getDTOAdesioneApi()) {
				singleAPI.adesioneAPI(adesioneApi);
				
				List<String> gruppi;
				try {
					gruppi = this.invokers.getConfigInvoker().getGruppiFromRisorse(singleAPI, List.of(adesioneApi.getRisorse().split(",")));
					for (String gruppo : gruppi) {
						singleAPI.gruppo(gruppo);
						clientToApis.get(adesioneApi.getClient()).add(new GruppoServizio(singleAPI));
					}
				} catch (IOException e) {
					messaggioErrore.add(e.getMessage());
					this.logger.error("risorse non trovate, servizio: {}", singleAPI.getNomeServizio(), e);
				}
			}
		}
		
		
		// configurazione client e api
		for (Map.Entry<String, List<GruppoServizio>> clientApi : clientToApis.entrySet()) {
			if (clientApi.getValue().isEmpty()) {
				this.logger.error("client {} non associato a nessun servizio, salto", clientApi.getKey());
				continue;
			}
			// configurazione client
			DTOClient client = clients.get(clientApi.getKey());
			ConfigurazioneScenario configurazioneScenario = this.getConfigurazioneScenario(client, clientApi.getValue());
			Map<String, String> secrets;
			
			if (configurazioneScenario == null) {
				messaggioErrore.add("scenario non riconosciuto");
				continue;
			}
			
			try {
				secrets = configurazioneScenario.configureClient(client, clientApi.getValue());
				if (secrets != null) {
					secrets.entrySet()
						.stream()
						.forEach(row -> esito.getChiaveRestituita().put(client.getNome() + "." + row.getKey(), row.getValue()));
				}
			} catch(ConfigurazioneException e) {
				this.logger.error("client [{}] non inizializzato", client.getNome(), e);
				messaggioErrore.add(new StringBuilder("client[").append(client.getNome()).append("] non inizializzato, errore: ").append(e.getMessage()).toString());
				continue;
			}
			
			for (GruppoServizio singleAPI : clientApi.getValue()) {
				
				try {
					if(!configurazioneScenario.check(client, singleAPI))
						throw new ConfigurazioneException();
					secrets = configurazioneScenario.configureAPI(client, singleAPI);
					
					if (secrets != null) {
						secrets.entrySet()
							.stream()
							.forEach(row -> esito.getChiaveRestituita().put(client.getNome() + "." + row.getKey(), row.getValue()));
					}
				} catch (ConfigurazioneException e) {
					this.logger.error("errore api [{}]", singleAPI, e);
					messaggioErrore.add(new StringBuilder("errore api ").append(singleAPI).append(": ").append(e.getMessage()).toString());
				}
			}
		}
		
		
		esito.setEsito(ESITO.OK);
		if (messaggioErrore.size() > 0) {
			esito.setMessaggioErrore(messaggioErrore.stream().collect(Collectors.joining("\n")));
			esito.setEsito(ESITO.KO_DEFINITIVO);
		}
		
		return esito;
	}

}
