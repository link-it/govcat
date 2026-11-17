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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.OrganizationContext;
import org.govway.catalogo.controllers.APIController;
import org.govway.catalogo.controllers.DominiController;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.controllers.ServiziController;
import org.govway.catalogo.controllers.SoggettiController;
import org.govway.catalogo.controllers.UtentiController;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.RuoloOrganizzazione;
import org.govway.catalogo.core.services.OrganizzazioneService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.monitor.controllers.StatisticheController;
import org.govway.catalogo.monitor.controllers.TransazioniController;
import org.govway.catalogo.monitoraggioutils.FiltriUtils;
import org.govway.catalogo.monitoraggioutils.GetReportRequest;
import org.govway.catalogo.monitoraggioutils.GetReportResponse;
import org.govway.catalogo.monitoraggioutils.IMonitoraggioClient;
import org.govway.catalogo.monitoraggioutils.IStatisticheClient;
import org.govway.catalogo.monitoraggioutils.IdApi;
import org.govway.catalogo.monitoraggioutils.PostReportResponse;
import org.govway.catalogo.monitoraggioutils.transazioni.GetTransazioneRequest;
import org.govway.catalogo.monitoraggioutils.transazioni.GetTransazioneResponse;
import org.govway.catalogo.monitoraggioutils.transazioni.ListTransazioniRawResponse;
import org.govway.catalogo.monitoraggioutils.transazioni.ListTransazioniRequest;
import org.govway.catalogo.monitoraggioutils.transazioni.ListTransazioniResponse;
import org.govway.catalogo.servlets.model.APICreate;
import org.govway.catalogo.servlets.model.APIDatiAmbienteCreate;
import org.govway.catalogo.servlets.model.APIDatiErogazione;
import org.govway.catalogo.servlets.model.AuthTypeApiResource;
import org.govway.catalogo.servlets.model.Dominio;
import org.govway.catalogo.servlets.model.DominioCreate;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.OrganizzazioneCreate;
import org.govway.catalogo.servlets.model.ProtocolloEnum;
import org.govway.catalogo.servlets.model.ReferenteCreate;
import org.govway.catalogo.servlets.model.RuoloAPIEnum;
import org.govway.catalogo.servlets.model.RuoloOrganizzazioneEnum;
import org.govway.catalogo.servlets.model.Servizio;
import org.govway.catalogo.servlets.model.ServizioCreate;
import org.govway.catalogo.servlets.model.Soggetto;
import org.govway.catalogo.servlets.model.SoggettoCreate;
import org.govway.catalogo.servlets.model.TipoReferenteEnum;
import org.govway.catalogo.servlets.model.UtenteCreate;
import org.govway.catalogo.servlets.monitor.model.AmbienteEnum;
import org.govway.catalogo.servlets.monitor.model.AndamentoTemporaleQuery;
import org.govway.catalogo.servlets.monitor.model.FiltroApi;
import org.govway.catalogo.servlets.monitor.model.IntervalloTemporale;
import org.govway.catalogo.servlets.monitor.model.ItemSoggetto;
import org.govway.catalogo.servlets.monitor.model.ListaTransazioniIdQuery;
import org.govway.catalogo.servlets.monitor.model.ListaTransazioniQuery;
import org.govway.catalogo.servlets.monitor.model.PagedModelItemTransazione;
import org.govway.catalogo.servlets.monitor.model.TipoIntervalloTemporaleEnum;
import org.govway.catalogo.servlets.monitor.model.Transazione;
import org.govway.catalogo.servlets.monitor.model.TransazioneApi;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/**
 * Autorizzazione delle API di monitoraggio (transazioni, dettaglio, ricerca per identificativo e statistiche)
 * in base ai ruoli dell'utente sul servizio (monitoraggio.ruoli_abilitati: gestore, referente_superiore, referente).
 * I client verso GovWay sono simulati: si verifica solo se la richiesta arriva al monitoraggio.
 */
