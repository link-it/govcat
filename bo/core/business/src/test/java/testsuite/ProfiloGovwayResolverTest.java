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
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

import org.govway.catalogo.core.business.utils.ProfiloGovwayResolver;
import org.govway.catalogo.core.business.utils.ProfiloGovwayResolver.LettoreProfiloGovway;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.AuthTypeEntity;
import org.junit.jupiter.api.Test;

/**
 * Logica di risoluzione del profilo di interoperabilità GovWay condivisa da batch e monitoraggio (Issue 440).
 */
class ProfiloGovwayResolverTest {

	private static final Supplier<String> NON_LETTO = () -> fail("default letto quando non necessario");

	private static final LettoreProfiloGovway<RuntimeException> LETTORE = Map.of(
			"INTERNO_HTTPS", "APIGateway",
			"MODI_P1", "ModIPA",
			"PDND", "ModI")::get;

	private static ApiEntity api(String... profili) {
		ApiEntity api = new ApiEntity();
		for (String profilo : profili) {
			AuthTypeEntity authType = new AuthTypeEntity();
			authType.setProfilo(profilo);
			api.getAuthType().add(authType);
		}
		return api;
	}

	@Test
	void tipoGatewayDelSoggettoVinceSuTutto() {
		assertEquals("SPCoop", ProfiloGovwayResolver.risolvi("SPCoop", "ModIPA", NON_LETTO, NON_LETTO));
	}

	@Test
	void senzaTipoGatewayVinceIlProfiloDeiProfili() {
		assertEquals("ModIPA", ProfiloGovwayResolver.risolvi(null, "ModIPA", NON_LETTO, NON_LETTO));
	}

	@Test
	void senzaProfiloDeiProfiliSiUsaIlDefaultDelSoggetto() {
		assertEquals("APIGateway", ProfiloGovwayResolver.risolvi(null, null, () -> "APIGateway", NON_LETTO));
	}

	@Test
	void senzaDefaultDelSoggettoSiUsaQuelloDelMonitoraggio() {
		assertEquals("SPCoop", ProfiloGovwayResolver.risolvi(null, null, () -> null, () -> "SPCoop"));
	}

	@Test
	void senzaAlcunDefaultSiRicadeSuModI() {
		assertEquals(ProfiloGovwayResolver.PROFILO_DEFAULT, ProfiloGovwayResolver.risolvi(null, null, () -> null, () -> null));
	}

	@Test
	void profiliConcordiDanoIlProfiloComune() {
		String profilo = ProfiloGovwayResolver.getProfiloGovwayProfili(
				List.of(api("INTERNO_HTTPS"), api("INTERNO_HTTPS", "NON_MAPPATO")), LETTORE, "del test");
		assertEquals("APIGateway", profilo);
	}

	@Test
	void modIeModIPASonoEquivalenti() {
		String profilo = ProfiloGovwayResolver.getProfiloGovwayProfili(
				List.of(api("MODI_P1"), api("PDND")), LETTORE, "del test");
		assertEquals("ModIPA", profilo);
	}

	@Test
	void profiliDiscordiNonSonoDeterminabili() {
		assertNull(ProfiloGovwayResolver.getProfiloGovwayProfili(
				List.of(api("INTERNO_HTTPS"), api("MODI_P1")), LETTORE, "del test"));
	}

	@Test
	void profiliSenzaProfiloGovwayNonSonoDeterminabili() {
		assertNull(ProfiloGovwayResolver.getProfiloGovwayProfili(List.of(api("NON_MAPPATO")), LETTORE, "del test"));
		assertNull(ProfiloGovwayResolver.getProfiloGovwayProfili(List.of(), LETTORE, "del test"));
	}

	@Test
	void equivalenza() {
		assertTrue(ProfiloGovwayResolver.isEquivalente("ModI", "ModIPA"));
		assertTrue(ProfiloGovwayResolver.isEquivalente("APIGateway", "APIGateway"));
		assertFalse(ProfiloGovwayResolver.isEquivalente("APIGateway", "ModIPA"));
	}
}
