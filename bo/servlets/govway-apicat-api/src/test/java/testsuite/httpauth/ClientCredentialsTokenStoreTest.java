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
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import httpauth.ClientAuthMethod;
import httpauth.ClientCredentialsConfig;
import httpauth.ClientCredentialsTokenStore;

/**
 * Verifica il comportamento della cache dei token: la negoziazione avviene solo quando in cache
 * non c'e' un token valido, e mai in parallelo per lo stesso profilo.
 */
class ClientCredentialsTokenStoreTest {

	private static ClientCredentialsConfig config(String tokenEndpoint) throws IOException {
		return config(tokenEndpoint, ClientAuthMethod.CLIENT_SECRET_BASIC, null, null, null);
	}

	private static ClientCredentialsConfig config(String tokenEndpoint, ClientAuthMethod method, String scope,
			String audience, Double refreshMargin) throws IOException {
		return new ClientCredentialsConfig("profilo-test", tokenEndpoint, "govcat", "segreto",
				scope, audience, method, refreshMargin);
	}

	@Test
	@DisplayName("il token viene negoziato una sola volta per piu' chiamate")
	void tokenNegoziatoUnaSolaVolta() throws Exception {
		try(FakeTokenEndpoint endpoint = new FakeTokenEndpoint()) {
			ClientCredentialsTokenStore store = new ClientCredentialsTokenStore();
			ClientCredentialsConfig config = config(endpoint.url());

			String primo = store.getAuthorizationHeader(config);

			for(int i = 0; i < 20; i++) {
				assertEquals(primo, store.getAuthorizationHeader(config));
			}

			assertEquals(1, endpoint.getNumeroRichieste());
			assertEquals(1, store.getNumeroNegoziazioni());
			assertEquals("Bearer token-1", primo);
		}
	}

	@Test
	@DisplayName("il token viene rinegoziato dopo la scadenza")
	void tokenRinegoziatoAllaScadenza() throws Exception {
		try(FakeTokenEndpoint endpoint = new FakeTokenEndpoint().conExpiresIn(1L)) {
			ClientCredentialsTokenStore store = new ClientCredentialsTokenStore();
			// margine 0.001 di 1 secondo: il token in cache scade dopo pochi millisecondi
			ClientCredentialsConfig config = config(endpoint.url(), ClientAuthMethod.CLIENT_SECRET_BASIC,
					null, null, 0.001d);

			String primo = store.getAuthorizationHeader(config);
			Thread.sleep(50L);
			String secondo = store.getAuthorizationHeader(config);

			assertNotEquals(primo, secondo);
			assertEquals(2, endpoint.getNumeroRichieste());
			assertEquals("Bearer token-2", secondo);
		}
	}

	@Test
	@DisplayName("un token ancora valido non viene rinegoziato anche con expires_in breve")
	void tokenValidoNonRinegoziato() throws Exception {
		try(FakeTokenEndpoint endpoint = new FakeTokenEndpoint().conExpiresIn(300L)) {
			ClientCredentialsTokenStore store = new ClientCredentialsTokenStore();
			ClientCredentialsConfig config = config(endpoint.url());

			store.getAuthorizationHeader(config);
			Thread.sleep(30L);
			store.getAuthorizationHeader(config);

			assertEquals(1, endpoint.getNumeroRichieste());
		}
	}

	@Test
	@DisplayName("piu' thread concorrenti provocano una sola negoziazione")
	void negoziazioneSerializzataTraThread() throws Exception {
		try(FakeTokenEndpoint endpoint = new FakeTokenEndpoint().conRitardo(120L)) {
			ClientCredentialsTokenStore store = new ClientCredentialsTokenStore();
			ClientCredentialsConfig config = config(endpoint.url());

			int thread = 16;
			CountDownLatch pronti = new CountDownLatch(thread);
			CountDownLatch via = new CountDownLatch(1);
			AtomicReference<Exception> errore = new AtomicReference<>();
			ExecutorService pool = Executors.newFixedThreadPool(thread);

			try {
				for(int i = 0; i < thread; i++) {
					pool.submit(() -> {
						pronti.countDown();

						try {
							via.await();
							store.getAuthorizationHeader(config);
						} catch(InterruptedException e) {
							Thread.currentThread().interrupt();
						} catch(Exception e) {
							errore.set(e);
						}
					});
				}

				assertTrue(pronti.await(10, TimeUnit.SECONDS));
				via.countDown();
				pool.shutdown();
				assertTrue(pool.awaitTermination(30, TimeUnit.SECONDS));
			} finally {
				pool.shutdownNow();
			}

			assertEquals(null, errore.get());
			assertEquals(1, endpoint.getNumeroRichieste());
			assertEquals(1, store.getNumeroNegoziazioni());
		}
	}

