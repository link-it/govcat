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
package testsuite;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Properties;

import org.govway.catalogo.core.configurazione.ConfigurazioneException;
import org.govway.catalogo.core.dto.DTOAdesione;
import org.govway.catalogo.core.dto.DTOAdesione.AmbienteEnum;
import org.govway.catalogo.core.dto.DTOAdesioneAPI;
import org.govway.catalogo.core.dto.DTOApi;
import org.govway.catalogo.core.dto.DTOSoggetto;
import org.govway.catalogo.core.dto.PdndClient;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.sun.net.httpserver.HttpServer;

import config.GovwayConfigInvoker;
import configuratore.ConfigurazioneScenario;
import configuratore.GruppoServizio;
import configuratore.Invokers;
import configuratore.ScenarioOauthCCTokenPolicy;
import freemarker.template.Configuration;
import okhttp3.HttpUrl;

/**
 * Scenario che censisce l'applicativo con la token policy dichiarata sull'API: l'applicativo nasce
 * sotto il soggetto aderente (erogazioni) o fruitore (fruizioni) e viene associato all'erogazione
 * solo se la policy configurata su govway coincide con quella dell'applicativo.
 */
class ScenarioOauthCCTokenPolicyTest {

	private static final String CLIENT_ID = "b3b1a0e2-1111-2222-3333-444455556666";
	private static final String NOME_CLIENT = "ClientDiProva";
	private static final String TOKEN_POLICY = "PolicyOauthCC";

	private HttpServer server;
	private List<String> richieste;
	private List<String> bodyRicevuti;
	private String policyErogazione;
	private String policyApplicativo;
	private boolean tokenRichiedente;

	@BeforeEach
	void setUp() throws IOException {
		this.richieste = new ArrayList<>();
		this.bodyRicevuti = new ArrayList<>();
		this.policyErogazione = TOKEN_POLICY;
		this.policyApplicativo = TOKEN_POLICY;
		this.tokenRichiedente = true;

		this.server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		this.server.createContext("/", exchange -> {
			String path = exchange.getRequestURI().getPath();
			String query = exchange.getRequestURI().getQuery();

			this.richieste.add(exchange.getRequestMethod() + " " + path + (query == null ? "" : "?" + query));

			try (InputStream is = exchange.getRequestBody()) {
				String body = new String(is.readAllBytes(), StandardCharsets.UTF_8);
				if (!body.isEmpty()) {
					this.bodyRicevuti.add(body);
				}
			}

			String risposta;
			if (path.endsWith("/controllo-accessi/gestione-token")) {
				risposta = this.policyErogazione == null ? "{}" : "{\"policy\":\"" + this.policyErogazione + "\"}";
			} else if (path.endsWith("/controllo-accessi/autorizzazione")) {
				risposta = "{\"autorizzazione\":{\"tipo\":\"abilitato\",\"token_richiedente\":" + this.tokenRichiedente + "}}";
			} else if (path.contains("/applicativi/")) {
				risposta = this.policyApplicativo == null
						? "{}"
						: "{\"credenziali\":{\"modalita_accesso\":\"token\",\"token_policy\":\"" + this.policyApplicativo + "\"}}";
			} else {
				risposta = "{}";
			}

			byte[] raw = risposta.getBytes(StandardCharsets.UTF_8);
			exchange.getResponseHeaders().add("Content-Type", "application/json");
			exchange.sendResponseHeaders(200, raw.length);

			try (OutputStream os = exchange.getResponseBody()) {
				os.write(raw);
			}
		});
		this.server.start();
	}

	@AfterEach
	void tearDown() {
		this.server.stop(0);
	}

	private ScenarioOauthCCTokenPolicy scenario() throws IOException {
		Configuration cfg = new Configuration(Configuration.VERSION_2_3_29);
		cfg.setClassLoaderForTemplateLoading(this.getClass().getClassLoader(), "templates/config");

		String baseUrl = "http://127.0.0.1:" + this.server.getAddress().getPort() + "/govwayAPIConfig";
		GovwayConfigInvoker invoker = new GovwayConfigInvoker(HttpUrl.get(baseUrl), cfg)
				.credentials("amministratore", "123456");

		Invokers invokers = new Invokers(Map.of(), Map.of(AmbienteEnum.COLLAUDO, invoker))
				.perAmbiente(AmbienteEnum.COLLAUDO);

		Properties properties = new Properties();
		properties.put(ConfigurazioneScenario.class.getCanonicalName() + ".ignoreConflict", "true");

		return new ScenarioOauthCCTokenPolicy(invokers, properties);
	}

