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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.util.Properties;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import httpauth.ClientCredentialsTokenStore;
import httpauth.OutboundAuthMode;
import httpauth.OutboundAuthRegistry;
import httpauth.OutboundAuthentication;

/**
 * Verifica la lettura dei profili dalle properties e la risoluzione dei riferimenti, con
 * attenzione al comportamento invariato delle integrazioni che non referenziano un profilo.
 */
class OutboundAuthRegistryTest {

	private static final String PREFIX = "outbound.auth.";

	private static Properties profiloCompleto(String nome) {
		Properties properties = new Properties();
		properties.setProperty(PREFIX + nome + ".token-endpoint", "http://localhost:9999/token");
		properties.setProperty(PREFIX + nome + ".client-id", "govcat");
		properties.setProperty(PREFIX + nome + ".client-secret", "segreto");
		return properties;
	}

	private static OutboundAuthRegistry registry(Properties properties) throws IOException {
		return new OutboundAuthRegistry(properties, PREFIX, new ClientCredentialsTokenStore());
	}

	@Test
	@DisplayName("il riferimento a un profilo restituisce il client credentials")
	void profiloRisolto() throws Exception {
		OutboundAuthRegistry registry = registry(profiloCompleto("govway-collaudo"));

		OutboundAuthentication autenticazione = registry.resolve("govway-collaudo", "utente", "password");

		assertEquals(OutboundAuthMode.OAUTH_CLIENT_CREDENTIALS, autenticazione.getMode());
		assertTrue(autenticazione.getBasicUsername().isEmpty());
		assertTrue(autenticazione.interceptor().isPresent());
	}

	@Test
	@DisplayName("senza riferimento restano le credenziali basic dell'integrazione")
	void senzaRiferimentoRestaBasic() throws Exception {
		OutboundAuthRegistry registry = registry(profiloCompleto("govway-collaudo"));

		for(String ref: new String[] {null, "", "   "}) {
			OutboundAuthentication autenticazione = registry.resolve(ref, "utente", "password");

			assertEquals(OutboundAuthMode.BASIC, autenticazione.getMode());
			assertEquals("utente", autenticazione.getBasicUsername().orElseThrow());
			assertEquals("password", autenticazione.getBasicPassword().orElseThrow());
		}
	}

	@Test
	@DisplayName("senza riferimento e senza credenziali non si applica alcuna autenticazione")
	void senzaRiferimentoNeCredenziali() throws Exception {
		OutboundAuthRegistry registry = registry(new Properties());

		assertEquals(OutboundAuthMode.NONE, registry.resolve(null, null, null).getMode());
		assertEquals(OutboundAuthMode.NONE, registry.resolve(null, "utente", "").getMode());
		assertTrue(registry.resolve(null, null, null).getAuthorizationHeader().isEmpty());
	}

	@Test
	@DisplayName("un riferimento a un profilo inesistente e' un errore di configurazione")
	void riferimentoInesistente() throws Exception {
		OutboundAuthRegistry registry = registry(profiloCompleto("govway-collaudo"));

		IOException e = assertThrows(IOException.class,
				() -> registry.resolve("govway-produzione", "utente", "password"));

		assertTrue(e.getMessage().contains("govway-produzione"), e.getMessage());
		assertTrue(e.getMessage().contains("govway-collaudo"), "il messaggio elenca i profili disponibili");
	}

	@Test
	@DisplayName("un profilo disattivato con mode=none riporta alle credenziali basic")
	void profiloDisattivato() throws Exception {
		Properties properties = profiloCompleto("govway-collaudo");
		properties.setProperty(PREFIX + "govway-collaudo.mode", "none");

		OutboundAuthentication autenticazione = registry(properties).resolve("govway-collaudo", "utente", "password");

		assertEquals(OutboundAuthMode.BASIC, autenticazione.getMode());
		assertEquals("utente", autenticazione.getBasicUsername().orElseThrow());
	}

	@Test
	@DisplayName("le chiavi si possono scrivere con trattini, underscore o camel case")
	void chiaviEquivalenti() throws Exception {
		Properties properties = new Properties();
		properties.setProperty(PREFIX + "p.token_endpoint", "http://localhost:9999/token");
		properties.setProperty(PREFIX + "p.clientId", "govcat");
		properties.setProperty(PREFIX + "p.CLIENT-SECRET", "segreto");
		properties.setProperty(PREFIX + "p.client-auth", "client_secret_post");

		OutboundAuthentication autenticazione = registry(properties).resolve("p", null, null);

		assertEquals(OutboundAuthMode.OAUTH_CLIENT_CREDENTIALS, autenticazione.getMode());
	}

	@Test
	@DisplayName("un profilo incompleto impedisce la costruzione del registry")
	void profiloIncompleto() {
		Properties properties = new Properties();
		properties.setProperty(PREFIX + "p.token-endpoint", "http://localhost:9999/token");

		IOException e = assertThrows(IOException.class, () -> registry(properties));

		assertTrue(e.getMessage().contains("client-id"), e.getMessage());
		assertTrue(e.getMessage().contains("'p'"), e.getMessage());
	}

	@Test
	@DisplayName("un valore non riconosciuto per mode o client-auth e' un errore")
	void valoriNonRiconosciuti() {
		Properties modeErrato = profiloCompleto("p");
		modeErrato.setProperty(PREFIX + "p.mode", "basic_auth");
		assertThrows(IOException.class, () -> registry(modeErrato));

		Properties clientAuthErrato = profiloCompleto("p");
		clientAuthErrato.setProperty(PREFIX + "p.client-auth", "private_key_jwt");
		assertThrows(IOException.class, () -> registry(clientAuthErrato));
	}

	@Test
	@DisplayName("le properties estranee al prefisso vengono ignorate")
	void propertiesEstraneeIgnorate() throws Exception {
		Properties properties = profiloCompleto("govway-collaudo");
		properties.setProperty("monitor.collaudo.uri", "http://localhost:8080/monitor");
		properties.setProperty(PREFIX + "senzachiave", "valore");

		OutboundAuthRegistry registry = registry(properties);

		assertEquals(1, registry.getNomiProfili().size());
		assertTrue(registry.getNomiProfili().contains("govway-collaudo"));
	}

	@Test
	@DisplayName("i profili si leggono anche da properties gia' limitate al prefisso")
	void prefissoVuoto() throws Exception {
		Properties properties = new Properties();
		properties.setProperty("govway.token-endpoint", "http://localhost:9999/token");
		properties.setProperty("govway.client-id", "govcat");
		properties.setProperty("govway.client-secret", "segreto");

		OutboundAuthRegistry registry = new OutboundAuthRegistry(properties, "", new ClientCredentialsTokenStore());

		assertEquals(OutboundAuthMode.OAUTH_CLIENT_CREDENTIALS, registry.resolve("govway", null, null).getMode());
	}
}
