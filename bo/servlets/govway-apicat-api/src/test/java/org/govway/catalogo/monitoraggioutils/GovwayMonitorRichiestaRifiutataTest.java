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
package org.govway.catalogo.monitoraggioutils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

import org.govway.catalogo.core.orm.entity.ApiEntity.RUOLO;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.gest.clients.govwaymonitor.impl.ApiException;
import org.govway.catalogo.gest.clients.govwaymonitor.model.ProfiloEnum;
import org.govway.catalogo.monitor.controllers.StatisticheController.ErogazioneFruizioneEnum;
import org.govway.catalogo.monitor.controllers.StatisticheController.TipologiaReportEnum;
import org.govway.catalogo.monitoraggioutils.transazioni.ListTransazioniRequest;
import org.govway.catalogo.servlets.monitor.model.TipoInformazioneReportEnum;
import org.govway.catalogo.servlets.monitor.model.TipoReportAndamentoTemporaleEnum;
import org.govway.catalogo.servlets.monitor.model.UnitaTempoReportEnum;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;

import com.sun.net.httpserver.HttpServer;

/**
 * Issue 456: un 400 delle ricerche di monitoraggio di GovWay (per esempio soggetto inesistente per il
 * profilo usato) diventa MON.409.GOVWAY con soggetto, profilo e dettaglio; le altre risposte restano SYS.500.
 */
class GovwayMonitorRichiestaRifiutataTest {

	private static final String SOGGETTO_NON_ESISTE = """
			{
			  "type" : "https://httpstatuses.com/400",
			  "title" : "Bad Request",
			  "status" : 400,
			  "detail" : "Il soggetto 'RegionePuglia' indicato non esiste"
			}""";

	private HttpServer server;
	private int status;
	private String body;

	@BeforeEach
	void avviaServer() throws IOException {
		this.server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		this.server.createContext("/", exchange -> {
			byte[] risposta = this.body.getBytes(StandardCharsets.UTF_8);
			exchange.getResponseHeaders().add("Content-Type", "application/problem+json");
			exchange.sendResponseHeaders(this.status, risposta.length);
			try(OutputStream os = exchange.getResponseBody()) {
				os.write(risposta);
			}
		});
		this.server.start();
	}

	@AfterEach
	void fermaServer() {
		this.server.stop(0);
	}

	private void risposta(int status, String body) {
		this.status = status;
		this.body = body;
	}

	private ConfigurazioneConnessione connessione() {
		ConfigurazioneConnessione c = new ConfigurazioneConnessione();
		c.setUrl("http://127.0.0.1:" + this.server.getAddress().getPort());
		c.setUsername("operatore");
		c.setPassword("password");
		return c;
	}

	private ListTransazioniRequest richiestaTransazioni() {
		IdApi api = new IdApi();
		api.setNome("api-test");
		api.setVersione(1);
		api.setRuolo(RUOLO.EROGATO_SOGGETTO_DOMINIO);

		ListTransazioniRequest request = new ListTransazioniRequest();
		request.setConfigurazioneConnessione(connessione());
		request.setPageable(PageRequest.of(0, 25));
		request.setDataDa(OffsetDateTime.now().minusDays(1));
		request.setDataA(OffsetDateTime.now());
		request.setLstIdApi(List.of(api));
		request.setProfilo(ProfiloEnum.API_GATEWAY.getValue());
		request.setSoggettoReferente("RegionePuglia");
		return request;
	}

	private GetReportRequest richiestaReport() {
		GetReportRequest request = new GetReportRequest();
		request.setConfigurazioneConnessione(connessione());
		request.setTipologiaReportEnum(TipologiaReportEnum.ANDAMENTO_TEMPORALE);
		request.setErogazioneFruizioneEnum(ErogazioneFruizioneEnum.EROGAZIONE);
		request.setAccept("text/csv");
		request.setUnitaTempo(UnitaTempoReportEnum.GIORNALIERO);
		request.setTipoReportAndamentoTemporale(TipoReportAndamentoTemporaleEnum.LINE);
		request.setTipoInformazioneReport(TipoInformazioneReportEnum.NUMERO_TRANSAZIONI);
		request.setApiNome("api-test");
		request.setApiVersione(1);
		request.setProfilo(ProfiloEnum.API_GATEWAY);
		request.setSoggettoReferente("RegionePuglia");
		request.setSoggettoErogatore("RegionePuglia");
		return request;
	}

	private static void assertRifiutata(ConflictException e) {
		assertEquals("MON.409.GOVWAY", e.getMessage());
		assertEquals(Map.of(
				"soggetto", "RegionePuglia",
				"profilo", "APIGateway",
				"dettaglio", "Il soggetto 'RegionePuglia' indicato non esiste"), e.getParameters());
	}

	@Test
	void listTransazioni_400_conflittoConSoggettoProfiloDettaglio() {
		risposta(400, SOGGETTO_NON_ESISTE);
		GovwayMonitorMonitoraggioClient client = new GovwayMonitorMonitoraggioClient();

		assertRifiutata(assertThrows(ConflictException.class, () -> client.listTransazioni(richiestaTransazioni())));
	}

	@Test
	void listTransazioniRaw_400_conflitto() {
		risposta(400, SOGGETTO_NON_ESISTE);
		GovwayMonitorMonitoraggioClient client = new GovwayMonitorMonitoraggioClient();

		assertRifiutata(assertThrows(ConflictException.class, () -> client.listTransazioniRaw(richiestaTransazioni())));
	}

	@Test
	void listTransazioni_500_restaErroreInterno() {
		risposta(500, "{\"status\":500,\"detail\":\"errore\"}");
		GovwayMonitorMonitoraggioClient client = new GovwayMonitorMonitoraggioClient();

		InternalException e = assertThrows(InternalException.class, () -> client.listTransazioni(richiestaTransazioni()));
		assertEquals(ErrorCode.SYS_500, e.getErrorCode());
	}

	@Test
	void getReport_400_conflitto() {
		risposta(400, SOGGETTO_NON_ESISTE);
		GovwayMonitorStatisticheClient client = new GovwayMonitorStatisticheClient();

		assertRifiutata(assertThrows(ConflictException.class, () -> client.getReport(richiestaReport())));
	}

	@Test
	void postReport_400_conflitto() {
		risposta(400, SOGGETTO_NON_ESISTE);
		GovwayMonitorStatisticheClient client = new GovwayMonitorStatisticheClient();

		assertRifiutata(assertThrows(ConflictException.class, () -> client.postReport(richiestaReport())));
	}

	@Test
	void getReport_500_restaErroreInterno() {
		risposta(500, "{\"status\":500,\"detail\":\"errore\"}");
		GovwayMonitorStatisticheClient client = new GovwayMonitorStatisticheClient();

		InternalException e = assertThrows(InternalException.class, () -> client.getReport(richiestaReport()));
		assertEquals(ErrorCode.SYS_500, e.getErrorCode());
	}

	@Test
	void dettaglio_rispostaSenzaProblem_statusHttp() {
		assertEquals("HTTP 400", AbstractGovwayMonitorClient.getDettaglio(new ApiException(400, "Bad Request", null, "<html>errore</html>")));
		assertEquals("HTTP 400", AbstractGovwayMonitorClient.getDettaglio(new ApiException(400, "Bad Request", null, null)));
		assertEquals("HTTP 400", AbstractGovwayMonitorClient.getDettaglio(new ApiException(400, "Bad Request", null, "{\"status\":400}")));
	}
}
