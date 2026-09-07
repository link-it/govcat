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
import java.util.List;

import org.govway.catalogo.gest.clients.govwaymonitor.PatchedApiClient;
import org.govway.catalogo.monitoraggioutils.AbstractGovwayMonitorClient;
import org.govway.catalogo.monitoraggioutils.ConfigurazioneConnessione;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import httpauth.BearerAuthInterceptor;
import httpauth.ClientCredentialsConfig;
import httpauth.ClientCredentialsTokenStore;
import httpauth.OutboundAuthMode;
import httpauth.OutboundAuthentication;
import okhttp3.Interceptor;
import okhttp3.logging.HttpLoggingInterceptor;

/**
 * Verifica come la configurazione di connessione al monitoraggio si traduce in un client http.
 *
 * Il caso senza autenticazione esplicita e' quello di tutte le installazioni esistenti e deve
 * restare identico: basic auth come header di default e nessun interceptor.
 */
class ConfigurazioneConnessioneAutenticazioneTest extends AbstractGovwayMonitorClient {

	private static ConfigurazioneConnessione connessione(String username, String password) {
		ConfigurazioneConnessione conf = new ConfigurazioneConnessione();
		conf.setUrl("http://localhost:8080/govwayAPIMonitor");
		conf.setUsername(username);
		conf.setPassword(password);
		return conf;
	}

	@Test
	@DisplayName("senza autenticazione esplicita resta il basic con le credenziali configurate")
	void basicPerDefault() {
		ConfigurazioneConnessione conf = connessione("utente", "password");

		OutboundAuthentication autenticazione = conf.getAutenticazione();

		assertEquals(OutboundAuthMode.BASIC, autenticazione.getMode());
		assertEquals("utente", autenticazione.getBasicUsername().orElseThrow());

		PatchedApiClient client = getClient(conf);

		assertEquals("http://localhost:8080/govwayAPIMonitor", client.getBasePath());
		assertTrue(client.getHttpClient().interceptors().stream()
				.noneMatch(BearerAuthInterceptor.class::isInstance),
				"nessun interceptor di autenticazione con il basic");
	}

	@Test
	@DisplayName("senza credenziali non si applica alcuna autenticazione")
	void nessunaAutenticazione() {
		assertEquals(OutboundAuthMode.NONE, connessione(null, null).getAutenticazione().getMode());

		// le credenziali passate al client restano quelle della configurazione anche nei casi
		// limite: il client generato decide da se' se comporre l'header, come ha sempre fatto
		PatchedApiClient client = getClient(connessione("utente", ""));

		assertTrue(client.getHttpClient().interceptors().stream()
				.noneMatch(BearerAuthInterceptor.class::isInstance));
	}

	@Test
	@DisplayName("con il client credentials il client usa l'interceptor e non l'header basic")
	void clientCredentialsUsaInterceptor() throws IOException {
		ConfigurazioneConnessione conf = connessione("utente", "password");
		conf.setAutenticazione(OutboundAuthentication.clientCredentials(
				new ClientCredentialsTokenStore(),
				new ClientCredentialsConfig("govway", "http://localhost:9999/token", "govcat", "segreto",
						null, null, null, null)));

		PatchedApiClient client = getClient(conf);

		List<Interceptor> interceptors = client.getHttpClient().interceptors();

		assertTrue(interceptors.stream().anyMatch(BearerAuthInterceptor.class::isInstance),
				"il client deve avere l'interceptor che applica il token");
		assertTrue(conf.getAutenticazione().getBasicUsername().isEmpty(),
				"con il token negoziato le credenziali basic non vengono usate");

		// l'interceptor di autenticazione va registrato per ultimo: il logging del client
		// generato, attivato da setDebugging, logga la richiesta prima che il token sia presente
		int posizioneLogging = indiceDi(interceptors, HttpLoggingInterceptor.class);
		int posizioneBearer = indiceDi(interceptors, BearerAuthInterceptor.class);

		assertTrue(posizioneLogging >= 0, "il client di monitoraggio attiva il logging con setDebugging");
		assertTrue(posizioneLogging < posizioneBearer,
				"il token non deve finire nei log del client: interceptor di logging prima di quello di autenticazione");
	}

	private static int indiceDi(List<Interceptor> interceptors, Class<?> tipo) {
		for(int i = 0; i < interceptors.size(); i++) {
			if(tipo.isInstance(interceptors.get(i))) {
				return i;
			}
		}

		return -1;
	}
}