@ExtendWith(SpringExtension.class)
@SpringBootTest(classes = OpenAPI2SpringBoot.class)
@EnableAutoConfiguration
@AutoConfigureTestDatabase(replace = Replace.ANY)
@ActiveProfiles("test")
@DirtiesContext(classMode = ClassMode.BEFORE_CLASS)
@TestInstance(TestInstance.Lifecycle.PER_METHOD)
@Transactional
public class MonitoraggioAutorizzazioniTest {

	private static final String UTENTE_GESTORE = "gestore";
	private static final String UTENTE_REFERENTE = "mon.referente";
	private static final String UTENTE_REFERENTE_TECNICO = "mon.referente.tecnico";
	private static final String UTENTE_OPERATORE_API = "mon.operatore.api";
	private static final String UTENTE_AMMINISTRATORE = "mon.amministratore";
	private static final String UTENTE_SENZA_RUOLO = "mon.senza.ruolo";

	private static final String SOGGETTO = "mon_soggetto";
	private static final String SOGGETTO_ALTRO = "mon_soggetto_altro";
	private static final String NOME_API = "API_MON";
	private static final int VERSIONE_API = 1;
	private static final String NOME_GATEWAY = "API_MON_GW";
	private static final int VERSIONE_GATEWAY = 7;

	private static final AmbienteEnum AMBIENTE = AmbienteEnum.COLLAUDO;

	@Mock
	private SecurityContext securityContext;

	@Mock
	private Authentication authentication;

	@MockitoBean
	private IMonitoraggioClient monitoraggioClient;

	@MockitoBean
	private IStatisticheClient statisticheClient;

	@Autowired
	private TransazioniController transazioniController;

	@Autowired
	private StatisticheController statisticheController;

	@Autowired
	private OrganizzazioniController organizzazioniController;

	@Autowired
	private SoggettiController soggettiController;

	@Autowired
	private DominiController dominiController;

	@Autowired
	private ServiziController serviziController;

	@Autowired
	private APIController apiController;

	@Autowired
	private UtentiController utentiController;

	@Autowired
	private UtenteService utenteService;

	@Autowired
	private OrganizzazioneService organizzazioneService;

	@Autowired
	private OrganizationContext organizationContext;

	@PersistenceContext
	private EntityManager entityManager;

	private Organizzazione organizzazione;
	private UUID idServizio;
	private UUID idServizioGateway;
	private UUID idServizioAltro;

	@BeforeEach
	public void setUp() {
		MockitoAnnotations.openMocks(this);
		when(this.securityContext.getAuthentication()).thenReturn(this.authentication);
		SecurityContextHolder.setContext(this.securityContext);
		autentica(UTENTE_GESTORE, null);

		this.organizzazione = creaOrganizzazione("mon_org", "mon_org_cod");
		UUID idSoggetto = creaSoggetto(SOGGETTO, this.organizzazione.getIdOrganizzazione());
		UUID idDominio = creaDominio("Interno", idSoggetto);

		creaUtente(UTENTE_REFERENTE, RuoloOrganizzazioneEnum.OPERATORE_API);
		creaUtente(UTENTE_REFERENTE_TECNICO, RuoloOrganizzazioneEnum.OPERATORE_API);
		creaUtente(UTENTE_OPERATORE_API, RuoloOrganizzazioneEnum.OPERATORE_API);
		creaUtente(UTENTE_AMMINISTRATORE, RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);
		UtenteCreate senzaRuolo = getUtenteCreate(UTENTE_SENZA_RUOLO);
		this.utentiController.createUtente(senzaRuolo);

		this.idServizio = creaServizio("mon_servizio", idDominio);
		creaApi(NOME_API, this.idServizio, null, null);

		// API con nome e versione diversi su GovWay
		this.idServizioGateway = creaServizio("mon_servizio_gw", idDominio);
		creaApi("API_MON_NOME_CATALOGO", this.idServizioGateway, NOME_GATEWAY, VERSIONE_GATEWAY);

		// Servizio con un'API omonima erogata da un altro soggetto, di cui gli utenti non sono referenti
		Organizzazione altra = creaOrganizzazione("mon_org_altra", "mon_org_altra_cod");
		UUID idSoggettoAltro = creaSoggetto(SOGGETTO_ALTRO, altra.getIdOrganizzazione());
		UUID idDominioAltro = creaDominio("Test", idSoggettoAltro);
		this.idServizioAltro = creaServizio("mon_servizio_altro", idDominioAltro, List.of());
		creaApi(NOME_API, this.idServizioAltro, null, null);

		this.entityManager.flush();
		this.entityManager.clear();

		ListTransazioniResponse lista = new ListTransazioniResponse();
		PagedModelItemTransazione pagedModel = new PagedModelItemTransazione();
		pagedModel.setContent(new ArrayList<>());
		lista.setPagedModel(pagedModel);
		when(this.monitoraggioClient.listTransazioni(any())).thenReturn(lista);

		ListTransazioniRawResponse raw = new ListTransazioniRawResponse();
		raw.setResource(new byte[0]);
		raw.setContentType("text/csv");
		when(this.monitoraggioClient.listTransazioniRaw(any())).thenReturn(raw);

		GetReportResponse report = new GetReportResponse();
		report.setResource(new byte[0]);
		report.setContentType("text/csv");
		when(this.statisticheClient.getReport(any())).thenReturn(report);
		when(this.statisticheClient.postReport(any())).thenReturn(new PostReportResponse());
	}

