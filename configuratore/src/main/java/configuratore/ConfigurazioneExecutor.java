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
package configuratore;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.EnumMap;
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
import org.govway.catalogo.core.dto.DTOAdesione.AmbienteEnum;
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
import httpauth.ClientCredentialsTokenStore;
import httpauth.OutboundAuthRegistry;
import keycloak.KeycloakInvoker;
import okhttp3.HttpUrl;

/**
 * @author Tommaso Burlon (tommaso.burlon@link.it)
 * @author $Author$
 * @version $Rev$, $Date$
 */

public class ConfigurazioneExecutor implements IConfigurazioneExecutor {
	
	/** Suffisso della property con cui una integrazione referenzia un profilo di autenticazione. */
	private static final String SUFFISSO_AUTHN_REF = "authn.ref";
	
	/** Prefisso, relativo al nome della classe, sotto cui sono dichiarati i profili. */
	private static final String PREFISSO_PROFILI = ".outbound.auth.";
	
	private Invokers invokers;	
	private Properties properties;
	
	/**
	 * Cache dei token condivisa da tutte le integrazioni del batch: il ConfigurazioneExecutor e'
	 * istanziato una sola volta come bean, quindi il token negoziato sopravvive ai tick del job.
	 */
	private final ClientCredentialsTokenStore tokenStore = new ClientCredentialsTokenStore();
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
		
		OutboundAuthRegistry authRegistry = new OutboundAuthRegistry(properties,
				className + PREFISSO_PROFILI, this.tokenStore);
		
		Map<AmbienteEnum, KeycloakInvoker> keycloakApi = new EnumMap<>(AmbienteEnum.class);
		
		for (AmbienteEnum ambiente : AmbienteEnum.values()) {
			KeycloakInvoker invoker = this.initKeycloak(properties, cfg, className, ambiente, authRegistry);
			if (invoker != null)
				keycloakApi.put(ambiente, invoker);
		}
		
		Map<AmbienteEnum, GovwayConfigInvoker> govwayConfigApi = new EnumMap<>(AmbienteEnum.class);
		
		for (AmbienteEnum ambiente : AmbienteEnum.values()) {
			GovwayConfigInvoker invoker = this.initGovwayConfig(properties, cfg, className, ambiente, authRegistry);
			if (invoker != null)
				govwayConfigApi.put(ambiente, invoker);
		}
		