	private static PdndClient client() {
		return new PdndClient(NOME_CLIENT, "descrizione del client", "PDND", null, CLIENT_ID);
	}

	private static GruppoServizio gruppoServizio(String tokenPolicy, boolean fruizione) {
		DTOSoggetto aderente = new DTOSoggetto("Aderente", "APIGateway", false);
		DTOSoggetto erogatore = new DTOSoggetto("Erogatore", "APIGateway", true);
		DTOSoggetto fruitore = fruizione ? new DTOSoggetto("Fruitore", "APIGateway", true) : null;

		DTOAdesioneAPI adesioneApi = new DTOAdesioneAPI("OAUTH_CC", "GET /risorsa", NOME_CLIENT, tokenPolicy);
		DTOApi api = new DTOApi("ApiDiProva", 1, DTOApi.RUOLO.EROGATO_SOGGETTO_DOMINIO,
				DTOApi.PROTOCOLLO.OPENAPI_3, Map.of(), List.of(adesioneApi));

		DTOAdesione adesione = new DTOAdesione(List.of(api), Map.of(), erogatore, aderente, fruitore,
				AmbienteEnum.COLLAUDO, List.of(), "collaudo_in_configurazione");

		return new GruppoServizio()
				.adesione(adesione)
				.api(api)
				.adesioneAPI(adesioneApi)
				.nomeAPI("ApiDiProva")
				.gruppo("Predefinito");
	}

	private JsonObject primoBody() {
		assertEquals(1, this.bodyRicevuti.size(), this.richieste.toString());
		return JsonParser.parseString(this.bodyRicevuti.get(0)).getAsJsonObject();
	}

	@Test
	@DisplayName("l'applicativo nasce con la token policy dichiarata sull'API")
	void applicativoConLaTokenPolicyDellApi() throws Exception {
		Map<String, String> chiavi = scenario().configureClient(client(), List.of(gruppoServizio(TOKEN_POLICY, false)));

		JsonObject credenziali = primoBody().getAsJsonObject("credenziali");
		assertEquals("token", credenziali.get("modalita_accesso").getAsString());
		assertEquals(TOKEN_POLICY, credenziali.get("token_policy").getAsString());
		assertEquals(CLIENT_ID, credenziali.get("identificativo").getAsString());

		assertEquals(CLIENT_ID, chiavi.get("client_id"));
	}

	@Test
	@DisplayName("per le erogazioni l'applicativo sta sotto il soggetto aderente")
	void applicativoSottoLAderentePerLeErogazioni() throws Exception {
		scenario().configureClient(client(), List.of(gruppoServizio(TOKEN_POLICY, false)));

		assertTrue(this.richieste.get(0).contains("soggetto=Aderente"), this.richieste.toString());
		assertTrue(this.richieste.get(0).contains("profilo=APIGateway"), this.richieste.toString());
	}

	@Test
	@DisplayName("per le fruizioni l'applicativo sta sotto il soggetto fruitore")
	void applicativoSottoIlFruitorePerLeFruizioni() throws Exception {
		scenario().configureClient(client(), List.of(gruppoServizio(TOKEN_POLICY, true)));

		assertTrue(this.richieste.get(0).contains("soggetto=Fruitore"), this.richieste.toString());
	}

	@Test
	@DisplayName("senza token policy sull'API la configurazione del client fallisce")
	void senzaTokenPolicyIlClientNonVieneConfigurato() throws Exception {
		ScenarioOauthCCTokenPolicy scenario = scenario();
		List<GruppoServizio> gruppi = List.of(gruppoServizio(null, false));

		ConfigurazioneException e = assertThrows(ConfigurazioneException.class,
				() -> scenario.configureClient(client(), gruppi));

		assertTrue(e.getMessage().contains("token policy"), e.getMessage());
		assertTrue(this.richieste.isEmpty(), "nessuna chiamata a govway senza token policy");
	}

