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
package testsuite.httpauth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import httpauth.ClientCredentialsConfig;
import httpauth.ClientCredentialsTokenStore;
import httpauth.OutboundAuthentication;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

/**
 * Verifica l'interceptor che autentica le richieste okhttp: applicazione dell'header, rispetto
 * di un Authorization gia' presente e ritentativo dopo un 401.
 */
class BearerAuthInterceptorTest {

	/**
	 * Servizio di prova che registra gli Authorization ricevuti e puo' rispondere 401 alle prime
	 * richieste, come farebbe govway con un token revocato.
	 */
	private static class ServizioProtetto implements AutoCloseable {

		private final HttpServer server;
		private final List<String> authorizationRicevuti = new CopyOnWriteArrayList<>();
		private final AtomicInteger richieste = new AtomicInteger();
		private volatile int risposteNonAutorizzate = 0;

		ServizioProtetto() throws IOException {
			this.server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
			this.server.createContext("/servizio", this::gestisci);
			this.server.start();
		}

		private void gestisci(HttpExchange exchange) throws IOException {
			int numero = this.richieste.incrementAndGet();
			String authorization = exchange.getRequestHeaders().getFirst("Authorization");
			this.authorizationRicevuti.add(authorization == null ? "" : authorization);

			int status = numero <= this.risposteNonAutorizzate ? 401 : 200;
			byte[] corpo = ("risposta-" + numero).getBytes(StandardCharsets.UTF_8);

			exchange.sendResponseHeaders(status, corpo.length);

			try(OutputStream os = exchange.getResponseBody()) {
				os.write(corpo);
			}
		}

		String url() {
			return "http://127.0.0.1:" + this.server.getAddress().getPort() + "/servizio";
		}

		ServizioProtetto conRisposteNonAutorizzate(int quante) {
			this.risposteNonAutorizzate = quante;
			return this;
		}

		@Override
		public void close() {
			this.server.stop(0);
		}
	}

	private static OutboundAuthentication autenticazione(FakeTokenEndpoint endpoint) throws IOException {
		ClientCredentialsConfig config = new ClientCredentialsConfig("profilo-test", endpoint.url(),
				"govcat", "segreto", null, null, null, null);
		return OutboundAuthentication.clientCredentials(new ClientCredentialsTokenStore(), config);
	}

	private static OkHttpClient client(OutboundAuthentication autenticazione) {
		return new OkHttpClient.Builder()
				.addInterceptor(autenticazione.interceptor().orElseThrow())
				.build();
	}

	@Test
	@DisplayName("l'header Authorization viene aggiunto con il token negoziato")
	void aggiungeHeaderConIlToken() throws Exception {
		try(FakeTokenEndpoint tokenEndpoint = new FakeTokenEndpoint();
				ServizioProtetto servizio = new ServizioProtetto()) {

			OkHttpClient client = client(autenticazione(tokenEndpoint));

			try(Response response = client.newCall(new Request.Builder().url(servizio.url()).build()).execute()) {
				assertEquals(200, response.code());
			}

			assertEquals("Bearer token-1", servizio.authorizationRicevuti.get(0));
		}
	}

	@Test
	@DisplayName("un Authorization gia' presente non viene sovrascritto")
	void nonSovrascriveAuthorizationEsistente() throws Exception {
		try(FakeTokenEndpoint tokenEndpoint = new FakeTokenEndpoint();
				ServizioProtetto servizio = new ServizioProtetto()) {

			OkHttpClient client = client(autenticazione(tokenEndpoint));

			Request request = new Request.Builder()
					.url(servizio.url())
					.header("Authorization", "Bearer header-custom")
					.build();

			try(Response response = client.newCall(request).execute()) {
				assertEquals(200, response.code());
			}

			assertEquals("Bearer header-custom", servizio.authorizationRicevuti.get(0));
			assertEquals(0, tokenEndpoint.getNumeroRichieste(), "senza bisogno del token non si negozia");
		}
	}

	@Test
	@DisplayName("su 401 il token viene rinegoziato e la richiesta ritentata una volta")
	void su401RinegoziaERitenta() throws Exception {
		try(FakeTokenEndpoint tokenEndpoint = new FakeTokenEndpoint();
				ServizioProtetto servizio = new ServizioProtetto().conRisposteNonAutorizzate(1)) {

			OkHttpClient client = client(autenticazione(tokenEndpoint));

			try(Response response = client.newCall(new Request.Builder().url(servizio.url()).build()).execute()) {
				assertEquals(200, response.code());
			}

			assertEquals(List.of("Bearer token-1", "Bearer token-2"), servizio.authorizationRicevuti);
			assertEquals(2, tokenEndpoint.getNumeroRichieste());
		}
	}

	@Test
	@DisplayName("il ritentativo dopo 401 avviene una sola volta")
	void ritentaUnaSolaVolta() throws Exception {
		try(FakeTokenEndpoint tokenEndpoint = new FakeTokenEndpoint();
				ServizioProtetto servizio = new ServizioProtetto().conRisposteNonAutorizzate(5)) {

			OkHttpClient client = client(autenticazione(tokenEndpoint));

			try(Response response = client.newCall(new Request.Builder().url(servizio.url()).build()).execute()) {
				assertEquals(401, response.code());
			}

			assertEquals(2, servizio.richieste.get(), "una richiesta e un solo ritentativo");
		}
	}

	@Test
	@DisplayName("con autenticazione basic non viene aggiunto alcun interceptor")
	void basicSenzaInterceptor() {
		assertTrue(OutboundAuthentication.basic("utente", "password").interceptor().isEmpty());
		assertTrue(OutboundAuthentication.none().interceptor().isEmpty());
	}
}
