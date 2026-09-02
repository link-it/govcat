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
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Stream;

import org.govway.catalogo.core.dto.DTOAdesione.AmbienteEnum;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.sun.net.httpserver.HttpServer;

import configuratore.Invokers;
import freemarker.template.Configuration;
import keycloak.KeycloakInvoker;
import okhttp3.HttpUrl;

/**
 * Verifica l'autenticazione verso keycloak (login con username e password, header custom
 * alternativi) e la selezione dell'istanza in base all'ambiente dell'adesione.
 */
class KeycloakInvokerTest {

	private static final String TOKEN_LOGIN = "token-da-login";
	private static final String SECRET = "secret-del-client";
	private static final String CLIENT_ID = "client-di-test";
	private static final String ID_CLIENT = "id-interno-del-client";

	private static final String PATH_LOGIN = "/protocol/openid-connect/token";
	private static final String PATH_ADMIN = "/admin/realms";

	private HttpServer server;
	private List<Richiesta> richieste;

	private static class Richiesta {
		private final String path;
		private final Map<String, String> headers;

		private Richiesta(String path, Map<String, String> headers) {
			this.path = path;
			this.headers = headers;
		}
	}

	@BeforeEach
	void setUp() throws IOException {
		this.richieste = new ArrayList<>();
		this.server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		this.server.createContext("/", exchange -> {
			String path = exchange.getRequestURI().getPath();

			Map<String, String> headers = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
			exchange.getRequestHeaders().forEach((nome, valori) -> headers.put(nome, String.join(",", valori)));
			this.richieste.add(new Richiesta(path, headers));

			String body;
			if(path.endsWith(PATH_LOGIN)) {
				body = "{\"access_token\":\"" + TOKEN_LOGIN + "\",\"expires_in\":300}";
			} else if(path.endsWith("/client-secret")) {
				body = "{\"type\":\"secret\",\"value\":\"" + SECRET + "\"}";
			} else {
				body = "[{\"id\":\"" + ID_CLIENT + "\",\"clientId\":\"" + CLIENT_ID + "\"}]";
			}

			byte[] raw = body.getBytes(StandardCharsets.UTF_8);
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

	private KeycloakInvoker invoker(String username, String password, Map<String, String> headers) throws IOException {
		HttpUrl url = HttpUrl.get("http://127.0.0.1:" + this.server.getAddress().getPort() + "/auth");
		return new KeycloakInvoker(url, username, password, "master", headers,
				new Configuration(Configuration.VERSION_2_3_29));
	}

	private Stream<Richiesta> richiesteAdmin() {
		return this.richieste.stream().filter(r -> r.path.contains(PATH_ADMIN));
	}

	private boolean loginEffettuato() {
		return this.richieste.stream().anyMatch(r -> r.path.endsWith(PATH_LOGIN));
	}

	@Test
	void testLoginConUsernamePassword() throws IOException {
		KeycloakInvoker invoker = this.invoker("admin", "admin", Map.of());

		assertEquals(SECRET, invoker.getSecret(CLIENT_ID));

		assertTrue(this.loginEffettuato(), "con username e password valorizzati deve essere effettuato il login");
		assertTrue(this.richiesteAdmin().count() > 0);
		assertTrue(this.richiesteAdmin().allMatch(r -> ("Bearer " + TOKEN_LOGIN).equals(r.headers.get("Authorization"))));
	}

	@Test
	void testHeaderCustomSenzaUsernamePassword() throws IOException {
		KeycloakInvoker invoker = this.invoker(null, null,
				Map.of("Authorization", "Bearer token-statico", "X-API-KEY", "chiave"));

		assertEquals(SECRET, invoker.getSecret(CLIENT_ID));

		assertTrue(!this.loginEffettuato(), "senza username e password non deve essere effettuato il login");
		assertTrue(this.richiesteAdmin().count() > 0);
		assertTrue(this.richiesteAdmin().allMatch(r -> "Bearer token-statico".equals(r.headers.get("Authorization"))
				&& "chiave".equals(r.headers.get("X-API-KEY"))));
	}

	@Test
	void testHeaderCustomPrevaleSulLogin() throws IOException {
		KeycloakInvoker invoker = this.invoker("admin", "admin", Map.of("Authorization", "Bearer token-statico"));

		assertEquals(SECRET, invoker.getSecret(CLIENT_ID));

		assertTrue(this.loginEffettuato());
		assertTrue(this.richiesteAdmin().allMatch(r -> "Bearer token-statico".equals(r.headers.get("Authorization"))),
				"l'header custom deve sovrascrivere l'Authorization ottenuto dal login");
	}

	@Test
	void testKeycloakSelezionatoPerAmbiente() throws IOException {
		KeycloakInvoker collaudo = this.invoker("admin", "admin", Map.of());
		KeycloakInvoker produzione = this.invoker("admin", "admin", Map.of());

		Invokers invokers = new Invokers(
				Map.of(AmbienteEnum.COLLAUDO, collaudo, AmbienteEnum.PRODUZIONE, produzione), null);

		assertSame(collaudo, invokers.getKeycloak(AmbienteEnum.COLLAUDO));
		assertSame(produzione, invokers.getKeycloak(AmbienteEnum.PRODUZIONE));
	}

	@Test
	void testKeycloakAmbienteNonConfigurato() throws IOException {
		Invokers invokers = new Invokers(Map.of(AmbienteEnum.COLLAUDO, this.invoker("admin", "admin", Map.of())), null);

		IOException e = assertThrows(IOException.class, () -> invokers.getKeycloak(AmbienteEnum.PRODUZIONE));
		assertTrue(e.getMessage().contains(AmbienteEnum.PRODUZIONE.toString()));

		assertThrows(IOException.class, () -> invokers.getKeycloak(null));
	}
}
