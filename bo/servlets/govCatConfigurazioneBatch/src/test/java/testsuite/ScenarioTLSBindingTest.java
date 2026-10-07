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
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
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
import configuratore.ScenarioTLS;
import freemarker.template.Configuration;
import okhttp3.HttpUrl;

/**
 * Associazione dell'applicativo agli applicativi autorizzati nello scenario mTLS.
 *
 * Per le erogazioni l'applicativo e` censito sotto il soggetto aderente, mentre l'erogazione
 * appartiene al referente del dominio: il soggetto va dichiarato nel binding, altrimenti govway
 * cerca l'applicativo sotto il soggetto sbagliato. Per le fruizioni il contratto di govway non
 * prevede quel campo e l'applicativo e` gia` sotto il soggetto della fruizione.
 */
class ScenarioTLSBindingTest {

	private static final String NOME_CLIENT = "ClientMtls";
	private static final String ADERENTE = "Aderente";
	private static final String EROGATORE = "ReferenteDominio";
	private static final String FRUITORE = "Fruitore";

	private HttpServer server;
	private List<String> richieste;
	private List<String> bodyBinding;
	private List<String> bodyApplicativo;

	@BeforeEach
	void setUp() throws IOException {
		this.richieste = new ArrayList<>();
		this.bodyBinding = new ArrayList<>();
		this.bodyApplicativo = new ArrayList<>();

		this.server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		this.server.createContext("/", exchange -> {
			String path = exchange.getRequestURI().getPath();
			String query = exchange.getRequestURI().getQuery();

			this.richieste.add(exchange.getRequestMethod() + " " + path + (query == null ? "" : "?" + query));

			String body;
			try (InputStream is = exchange.getRequestBody()) {
				body = new String(is.readAllBytes(), StandardCharsets.UTF_8);
			}

			if (path.endsWith("/autorizzazione/applicativi")) {
				this.bodyBinding.add(body);
			} else if (path.endsWith("/applicativi")) {
				this.bodyApplicativo.add(body);
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

	private ScenarioTLS scenario() throws IOException {
		Configuration cfg = new Configuration(Configuration.VERSION_2_3_29);
		cfg.setClassLoaderForTemplateLoading(this.getClass().getClassLoader(), "templates/config");

		String baseUrl = "http://127.0.0.1:" + this.server.getAddress().getPort() + "/govwayAPIConfig";
		GovwayConfigInvoker invoker = new GovwayConfigInvoker(HttpUrl.get(baseUrl), cfg)
				.credentials("amministratore", "123456");

		Invokers invokers = new Invokers(Map.of(), Map.of(AmbienteEnum.COLLAUDO, invoker))
				.perAmbiente(AmbienteEnum.COLLAUDO);

		Properties properties = new Properties();
		properties.put(ConfigurazioneScenario.class.getCanonicalName() + ".ignoreConflict", "true");

		return new ScenarioTLS(invokers, properties);
	}

	private static HttpsClient client() {
		return new HttpsClient(NOME_CLIENT, "descrizione del client", "HTTPS", null, new byte[] { 1, 2, 3 }, "CER");
	}

	private static GruppoServizio gruppoServizio(boolean fruizione) {
		DTOSoggetto aderente = new DTOSoggetto(ADERENTE, "APIGateway", false);
		DTOSoggetto erogatore = new DTOSoggetto(EROGATORE, "APIGateway", true);
		DTOSoggetto fruitore = fruizione ? new DTOSoggetto(FRUITORE, "APIGateway", true) : null;

		DTOAdesioneAPI adesioneApi = new DTOAdesioneAPI("MTLS", "GET /risorsa", NOME_CLIENT, null);
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

	private JsonObject binding() {
		assertEquals(1, this.bodyBinding.size(), this.richieste.toString());
		return JsonParser.parseString(this.bodyBinding.get(0)).getAsJsonObject();
	}

	@Test
	@DisplayName("erogazione: il binding dichiara il soggetto aderente, proprietario dell'applicativo")
	void erogazioneDichiaraIlSoggettoDellApplicativo() throws Exception {
		scenario().configureAPI(client(), gruppoServizio(false));

		JsonObject body = binding();
		assertEquals(NOME_CLIENT, body.get("applicativo").getAsString());
		assertTrue(body.has("soggetto"),
				"senza soggetto govway cerca l'applicativo sotto " + EROGATORE + ", dove non esiste: " + body);
		assertEquals(ADERENTE, body.get("soggetto").getAsString(),
				"l'erogazione appartiene a " + EROGATORE + ", l'applicativo a " + ADERENTE);
	}

	@Test
	@DisplayName("fruizione: il binding non dichiara il soggetto, che il contratto non prevede")
	void fruizioneNonDichiaraIlSoggetto() throws Exception {
		scenario().configureAPI(client(), gruppoServizio(true));

		JsonObject body = binding();
		assertEquals(NOME_CLIENT, body.get("applicativo").getAsString());
		assertFalse(body.has("soggetto"),
				"il modello delle fruizioni non prevede il campo soggetto: " + body);
	}

	@Test
	@DisplayName("l'applicativo nasce sotto l'aderente per le erogazioni e sotto il fruitore per le fruizioni")
	void applicativoCensitoSottoIlSoggettoGiusto() throws Exception {
		scenario().configureClient(client(), List.of(gruppoServizio(false)));
		assertTrue(this.richieste.stream().anyMatch(r -> r.startsWith("POST ") && r.contains("/applicativi")
				&& r.contains("soggetto=" + ADERENTE)), this.richieste.toString());

		this.richieste.clear();

		scenario().configureClient(client(), List.of(gruppoServizio(true)));
		assertTrue(this.richieste.stream().anyMatch(r -> r.startsWith("POST ") && r.contains("/applicativi")
				&& r.contains("soggetto=" + FRUITORE)), this.richieste.toString());
	}

	@Test
	@DisplayName("l'applicativo porta il certificato X.509 del client in accesso https")
	void applicativoConIlCertificatoDelClient() throws Exception {
		scenario().configureClient(client(), List.of(gruppoServizio(false)));

		assertEquals(1, this.bodyApplicativo.size(), this.richieste.toString());
		JsonObject credenziali = JsonParser.parseString(this.bodyApplicativo.get(0))
				.getAsJsonObject().getAsJsonObject("credenziali");

		assertEquals("https", credenziali.get("modalita_accesso").getAsString());
		assertEquals(Base64.getEncoder().encodeToString(new byte[] { 1, 2, 3 }),
				credenziali.getAsJsonObject("certificato").get("archivio").getAsString());
	}
}
