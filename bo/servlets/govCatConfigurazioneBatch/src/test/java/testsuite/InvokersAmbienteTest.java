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

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.util.Map;

import org.govway.catalogo.core.dto.DTOAdesione.AmbienteEnum;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import config.GovwayConfigInvoker;
import configuratore.Invokers;
import freemarker.template.Configuration;
import keycloak.KeycloakInvoker;
import okhttp3.HttpUrl;

/**
 * Selezione dell'API di configurazione di govway in base all'ambiente dell'adesione: collaudo e
 * produzione sono installazioni distinte, configurate separatamente.
 */
class InvokersAmbienteTest {

	private static GovwayConfigInvoker invoker(String url) {
		return new GovwayConfigInvoker(HttpUrl.get(url), new Configuration(Configuration.VERSION_2_3_29));
	}

	private static final GovwayConfigInvoker COLLAUDO = invoker("http://govway-collaudo.example/govwayAPIConfig");
	private static final GovwayConfigInvoker PRODUZIONE = invoker("http://govway.example/govwayAPIConfig");

	private static Invokers invokers(Map<AmbienteEnum, GovwayConfigInvoker> config) {
		return new Invokers(Map.of(), config);
	}

	@Test
	@DisplayName("ogni ambiente ottiene l'installazione govway configurata per quell'ambiente")
	void govwayPerAmbiente() throws IOException {
		Invokers invokers = invokers(Map.of(
				AmbienteEnum.COLLAUDO, COLLAUDO,
				AmbienteEnum.PRODUZIONE, PRODUZIONE));

		assertSame(COLLAUDO, invokers.perAmbiente(AmbienteEnum.COLLAUDO).getConfigInvoker());
		assertSame(PRODUZIONE, invokers.perAmbiente(AmbienteEnum.PRODUZIONE).getConfigInvoker());
	}

	@Test
	@DisplayName("un ambiente privo di configurazione produce un errore esplicito")
	void ambienteNonConfigurato() {
		Invokers invokers = invokers(Map.of(AmbienteEnum.COLLAUDO, COLLAUDO));

		IOException e = assertThrows(IOException.class, () -> invokers.perAmbiente(AmbienteEnum.PRODUZIONE));

		assertTrue(e.getMessage().contains(AmbienteEnum.PRODUZIONE.toString()), e.getMessage());
		assertTrue(e.getMessage().contains("govway"), e.getMessage());
	}

	@Test
	@DisplayName("senza ambiente non e' possibile individuare l'installazione govway")
	void ambienteNonValorizzato() {
		Invokers invokers = invokers(Map.of(AmbienteEnum.COLLAUDO, COLLAUDO));

		assertThrows(IOException.class, () -> invokers.perAmbiente(null));
	}

	@Test
	@DisplayName("l'invoker non risolto per ambiente non e' utilizzabile")
	void invokerNonRisolto() {
		Invokers invokers = invokers(Map.of(AmbienteEnum.COLLAUDO, COLLAUDO));

		IllegalStateException e = assertThrows(IllegalStateException.class, invokers::getConfigInvoker);

		assertTrue(e.getMessage().contains("perAmbiente"), e.getMessage());
	}

	@Test
	@DisplayName("la vista risolta conserva gli invoker keycloak di tutti gli ambienti")
	void keycloakConservatoNellaVistaRisolta() throws IOException {
		KeycloakInvoker keycloakCollaudo = keycloak("http://sso-collaudo.example/auth");
		KeycloakInvoker keycloakProduzione = keycloak("http://sso.example/auth");

		Invokers invokers = new Invokers(
				Map.of(AmbienteEnum.COLLAUDO, keycloakCollaudo, AmbienteEnum.PRODUZIONE, keycloakProduzione),
				Map.of(AmbienteEnum.COLLAUDO, COLLAUDO, AmbienteEnum.PRODUZIONE, PRODUZIONE));

		Invokers risolti = invokers.perAmbiente(AmbienteEnum.COLLAUDO);

		assertSame(COLLAUDO, risolti.getConfigInvoker());

		// keycloak resta selezionabile per ambiente anche sulla vista risolta: gli scenari lo
		// richiedono passando esplicitamente l'ambiente
		assertSame(keycloakCollaudo, risolti.getKeycloak(AmbienteEnum.COLLAUDO));
		assertSame(keycloakProduzione, risolti.getKeycloak(AmbienteEnum.PRODUZIONE));
	}

	private static KeycloakInvoker keycloak(String url) throws IOException {
		return new KeycloakInvoker(HttpUrl.get(url), "admin", "admin", "master",
				new Configuration(Configuration.VERSION_2_3_29));
	}
}