		this.invokers = new Invokers(keycloakApi, govwayConfigApi);
		
	}
	
	/**
	 * L'API di configurazione di govway e' configurata per ambiente (.govwayConfig.collaudo.*,
	 * .govwayConfig.produzione.*) perche' le due installazioni sono distinte. Un ambiente privo
	 * di url non viene configurato: le adesioni di quell'ambiente falliscono con un errore
	 * esplicito.
	 */
	private GovwayConfigInvoker initGovwayConfig(Properties properties, Configuration cfg, String className, AmbienteEnum ambiente, OutboundAuthRegistry authRegistry) throws IOException {
		String prefix = className + ".govwayConfig." + ambiente.toString().toLowerCase() + ".";
		
		String url = properties.getProperty(prefix + "url");
		
		if (url == null || url.isBlank()) {
			this.logger.info("govway non configurato per l'ambiente {}", ambiente);
			return null;
		}
		
		String username = properties.getProperty(prefix + "username");
		String password = properties.getProperty(prefix + "password");
		
		GovwayConfigInvoker invoker = new GovwayConfigInvoker(HttpUrl.get(url), cfg);
		
		// le credenziali basic restano opzionali: con un profilo di autenticazione non servono
		if (username != null && !username.isEmpty() && password != null && !password.isEmpty())
			invoker.credentials(username, password);
		
		return invoker.authentication(authRegistry.resolve(
				properties.getProperty(prefix + SUFFISSO_AUTHN_REF), username, password));
	}
	
	/**
	 * Keycloak e' configurato per ambiente (.keycloak.collaudo.*, .keycloak.produzione.*) perche'
	 * le due istanze sono distinte. Un ambiente privo di url non viene configurato: le adesioni
	 * di quell'ambiente che richiedono keycloak falliscono con un errore esplicito.
	 */
	private KeycloakInvoker initKeycloak(Properties properties, Configuration cfg, String className, AmbienteEnum ambiente, OutboundAuthRegistry authRegistry) throws IOException {
		String prefix = className + ".keycloak." + ambiente.toString().toLowerCase() + ".";
		
		String kcUrl = properties.getProperty(prefix + "url");
		
		if (kcUrl == null || kcUrl.isBlank()) {
			this.logger.info("keycloak non configurato per l'ambiente {}", ambiente);
			return null;
		}
		
		String kcUsername = properties.getProperty(prefix + "username");
		String kcPassword = properties.getProperty(prefix + "password");
		
		return new KeycloakInvoker(HttpUrl.get(kcUrl),
				kcUsername,
				kcPassword,
				properties.getProperty(prefix + "realm"),
				getHeaders(properties, prefix + "properties."),
				authRegistry.resolve(properties.getProperty(prefix + SUFFISSO_AUTHN_REF), kcUsername, kcPassword),
				cfg);
	}
	
	/**
	 * Header aggiuntivi per l'autenticazione verso keycloak, in alternativa a username e password:
	 * ogni property con il prefisso indicato definisce un header con il nome che segue il prefisso.
	 */
	private static Map<String, String> getHeaders(Properties properties, String prefix) {
		Map<String, String> headers = new HashMap<>();
		
		for (String name : properties.stringPropertyNames()) {
			if (name.startsWith(prefix) && name.length() > prefix.length())
				headers.put(name.substring(prefix.length()), properties.getProperty(name));
		}
		
		return headers;
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
	
	
	/**
	 * @param invokersAdesione invoker gia' risolti sull'ambiente dell'adesione, che gli scenari
	 *        ricevono al posto di quelli generali
	 */
	private ConfigurazioneScenario getConfigurazioneScenario(DTOClient client, List<GruppoServizio> gruppiServizio, Invokers invokersAdesione) {
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
			return new ScenarioPDND(invokersAdesione, properties).configureGovway(true);
		case PDND_VOUCHER:
			return new ScenarioPDND(invokersAdesione, properties).configureGovway(false);
		case MTLS:
			return new ScenarioTLS(invokersAdesione, properties);
		case MTLS_PDND:
			return new ScenarioTLSPDND(invokersAdesione, properties);
		case MTLS_SIGN:
			return new ScenarioTLSSign(invokersAdesione, properties);
		case SIGN:
			return new ScenarioSign(invokersAdesione, properties);
		case OAUTH_CLIENT_CREDENTIALS:
			return new ScenarioClientCredentials(invokersAdesione, properties);
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
		
		// govway e keycloak sono configurati per ambiente: l'ambiente e' quello dell'adesione,
		// quindi si risolve una volta sola e vale per tutti gli scenari e i servizi
		Invokers invokersAdesione;
		
		try {
			invokersAdesione = this.invokers.perAmbiente(dtoAdesione.getAmbienteConfigurazione());
		} catch (IOException e) {
			this.logger.error("configurazione non eseguibile: {}", e.getMessage(), e);
			esito.setEsito(ESITO.KO_DEFINITIVO);
			esito.setMessaggioErrore(e.getMessage());
			return esito;
		}
		
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
				singleAPI.nomeAPI(invokersAdesione.getConfigInvoker().getNomeApiFromSingleApi(singleAPI));
			} catch (IOException e) {
				messaggioErrore.add(e.getMessage());
				this.logger.error("nome api non trovato, servizio: {}", singleAPI.getNomeServizio(), e);
				continue;
			}
			
			for (DTOAdesioneAPI adesioneApi : api.getDTOAdesioneApi()) {
				singleAPI.adesioneAPI(adesioneApi);
				
				List<String> gruppi;
				try {
					gruppi = invokersAdesione.getConfigInvoker().getGruppiFromRisorse(singleAPI, List.of(adesioneApi.getRisorse().split(",")));
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
			ConfigurazioneScenario configurazioneScenario = this.getConfigurazioneScenario(client, clientApi.getValue(), invokersAdesione);
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
					String error = configurazioneScenario.getError(client, singleAPI);
					if(error != null)
						throw new ConfigurazioneException(error);
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
