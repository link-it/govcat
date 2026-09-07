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
import java.util.ArrayList;
import java.util.List;

import org.govway.catalogo.monitoraggioutils.ConfigurazioneConnessione;
import org.govway.catalogo.monitoraggioutils.allarmi.AllarmeResponse;
import org.govway.catalogo.monitoraggioutils.allarmi.SoggettoAllarmeClient;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.sun.net.httpserver.HttpServer;

import httpauth.ClientCredentialsConfig;
import httpauth.ClientCredentialsTokenStore;
import httpauth.OutboundAuthentication;

/**
 * Gli allarmi sono l'unica integrazione su apache httpclient: l'header con il token negoziato
 * viene applicato alla richiesta invece che da un interceptor okhttp.
 *
 * Senza profilo di autenticazione resta il credentials provider basic, che risponde alla sfida
 * del server e quindi non invia credenziali su una richiesta accettata: e' il comportamento
 * storico e non deve cambiare.
 */
class AllarmiAutenticazioneTest {

	private static final String ID_ALLARME = "allarme-soggetti";

	private HttpServer server;
	private List<String> authorizationRicevuti;
	private FakeTokenEndpoint tokenEndpoint;

	@BeforeEach
	void setUp() throws IOException {
		this.authorizationRicevuti = new ArrayList<>();
		this.tokenEndpoint = new FakeTokenEndpoint();

		this.server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		this.server.createContext("/", exchange -> {
			String authorization = exchange.getRequestHeaders().getFirst("Authorization");
			this.authorizationRicevuti.add(authorization == null ? "" : authorization);

			byte[] raw = "".getBytes(StandardCharsets.UTF_8);
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
		this.tokenEndpoint.close();
	}

	private ConfigurazioneConnessione connessione() {
		ConfigurazioneConnessione conf = new ConfigurazioneConnessione();
		conf.setUrl("http://127.0.0.1:" + this.server.getAddress().getPort() + "/allarmi");
		conf.setUsername("utente");
		conf.setPassword("password");
		return conf;
	}

	@Test
	@DisplayName("senza profilo la richiesta non porta un Authorization preventivo")
	void basicPerDefault() {
		List<AllarmeResponse> allarmi = new SoggettoAllarmeClient(ID_ALLARME).getAllarmeList(this.connessione());

		assertTrue(allarmi.isEmpty());
		assertEquals(List.of(""), this.authorizationRicevuti);
		assertEquals(0, this.tokenEndpoint.getNumeroRichieste());
	}

	@Test
	@DisplayName("con il profilo client credentials la richiesta porta il token negoziato")
	void clientCredentials() throws IOException {
		ClientCredentialsTokenStore tokenStore = new ClientCredentialsTokenStore();

		ConfigurazioneConnessione conf = this.connessione();
		conf.setAutenticazione(OutboundAuthentication.clientCredentials(tokenStore,
				new ClientCredentialsConfig("allarmi", this.tokenEndpoint.url(), "govcat", "segreto",
						null, null, null, null)));

		SoggettoAllarmeClient client = new SoggettoAllarmeClient(ID_ALLARME);

		for(int i = 0; i < 4; i++) {
			client.getAllarmeList(conf);
		}

		assertEquals(4, this.authorizationRicevuti.size());
		assertTrue(this.authorizationRicevuti.stream().allMatch("Bearer token-1"::equals),
				() -> "authorization ricevuti: " + this.authorizationRicevuti);
		assertEquals(1, this.tokenEndpoint.getNumeroRichieste(), "il token in cache va riusato");
	}
}
