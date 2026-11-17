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
package org.govway.catalogo.monitoraggioutils.transazioni;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.function.Supplier;

import org.govway.catalogo.core.services.ApiService;
import org.govway.catalogo.gest.clients.govwaymonitor.model.DetailTransazione;
import org.govway.catalogo.gest.clients.govwaymonitor.model.ProfiloEnum;
import org.govway.catalogo.gest.clients.govwaymonitor.model.TransazioneContestoEnum;
import org.govway.catalogo.gest.clients.govwaymonitor.model.TransazioneExtDettaglioRichiesta;
import org.govway.catalogo.gest.clients.govwaymonitor.model.TransazioneExtDettaglioRisposta;
import org.govway.catalogo.gest.clients.govwaymonitor.model.TransazioneExtInformazioniApi;
import org.govway.catalogo.gest.clients.govwaymonitor.model.TransazioneRuoloEnum;
import org.govway.catalogo.servlets.monitor.model.AmbienteEnum;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Conversione del dettaglio di una transazione nella riga del CSV esportato dopo la ricerca per identificativo
 * (GET .../diagnostica/lista-transazioni-id).
 */
@ExtendWith(MockitoExtension.class)
class TransazioneBuilderTest {

	@Mock
	private ApiService apiService;

	@InjectMocks
	private TransazioneBuilder builder;

	@BeforeEach
	void setUp() {
		// API senza configurazione di ambiente su GovCat: trattata come REST
		when(this.apiService.runTransaction(any(Supplier.class))).thenReturn(null);
	}

	@Test
	void dettaglioSenzaTag() {
		Transazione transazione = this.builder.toTransazione(dettaglio(null), AmbienteEnum.COLLAUDO);

		assertNull(transazione.getTags());
		assertEquals("API_MON v1", transazione.getApi());
		assertEquals("Rest", transazione.getTipoAPI());
		assertEquals("GET", transazione.getMetodoHTTP());
		assertEquals("/risorsa", transazione.getAzione());
		assertEquals("mon_soggetto", transazione.getSoggettoErogatore());
	}

	@Test
	void dettaglioConTag() {
		Transazione transazione = this.builder.toTransazione(dettaglio(List.of("tag1", "tag2")), AmbienteEnum.COLLAUDO);

		assertEquals("tag1,tag2", transazione.getTags());
	}

	private static DetailTransazione dettaglio(List<String> tags) {
		OffsetDateTime ricezione = OffsetDateTime.parse("2026-11-17T10:00:00Z");

		TransazioneExtDettaglioRichiesta richiesta = new TransazioneExtDettaglioRichiesta();
		richiesta.setDataRicezione(ricezione);
		richiesta.setDataConsegna(ricezione.plusNanos(10_000_000));

		TransazioneExtDettaglioRisposta risposta = new TransazioneExtDettaglioRisposta();
		risposta.setDataRicezione(ricezione.plusNanos(90_000_000));
		risposta.setDataConsegna(ricezione.plusNanos(100_000_000));

		TransazioneExtInformazioniApi api = new TransazioneExtInformazioniApi();
		api.setNome("API_MON");
		api.setVersione(1);
		api.setErogatore("mon_soggetto");
		api.setOperazione("GET_/risorsa");
		api.setTags(tags);

		DetailTransazione dettaglio = new DetailTransazione();
		dettaglio.setIdTraccia(UUID.randomUUID());
		dettaglio.setProfilo(ProfiloEnum.API_GATEWAY);
		dettaglio.setContesto(TransazioneContestoEnum.STANDARD);
		dettaglio.setRuolo(TransazioneRuoloEnum.EROGAZIONE);
		dettaglio.setRichiesta(richiesta);
		dettaglio.setRisposta(risposta);
		dettaglio.setApi(api);
		return dettaglio;
	}
}
