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

public class ConfigurazioneDemo implements IConfigurazioneExecutor {
	private Invokers invokers;	
	private Properties properties;
	private Logger logger = LoggerFactory.getLogger(ConfigurazioneDemo.class);
	private Map<ScenariEnum, ScenarioCondition> scenariConditions;
	
	private void parseProperties(Properties properties) {
		Map<String, Map<String, String>> parsedProperty = ScenarioCondition.parsePropery(properties);
		
		for (ScenariEnum scenario : ScenariEnum.values()) {
			String[] conditionNames = properties.get(scenario.toString()).toString().split(",");
			ScenarioCondition[] conditions = new ScenarioCondition[conditionNames.length];
			
			for (int i = 0; i < conditions.length; i++) {
				conditions[i] = ScenarioCondition.parse(parsedProperty, conditionNames[i]);
			}
			
			scenariConditions.put(scenario, ScenarioCondition.or(conditions));
		}
			
	}
	
	private void initUrl(Properties properties, Configuration cfg) throws NumberFormatException, IOException {
		String kcUsername = properties.getProperty("configuratore.ConfiguratoreDemo.keycloak.username");
		String kcPassword = properties.getProperty("configuratore.ConfiguratoreDemo.keycloak.password");
		
		KeycloakInvoker keycloakApi = new KeycloakInvoker(HttpUrl.get(properties.getProperty("configuratore.ConfiguratoreDemo.keycloak.url")),
				kcUsername,
				kcPassword,
				cfg);
		
		HttpUrl configAPIUrl = HttpUrl.get(properties.getProperty("configuratore.ConfiguratoreDemo.govwayConfig.url"));
		
		String govwayUsername = properties.getProperty("configuratore.ConfiguratoreDemo.govwayConfig.username");
		String govwayPassword = properties.getProperty("configuratore.ConfiguratoreDemo.govwayConfig.password");
		
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
	
	public ConfigurazioneDemo() {
		try {
			this.properties = new Properties();
			this.properties.load(ConfigurazioneDemo.class.getResourceAsStream("../properties/govcat-configuratore.properties"));
			this.scenariConditions = new HashMap<>();
			
			Properties localProperties = new Properties();
			String localPropertiesPath = this.properties.getProperty("configuratore.ConfigurazioneDemo.localProperties");
			try (FileInputStream is = new FileInputStream(this.properties.getProperty("configuratore.ConfigurazioneDemo.localProperties"))) {
				localProperties.load(is);
			} catch (FileNotFoundException e) {
				this.logger.error("properties locali non trovate, file non esistente: {}", localPropertiesPath);
			}
			this.properties.putAll(localProperties);
			
			this.parseProperties(this.properties);
			
			Configuration cfg = this.initTemplateConfiguration();
			this.initUrl(properties, cfg);
			this.logger.info("Configuratore Demo inizializzato");
		} catch (IOException e) {
			this.logger.error("Errore nell'inizializzazione del configuratore demo", e);
		}
	}
	
	
	private ConfigurazioneScenario getConfigurazioneScenario(DTOClient client, List<GruppoServizio> gruppiServizio) {
		ScenariEnum possibleScenario = null;
		for (ScenariEnum scenario : ScenariEnum.values()) {
			ScenarioCondition condition = this.scenariConditions.get(scenario);
			if (condition.check(client.getClass().getSimpleName(), gruppiServizio.get(0).getEstensioni()))
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
	
	// ***************************************** Entry point configuratore ************************************************
	@Override
	public EsitoConfigurazioneAdesione configura(ConfigurazioneAdesioneInput adesione) throws ConfigurazioneException {
		DTOAdesione dtoAdesione = adesione.getAdesione();
		EsitoConfigurazioneAdesione esito = new EsitoConfigurazioneAdesione();
		StringBuilder messaggioErrore = new StringBuilder();
		
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
				messaggioErrore.append(e.getMessage()).append('\n');
				this.logger.error("nome api non trovato, servizio: {}", singleAPI.getNomeServizio());
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
					//e.printStackTrace();
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
				messaggioErrore.append('\n').append("scenario non riconosciuto");
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
				this.logger.error("client [{}] non inizializzato, errore: {}", client.getNome(), e.getMessage());
				messaggioErrore.append('\n').append("client[").append(client.getNome()).append("] non inizializzato, errore: ").append(e.getMessage());
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
					this.logger.error("errore api [{}]: {}", singleAPI, e.getMessage());
					messaggioErrore.append("\nerrore api ").append(singleAPI).append(": ").append(e.getMessage());
				}
			}
		}
		
		
		esito.setEsito(ESITO.OK);
		if (messaggioErrore.length() > 0) {
			esito.setMessaggioErrore(messaggioErrore.deleteCharAt(0).toString());
			esito.setEsito(ESITO.KO_DEFINITIVO);
		}
		
		return esito;
	}

}