	@AfterEach
	public void tearDown() {
		SecurityContextHolder.clearContext();
		this.organizationContext.setIdOrganizzazione(null);
		this.organizationContext.setRuoloOrganizzazione(null);
		this.organizationContext.setInitialized(false);
	}

	// ==================== LISTA TRANSAZIONI ====================

	@Test
	public void testListaTransazioniConsentitaAiRuoliAbilitati() {
		for(Runnable autenticazione: utentiAbilitati()) {
			autenticazione.run();
			assertEquals(HttpStatus.OK, listaTransazioniErogazioni(this.idServizio, SOGGETTO).getStatusCode());
			assertEquals(HttpStatus.OK, listaTransazioniFruizioni(this.idServizio, SOGGETTO).getStatusCode());
			assertEquals(HttpStatus.OK, exportTransazioni(this.idServizio, SOGGETTO).getStatusCode());
		}
	}

	@Test
	public void testListaTransazioniNegataSenzaRuoloAbilitato() {
		for(Runnable autenticazione: utentiNonAbilitati()) {
			autenticazione.run();
			assertMon403(() -> listaTransazioniErogazioni(this.idServizio, SOGGETTO));
			assertMon403(() -> listaTransazioniFruizioni(this.idServizio, SOGGETTO));
			assertMon403(() -> exportTransazioni(this.idServizio, SOGGETTO));
		}
		verify(this.monitoraggioClient, never()).listTransazioni(any());
		verify(this.monitoraggioClient, never()).listTransazioniRaw(any());
	}

	@Test
	public void testListaTransazioniNegataSuServizioDiAltroSoggetto() {
		autentica(UTENTE_REFERENTE, RuoloOrganizzazione.OPERATORE_API);
		assertMon403(() -> listaTransazioniErogazioni(this.idServizioAltro, SOGGETTO_ALTRO));
	}

	@Test
	public void testListaTransazioniSoggettoDiversoDalServizio() {
		autentica(UTENTE_REFERENTE, RuoloOrganizzazione.OPERATORE_API);
		BadRequestException e = assertThrows(BadRequestException.class, () -> listaTransazioniErogazioni(this.idServizio, SOGGETTO_ALTRO));
		assertEquals("MON.400.SOGGETTO", e.getMessage());
		e = assertThrows(BadRequestException.class, () -> exportTransazioni(this.idServizio, SOGGETTO_ALTRO));
		assertEquals("MON.400.SOGGETTO", e.getMessage());

		// Vale anche per il gestore: il soggetto determina il traffico letto da GovWay
		autentica(UTENTE_GESTORE, null);
		e = assertThrows(BadRequestException.class, () -> listaTransazioniFruizioni(this.idServizio, SOGGETTO_ALTRO));
		assertEquals("MON.400.SOGGETTO", e.getMessage());
		verify(this.monitoraggioClient, never()).listTransazioni(any());
	}