	@Test
	@DisplayName("token policy discordanti tra le API dello stesso client sono un errore")
	void tokenPolicyDiscordantiSonoUnErrore() throws Exception {
		ScenarioOauthCCTokenPolicy scenario = scenario();
		List<GruppoServizio> gruppi = List.of(
				gruppoServizio(TOKEN_POLICY, false),
				gruppoServizio("AltraPolicy", false));

		ConfigurazioneException e = assertThrows(ConfigurazioneException.class,
				() -> scenario.configureClient(client(), gruppi));

		assertTrue(e.getMessage().contains("token policy diverse"), e.getMessage());
		assertTrue(this.richieste.isEmpty(), "nessuna chiamata a govway con policy discordanti");
	}

	@Test
	@DisplayName("getError segnala la token policy mancante e il client non gestito")
	void getErrorSegnalaIProblemiDiConfigurazione() throws Exception {
		ScenarioOauthCCTokenPolicy scenario = scenario();

		assertNull(scenario.getError(client(), gruppoServizio(TOKEN_POLICY, false)));

		String errorePolicy = scenario.getError(client(), gruppoServizio(null, false));
		assertNotNull(errorePolicy);
		assertTrue(errorePolicy.contains("OAUTH_CC"), errorePolicy);

		assertNotNull(scenario.getError(
				new org.govway.catalogo.core.dto.HttpsClient("c", "d", "HTTPS", null, new byte[] {1}, "CER"),
				gruppoServizio(TOKEN_POLICY, false)));
	}

	@Test
	@DisplayName("l'applicativo viene associato all'erogazione quando le policy coincidono")
	void applicativoAssociatoAllErogazione() throws Exception {
		scenario().configureAPI(client(), gruppoServizio(TOKEN_POLICY, false));

		String binding = this.richieste.get(this.richieste.size() - 1);
		assertTrue(binding.startsWith("POST "), binding);
		assertTrue(binding.contains("/autorizzazione/token/applicativi"), binding);

		JsonObject body = primoBody();
		assertEquals(NOME_CLIENT, body.get("applicativo").getAsString());
		assertEquals("Aderente", body.get("soggetto").getAsString());
	}

	@Test
	@DisplayName("policy dell'erogazione diversa da quella dell'applicativo: nessuna associazione")
	void policyDiscordanteConLErogazione() throws Exception {
		this.policyErogazione = "PolicyDiversa";
		ScenarioOauthCCTokenPolicy scenario = scenario();
		GruppoServizio gruppo = gruppoServizio(TOKEN_POLICY, false);

		ConfigurazioneException e = assertThrows(ConfigurazioneException.class,
				() -> scenario.configureAPI(client(), gruppo));

		assertTrue(e.getMessage().contains("non coincide"), e.getMessage());
		assertTrue(this.richieste.stream().noneMatch(r -> r.startsWith("POST ")),
				"nessuna associazione con policy discordanti: " + this.richieste);
	}

	@Test
	@DisplayName("senza gestione token sull'erogazione non si associa l'applicativo")
	void senzaGestioneTokenNessunaAssociazione() throws Exception {
		this.policyErogazione = null;
		ScenarioOauthCCTokenPolicy scenario = scenario();
		GruppoServizio gruppo = gruppoServizio(TOKEN_POLICY, false);

		ConfigurazioneException e = assertThrows(ConfigurazioneException.class,
				() -> scenario.configureAPI(client(), gruppo));

		assertTrue(e.getMessage().contains("autenticazione token non configurata"), e.getMessage());
	}

	@Test
	@DisplayName("autorizzazione non in modalita token richiedente: nessuna associazione")
	void senzaTokenRichiedenteNessunaAssociazione() throws Exception {
		this.tokenRichiedente = false;
		ScenarioOauthCCTokenPolicy scenario = scenario();
		GruppoServizio gruppo = gruppoServizio(TOKEN_POLICY, false);

		ConfigurazioneException e = assertThrows(ConfigurazioneException.class,
				() -> scenario.configureAPI(client(), gruppo));

		assertTrue(e.getMessage().contains("token richiedente"), e.getMessage());
		assertTrue(this.richieste.stream().noneMatch(r -> r.startsWith("POST ")), this.richieste.toString());
	}
}
