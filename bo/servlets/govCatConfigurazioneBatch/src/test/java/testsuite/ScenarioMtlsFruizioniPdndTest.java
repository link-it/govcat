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
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;

import org.govway.catalogo.core.dto.DTOAdesione;
import org.govway.catalogo.core.dto.DTOAdesione.AmbienteEnum;
import org.govway.catalogo.core.dto.DTOAdesioneAPI;
import org.govway.catalogo.core.dto.DTOApi;
import org.govway.catalogo.core.dto.DTOSoggetto;
import org.govway.catalogo.core.dto.HttpsClient;
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
import configuratore.ScenarioMtlsFruizioniPdnd;
import freemarker.template.Configuration;
import okhttp3.HttpUrl;

/**
 * Fruizioni PDND con autenticazione mTLS: oltre a quanto fa lo scenario mtls, il batch configura
 * la quota del singolo adesore come policy di rate limiting filtrata sul suo applicativo e la
 * finalità PDND come proprietà della fruizione.
 */
class ScenarioMtlsFruizioniPdndTest {

	private static final String NOME_CLIENT = "ClientAdesore";
	private static final String FRUITORE = "Fruitore";
	private static final String FINALITA = "3f2a1b4c-5d6e-7f80-9a1b-2c3d4e5f6071";

	private static final String CHIAVE_PURPOSE_ID = "PDNDCollaudo.finalita";
	private static final String CHIAVE_RATE_LIMITING = "PDNDCollaudo.rate_limiting_quota";

	private HttpServer server;
	private List<String> richieste;
	private Map<String, List<String>> bodyPerPath;