	// ==================== RICERCA PER IDENTIFICATIVO ====================

	@Test
	public void testRicercaPerIdConsentitaAiRuoliAbilitati() {
		for(Runnable autenticazione: utentiAbilitati()) {
			autenticazione.run();
			assertEquals(HttpStatus.OK, ricercaPerId(this.idServizio).getStatusCode());
			assertEquals(HttpStatus.OK, this.transazioniController.ambienteDiagnosticaListaTransazioniIdGet(AMBIENTE, UUID.randomUUID(), this.idServizio).getStatusCode());
		}
	}

	@Test
	public void testRicercaPerIdNegataSenzaRuoloAbilitato() {
		for(Runnable autenticazione: utentiNonAbilitati()) {
			autenticazione.run();
			assertMon403(() -> ricercaPerId(this.idServizio));
			assertMon403(() -> this.transazioniController.ambienteDiagnosticaListaTransazioniIdGet(AMBIENTE, UUID.randomUUID(), this.idServizio));
		}
		verify(this.monitoraggioClient, never()).listTransazioni(any());
		verify(this.monitoraggioClient, never()).listTransazioniRaw(any());
	}

	/**
	 * Una transazione senza API non compare nella lista di alcun servizio: nella ricerca per identificativo
	 * la si restituisce solo al gestore.
	 */
	@Test
	public void testRicercaPerIdTransazioniSenzaApiSoloGestore() {
		ArgumentCaptor<ListTransazioniRequest> captor = ArgumentCaptor.forClass(ListTransazioniRequest.class);

		autentica(UTENTE_GESTORE, null);
		ricercaPerId(this.idServizio);
		autentica(UTENTE_REFERENTE, RuoloOrganizzazione.OPERATORE_API);
		ricercaPerId(this.idServizio);

		verify(this.monitoraggioClient, org.mockito.Mockito.times(2)).listTransazioni(captor.capture());
		assertTrue(captor.getAllValues().get(0).isTransazioniSenzaApi());
		assertFalse(captor.getAllValues().get(1).isTransazioniSenzaApi());
	}

	// ==================== DETTAGLIO TRANSAZIONE ====================

	@Test
	public void testDettaglioConsentitoAiRuoliAbilitati() {
		mockTransazione(NOME_API, VERSIONE_API, SOGGETTO);
		for(Runnable autenticazione: utentiAbilitati()) {
			autenticazione.run();
			assertEquals(HttpStatus.OK, dettaglio().getStatusCode());
		}
	}

	@Test
	public void testDettaglioNegatoSenzaRuoloAbilitato() {
		mockTransazione(NOME_API, VERSIONE_API, SOGGETTO);
		for(Runnable autenticazione: utentiNonAbilitati()) {
			autenticazione.run();
			assertMonTransazione403(this::dettaglio);
		}
	}

	/**
	 * La transazione e' identificata come in GovWay: nome e versione dell'API sul gateway.
	 */
	@Test
	public void testDettaglioApiConNomeGateway() {
		autentica(UTENTE_REFERENTE, RuoloOrganizzazione.OPERATORE_API);

		mockTransazione(NOME_GATEWAY, VERSIONE_GATEWAY, SOGGETTO);
		assertEquals(HttpStatus.OK, dettaglio().getStatusCode());

		// nome dell'API nel catalogo diverso da quello su GovWay: la transazione non e' dell'API
		mockTransazione("API_MON_NOME_CATALOGO", VERSIONE_API, SOGGETTO);
		assertMonTransazione403(this::dettaglio);
	}

