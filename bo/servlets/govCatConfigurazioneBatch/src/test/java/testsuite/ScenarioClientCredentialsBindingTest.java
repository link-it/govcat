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
import java.util.List;
import java.util.Map;
import java.util.Properties;

import org.govway.catalogo.core.dto.DTOAdesione;
import org.govway.catalogo.core.dto.DTOAdesione.AmbienteEnum;
import org.govway.catalogo.core.dto.DTOAdesioneAPI;
import org.govway.catalogo.core.dto.DTOApi;
import org.govway.catalogo.core.dto.DTOSoggetto;
import org.govway.catalogo.core.dto.OauthClientCredentialsClient;
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
import configuratore.ScenarioClientCredentials;
import freemarker.template.Configuration;
import okhttp3.HttpUrl;

/**
 * Associazione dell'applicativo agli applicativi autorizzati (token richiedente) nello scenario
 * OAuth client credentials (Issue 444).
 *
 * Per le erogazioni il binding dichiara il soggetto aderente, proprietario dell'applicativo. Per
 * le fruizioni govway ammette solo il campo applicativo: un campo soggetto produce un 400
 * ("Unrecognized field soggetto"), come accadeva sulla fruizione intermediata ModI.
 */
class ScenarioClientCredentialsBindingTest {

	private static final String NOME_CLIENT = "applicativo_client";
	private static final String TOKEN_POLICY = "PolicyOauthCC";
	private static final String ADERENTE = "Aderente";
	private static final String EROGATORE = "Erogatore";
	private static final String FRUITORE = "Fruitore";

	private HttpServer server;
	private List<String> richieste;
	private List<String> bodyBinding;

	@BeforeEach
	void setUp() throws IOException {
		this.richieste = new ArrayList<>();
		this.bodyBinding = new ArrayList<>();

		this.server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		this.server.createContext("/", exchange -> {
			String path = exchange.getRequestURI().getPath();
			String query = exchange.getRequestURI().getQuery();

			this.richieste.add(exchange.getRequestMethod() + " " + path + (query == null ? "" : "?" + query));

			try (InputStream is = exchange.getRequestBody()) {
				String body = new String(is.readAllBytes(), StandardCharsets.UTF_8);
				if (path.endsWith("/autorizzazione/token/applicativi")) {
					this.bodyBinding.add(body);
				}
			}

			String risposta;
			if (path.endsWith("/controllo-accessi/gestione-token")) {
				risposta = "{\"policy\":\"" + TOKEN_POLICY + "\"}";
			} else if (path.endsWith("/controllo-accessi/autorizzazione")) {
				risposta = "{\"autorizzazione\":{\"tipo\":\"abilitato\",\"token_richiedente\":true}}";
			} else if (path.contains("/applicativi/")) {
				risposta = "{\"credenziali\":{\"modalita_accesso\":\"token\",\"token_policy\":\"" + TOKEN_POLICY + "\"}}";
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

	private ScenarioClientCredentials scenario() throws IOException {
		Configuration cfg = new Configuration(Configuration.VERSION_2_3_29);
		cfg.setClassLoaderForTemplateLoading(this.getClass().getClassLoader(), "templates/config");

		String baseUrl = "http://127.0.0.1:" + this.server.getAddress().getPort() + "/govwayAPIConfig";
		GovwayConfigInvoker invoker = new GovwayConfigInvoker(HttpUrl.get(baseUrl), cfg)
				.credentials("amministratore", "123456");

		Invokers invokers = new Invokers(Map.of(), Map.of(AmbienteEnum.COLLAUDO, invoker))
				.perAmbiente(AmbienteEnum.COLLAUDO);

		Properties properties = new Properties();
		properties.put(ConfigurazioneScenario.class.getCanonicalName() + ".ignoreConflict", "true");

		return new ScenarioClientCredentials(invokers, properties);
	}

	private static OauthClientCredentialsClient client() {
		return new OauthClientCredentialsClient(NOME_CLIENT, null, "OAUTH_CLIENT_CREDENTIALS", null, NOME_CLIENT);
	}

	private static GruppoServizio gruppoServizio(boolean fruizione) {
		DTOSoggetto aderente = new DTOSoggetto(ADERENTE, "ModIPA", true);
		DTOSoggetto erogatore = new DTOSoggetto(EROGATORE, "ModIPA", true);
		DTOSoggetto fruitore = fruizione ? new DTOSoggetto(FRUITORE, "ModIPA", true) : null;

		DTOAdesioneAPI adesioneApi = new DTOAdesioneAPI("OAUTH_CC", "Servizio.Azione", NOME_CLIENT, null);
		DTOApi api = new DTOApi("ApiDiProva", 1, DTOApi.RUOLO.EROGATO_SOGGETTO_DOMINIO,
				DTOApi.PROTOCOLLO.WSDL11, Map.of(), List.of(adesioneApi));

		DTOAdesione adesione = new DTOAdesione(List.of(api), Map.of(), erogatore, aderente, fruitore,
				AmbienteEnum.COLLAUDO, List.of(), "in_configurazione_automatica_collaudo");

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
		assertEquals(ADERENTE, body.get("soggetto").getAsString());
	}

	@Test
	@DisplayName("fruizione: il binding contiene solo l'applicativo, il fruitore è nella query string")
	void fruizioneNonDichiaraIlSoggetto() throws Exception {
		scenario().configureAPI(client(), gruppoServizio(true));

		JsonObject body = binding();
		assertEquals(NOME_CLIENT, body.get("applicativo").getAsString());
		assertFalse(body.has("soggetto"), "il modello delle fruizioni ammette solo applicativo: " + body);

		String post = this.richieste.get(this.richieste.size() - 1);
		assertTrue(post.startsWith("POST /govwayAPIConfig/fruizioni/" + EROGATORE + "/"), post);
		assertTrue(post.contains("soggetto=" + FRUITORE), post);
	}
}