	@BeforeEach
	void setUp() throws IOException {
		this.richieste = new ArrayList<>();
		this.bodyPerPath = new HashMap<>();

		this.server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		this.server.createContext("/", exchange -> {
			String path = exchange.getRequestURI().getPath();
			String query = exchange.getRequestURI().getQuery();

			this.richieste.add(exchange.getRequestMethod() + " " + path + (query == null ? "" : "?" + query));

			String body;
			try (InputStream is = exchange.getRequestBody()) {
				body = new String(is.readAllBytes(), StandardCharsets.UTF_8);
			}
			if (!body.isEmpty()) {
				this.bodyPerPath.computeIfAbsent(path.substring(path.lastIndexOf('/') + 1), k -> new ArrayList<>()).add(body);
			}

			String risposta;
			if (path.endsWith("/controllo-accessi/autenticazione")) {
				risposta = "{\"autenticazione\":{\"tipo\":\"https\"}}";
			} else if (path.endsWith("/controllo-accessi/autorizzazione")) {
				risposta = "{\"autorizzazione\":{\"tipo\":\"abilitato\",\"richiedente\":true}}";
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

	/**
	 * @param riferimenti true per dichiarare nelle properties le estensioni da cui leggere
	 *        finalità e quota, false per simulare un deployment che non le abilita
	 */
	private ScenarioMtlsFruizioniPdnd scenario(boolean riferimenti) throws IOException {
		Configuration cfg = new Configuration(Configuration.VERSION_2_3_29);
		cfg.setClassLoaderForTemplateLoading(this.getClass().getClassLoader(), "templates/config");

		String baseUrl = "http://127.0.0.1:" + this.server.getAddress().getPort() + "/govwayAPIConfig";
		GovwayConfigInvoker invoker = new GovwayConfigInvoker(HttpUrl.get(baseUrl), cfg)
				.credentials("amministratore", "123456");

		Invokers invokers = new Invokers(Map.of(), Map.of(AmbienteEnum.COLLAUDO, invoker))
				.perAmbiente(AmbienteEnum.COLLAUDO);

		Properties properties = new Properties();
		properties.put(ConfigurazioneScenario.class.getCanonicalName() + ".ignoreConflict", "true");

		if (riferimenti) {
			String prefisso = ScenarioMtlsFruizioniPdnd.class.getCanonicalName() + ".collaudo.";
			properties.put(prefisso + "purposeId", CHIAVE_PURPOSE_ID);
			properties.put(prefisso + "rateLimiting", CHIAVE_RATE_LIMITING);
		}

		return new ScenarioMtlsFruizioniPdnd(invokers, properties);
	}

	private static HttpsClient client() {
		return new HttpsClient(NOME_CLIENT, "descrizione", "HTTPS", null, new byte[] { 1, 2, 3 }, "CER");
	}

	private static GruppoServizio gruppoServizio(boolean fruizione, Map<String, String> estensioni) {
		DTOSoggetto aderente = new DTOSoggetto("Aderente", "APIGateway", false);
		DTOSoggetto erogatore = new DTOSoggetto("Erogatore", "APIGateway", true);
		DTOSoggetto fruitore = fruizione ? new DTOSoggetto(FRUITORE, "APIGateway", true) : null;

		DTOAdesioneAPI adesioneApi = new DTOAdesioneAPI("MTLS_FRUIZIONI_PDND", "GET /risorsa", NOME_CLIENT, null);
		DTOApi api = new DTOApi("ApiDiProva", 1, DTOApi.RUOLO.EROGATO_SOGGETTO_DOMINIO,
				DTOApi.PROTOCOLLO.OPENAPI_3, estensioni, List.of(adesioneApi));

		DTOAdesione adesione = new DTOAdesione(List.of(api), Map.of(), erogatore, aderente, fruitore,
				AmbienteEnum.COLLAUDO, List.of(), "collaudo_in_configurazione");

		return new GruppoServizio()
				.adesione(adesione)
				.api(api)
				.adesioneAPI(adesioneApi)
				.nomeAPI("ApiDiProva")
				.gruppo("Predefinito");
	}

	private static GruppoServizio fruizioneCompleta() {
		return gruppoServizio(true, Map.of(CHIAVE_PURPOSE_ID, FINALITA, CHIAVE_RATE_LIMITING, "500"));
	}

	private JsonObject unicoBody(String ultimoSegmentoPath) {
		List<String> bodies = this.bodyPerPath.get(ultimoSegmentoPath);
		assertNotNull(bodies, "nessuna richiesta su /" + ultimoSegmentoPath + ": " + this.richieste);
		assertEquals(1, bodies.size(), bodies.toString());
		return JsonParser.parseString(bodies.get(0)).getAsJsonObject();
	}

	@Test
	@DisplayName("la quota dell'adesione diventa una policy filtrata sul suo applicativo")
	void quotaDellAdesoreNellaPolicyDiRateLimiting() throws Exception {
		scenario(true).configureAPI(client(), fruizioneCompleta());

		JsonObject policy = unicoBody("rate-limiting");
		assertEquals(NOME_CLIENT, policy.get("nome").getAsString());
		assertEquals("abilitato", policy.get("stato").getAsString());
		assertTrue(policy.get("soglia_ridefinita").getAsBoolean());
		assertEquals(500, policy.get("soglia_valore").getAsInt());
		assertEquals("criteri", policy.getAsJsonObject("configurazione").get("identificazione").getAsString());
		assertEquals("numero-richieste", policy.getAsJsonObject("configurazione").get("metrica").getAsString());
		assertEquals("giornaliero", policy.getAsJsonObject("configurazione").get("intervallo").getAsString());
		assertEquals(NOME_CLIENT, policy.getAsJsonObject("filtro").get("applicativo_fruitore").getAsString());
	}

	@Test
	@DisplayName("la finalità diventa la proprietà .purposeId della fruizione")
	void finalitaNellaProprietaDellaFruizione() throws Exception {
		scenario(true).configureAPI(client(), fruizioneCompleta());

		JsonObject proprieta = unicoBody("proprieta");
		assertEquals(".purposeId", proprieta.get("nome").getAsString());
		assertEquals(FINALITA, proprieta.get("valore").getAsString());
	}

	@Test
	@DisplayName("le chiamate vanno sulla fruizione, non sull'erogazione")
	void chiamateSullaFruizione() throws Exception {
		scenario(true).configureAPI(client(), fruizioneCompleta());

		assertTrue(this.richieste.stream().anyMatch(r -> r.startsWith("POST ") && r.contains("/fruizioni/Erogatore/")
				&& r.contains("/rate-limiting") && r.contains("soggetto=" + FRUITORE)), this.richieste.toString());
		assertTrue(this.richieste.stream().anyMatch(r -> r.startsWith("POST ") && r.contains("/fruizioni/Erogatore/")
				&& r.contains("/proprieta")), this.richieste.toString());
	}

	@Test
	@DisplayName("fa comunque quanto fa lo scenario mtls: applicativo negli autorizzati")
	void delegaAncheAlloScenarioMtls() throws Exception {
		scenario(true).configureAPI(client(), fruizioneCompleta());

		JsonObject binding = unicoBody("applicativi");
		assertEquals(NOME_CLIENT, binding.get("applicativo").getAsString());
	}

	@Test
	@DisplayName("senza quota sull'adesione non viene configurata alcuna policy")
	void senzaQuotaNessunaPolicy() throws Exception {
		scenario(true).configureAPI(client(), gruppoServizio(true, Map.of(CHIAVE_PURPOSE_ID, FINALITA)));

		assertNull(this.bodyPerPath.get("rate-limiting"), this.richieste.toString());
		// la finalità viene configurata lo stesso
		assertEquals(FINALITA, unicoBody("proprieta").get("valore").getAsString());
	}

	@Test
	@DisplayName("senza riferimenti nelle properties non si configura nulla di PDND")
	void senzaRiferimentiNessunaConfigurazionePdnd() throws Exception {
		scenario(false).configureAPI(client(), fruizioneCompleta());

		assertNull(this.bodyPerPath.get("rate-limiting"), this.richieste.toString());
		assertNull(this.bodyPerPath.get("proprieta"), this.richieste.toString());
		// lo scenario mtls viene comunque eseguito
		assertNotNull(this.bodyPerPath.get("applicativi"), this.richieste.toString());
	}

	@Test
	@DisplayName("getError rifiuta le erogazioni e segnala i dati mancanti o non validi")
	void getErrorSegnalaIProblemi() throws Exception {
		ScenarioMtlsFruizioniPdnd scenario = scenario(true);

		assertNull(scenario.getError(client(), fruizioneCompleta()));

		String erroreErogazione = scenario.getError(client(), gruppoServizio(false,
				Map.of(CHIAVE_PURPOSE_ID, FINALITA, CHIAVE_RATE_LIMITING, "500")));
		assertNotNull(erroreErogazione);
		assertTrue(erroreErogazione.contains("fruizione"), erroreErogazione);

		String erroreFinalita = scenario.getError(client(), gruppoServizio(true, Map.of(CHIAVE_RATE_LIMITING, "500")));
		assertNotNull(erroreFinalita);
		assertTrue(erroreFinalita.contains(CHIAVE_PURPOSE_ID), erroreFinalita);

		String erroreQuota = scenario.getError(client(), gruppoServizio(true,
				Map.of(CHIAVE_PURPOSE_ID, FINALITA, CHIAVE_RATE_LIMITING, "molte")));
		assertNotNull(erroreQuota);
		assertTrue(erroreQuota.contains("non numerica"), erroreQuota);
	}

	@Test
	@DisplayName("senza riferimenti configurati la finalità mancante non è un errore")
	void senzaRiferimentiNessunVincoloSullaFinalita() throws Exception {
		assertNull(scenario(false).getError(client(), gruppoServizio(true, Map.of())));
	}
}
