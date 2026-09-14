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
import java.util.Properties;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import httpauth.ClientCredentialsTokenStore;
import httpauth.OutboundAuthMode;
import httpauth.OutboundAuthRegistry;

/**
 * Verifica che le properties dei profili arrivino integre al registry passando dal binding di
 * spring, compresi i nomi di profilo con il trattino.
 *
 * Riproduce i bean dichiarati in OpenAPI2SpringBoot: se il binding cambiasse la forma delle
 * chiavi, i profili risulterebbero non configurati soltanto a runtime.
 */
class OutboundAuthPropertiesBindingTest {

	@Configuration
	@EnableConfigurationProperties
	static class ConfigurazioneAuth {

		@Bean
		@ConfigurationProperties(prefix = "outbound.auth")
		Properties outboundAuthProperties() {
			return new Properties();
		}

		@Bean
		ClientCredentialsTokenStore clientCredentialsTokenStore() {
			return new ClientCredentialsTokenStore();
		}

		@Bean
		OutboundAuthRegistry outboundAuthRegistry() throws IOException {
			return new OutboundAuthRegistry(outboundAuthProperties(), "", clientCredentialsTokenStore());
		}
	}

	private final ApplicationContextRunner runner = new ApplicationContextRunner()
			.withUserConfiguration(ConfigurazioneAuth.class);

	@Test
	@DisplayName("i profili dichiarati nelle properties sono risolvibili per nome")
	void profiliBindati() {
		this.runner.withPropertyValues(
				"outbound.auth.govway-collaudo.token-endpoint=http://localhost:9999/token",
				"outbound.auth.govway-collaudo.client-id=govcat",
				"outbound.auth.govway-collaudo.client-secret=segreto",
				"outbound.auth.govway-collaudo.scope=monitoraggio",
				"outbound.auth.keycloak-produzione.token-endpoint=http://localhost:9998/token",
				"outbound.auth.keycloak-produzione.client-id=govcat-kc",
				"outbound.auth.keycloak-produzione.client-secret=segreto-kc",
				"outbound.auth.keycloak-produzione.client-auth=client_secret_post")
				.run(context -> {
					assertTrue(context.getStartupFailure() == null,
							() -> "avvio non riuscito: " + context.getStartupFailure());

					OutboundAuthRegistry registry = context.getBean(OutboundAuthRegistry.class);

					assertEquals(2, registry.getNomiProfili().size(), () -> "profili: " + registry.getNomiProfili());
					assertTrue(registry.getNomiProfili().contains("govway-collaudo"));
					assertTrue(registry.getNomiProfili().contains("keycloak-produzione"));

					assertEquals(OutboundAuthMode.OAUTH_CLIENT_CREDENTIALS,
							registry.resolve("govway-collaudo", "utente", "password").getMode());
					assertEquals(OutboundAuthMode.OAUTH_CLIENT_CREDENTIALS,
							registry.resolve("keycloak-produzione", null, null).getMode());
				});
	}

	@Test
	@DisplayName("senza profili configurati il contesto parte e le integrazioni restano sul basic")
	void nessunProfiloConfigurato() {
		this.runner.run(context -> {
			assertTrue(context.getStartupFailure() == null,
					() -> "avvio non riuscito: " + context.getStartupFailure());

			OutboundAuthRegistry registry = context.getBean(OutboundAuthRegistry.class);

			assertTrue(registry.getNomiProfili().isEmpty());
			assertEquals(OutboundAuthMode.BASIC, registry.resolve(null, "utente", "password").getMode());
		});
	}

	@Test
	@DisplayName("un profilo incompleto impedisce l'avvio del contesto")
	void profiloIncompletoImpedisceAvvio() {
		this.runner.withPropertyValues(
				"outbound.auth.govway-collaudo.token-endpoint=http://localhost:9999/token")
				.run(context -> assertTrue(context.getStartupFailure() != null,
						"un profilo senza client-id deve impedire l'avvio"));
	}
}