	/**
	 * Un'API omonima erogata da un altro soggetto appartiene a un altro servizio.
	 */
	@Test
	public void testDettaglioApiOmonimaDiAltroSoggettoNegato() {
		mockTransazione(NOME_API, VERSIONE_API, SOGGETTO_ALTRO);

		autentica(UTENTE_REFERENTE, RuoloOrganizzazione.OPERATORE_API);
		assertMonTransazione403(this::dettaglio);

		autentica(UTENTE_GESTORE, null);
		assertEquals(HttpStatus.OK, dettaglio().getStatusCode());
	}

	@Test
	public void testDettaglioVersioneDiversaNegato() {
		mockTransazione(NOME_API, VERSIONE_API + 1, SOGGETTO);
		autentica(UTENTE_REFERENTE, RuoloOrganizzazione.OPERATORE_API);
		assertMonTransazione403(this::dettaglio);
	}

	@Test
	public void testDettaglioSenzaApiSoloGestore() {
		Transazione transazione = new Transazione();
		GetTransazioneResponse response = new GetTransazioneResponse();
		response.setTransazione(transazione);
		when(this.monitoraggioClient.getTransazione(any(GetTransazioneRequest.class))).thenReturn(response);

		autentica(UTENTE_GESTORE, null);
		assertEquals(HttpStatus.OK, dettaglio().getStatusCode());

		autentica(UTENTE_REFERENTE, RuoloOrganizzazione.OPERATORE_API);
		assertMonTransazione403(this::dettaglio);
	}

	// ==================== STATISTICHE ====================

	@Test
	public void testStatisticheConsentiteAiRuoliAbilitati() {
		for(Runnable autenticazione: utentiAbilitati()) {
			autenticazione.run();
			assertEquals(HttpStatus.OK, reportPost(this.idServizio, SOGGETTO).getStatusCode());
			assertEquals(HttpStatus.OK, reportGetErogazioni(this.idServizio, SOGGETTO).getStatusCode());
			assertEquals(HttpStatus.OK, reportGetFruizioni(this.idServizio, SOGGETTO).getStatusCode());
		}
	}

	@Test
	public void testStatisticheNegateSenzaRuoloAbilitato() {
		for(Runnable autenticazione: utentiNonAbilitati()) {
			autenticazione.run();
			assertMon403(() -> reportPost(this.idServizio, SOGGETTO));
			assertMon403(() -> reportGetErogazioni(this.idServizio, SOGGETTO));
			assertMon403(() -> reportGetFruizioni(this.idServizio, SOGGETTO));
		}
		verify(this.statisticheClient, never()).getReport(any(GetReportRequest.class));
		verify(this.statisticheClient, never()).postReport(any(GetReportRequest.class));
	}

	@Test
	public void testStatisticheSoggettoDiversoDalServizio() {
		autentica(UTENTE_REFERENTE, RuoloOrganizzazione.OPERATORE_API);
		BadRequestException e = assertThrows(BadRequestException.class, () -> reportPost(this.idServizio, SOGGETTO_ALTRO));
		assertEquals("MON.400.SOGGETTO", e.getMessage());
		e = assertThrows(BadRequestException.class, () -> reportGetErogazioni(this.idServizio, SOGGETTO_ALTRO));
		assertEquals("MON.400.SOGGETTO", e.getMessage());
	}

	// ==================== CONFRONTO TRANSAZIONE / API MONITORATE ====================

	@Test
	public void testIsTransazioneApi() {
		IdApi idApi = new IdApi();
		idApi.setNome(NOME_API);
		idApi.setVersione(VERSIONE_API);
		idApi.setSoggetto(SOGGETTO);
		List<IdApi> lst = List.of(idApi);

		assertTrue(FiltriUtils.isTransazioneApi(lst, NOME_API, VERSIONE_API, SOGGETTO));
		assertFalse(FiltriUtils.isTransazioneApi(lst, NOME_API, VERSIONE_API, SOGGETTO_ALTRO));
		assertFalse(FiltriUtils.isTransazioneApi(lst, NOME_API, VERSIONE_API + 1, SOGGETTO));
		assertFalse(FiltriUtils.isTransazioneApi(lst, "altra", VERSIONE_API, SOGGETTO));
		assertFalse(FiltriUtils.isTransazioneApi(lst, null, null, null));
	}

