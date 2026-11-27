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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.govway.catalogo.core.orm.entity.AmbienteEnum;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.pdnd.controllers.FinalitaRifiutataException;
import org.govway.catalogo.pdnd.controllers.IPDNDClient;
import org.govway.catalogo.pdnd.controllers.PDNDClientFactory;
import org.govway.catalogo.services.RateLimitingFinalitaService.FinalitaAdesione;
import org.govway.catalogo.services.RateLimitingFinalitaService.FinalitaPdnd;
import org.govway.catalogo.servlets.model.RateLimitingFinalitaErroreEnum;
import org.govway.catalogo.servlets.pdnd.model.Purpose;
import org.govway.catalogo.servlets.pdnd.model.PurposeState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * Lettura delle finalita` PDND senza quota concessa (Issue 486): motivo dedicato, quota assente e,
 * trattandosi di letture riuscite, memorizzazione nella cache, a differenza degli errori di
 * comunicazione.
 */
class RateLimitingFinalitaServiceTest {

	private static final UUID PURPOSE_ID = UUID.fromString("36666666-6666-6666-6666-666666666666");

	private IPDNDClient pdnd;
	private RateLimitingFinalitaService service;

	@BeforeEach
	void setUp() {
		this.pdnd = mock(IPDNDClient.class);
		PDNDClientFactory factory = mock(PDNDClientFactory.class);
		when(factory.getClientCollaudo()).thenReturn(this.pdnd);

		this.service = new RateLimitingFinalitaService();
		ReflectionTestUtils.setField(this.service, "pdndClientFactory", factory);
		ReflectionTestUtils.setField(this.service, "cacheEnabled", true);
		ReflectionTestUtils.setField(this.service, "cacheTtl", 300L);
		ReflectionTestUtils.setField(this.service, "cacheMaxElements", 10);
		this.service.initCache();
	}

	private FinalitaPdnd leggi() {
		return this.service.leggiFinalita(AmbienteEnum.COLLAUDO, List.of(),
				List.of(new FinalitaAdesione(null, PURPOSE_ID.toString(), 100L))).get(PURPOSE_ID.toString()).pdnd();
	}

	private void simula(PurposeState stato, int quota) {
		Purpose purpose = new Purpose();
		purpose.setId(PURPOSE_ID);
		purpose.setTitle("Finalita`");
		purpose.setState(stato);
		purpose.setThroughput(quota);
		when(this.pdnd.getPurpose(PURPOSE_ID)).thenReturn(ResponseEntity.ok(purpose));
	}

	@Test
	void laFinalitaRifiutataHaUnMotivoDedicatoEFinisceInCache() {
		when(this.pdnd.getPurpose(PURPOSE_ID)).thenThrow(new FinalitaRifiutataException(PURPOSE_ID, "Finalita` rifiutata", "REJECTED"));

		FinalitaPdnd finalita = leggi();
		assertEquals(RateLimitingFinalitaErroreEnum.RIFIUTATA, finalita.errore());
		assertEquals("Finalita` rifiutata", finalita.titolo());
		assertEquals("REJECTED", finalita.stato());
		assertNull(finalita.quota());

		assertEquals(RateLimitingFinalitaErroreEnum.RIFIUTATA, leggi().errore());
		verify(this.pdnd, times(1)).getPurpose(PURPOSE_ID);
	}

	@Test
	void unErroreInternoDelClientNonFinisceInCache() {
		when(this.pdnd.getPurpose(PURPOSE_ID)).thenThrow(new InternalException(ErrorCode.INT_500_PDND, Map.of("dettagli", "test")));

		assertEquals(RateLimitingFinalitaErroreEnum.NON_DISPONIBILE, leggi().errore());
		assertEquals(RateLimitingFinalitaErroreEnum.NON_DISPONIBILE, leggi().errore());
		verify(this.pdnd, times(2)).getPurpose(PURPOSE_ID);
	}

	@Test
	void laFinalitaInAttesaSenzaVersioneAParteRiportaLaQuotaComeInAttesa() {
		// come la v1: la quota della finalita` in attesa e` quella della versione in attesa
		simula(PurposeState.WAITING_FOR_APPROVAL, 5000);

		FinalitaPdnd finalita = leggi();
		assertEquals(RateLimitingFinalitaErroreEnum.NON_APPROVATA, finalita.errore());
		assertEquals("WAITING_FOR_APPROVAL", finalita.stato());
		assertNull(finalita.quota());
		assertEquals(5000, finalita.quotaInAttesa());

		leggi();
		verify(this.pdnd, times(1)).getPurpose(PURPOSE_ID);
	}

	@Test
	void laFinalitaAttivaSiConfrontaConLaQuotaCorrente() {
		simula(PurposeState.ACTIVE, 1000);

		FinalitaPdnd finalita = leggi();
		assertNull(finalita.errore());
		assertEquals(1000, finalita.quota());
		assertNull(finalita.quotaInAttesa());
	}
}
