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
package org.govway.catalogo.services;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.util.Map;
import java.util.Properties;

import org.govway.catalogo.core.orm.entity.AmbienteEnum;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * Keycloak e' configurato per ambiente: solo gli ambienti con url valorizzato vengono
 * inizializzati, per gli altri la lettura del secret termina con errore esplicito.
 */
class KeycloakClientSecretServiceTest {

	private KeycloakClientSecretService service(String urlCollaudo, String urlProduzione) throws IOException {
		KeycloakClientSecretService service = new KeycloakClientSecretService();

		ReflectionTestUtils.setField(service, "keycloakCollaudoUrl", urlCollaudo);
		ReflectionTestUtils.setField(service, "keycloakCollaudoUsername", "admin");
		ReflectionTestUtils.setField(service, "keycloakCollaudoPassword", "admin");
		ReflectionTestUtils.setField(service, "keycloakCollaudoRealm", "master");
		ReflectionTestUtils.setField(service, "keycloakProduzioneUrl", urlProduzione);
		ReflectionTestUtils.setField(service, "keycloakProduzioneUsername", "admin");
		ReflectionTestUtils.setField(service, "keycloakProduzionePassword", "admin");
		ReflectionTestUtils.setField(service, "keycloakProduzioneRealm", "master");
		ReflectionTestUtils.setField(service, "keycloakCollaudoProperties", new Properties());
		ReflectionTestUtils.setField(service, "keycloakProduzioneProperties", new Properties());

		service.init();

		return service;
	}

	@SuppressWarnings("unchecked")
	private Map<AmbienteEnum, ?> invokers(KeycloakClientSecretService service) {
		return (Map<AmbienteEnum, ?>) ReflectionTestUtils.getField(service, "keycloakInvokers");
	}

	@Test
	@DisplayName("Con entrambi gli ambienti configurati vengono create due istanze distinte")
	void testIstanzePerAmbiente() throws IOException {
		KeycloakClientSecretService service = this.service("http://collaudo.example:9083/auth",
				"http://produzione.example:9083/auth");

		Map<AmbienteEnum, ?> invokers = this.invokers(service);

		assertTrue(invokers.containsKey(AmbienteEnum.COLLAUDO));
		assertTrue(invokers.containsKey(AmbienteEnum.PRODUZIONE));
		assertFalse(invokers.get(AmbienteEnum.COLLAUDO) == invokers.get(AmbienteEnum.PRODUZIONE));
	}

	@Test
	@DisplayName("Un ambiente privo di url non viene configurato e il secret non e' leggibile")
	void testAmbienteNonConfigurato() throws IOException {
		KeycloakClientSecretService service = this.service("http://collaudo.example:9083/auth", null);

		assertFalse(this.invokers(service).containsKey(AmbienteEnum.PRODUZIONE));

		IOException e = assertThrows(IOException.class,
				() -> service.getSecret("client-di-test", AmbienteEnum.PRODUZIONE));
		assertTrue(e.getMessage().contains(AmbienteEnum.PRODUZIONE.toString()));
	}

	@Test
	@DisplayName("Senza ambiente non e' possibile individuare l'istanza di keycloak")
	void testAmbienteNonValorizzato() throws IOException {
		KeycloakClientSecretService service = this.service("http://collaudo.example:9083/auth",
				"http://produzione.example:9083/auth");

		assertThrows(IOException.class, () -> service.getSecret("client-di-test", null));
	}
}
