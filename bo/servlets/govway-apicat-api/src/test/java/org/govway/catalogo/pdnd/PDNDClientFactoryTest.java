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
package org.govway.catalogo.pdnd;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.govway.catalogo.pdnd.controllers.PDNDClientFactory;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneGenerale;
import org.govway.catalogo.servlets.model.PdndVersionEnum;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * Verifica la scelta della versione delle API PDND a partire dalla configurazione.
 */
class PDNDClientFactoryTest {

	@Test
	void senzaIndicazioneInConfigurazioneSiUsaLaV3() {
		PDNDClientFactory factory = factoryConVersione(null);

		assertEquals(PdndVersionEnum.V3, factory.getVersione());
		assertFalse(factory.isVersioneV1());
	}

	@Test
	void laVersioneIndicataInConfigurazionePrevaleSulDefault() {
		PDNDClientFactory factory = factoryConVersione(PdndVersionEnum.V1);

		assertEquals(PdndVersionEnum.V1, factory.getVersione());
		assertTrue(factory.isVersioneV1());
	}

	@Test
	void senzaSezioneGeneraleSiUsaIlDefault() {
		PDNDClientFactory factory = new PDNDClientFactory();
		ReflectionTestUtils.setField(factory, "configurazione", new Configurazione());

		assertEquals(PDNDClientFactory.VERSIONE_DEFAULT, factory.getVersione());
	}

	private PDNDClientFactory factoryConVersione(PdndVersionEnum versione) {
		ConfigurazioneGenerale generale = new ConfigurazioneGenerale();
		generale.setPdndVersion(versione);

		Configurazione configurazione = new Configurazione();
		configurazione.setGenerale(generale);

		PDNDClientFactory factory = new PDNDClientFactory();
		ReflectionTestUtils.setField(factory, "configurazione", configurazione);

		return factory;
	}
}
