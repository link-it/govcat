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
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.govway.catalogo.core.dto.DTOAdesione.AmbienteEnum;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.sun.net.httpserver.HttpServer;

import config.GovwayConfigInvoker;
import configuratore.Invokers;
import freemarker.template.Configuration;
import httpauth.ClientCredentialsConfig;
import httpauth.ClientCredentialsTokenStore;
import httpauth.OutboundAuthentication;
import okhttp3.Credentials;
import okhttp3.HttpUrl;

/**
 * Autenticazione verso l'API di configurazione di govway: le credenziali basic restano il
 * comportamento di default, il profilo client credentials le sostituisce con il token negoziato.
 */
class GovwayConfigInvokerAutenticazioneTest {

	private static final String PATH_TOKEN = "/token";
	private static final String TOKEN = "token-negoziato";

	private HttpServer server;
	private List<String> authorizationRicevuti;
	private List<String> bodyTokenEndpoint;

	@BeforeEach
	void setUp() throws IOException {
		this.authorizationRicevuti = new ArrayList<>();
		this.bodyTokenEndpoint = new ArrayList<>();

		this.server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		this.server.createContext("/", exchange -> {
			String path = exchange.getRequestURI().getPath();
			String authorization = exchange.getRequestHeaders().getFirst("Authorization");

			String body;

			if(path.endsWith(PATH_TOKEN)) {
				try(InputStream is = exchange.getRequestBody()) {
					this.bodyTokenEndpoint.add(new String(is.readAllBytes(), StandardCharsets.UTF_8));
				}

				body = "{\"access_token\":\"" + TOKEN + "\",\"token_type\":\"Bearer\",\"expires_in\":300}";
			} else {
				this.authorizationRicevuti.add(authorization == null ? "" : authorization);
				body = "{\"nome\":\"applicativo-di-test\"}";
			}

			byte[] raw = body.getBytes(StandardCharsets.UTF_8);
			exchange.getResponseHeaders().add("Content-Type", "application/json");
			exchange.sendResponseHeaders(200, raw.length);

			try(OutputStream os = exchange.getResponseBody()) {
				os.write(raw);
			}
		});
		this.server.start();
	}

	@AfterEach
	void tearDown() {
		this.server.stop(0);
	}

	private String baseUrl() {
		return "http://127.0.0.1:" + this.server.getAddress().getPort() + "/govwayAPIConfig";
	}

	private GovwayConfigInvoker invoker() {
		return new GovwayConfigInvoker(HttpUrl.get(this.baseUrl()),
				new Configuration(Configuration.VERSION_2_3_29));
	}

	private OutboundAuthentication clientCredentials(ClientCredentialsTokenStore tokenStore) throws IOException {
		String tokenEndpoint = "http://127.0.0.1:" + this.server.getAddress().getPort() + PATH_TOKEN;

		return OutboundAuthentication.clientCredentials(tokenStore, new ClientCredentialsConfig(
				"govway-config", tokenEndpoint, "govcat-batch", "segreto", null, null, null, null));
	}

	@Test
	@DisplayName("senza profilo restano le credenziali basic configurate")
	void basicPerDefault() throws IOException {
		GovwayConfigInvoker invoker = this.invoker().credentials("amministratore", "123456");

		invoker.getServizioApplicativo("applicativo-di-test", "ente", "APIGateway");

		assertEquals(List.of(Credentials.basic("amministratore", "123456")), this.authorizationRicevuti);
		assertTrue(this.bodyTokenEndpoint.isEmpty(), "senza profilo non si contatta alcun token endpoint");
	}

	@Test
	@DisplayName("con il profilo client credentials le richieste portano il token negoziato")
	void clientCredentialsSostituisceIlBasic() throws IOException {
		GovwayConfigInvoker invoker = this.invoker()
				.credentials("amministratore", "123456")
				.authentication(this.clientCredentials(new ClientCredentialsTokenStore()));

		invoker.getServizioApplicativo("applicativo-di-test", "ente", "APIGateway");

		assertEquals(List.of("Bearer " + TOKEN), this.authorizationRicevuti);
		assertEquals(1, this.bodyTokenEndpoint.size());
		assertTrue(this.bodyTokenEndpoint.get(0).contains("grant_type=client_credentials"),
				this.bodyTokenEndpoint.get(0));
	}

	@Test
	@DisplayName("collaudo con token negoziato e produzione con basic nella stessa esecuzione")
	void ambientiConAutenticazioniDiverse() throws IOException {
		GovwayConfigInvoker collaudo = this.invoker()
				.authentication(this.clientCredentials(new ClientCredentialsTokenStore()));

		GovwayConfigInvoker produzione = this.invoker().credentials("amministratore", "123456");

		Invokers invokers = new Invokers(Map.of(), Map.of(
				AmbienteEnum.COLLAUDO, collaudo,
				AmbienteEnum.PRODUZIONE, produzione));

		invokers.perAmbiente(AmbienteEnum.COLLAUDO).getConfigInvoker()
				.getServizioApplicativo("applicativo-di-test", "ente", "APIGateway");
		invokers.perAmbiente(AmbienteEnum.PRODUZIONE).getConfigInvoker()
				.getServizioApplicativo("applicativo-di-test", "ente", "APIGateway");

		assertEquals(List.of("Bearer " + TOKEN, Credentials.basic("amministratore", "123456")),
				this.authorizationRicevuti);
		assertEquals(1, this.bodyTokenEndpoint.size(),
				"solo l'ambiente con il profilo negozia un token");
	}

	@Test
	@DisplayName("il token viene negoziato una sola volta per molte chiamate")
	void tokenNegoziatoUnaSolaVolta() throws IOException {
		GovwayConfigInvoker invoker = this.invoker()
				.authentication(this.clientCredentials(new ClientCredentialsTokenStore()));

		for(int i = 0; i < 10; i++) {
			invoker.getServizioApplicativo("applicativo-di-test", "ente", "APIGateway");
		}

		assertEquals(10, this.authorizationRicevuti.size());
		assertTrue(this.authorizationRicevuti.stream().allMatch(("Bearer " + TOKEN)::equals));
		assertEquals(1, this.bodyTokenEndpoint.size(), "il token in cache va riusato fino alla scadenza");
	}
}