	// ==================== UTILITY ====================

	/** Gestore, referente e referente tecnico del servizio, amministratore dell'organizzazione. */
	private List<Runnable> utentiAbilitati() {
		return List.of(
				() -> autentica(UTENTE_GESTORE, null),
				() -> autentica(UTENTE_REFERENTE, RuoloOrganizzazione.OPERATORE_API),
				() -> autentica(UTENTE_REFERENTE_TECNICO, RuoloOrganizzazione.OPERATORE_API),
				() -> autentica(UTENTE_AMMINISTRATORE, RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE));
	}

	/**
	 * Operatore API dell'organizzazione non referente (il ruolo referente ricavato dall'organizzazione non basta),
	 * lo stesso operatore senza contesto di organizzazione, utente senza ruoli.
	 */
	private List<Runnable> utentiNonAbilitati() {
		return List.of(
				() -> autentica(UTENTE_OPERATORE_API, RuoloOrganizzazione.OPERATORE_API),
				() -> autentica(UTENTE_OPERATORE_API, null),
				() -> autentica(UTENTE_SENZA_RUOLO, null));
	}

	private void assertMon403(Runnable invocazione) {
		NotAuthorizedException e = assertThrows(NotAuthorizedException.class, invocazione::run);
		assertEquals("MON.403", e.getMessage());
	}

	private void assertMonTransazione403(Runnable invocazione) {
		NotAuthorizedException e = assertThrows(NotAuthorizedException.class, invocazione::run);
		assertEquals("MON.403.TRANSAZIONE", e.getMessage());
	}

	private org.springframework.http.ResponseEntity<PagedModelItemTransazione> listaTransazioniErogazioni(UUID idServizio, String soggetto) {
		return this.transazioniController.ambienteErogazioniSoggettoDiagnosticaListaTransazioniPost(AMBIENTE, soggetto, 0, 10, null, false, getListaTransazioniQuery(idServizio));
	}

	private org.springframework.http.ResponseEntity<PagedModelItemTransazione> listaTransazioniFruizioni(UUID idServizio, String soggetto) {
		return this.transazioniController.ambienteFruizioniSoggettoDiagnosticaListaTransazioniPost(AMBIENTE, soggetto, 0, 10, null, false, getListaTransazioniQuery(idServizio));
	}

	private org.springframework.http.ResponseEntity<?> exportTransazioni(UUID idServizio, String soggetto) {
		return this.transazioniController.ambienteErogazioniSoggettoDiagnosticaListaTransazioniGet(AMBIENTE, soggetto, idServizio,
				OffsetDateTime.now().minusDays(1), OffsetDateTime.now(), null, null, null, null, null, 0, 10, null);
	}

	private org.springframework.http.ResponseEntity<PagedModelItemTransazione> ricercaPerId(UUID idServizio) {
		ListaTransazioniIdQuery query = new ListaTransazioniIdQuery();
		query.setIdTransazione(UUID.randomUUID());
		query.setIdServizio(idServizio);
		return this.transazioniController.ambienteDiagnosticaListaTransazioniIdPost(AMBIENTE, false, query);
	}

	private org.springframework.http.ResponseEntity<Transazione> dettaglio() {
		return this.transazioniController.ambienteDiagnosticaIdTransazioneGet(AMBIENTE, UUID.randomUUID(), false);
	}

	private org.springframework.http.ResponseEntity<?> reportPost(UUID idServizio, String soggetto) {
		AndamentoTemporaleQuery query = new AndamentoTemporaleQuery();
		query.setApi(getFiltroApi(idServizio));
		query.setIntervalloTemporale(getIntervalloTemporale());
		return this.statisticheController.ambienteErogazioniSoggettoReportAndamentoTemporalePost(AMBIENTE, soggetto, query);
	}