	@Test
	@DisplayName("client_secret_basic presenta le credenziali nell'header Authorization")
	void clientSecretBasic() throws Exception {
		try(FakeTokenEndpoint endpoint = new FakeTokenEndpoint()) {
			ClientCredentialsTokenStore store = new ClientCredentialsTokenStore();
			store.getAuthorizationHeader(config(endpoint.url()));

			String atteso = "Basic " + Base64.getEncoder().encodeToString("govcat:segreto".getBytes("ISO-8859-1"));
			assertEquals(atteso, endpoint.getAuthorizationRicevuti().get(0));

			String body = endpoint.getBodyRicevuti().get(0);
			assertTrue(body.contains("grant_type=client_credentials"), body);
			assertTrue(!body.contains("client_secret"), body);
		}
	}

	@Test
	@DisplayName("client_secret_post presenta le credenziali nel body")
	void clientSecretPost() throws Exception {
		try(FakeTokenEndpoint endpoint = new FakeTokenEndpoint()) {
			ClientCredentialsTokenStore store = new ClientCredentialsTokenStore();
			store.getAuthorizationHeader(config(endpoint.url(), ClientAuthMethod.CLIENT_SECRET_POST,
					null, null, null));

			assertEquals("", endpoint.getAuthorizationRicevuti().get(0));

			String body = endpoint.getBodyRicevuti().get(0);
			assertTrue(body.contains("client_id=govcat"), body);
			assertTrue(body.contains("client_secret=segreto"), body);
		}
	}

	@Test
	@DisplayName("scope e audience vengono inviati solo se configurati")
	void scopeEAudience() throws Exception {
		try(FakeTokenEndpoint endpoint = new FakeTokenEndpoint()) {
			ClientCredentialsTokenStore store = new ClientCredentialsTokenStore();
			store.getAuthorizationHeader(config(endpoint.url(), ClientAuthMethod.CLIENT_SECRET_BASIC,
					"monitoraggio", "govway", null));

			String body = endpoint.getBodyRicevuti().get(0);
			assertTrue(body.contains("scope=monitoraggio"), body);
			assertTrue(body.contains("audience=govway"), body);
		}
	}

	@Test
	@DisplayName("invalidate forza la rinegoziazione alla richiesta successiva")
	void invalidateForzaRinegoziazione() throws Exception {
		try(FakeTokenEndpoint endpoint = new FakeTokenEndpoint()) {
			ClientCredentialsTokenStore store = new ClientCredentialsTokenStore();
			ClientCredentialsConfig config = config(endpoint.url());

			assertEquals("Bearer token-1", store.getAuthorizationHeader(config));
			store.invalidate(config);
			assertEquals("Bearer token-2", store.getAuthorizationHeader(config));
			assertEquals(2, endpoint.getNumeroRichieste());
		}
	}

	@Test
	@DisplayName("il token_type restituito viene usato nell'header")
	void tokenTypeRispettato() throws Exception {
		try(FakeTokenEndpoint endpoint = new FakeTokenEndpoint().conTokenType("DPoP")) {
			ClientCredentialsTokenStore store = new ClientCredentialsTokenStore();
			assertEquals("DPoP token-1", store.getAuthorizationHeader(config(endpoint.url())));
		}
	}

