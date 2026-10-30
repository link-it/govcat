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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.lang.reflect.Field;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import batch.SoggettoDTOFactory;

/**
 * Catena di risoluzione del profilo di interoperabilità GovWay usato dal batch: tipo gateway del
 * soggetto, profilo_govway dichiarato dai profili dell'adesione (Issue 354),
 * soggetto.profilo_gateway_default, monitoraggio.profilo_govway_default, infine ModI.
 */
class SoggettoDTOFactoryProfiloTest {

	private static final String CONFIG_COMPLETA = """
			{
			  "soggetto": { "profilo_gateway_default": "APIGateway" },
			  "monitoraggio": { "profilo_govway_default": "ModI" }
			}
			""";

	private static final String CONFIG_SOLO_MONITORAGGIO = """
			{
			  "monitoraggio": { "profilo_govway_default": "SPCoop" }
			}
			""";

	private static final String CONFIG_VUOTA = "{}";

	@TempDir
	Path tempDir;

	private SoggettoDTOFactory factory(String configurazione) throws Exception {
		Path file = tempDir.resolve("configurazione-" + UUID.randomUUID() + ".json");
		Files.writeString(file, configurazione);

		SoggettoDTOFactory factory = new SoggettoDTOFactory();
		Field f = SoggettoDTOFactory.class.getDeclaredField("configurazioneJsonPath");
		f.setAccessible(true);
		f.set(factory, file.toString());
		return factory;
	}

	private static SoggettoEntity soggetto(String tipoGateway) {
		SoggettoEntity soggetto = new SoggettoEntity();
		soggetto.setTipoGateway(tipoGateway);
		return soggetto;
	}

	@Test
	void tipoGatewayDelSoggettoVinceSuTutto() throws Exception {
		SoggettoDTOFactory factory = factory(CONFIG_COMPLETA);

		assertEquals("SPCoop", factory.getTipoGateway(soggetto("SPCoop"), "ModIPA"));
	}

	@Test
	void senzaTipoGatewayVinceIlProfiloDeiProfili() throws Exception {
		SoggettoDTOFactory factory = factory(CONFIG_COMPLETA);

		assertEquals("ModIPA", factory.getTipoGateway(soggetto(null), "ModIPA"));
	}

	@Test
	void senzaProfiloDeiProfiliSiUsaIlDefaultDelSoggetto() throws Exception {
		SoggettoDTOFactory factory = factory(CONFIG_COMPLETA);

		assertEquals("APIGateway", factory.getTipoGateway(soggetto(null), null));
	}

	@Test
	void senzaDefaultDelSoggettoSiUsaQuelloDelMonitoraggio() throws Exception {
		SoggettoDTOFactory factory = factory(CONFIG_SOLO_MONITORAGGIO);

		assertEquals("SPCoop", factory.getTipoGateway(soggetto(null), null));
	}

	@Test
	void senzaAlcunDefaultSiRicadeSuModI() throws Exception {
		SoggettoDTOFactory factory = factory(CONFIG_VUOTA);

		assertEquals("ModI", factory.getTipoGateway(soggetto(null), null));
	}

	@Test
	void soggettoNulloRestaNullo() throws Exception {
		SoggettoDTOFactory factory = factory(CONFIG_COMPLETA);

		assertNull(factory.getTipoGateway(null, "ModIPA"));
		assertNull(factory.getTipoGateway(null));
	}

	@Test
	void chiamataSenzaProfiloEquivaleAProfiloNullo() throws Exception {
		SoggettoDTOFactory factory = factory(CONFIG_COMPLETA);

		assertEquals("APIGateway", factory.getTipoGateway(soggetto(null)));
	}
}