	private org.springframework.http.ResponseEntity<?> reportGetErogazioni(UUID idServizio, String soggetto) {
		return this.statisticheController.ambienteErogazioniSoggettoReportDistribuzioneApiGet(AMBIENTE, soggetto, idServizio,
				OffsetDateTime.now().minusDays(1), OffsetDateTime.now(), null, null, null, null, null, null, null,
				TipoIntervalloTemporaleEnum.PERSONALIZZATO, null, null, null);
	}

	private org.springframework.http.ResponseEntity<?> reportGetFruizioni(UUID idServizio, String soggetto) {
		return this.statisticheController.ambienteFruizioniSoggettoReportAndamentoTemporaleGet(AMBIENTE, soggetto, idServizio,
				OffsetDateTime.now().minusDays(1), OffsetDateTime.now(), null, null, null, null, null, null, null,
				TipoIntervalloTemporaleEnum.PERSONALIZZATO, null, null, null);
	}

	private ListaTransazioniQuery getListaTransazioniQuery(UUID idServizio) {
		ListaTransazioniQuery query = new ListaTransazioniQuery();
		query.setApi(getFiltroApi(idServizio));
		query.setIntervalloTemporale(getIntervalloTemporale());
		return query;
	}

	private FiltroApi getFiltroApi(UUID idServizio) {
		FiltroApi filtroApi = new FiltroApi();
		filtroApi.setIdServizio(idServizio);
		return filtroApi;
	}

	private IntervalloTemporale getIntervalloTemporale() {
		IntervalloTemporale it = new IntervalloTemporale();
		it.setTipoIntervalloTemporale(TipoIntervalloTemporaleEnum.PERSONALIZZATO);
		it.setDataInizio(OffsetDateTime.now().minusDays(1));
		it.setDataFine(OffsetDateTime.now());
		return it;
	}

	private void mockTransazione(String nome, Integer versione, String erogatore) {
		ItemSoggetto soggetto = new ItemSoggetto();
		soggetto.setNome(erogatore);
		TransazioneApi api = new TransazioneApi();
		api.setNome(nome);
		api.setVersione(versione);
		api.setErogatore(soggetto);
		Transazione transazione = new Transazione();
		transazione.setApi(api);
		GetTransazioneResponse response = new GetTransazioneResponse();
		response.setTransazione(transazione);
		when(this.monitoraggioClient.getTransazione(any(GetTransazioneRequest.class))).thenReturn(response);
	}

	/**
	 * Autentica l'utente e simula il contesto di organizzazione della sessione (organizzazione del servizio).
	 */
	private void autentica(String principal, RuoloOrganizzazione ruoloOrganizzazione) {
		InfoProfilo info = CommonUtils.getInfoProfilo(principal, this.utenteService);
		when(this.authentication.getPrincipal()).thenReturn(info);
		if(ruoloOrganizzazione != null) {
			OrganizzazioneEntity org = this.organizzazioneService.find(this.organizzazione.getIdOrganizzazione()).get();
			this.organizationContext.setIdOrganizzazione(org.getId());
			this.organizationContext.setRuoloOrganizzazione(ruoloOrganizzazione);
			this.organizationContext.setInitialized(true);
		} else {
			this.organizationContext.setIdOrganizzazione(null);
			this.organizationContext.setRuoloOrganizzazione(null);
			this.organizationContext.setInitialized(false);
		}
	}

	private Organizzazione creaOrganizzazione(String nome, String codiceEnte) {
		OrganizzazioneCreate organizzazione = CommonUtils.getOrganizzazioneCreate();
		organizzazione.setNome(nome);
		organizzazione.setCodiceEnte(codiceEnte);
		organizzazione.setCodiceFiscaleSoggetto(codiceEnte);
		return this.organizzazioniController.createOrganizzazione(organizzazione).getBody();
	}