	@Test
	@DisplayName("senza expires_in il token resta comunque in cache")
	void senzaExpiresInIlTokenRestaInCache() throws Exception {
		try(FakeTokenEndpoint endpoint = new FakeTokenEndpoint().senzaExpiresIn()) {
			ClientCredentialsTokenStore store = new ClientCredentialsTokenStore();
			ClientCredentialsConfig config = config(endpoint.url());

			store.getAuthorizationHeader(config);
			store.getAuthorizationHeader(config);

			assertEquals(1, endpoint.getNumeroRichieste());
		}
	}

	@Test
	@DisplayName("l'errore del token endpoint riporta error ed error_description")
	void erroreDelTokenEndpoint() throws Exception {
		try(FakeTokenEndpoint endpoint = new FakeTokenEndpoint().conErrore(401)) {
			ClientCredentialsTokenStore store = new ClientCredentialsTokenStore();
			ClientCredentialsConfig config = config(endpoint.url());

			IOException e = assertThrows(IOException.class, () -> store.getAuthorizationHeader(config));

			assertTrue(e.getMessage().contains("invalid_client"), e.getMessage());
			assertTrue(e.getMessage().contains("client non valido"), e.getMessage());
			assertTrue(!e.getMessage().contains("segreto"), "il messaggio non deve contenere il client secret");
		}
	}

	@Test
	@DisplayName("dopo un fallimento le richieste successive non si accodano sul token endpoint")
	void fallimentoNonRitentatoSubito() throws Exception {
		try(FakeTokenEndpoint endpoint = new FakeTokenEndpoint().conErrore(500).conRitardo(100L)) {
			ClientCredentialsTokenStore store = new ClientCredentialsTokenStore();
			ClientCredentialsConfig config = config(endpoint.url());

			assertThrows(IOException.class, () -> store.getAuthorizationHeader(config));

			IOException successivo = assertThrows(IOException.class, () -> store.getAuthorizationHeader(config));

			assertTrue(successivo.getMessage().contains("non ritentata"), successivo.getMessage());
			assertEquals(1, endpoint.getNumeroRichieste(), "il token endpoint non viene interrogato di nuovo");
		}
	}

	@Test
	@DisplayName("profili con lo stesso token endpoint e le stesse credenziali condividono il token")
	void profiliEquivalentiCondividonoIlToken() throws Exception {
		try(FakeTokenEndpoint endpoint = new FakeTokenEndpoint()) {
			ClientCredentialsTokenStore store = new ClientCredentialsTokenStore();

			// e' il caso di monitoraggio, statistiche e allarmi dello stesso ambiente
			List<ClientCredentialsConfig> equivalenti = List.of(
					new ClientCredentialsConfig("monitor", endpoint.url(), "govcat", "segreto", null, null, null, null),
					new ClientCredentialsConfig("statistiche", endpoint.url(), "govcat", "segreto", null, null, null, null),
					new ClientCredentialsConfig("allarmi", endpoint.url(), "govcat", "segreto", null, null, null, null));

			for(ClientCredentialsConfig config: equivalenti) {
				assertEquals("Bearer token-1", store.getAuthorizationHeader(config));
			}

			assertEquals(1, endpoint.getNumeroRichieste());
		}
	}

	@Test
	@DisplayName("la configurazione rifiuta parametri obbligatori mancanti e margini non validi")
	void configurazioneValidata() throws Exception {
		IOException senzaEndpoint = assertThrows(IOException.class, () -> new ClientCredentialsConfig(
				"p", null, "govcat", "segreto", null, null, null, null));
		assertTrue(senzaEndpoint.getMessage().contains("token-endpoint"), senzaEndpoint.getMessage());

		IOException senzaClientId = assertThrows(IOException.class, () -> new ClientCredentialsConfig(
				"p", "http://localhost/token", " ", "segreto", null, null, null, null));
		assertTrue(senzaClientId.getMessage().contains("client-id"), senzaClientId.getMessage());

		IOException margineNonValido = assertThrows(IOException.class, () -> new ClientCredentialsConfig(
				"p", "http://localhost/token", "govcat", "segreto", null, null, null, 1.5d));
		assertTrue(margineNonValido.getMessage().contains("refresh-margin"), margineNonValido.getMessage());
	}
}
