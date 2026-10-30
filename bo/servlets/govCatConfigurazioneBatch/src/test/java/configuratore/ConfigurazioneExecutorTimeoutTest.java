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
package configuratore;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.Properties;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Lettura dei timeout dalle properties: una property assente o scritta male mantiene il default,
 * perche' non deve impedire al batch di configurare le adesioni.
 */
class ConfigurazioneExecutorTimeoutTest {

	private static final String CHIAVE = "configuratore.ConfigurazioneExecutor.govwayConfig.collaudo.timeout.read";
	private static final int DEFAULT = 60;

	private static Properties properties(String valore) {
		Properties properties = new Properties();
		if (valore != null)
			properties.setProperty(CHIAVE, valore);
		return properties;
	}

	@Test
	@DisplayName("la property assente mantiene il default")
	void propertyAssente() {
		assertEquals(DEFAULT, ConfigurazioneExecutor.getTimeoutSecondi(properties(null), CHIAVE, DEFAULT));
	}

	@Test
	@DisplayName("la property valorizzata sostituisce il default")
	void propertyValorizzata() {
		assertEquals(120, ConfigurazioneExecutor.getTimeoutSecondi(properties("120"), CHIAVE, DEFAULT));
	}

	@Test
	@DisplayName("gli spazi attorno al valore non lo invalidano")
	void valoreConSpazi() {
		assertEquals(90, ConfigurazioneExecutor.getTimeoutSecondi(properties("  90  "), CHIAVE, DEFAULT));
	}

	@Test
	@DisplayName("il valore vuoto mantiene il default")
	void valoreVuoto() {
		assertEquals(DEFAULT, ConfigurazioneExecutor.getTimeoutSecondi(properties("   "), CHIAVE, DEFAULT));
	}

	@Test
	@DisplayName("il valore non numerico mantiene il default")
	void valoreNonNumerico() {
		assertEquals(DEFAULT, ConfigurazioneExecutor.getTimeoutSecondi(properties("60s"), CHIAVE, DEFAULT));
	}

	@Test
	@DisplayName("un timeout nullo o negativo mantiene il default, non disattiva l'attesa")
	void valoreNonPositivo() {
		assertEquals(DEFAULT, ConfigurazioneExecutor.getTimeoutSecondi(properties("0"), CHIAVE, DEFAULT));
		assertEquals(DEFAULT, ConfigurazioneExecutor.getTimeoutSecondi(properties("-1"), CHIAVE, DEFAULT));
	}
}