	private UUID creaSoggetto(String nome, UUID idOrganizzazione) {
		SoggettoCreate soggetto = new SoggettoCreate();
		soggetto.setNome(nome);
		soggetto.setIdOrganizzazione(idOrganizzazione);
		soggetto.setAderente(true);
		soggetto.setReferente(true);
		Soggetto creato = this.soggettiController.createSoggetto(soggetto).getBody();
		return creato.getIdSoggetto();
	}

	private UUID creaDominio(String nome, UUID idSoggetto) {
		DominioCreate dominio = CommonUtils.getDominioCreate();
		dominio.setNome(nome);
		dominio.setIdSoggettoReferente(idSoggetto);
		Dominio creato = this.dominiController.createDominio(dominio).getBody();
		return creato.getIdDominio();
	}

	private UtenteCreate getUtenteCreate(String principal) {
		UtenteCreate utente = CommonUtils.getUtenteCreate();
		utente.setPrincipal(principal);
		utente.setEmail(principal + "@test.it");
		utente.setEmailAziendale(principal + "@aziendale.it");
		return utente;
	}

	private void creaUtente(String principal, RuoloOrganizzazioneEnum ruolo) {
		UtenteCreate utente = getUtenteCreate(principal);
		CommonUtils.setOrganizzazione(utente, this.organizzazione.getIdOrganizzazione(), ruolo);
		this.utentiController.createUtente(utente);
	}

	private UUID creaServizio(String nome, UUID idDominio) {
		ReferenteCreate referente = new ReferenteCreate();
		referente.setTipo(TipoReferenteEnum.REFERENTE);
		referente.setIdUtente(getIdUtente(UTENTE_REFERENTE));
		ReferenteCreate referenteTecnico = new ReferenteCreate();
		referenteTecnico.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
		referenteTecnico.setIdUtente(getIdUtente(UTENTE_REFERENTE_TECNICO));
		return creaServizio(nome, idDominio, List.of(referente, referenteTecnico));
	}

	private UUID creaServizio(String nome, UUID idDominio, List<ReferenteCreate> referenti) {
		ServizioCreate servizio = CommonUtils.getServizioCreate();
		servizio.setNome(nome);
		servizio.setIdDominio(idDominio);
		List<ReferenteCreate> tutti = new ArrayList<>(referenti);
		ReferenteCreate gestore = new ReferenteCreate();
		gestore.setTipo(TipoReferenteEnum.REFERENTE);
		gestore.setIdUtente(getIdUtente(UTENTE_GESTORE));
		tutti.add(gestore);
		servizio.setReferenti(tutti);
		Servizio creato = this.serviziController.createServizio(servizio).getBody();
		return creato.getIdServizio();
	}

	private UUID creaApi(String nome, UUID idServizio, String nomeGateway, Integer versioneGateway) {
		APICreate api = CommonUtils.getAPICreate();
		api.setNome(nome);
		api.setVersione(VERSIONE_API);
		api.setIdServizio(idServizio);
		api.setRuolo(RuoloAPIEnum.DOMINIO);

		APIDatiAmbienteCreate collaudo = new APIDatiAmbienteCreate();
		collaudo.setProtocollo(ProtocolloEnum.REST);
		if(nomeGateway != null) {
			APIDatiErogazione erogazione = new APIDatiErogazione();
			erogazione.setNomeGateway(nomeGateway);
			erogazione.setVersioneGateway(versioneGateway);
			erogazione.setUrl("testurl.com/test");
			collaudo.setDatiErogazione(erogazione);
		}
		api.setConfigurazioneCollaudo(collaudo);

		AuthTypeApiResource authType = new AuthTypeApiResource();
		authType.setProfilo("INTERNO_HTTPS");
		authType.setResources(List.of("risorsa1"));
		api.setGruppiAuthType(List.of(authType));

		return this.apiController.createApi(api).getBody().getIdApi();
	}

	private UUID getIdUtente(String principal) {
		return UUID.fromString(this.utenteService.findByPrincipal(principal).get().getIdUtente());
	}
}
