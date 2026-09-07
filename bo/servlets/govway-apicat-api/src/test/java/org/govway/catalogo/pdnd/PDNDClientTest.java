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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

import java.util.UUID;

import org.govway.catalogo.exception.NotImplementedException;
import org.govway.catalogo.pdnd.controllers.PDNDClient;
import org.govway.catalogo.servlets.pdnd.client.api.GatewayApi;
import org.govway.catalogo.servlets.pdnd.client.api.HealthApi;
import org.junit.jupiter.api.Test;

/**
 * Verifica il comportamento dell'implementazione basata sull'API PDND v1 per le operazioni
 * di approvazione, che la v1 non prevede.
 */
class PDNDClientTest {

	private static final UUID ID = UUID.fromString("55555555-5555-5555-5555-555555555555");

	@Test
	void leApprovazioniNonSonoSupportateDallaV1() {
		PDNDClient client = new PDNDClient(mock(GatewayApi.class), mock(HealthApi.class));

		NotImplementedException agreement = assertThrows(NotImplementedException.class,
				() -> client.approveAgreement(ID));
		assertEquals("SYS.501", agreement.getMessage());

		NotImplementedException purpose = assertThrows(NotImplementedException.class,
				() -> client.approvePurpose(ID));
		assertEquals("SYS.501", purpose.getMessage());
	}
}
