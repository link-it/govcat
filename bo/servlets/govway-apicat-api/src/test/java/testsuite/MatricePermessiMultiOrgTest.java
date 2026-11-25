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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.OrganizationContext;
import org.govway.catalogo.authorization.AdesioneAuthorization;
import org.govway.catalogo.authorization.ServizioAuthorization;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import org.apache.commons.codec.binary.Base64;
import org.govway.catalogo.controllers.APIController;
import org.govway.catalogo.controllers.AdesioniController;
import org.govway.catalogo.controllers.DominiController;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.controllers.ServiziController;
import org.govway.catalogo.controllers.SoggettiController;
import org.govway.catalogo.controllers.UtentiController;
import org.govway.catalogo.core.orm.entity.DominioEntity;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.RuoloOrganizzazione;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.services.DominioService;
import org.govway.catalogo.core.services.OrganizzazioneService;
import org.govway.catalogo.core.services.ServizioService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.exception.UpdateEntitaComplessaNonValidaSemanticamenteException;
import org.govway.catalogo.servlets.model.APICreate;
import org.govway.catalogo.servlets.model.APIDatiAmbienteCreate;
import org.govway.catalogo.servlets.model.APIDatiErogazione;
import org.govway.catalogo.servlets.model.Adesione;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneRuolo;
import org.govway.catalogo.servlets.model.ConfigurazioneStatoDashboard;
import org.govway.catalogo.servlets.model.ConfigurazioneWorkflow;
import org.govway.catalogo.servlets.model.Grant;
import org.govway.catalogo.servlets.model.GrantType;
import org.govway.catalogo.servlets.model.AuthTypeApiResource;
import org.govway.catalogo.servlets.model.AdesioneCreate;
import org.govway.catalogo.servlets.model.DocumentoCreate;
import org.govway.catalogo.servlets.model.Dominio;
import org.govway.catalogo.servlets.model.DominioCreate;
import org.govway.catalogo.servlets.model.IdentificativoServizioUpdate;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.OrganizzazioneCreate;
import org.govway.catalogo.servlets.model.PagedModelItemAdesione;
import org.govway.catalogo.servlets.model.PagedModelItemDominio;
import org.govway.catalogo.servlets.model.PagedModelItemServizio;
import org.govway.catalogo.servlets.model.ProtocolloEnum;
import org.govway.catalogo.servlets.model.ReferenteCreate;
import org.govway.catalogo.servlets.model.Ruolo;
import org.govway.catalogo.servlets.model.RuoloAPIEnum;
import org.govway.catalogo.servlets.model.RuoloReferenteEnum;
import org.govway.catalogo.servlets.model.RuoloOrganizzazioneEnum;
import org.govway.catalogo.servlets.model.RuoloUtenteEnum;
import org.govway.catalogo.servlets.model.Servizio;
import org.govway.catalogo.servlets.model.ServizioCreate;
import org.govway.catalogo.servlets.model.ServizioUpdate;
import org.govway.catalogo.servlets.model.Soggetto;
import org.govway.catalogo.servlets.model.SoggettoCreate;
import org.govway.catalogo.servlets.model.StatoUpdate;
import org.govway.catalogo.servlets.model.TipoReferenteEnum;
import org.govway.catalogo.servlets.model.VisibilitaServizioEnum;
import org.govway.catalogo.servlets.model.Utente;
import org.govway.catalogo.servlets.model.UtenteCreate;
import org.govway.catalogo.servlets.model.UtenteOrganizzazioneCreate;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.transaction.annotation.Transactional;

/**
 * Test matrice permessi multi-organizzazione:
 * - Vincolo [*] creare servizio: session org deve avere flag referente
 * - Vincolo [**] creare adesione: session org deve avere flag aderente
 * - Filtro GET /domini: utenti non-admin vedono solo domini della propria org
 */
@ExtendWith(SpringExtension.class)
@SpringBootTest(classes = OpenAPI2SpringBoot.class)
@EnableAutoConfiguration
@AutoConfigureTestDatabase(replace = Replace.ANY)
@ActiveProfiles("test")
@DirtiesContext(classMode = ClassMode.BEFORE_CLASS)
@TestInstance(TestInstance.Lifecycle.PER_METHOD)
@Transactional
public class MatricePermessiMultiOrgTest {

	@Mock
	private SecurityContext securityContext;

	@Mock
	private Authentication authentication;

	@Autowired
	private OrganizzazioniController organizzazioniController;

	@Autowired
	private UtentiController utentiController;

	@Autowired
	private SoggettiController soggettiController;

	@Autowired
	private DominiController dominiController;

	@Autowired
	private ServiziController serviziController;

	@Autowired
	private AdesioniController adesioniController;

	@Autowired
	private APIController apiController;

	@PersistenceContext
	private EntityManager entityManager;

	@Autowired
	private UtenteService utenteService;

	@Autowired
	private OrganizzazioneService organizzazioneService;

	@Autowired
	private DominioService dominioService;

	@Autowired
	private ServizioService servizioService;

	@Autowired
	private ServizioAuthorization servizioAuthorization;

	@Autowired
	private AdesioneAuthorization adesioneAuthorization;

	@Autowired
	private OrganizationContext organizationContext;

	@Autowired
	private Configurazione configurazione;

	private static final String UTENTE_GESTORE = "gestore";

	@BeforeEach
	public void setUp() {
		MockitoAnnotations.initMocks(this);
		when(this.securityContext.getAuthentication()).thenReturn(this.authentication);

		InfoProfilo infoProfiloGestore = new InfoProfilo(UTENTE_GESTORE,
				this.utenteService.findByPrincipal(UTENTE_GESTORE).get(), List.of());
		when(this.authentication.getPrincipal()).thenReturn(infoProfiloGestore);

		SecurityContextHolder.setContext(this.securityContext);

		organizationContext.setIdOrganizzazione(null);
		organizationContext.setRuoloOrganizzazione(null);
		organizationContext.setInitialized(false);
	}

	@AfterEach
	public void tearDown() {
		SecurityContextHolder.clearContext();
	}

	private Organizzazione creaOrganizzazione(String nome, boolean referente, boolean aderente) {
		OrganizzazioneCreate oc = CommonUtils.getOrganizzazioneCreate();
		oc.setNome(nome);
		oc.setReferente(referente);
		oc.setAderente(aderente);
		return organizzazioniController.createOrganizzazione(oc).getBody();
	}

	private Utente creaUtenteEAutentica(String principal, Organizzazione org,
			RuoloOrganizzazioneEnum ruolo) {
		UtenteCreate uc = CommonUtils.getUtenteCreate();
		uc.setPrincipal(principal);
		uc.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
		UtenteOrganizzazioneCreate assoc = new UtenteOrganizzazioneCreate();
		assoc.setIdOrganizzazione(org.getIdOrganizzazione());
		assoc.setRuoloOrganizzazione(ruolo);
		uc.setOrganizzazioni(List.of(assoc));
		Utente creato = utentiController.createUtente(uc).getBody();

		InfoProfilo info = new InfoProfilo(principal,
				this.utenteService.findByPrincipal(principal).get(), List.of());
		when(this.authentication.getPrincipal()).thenReturn(info);

		return creato;
	}

	/**
	 * Popola manualmente il contesto organizzazione simulando il comportamento dell'interceptor.
	 */
	private void simulaContestoSessione(Organizzazione organizzazione,
			RuoloOrganizzazione ruolo) {
		OrganizzazioneEntity orgEntity = this.organizzazioneService.find(organizzazione.getIdOrganizzazione()).get();
		organizationContext.setIdOrganizzazione(orgEntity.getId());
		organizationContext.setRuoloOrganizzazione(ruolo);
		organizationContext.setInitialized(true);
	}

	@Test
	public void testCreateServizio_OrgSessioneNonReferente_Forbidden() {
		// Organizzazione SENZA flag referente
		Organizzazione org = creaOrganizzazione("org-no-ref", false, false);
		creaUtenteEAutentica("test.create.serv.nref", org,
				RuoloOrganizzazioneEnum.OPERATORE_API);
		simulaContestoSessione(org, RuoloOrganizzazione.OPERATORE_API);

		ServizioCreate sc = CommonUtils.getServizioCreate();

		NotAuthorizedException ex = assertThrows(NotAuthorizedException.class, () -> {
			servizioAuthorization.authorizeCreate(sc);
		});
		assertEquals("AUT.403.ORG.NOT.REFERENTE", ex.getMessage());
	}

	@Test
	public void testCreateServizio_OrgSessioneReferente_Success() {
		// Organizzazione CON flag referente
		Organizzazione org = creaOrganizzazione("org-ref-ok", true, false);
		creaUtenteEAutentica("test.create.serv.ok", org,
				RuoloOrganizzazioneEnum.OPERATORE_API);
		simulaContestoSessione(org, RuoloOrganizzazione.OPERATORE_API);

		ServizioCreate sc = CommonUtils.getServizioCreate();

		// Non deve lanciare eccezioni: il check flag referente passa
		servizioAuthorization.authorizeCreate(sc);
	}

	@Test
	public void testCreateServizio_Gestore_BypassCheck() {
		// Gestore non ha vincoli sull'org di sessione
		Organizzazione org = creaOrganizzazione("org-gest-bypass", false, false);
		simulaContestoSessione(org, null); // gestore senza ruolo org

		ServizioCreate sc = CommonUtils.getServizioCreate();

		// Gestore bypassa il check flag referente
		servizioAuthorization.authorizeCreate(sc);
	}

	@Test
	public void testCreateAdesione_OrgSessioneNonAderente_Forbidden() {
		// Organizzazione SENZA flag aderente
		Organizzazione org = creaOrganizzazione("org-no-ader", true, false);
		creaUtenteEAutentica("test.create.ades.nader", org,
				RuoloOrganizzazioneEnum.OPERATORE_API);
		simulaContestoSessione(org, RuoloOrganizzazione.OPERATORE_API);

		AdesioneCreate ac = new AdesioneCreate();

		NotAuthorizedException ex = assertThrows(NotAuthorizedException.class, () -> {
			adesioneAuthorization.authorizeCreate(ac);
		});
		assertEquals("AUT.403.ORG.NOT.ADERENTE", ex.getMessage());
	}

	@Test
	public void testCreateAdesione_OrgSessioneAderente_Success() {
		// Organizzazione CON flag aderente
		Organizzazione org = creaOrganizzazione("org-ader-ok", false, true);
		creaUtenteEAutentica("test.create.ades.ok", org,
				RuoloOrganizzazioneEnum.OPERATORE_API);
		simulaContestoSessione(org, RuoloOrganizzazione.OPERATORE_API);

		AdesioneCreate ac = new AdesioneCreate();

		// Non deve lanciare eccezioni
		adesioneAuthorization.authorizeCreate(ac);
	}

	@Test
	public void testCreateAdesione_Gestore_BypassCheck() {
		Organizzazione org = creaOrganizzazione("org-gest-ader-bypass", false, false);
		simulaContestoSessione(org, null);

		AdesioneCreate ac = new AdesioneCreate();

		// Gestore bypassa il check flag aderente
		adesioneAuthorization.authorizeCreate(ac);
	}

	/**
	 * Scenario Issue 451: organizzazione erogatrice (anche aderente) con soggetto, dominio e servizio
	 * pubblicato in collaudo, e un'organizzazione aderente con il proprio soggetto.
	 * Restituisce [soggettoErogatore, soggettoAderente]; il servizio e` in {@link #idServizio451}.
	 */
	private UUID idServizio451;

	private Soggetto[] preparaScenarioAdesioneAltraOrg(String suffisso, Organizzazione orgErogatrice,
			Organizzazione orgAderente, Utente referenteServizio) {
		Soggetto soggErogatore = creaSoggetto("sogg-erog-" + suffisso, orgErogatrice);
		Soggetto soggAderente = creaSoggetto("sogg-ader-" + suffisso, orgAderente);
		Dominio dominio = creaDominio("Test", soggErogatore);
		Servizio servizio = creaServizio("srv-" + suffisso, dominio, soggErogatore, referenteServizio);
		pubblicaInCollaudo(servizio.getIdServizio());
		this.idServizio451 = servizio.getIdServizio();
		return new Soggetto[] {soggErogatore, soggAderente};
	}

	private Adesione creaAdesioneSenzaReferenti(UUID idServizio, Soggetto soggetto) {
		AdesioneCreate ac = new AdesioneCreate();
		ac.setIdServizio(idServizio);
		ac.setIdSoggetto(soggetto.getIdSoggetto());
		return adesioniController.createAdesione(ac).getBody();
	}

	/**
	 * Esegue l'azione con adesione.scelta_libera_organizzazione=false, ripristinando poi il valore originale
	 * (la configurazione e` un bean condiviso fra i test).
	 */
	private void conSceltaLiberaOrganizzazioneDisabilitata(Runnable azione) {
		Boolean originale = this.configurazione.getAdesione().isSceltaLiberaOrganizzazione();
		this.configurazione.getAdesione().setSceltaLiberaOrganizzazione(false);
		try {
			azione.run();
		} finally {
			this.configurazione.getAdesione().setSceltaLiberaOrganizzazione(originale);
		}
	}

	@Test
	public void testCreateAdesione_OperatoreApiErogatore_SoggettoAltraOrg_Forbidden() {
		Organizzazione orgErogatrice = creaOrganizzazione("org-451-erog-op", true, true);
		Organizzazione orgAderente = creaOrganizzazione("org-451-ader-op", false, true);
		Utente refServizio = creaUtenteMultiOrg("test.451.refserv.op", List.of(orgErogatrice),
				RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);
		Soggetto[] soggetti = preparaScenarioAdesioneAltraOrg("451-op", orgErogatrice, orgAderente, refServizio);

		creaUtenteMultiOrg("test.451.op.erog", List.of(orgErogatrice), RuoloOrganizzazioneEnum.OPERATORE_API);
		autenticaCome("test.451.op.erog");
		simulaContestoSessione(orgErogatrice, RuoloOrganizzazione.OPERATORE_API);

		conSceltaLiberaOrganizzazioneDisabilitata(() -> {
			// Il ruolo per-organizzazione sull'erogatrice non consente di far aderire un'altra organizzazione
			NotAuthorizedException ex = assertThrows(NotAuthorizedException.class,
					() -> creaAdesioneSenzaReferenti(idServizio451, soggetti[1]));
			assertEquals("AUT.403.ORG.ADHESION", ex.getMessage());

			// Per un soggetto della propria organizzazione la creazione resta consentita
			assertNotNull(creaAdesioneSenzaReferenti(idServizio451, soggetti[0]));
		});
	}

	@Test
	public void testCreateAdesione_AmmOrgErogatore_SoggettoAltraOrg_Forbidden() {
		Organizzazione orgErogatrice = creaOrganizzazione("org-451-erog-amm", true, true);
		Organizzazione orgAderente = creaOrganizzazione("org-451-ader-amm", false, true);
		Utente refServizio = creaUtenteMultiOrg("test.451.refserv.amm", List.of(orgErogatrice),
				RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);
		Soggetto[] soggetti = preparaScenarioAdesioneAltraOrg("451-amm", orgErogatrice, orgAderente, refServizio);

		creaUtenteMultiOrg("test.451.amm.erog", List.of(orgErogatrice),
				RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);
		autenticaCome("test.451.amm.erog");
		simulaContestoSessione(orgErogatrice, RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);

		conSceltaLiberaOrganizzazioneDisabilitata(() -> {
			NotAuthorizedException ex = assertThrows(NotAuthorizedException.class,
					() -> creaAdesioneSenzaReferenti(idServizio451, soggetti[1]));
			assertEquals("AUT.403.ORG.ADHESION", ex.getMessage());
		});
	}

	@Test
	public void testCreateAdesione_OperatoreApiAderente_SoggettoErogatore_Forbidden() {
		Organizzazione orgErogatrice = creaOrganizzazione("org-451-erog-ade", true, true);
		Organizzazione orgAderente = creaOrganizzazione("org-451-ader-ade", false, true);
		Utente refServizio = creaUtenteMultiOrg("test.451.refserv.ade", List.of(orgErogatrice),
				RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);
		Soggetto[] soggetti = preparaScenarioAdesioneAltraOrg("451-ade", orgErogatrice, orgAderente, refServizio);

		creaUtenteMultiOrg("test.451.op.ader", List.of(orgAderente), RuoloOrganizzazioneEnum.OPERATORE_API);
		autenticaCome("test.451.op.ader");
		simulaContestoSessione(orgAderente, RuoloOrganizzazione.OPERATORE_API);

		conSceltaLiberaOrganizzazioneDisabilitata(() -> {
			// Prima della Issue 451 lo stesso codice era restituito con HTTP 400 (BadRequestException)
			NotAuthorizedException ex = assertThrows(NotAuthorizedException.class,
					() -> creaAdesioneSenzaReferenti(idServizio451, soggetti[0]));
			assertEquals("AUT.403.ORG.ADHESION", ex.getMessage());
		});
	}

	@Test
	public void testCreateAdesione_ReferenteServizio_SoggettoAltraOrg_Consentito() {
		// Decisione Issue 451: il referente (non tecnico) del servizio puo` aderire per conto di un aderente
		Organizzazione orgErogatrice = creaOrganizzazione("org-451-erog-ref", true, true);
		Organizzazione orgAderente = creaOrganizzazione("org-451-ader-ref", false, true);
		Utente refServizio = creaUtenteMultiOrg("test.451.refserv.ref", List.of(orgErogatrice),
				RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);
		Soggetto[] soggetti = preparaScenarioAdesioneAltraOrg("451-ref", orgErogatrice, orgAderente, refServizio);

		autenticaCome("test.451.refserv.ref");
		simulaContestoSessione(orgErogatrice, RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);

		conSceltaLiberaOrganizzazioneDisabilitata(() -> {
			Adesione adesione = creaAdesioneSenzaReferenti(idServizio451, soggetti[1]);
			assertNotNull(adesione);
			assertEquals(soggetti[1].getIdSoggetto(), adesione.getSoggetto().getIdSoggetto());
		});
	}

	@Test
	public void testListDomini_UtenteOperatoreApi_SoloDominiDellaPropriaOrg() {
		// Crea 2 organizzazioni con 2 soggetti e 2 domini
		Organizzazione org1 = creaOrganizzazione("org-dom-1", true, false);
		Organizzazione org2 = creaOrganizzazione("org-dom-2", true, false);

		SoggettoCreate sc1 = CommonUtils.getSoggettoCreate();
		sc1.setNome("sogg-dom-1");
		sc1.setIdOrganizzazione(org1.getIdOrganizzazione());
		Soggetto s1 = soggettiController.createSoggetto(sc1).getBody();

		SoggettoCreate sc2 = CommonUtils.getSoggettoCreate();
		sc2.setNome("sogg-dom-2");
		sc2.setIdOrganizzazione(org2.getIdOrganizzazione());
		Soggetto s2 = soggettiController.createSoggetto(sc2).getBody();

		DominioCreate dc1 = CommonUtils.getDominioCreate();
		dc1.setNome("dom-1");
		dc1.setIdSoggettoReferente(s1.getIdSoggetto());
		dominiController.createDominio(dc1);

		DominioCreate dc2 = CommonUtils.getDominioCreate();
		dc2.setNome("dom-2");
		dc2.setIdSoggettoReferente(s2.getIdSoggetto());
		dominiController.createDominio(dc2);

		// Utente operatore API di org1
		creaUtenteEAutentica("test.list.dom", org1, RuoloOrganizzazioneEnum.OPERATORE_API);
		simulaContestoSessione(org1, RuoloOrganizzazione.OPERATORE_API);

		PagedModelItemDominio list = dominiController.listDomini(
				null, null, null, null, null, null, 0, 100, null).getBody();

		// L'utente deve vedere solo dom-1 (della propria org1), non dom-2 di org2
		assertFalse(list.getContent().isEmpty());
		boolean visto1 = list.getContent().stream().anyMatch(d -> "dom-1".equals(d.getNome()));
		boolean visto2 = list.getContent().stream().anyMatch(d -> "dom-2".equals(d.getNome()));
		assertTrue(visto1, "L'utente deve vedere il dominio della propria org");
		assertFalse(visto2, "L'utente NON deve vedere il dominio di altra org");
	}

	@Test
	public void testListDomini_Gestore_VedeTuttiDomini() {
		Organizzazione org1 = creaOrganizzazione("org-gest-dom-1", true, false);
		Organizzazione org2 = creaOrganizzazione("org-gest-dom-2", true, false);

		SoggettoCreate sc1 = CommonUtils.getSoggettoCreate();
		sc1.setNome("sogg-gest-dom-1");
		sc1.setIdOrganizzazione(org1.getIdOrganizzazione());
		Soggetto s1 = soggettiController.createSoggetto(sc1).getBody();

		SoggettoCreate sc2 = CommonUtils.getSoggettoCreate();
		sc2.setNome("sogg-gest-dom-2");
		sc2.setIdOrganizzazione(org2.getIdOrganizzazione());
		Soggetto s2 = soggettiController.createSoggetto(sc2).getBody();

		DominioCreate dc1 = CommonUtils.getDominioCreate();
		dc1.setNome("gest-dom-1");
		dc1.setIdSoggettoReferente(s1.getIdSoggetto());
		dominiController.createDominio(dc1);

		DominioCreate dc2 = CommonUtils.getDominioCreate();
		dc2.setNome("gest-dom-2");
		dc2.setIdSoggettoReferente(s2.getIdSoggetto());
		dominiController.createDominio(dc2);

		// Resta il gestore (setUp di default). Nessun filtro di org applicato.
		PagedModelItemDominio list = dominiController.listDomini(
				null, null, null, null, null, null, 0, 100, null).getBody();

		boolean visto1 = list.getContent().stream().anyMatch(d -> "gest-dom-1".equals(d.getNome()));
		boolean visto2 = list.getContent().stream().anyMatch(d -> "gest-dom-2".equals(d.getNome()));
		assertTrue(visto1, "Il gestore deve vedere dom di org1");
		assertTrue(visto2, "Il gestore deve vedere dom di org2");
	}


	// ------------------------------------------------------------------
	// Filtro di visibilita` per organizzazione di sessione su servizi e adesioni
	// ------------------------------------------------------------------

	private void autenticaCome(String principal) {
		InfoProfilo info = new InfoProfilo(principal,
				this.utenteService.findByPrincipal(principal).get(), List.of());
		when(this.authentication.getPrincipal()).thenReturn(info);
	}

	private Utente creaUtenteMultiOrg(String principal, List<Organizzazione> organizzazioni,
			RuoloOrganizzazioneEnum ruolo) {
		UtenteCreate uc = CommonUtils.getUtenteCreate();
		uc.setPrincipal(principal);
		uc.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
		List<UtenteOrganizzazioneCreate> assoc = new ArrayList<>();
		for(Organizzazione org: organizzazioni) {
			UtenteOrganizzazioneCreate a = new UtenteOrganizzazioneCreate();
			a.setIdOrganizzazione(org.getIdOrganizzazione());
			a.setRuoloOrganizzazione(ruolo);
			assoc.add(a);
		}
		uc.setOrganizzazioni(assoc);
		return utentiController.createUtente(uc).getBody();
	}

	private Soggetto creaSoggetto(String nome, Organizzazione org) {
		SoggettoCreate sc = CommonUtils.getSoggettoCreate();
		sc.setNome(nome);
		sc.setIdOrganizzazione(org.getIdOrganizzazione());
		sc.setAderente(true);
		sc.setReferente(true);
		return soggettiController.createSoggetto(sc).getBody();
	}

	private Dominio creaDominio(String nome, Soggetto soggettoReferente) {
		DominioCreate dc = CommonUtils.getDominioCreate();
		dc.setNome(nome);
		dc.setIdSoggettoReferente(soggettoReferente.getIdSoggetto());
		return dominiController.createDominio(dc).getBody();
	}

	private Servizio creaServizio(String nome, Dominio dominio, Soggetto soggettoErogatore, Utente referente) {
		return creaServizio(nome, dominio, soggettoErogatore, referente, VisibilitaServizioEnum.PUBBLICO);
	}

	private Servizio creaServizio(String nome, Dominio dominio, Soggetto soggettoErogatore, Utente referente,
			VisibilitaServizioEnum visibilita) {
		ServizioCreate sc = CommonUtils.getServizioCreate();
		sc.setNome(nome);
		sc.setVisibilita(visibilita);
		sc.setIdDominio(dominio.getIdDominio());
		sc.setIdSoggettoErogatore(soggettoErogatore.getIdSoggetto());

		ReferenteCreate rc = new ReferenteCreate();
		rc.setTipo(TipoReferenteEnum.REFERENTE);
		rc.setIdUtente(referente.getIdUtente());
		sc.setReferenti(List.of(rc));

		Servizio servizio = serviziController.createServizio(sc).getBody();
		this.entityManager.flush();
		this.entityManager.clear();
		return servizio;
	}

	/**
	 * Crea un servizio intermediato (fruizione): il dominio appartiene all'organizzazione
	 * interna, l'ente erogatore a un'altra organizzazione.
	 */
	private Servizio creaServizioIntermediato(String nome, Dominio dominio, Soggetto enteErogatore,
			List<Utente> referenti) {
		ServizioCreate sc = CommonUtils.getServizioCreate();
		sc.setNome(nome);
		sc.setVisibilita(VisibilitaServizioEnum.PUBBLICO);
		sc.setFruizione(true);
		sc.setIdDominio(dominio.getIdDominio());
		sc.setIdSoggettoErogatore(enteErogatore.getIdSoggetto());

		List<ReferenteCreate> lst = new ArrayList<>();
		for(Utente u: referenti) {
			ReferenteCreate rc = new ReferenteCreate();
			rc.setTipo(TipoReferenteEnum.REFERENTE);
			rc.setIdUtente(u.getIdUtente());
			lst.add(rc);
		}
		sc.setReferenti(lst);

		Servizio servizio = serviziController.createServizio(sc).getBody();
		this.entityManager.flush();
		this.entityManager.clear();
		return servizio;
	}

	/**
	 * Porta il servizio fino a "pubblicato_collaudo", stato in cui e` consentita l'adesione.
	 */
	private void pubblicaInCollaudo(UUID idServizio) {
		creaApiDominio(idServizio);
		CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);
	}

	/**
	 * Crea un'API erogata dal soggetto del dominio, necessaria per far avanzare il servizio nel workflow.
	 */
	private void creaApiDominio(UUID idServizio) {
		APICreate apiCreate = CommonUtils.getAPICreate();
		apiCreate.setIdServizio(idServizio);
		apiCreate.setRuolo(RuoloAPIEnum.DOMINIO);

		DocumentoCreate documento = new DocumentoCreate();
		documento.setContentType("application/yaml");
		documento.setContent(Base64.encodeBase64String(CommonUtils.openApiSpec.getBytes()));
		documento.setFilename("openapi.yaml");

		APIDatiErogazione datiErogazione = new APIDatiErogazione();
		datiErogazione.setNomeGateway("APIGateway");
		datiErogazione.setVersioneGateway(1);
		datiErogazione.setUrlPrefix("http://");
		datiErogazione.setUrl("testurl.com/test");

		APIDatiAmbienteCreate datiAmbiente = new APIDatiAmbienteCreate();
		datiAmbiente.setProtocollo(ProtocolloEnum.REST);
		datiAmbiente.setSpecifica(documento);
		datiAmbiente.setDatiErogazione(datiErogazione);

		apiCreate.setConfigurazioneCollaudo(datiAmbiente);
		apiCreate.setConfigurazioneProduzione(datiAmbiente);

		AuthTypeApiResource authType = new AuthTypeApiResource();
		authType.setProfilo("MODI_P1");
		authType.setResources(List.of("risorsa1"));
		apiCreate.setGruppiAuthType(List.of(authType));

		apiController.createApi(apiCreate);
		this.entityManager.flush();
		this.entityManager.clear();
	}

	private Adesione creaAdesione(UUID idServizio, Soggetto soggettoAderente, Utente referente) {
		ReferenteCreate rc = new ReferenteCreate();
		rc.setTipo(TipoReferenteEnum.REFERENTE);
		rc.setIdUtente(referente.getIdUtente());

		AdesioneCreate ac = new AdesioneCreate();
		ac.setIdServizio(idServizio);
		ac.setIdSoggetto(soggettoAderente.getIdSoggetto());
		ac.setReferenti(List.of(rc));

		Adesione adesione = adesioniController.createAdesione(ac).getBody();
		this.entityManager.flush();
		this.entityManager.clear();
		return adesione;
	}

	private PagedModelItemServizio listServizi(Boolean mieiServizi, Boolean dashboard) {
		return serviziController.listServizi(null, null, null, null, null, null, null, null, null, null, null,
				null, mieiServizi, null, dashboard, null, null, null, null, null, null, null, null, null,
				0, 100, null).getBody();
	}

	private PagedModelItemAdesione listAdesioni() {
		return adesioniController.listAdesioni(null, null, null, null, null, null, null, null, null,
				null, null, null, null, null, null, null, 0, 100, null).getBody();
	}

	private boolean contieneServizio(PagedModelItemServizio lista, String nome) {
		return lista.getContent().stream().anyMatch(x -> nome.equals(x.getNome()));
	}

	private boolean contieneAdesione(PagedModelItemAdesione lista, UUID idAdesione) {
		return lista.getContent().stream().anyMatch(x -> idAdesione.equals(x.getIdAdesione()));
	}

	/**
	 * Contesto di partenza condiviso: due organizzazioni, ciascuna con soggetto, dominio e un
	 * servizio di cui l'utente di test e` referente. L'utente e` associato a entrambe.
	 */
	private Utente preparaDueOrganizzazioni(String principal, String suffisso,
			Organizzazione org1, Organizzazione org2) {
		Utente utente = creaUtenteMultiOrg(principal, List.of(org1, org2),
				RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);

		Soggetto s1 = creaSoggetto("sogg-1-" + suffisso, org1);
		Soggetto s2 = creaSoggetto("sogg-2-" + suffisso, org2);
		Dominio d1 = creaDominio("dom-1-" + suffisso, s1);
		Dominio d2 = creaDominio("dom-2-" + suffisso, s2);

		creaServizio("srv-1-" + suffisso, d1, s1, utente);
		creaServizio("srv-2-" + suffisso, d2, s2, utente);

		return utente;
	}

	@Test
	public void testListServizi_MieiServizi_SoloOrganizzazioneDiSessione() {
		Organizzazione org1 = creaOrganizzazione("org-srv-1", true, true);
		Organizzazione org2 = creaOrganizzazione("org-srv-2", true, true);
		preparaDueOrganizzazioni("test.list.serv.multi", "miei", org1, org2);

		autenticaCome("test.list.serv.multi");
		simulaContestoSessione(org1, RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);

		PagedModelItemServizio lista = listServizi(true, null);

		assertTrue(contieneServizio(lista, "srv-1-miei"),
				"Deve vedere il servizio della propria organizzazione di sessione");
		assertFalse(contieneServizio(lista, "srv-2-miei"),
				"NON deve vedere il servizio dell'altra organizzazione di cui pure e` referente");
	}

	@Test
	public void testListServizi_Catalogo_NonFiltratoPerOrganizzazioneDiSessione() {
		Organizzazione org1 = creaOrganizzazione("org-cat-1", true, true);
		Organizzazione org2 = creaOrganizzazione("org-cat-2", true, true);
		preparaDueOrganizzazioni("test.list.serv.cat", "cat", org1, org2);

		autenticaCome("test.list.serv.cat");
		simulaContestoSessione(org1, RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);

		// Lista di catalogo: nessun filtro operativo, la visibilita` non deve essere ristretta
		PagedModelItemServizio lista = listServizi(null, null);

		assertTrue(contieneServizio(lista, "srv-1-cat"), "Il catalogo deve mostrare i servizi della propria org");
		assertTrue(contieneServizio(lista, "srv-2-cat"),
				"Il catalogo NON deve essere ristretto all'organizzazione di sessione");
	}

	@Test
	public void testListServizi_Dashboard_SoloOrganizzazioneDiSessione() {
		Organizzazione org1 = creaOrganizzazione("org-dash-1", true, true);
		Organizzazione org2 = creaOrganizzazione("org-dash-2", true, true);
		preparaDueOrganizzazioni("test.list.serv.dash", "dash", org1, org2);

		autenticaCome("test.list.serv.dash");
		simulaContestoSessione(org1, RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);

		PagedModelItemServizio lista = listServizi(null, true);

		assertTrue(contieneServizio(lista, "srv-1-dash"),
				"La dashboard deve mostrare i servizi dell'organizzazione di sessione");
		assertFalse(contieneServizio(lista, "srv-2-dash"),
				"La dashboard NON deve mostrare i servizi dell'altra organizzazione");
	}

	@Test
	public void testListServizi_Gestore_NonFiltratoPerOrganizzazioneDiSessione() {
		Organizzazione org1 = creaOrganizzazione("org-gest-srv-1", true, true);
		Organizzazione org2 = creaOrganizzazione("org-gest-srv-2", true, true);
		preparaDueOrganizzazioni("test.list.serv.gest", "gest", org1, org2);

		// Resta autenticato il gestore, con un contesto organizzazione valorizzato
		autenticaCome(UTENTE_GESTORE);
		simulaContestoSessione(org1, null);

		PagedModelItemServizio lista = listServizi(true, null);

		assertTrue(contieneServizio(lista, "srv-1-gest"), "Il gestore deve vedere i servizi di org1");
		assertTrue(contieneServizio(lista, "srv-2-gest"),
				"Il gestore ha visibilita` globale e non va ristretto all'organizzazione di sessione");
	}

	@Test
	public void testListServizi_MieiServizi_ServizioDiAltraOrgConAdesioneDellaPropria() {
		Organizzazione orgErogatrice = creaOrganizzazione("org-ade-erog", true, false);
		Organizzazione orgAderente = creaOrganizzazione("org-ade-ader", false, true);

		Soggetto soggErogatore = creaSoggetto("sogg-ade-erog", orgErogatrice);
		Soggetto soggAderente = creaSoggetto("sogg-ade-ader", orgAderente);
		Dominio dominio = creaDominio("Test", soggErogatore);

		Utente utenteGestore = utentiController.getUtente(
				UUID.fromString(this.utenteService.findByPrincipal(UTENTE_GESTORE).get().getIdUtente())).getBody();
		Servizio servizio = creaServizio("srv-ade-erog", dominio, soggErogatore, utenteGestore);
		pubblicaInCollaudo(servizio.getIdServizio());

		Utente utente = creaUtenteMultiOrg("test.list.serv.ade", List.of(orgAderente),
				RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);
		creaAdesione(servizio.getIdServizio(), soggAderente, utente);

		autenticaCome("test.list.serv.ade");
		simulaContestoSessione(orgAderente, RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);

		PagedModelItemServizio lista = listServizi(true, null);

		assertTrue(contieneServizio(lista, "srv-ade-erog"),
				"Il servizio di un'altra organizzazione a cui la propria ha aderito deve restare visibile");
	}

	@Test
	public void testListAdesioni_SoloOrganizzazioneDiSessione() {
		Organizzazione org1 = creaOrganizzazione("org-adelist-1", true, true);
		Organizzazione org2 = creaOrganizzazione("org-adelist-2", true, true);

		Utente utente = creaUtenteMultiOrg("test.list.ades.multi", List.of(org1, org2),
				RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);

		Soggetto s1 = creaSoggetto("sogg-adelist-1", org1);
		Soggetto s2 = creaSoggetto("sogg-adelist-2", org2);
		Dominio d1 = creaDominio("Test", s1);
		Dominio d2 = creaDominio("ModI", s2);

		Servizio srv1 = creaServizio("srv-adelist-1", d1, s1, utente);
		pubblicaInCollaudo(srv1.getIdServizio());
		Servizio srv2 = creaServizio("srv-adelist-2", d2, s2, utente);
		pubblicaInCollaudo(srv2.getIdServizio());

		Adesione ade1 = creaAdesione(srv1.getIdServizio(), s1, utente);
		Adesione ade2 = creaAdesione(srv2.getIdServizio(), s2, utente);

		autenticaCome("test.list.ades.multi");
		simulaContestoSessione(org1, RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);

		PagedModelItemAdesione lista = listAdesioni();

		assertTrue(contieneAdesione(lista, ade1.getIdAdesione()),
				"Deve vedere l'adesione della propria organizzazione di sessione");
		assertFalse(contieneAdesione(lista, ade2.getIdAdesione()),
				"NON deve vedere l'adesione dell'altra organizzazione di cui pure e` referente");
	}

	@Test
	public void testListAdesioni_AdesioneDiAltraOrgAlProprioServizio() {
		Organizzazione orgErogatrice = creaOrganizzazione("org-adeerog-erog", true, false);
		Organizzazione orgAderente = creaOrganizzazione("org-adeerog-ader", false, true);

		Soggetto soggErogatore = creaSoggetto("sogg-adeerog-erog", orgErogatrice);
		Soggetto soggAderente = creaSoggetto("sogg-adeerog-ader", orgAderente);
		Dominio dominio = creaDominio("Test", soggErogatore);

		Utente utenteErogatore = creaUtenteMultiOrg("test.list.ades.erog", List.of(orgErogatrice),
				RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);
		Servizio servizio = creaServizio("srv-adeerog", dominio, soggErogatore, utenteErogatore);
		pubblicaInCollaudo(servizio.getIdServizio());

		Utente utenteAderente = creaUtenteMultiOrg("test.list.ades.ader", List.of(orgAderente),
				RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);
		Adesione adesione = creaAdesione(servizio.getIdServizio(), soggAderente, utenteAderente);

		autenticaCome("test.list.ades.erog");
		simulaContestoSessione(orgErogatrice, RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);

		PagedModelItemAdesione lista = listAdesioni();

		assertTrue(contieneAdesione(lista, adesione.getIdAdesione()),
				"Il referente del servizio deve vedere le adesioni di altre organizzazioni al proprio servizio");
	}


	@Test
	public void testListServizi_ServizioIntermediato_VisibileDaOrganizzazioneDelDominio() {
		Organizzazione orgDominio = creaOrganizzazione("org-interm-dom", true, false);
		Organizzazione orgErogatrice = creaOrganizzazione("org-interm-erog", true, false);

		Soggetto soggDominio = creaSoggetto("sogg-interm-dom", orgDominio);
		Soggetto soggErogatore = creaSoggetto("sogg-interm-erog", orgErogatrice);
		Dominio dominio = creaDominio("dom-interm", soggDominio);

		Utente utenteDominio = creaUtenteMultiOrg("test.interm.dom", List.of(orgDominio),
				RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);
		Utente utenteErogatore = creaUtenteMultiOrg("test.interm.erog", List.of(orgErogatrice),
				RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);

		creaServizioIntermediato("srv-interm", dominio, soggErogatore,
				List.of(utenteDominio, utenteErogatore));

		autenticaCome("test.interm.dom");
		simulaContestoSessione(orgDominio, RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);

		PagedModelItemServizio lista = listServizi(true, null);

		assertTrue(contieneServizio(lista, "srv-interm"),
				"Il servizio intermediato deve essere visibile dall'organizzazione del suo dominio");
	}

	@Test
	public void testListServizi_ServizioIntermediato_VisibileDaOrganizzazioneEnteErogatore() {
		Organizzazione orgDominio = creaOrganizzazione("org-interm2-dom", true, false);
		Organizzazione orgErogatrice = creaOrganizzazione("org-interm2-erog", true, false);

		Soggetto soggDominio = creaSoggetto("sogg-interm2-dom", orgDominio);
		Soggetto soggErogatore = creaSoggetto("sogg-interm2-erog", orgErogatrice);
		Dominio dominio = creaDominio("dom-interm2", soggDominio);

		Utente utenteDominio = creaUtenteMultiOrg("test.interm2.dom", List.of(orgDominio),
				RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);
		Utente utenteErogatore = creaUtenteMultiOrg("test.interm2.erog", List.of(orgErogatrice),
				RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);

		creaServizioIntermediato("srv-interm2", dominio, soggErogatore,
				List.of(utenteDominio, utenteErogatore));

		autenticaCome("test.interm2.erog");
		simulaContestoSessione(orgErogatrice, RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);

		PagedModelItemServizio lista = listServizi(true, null);

		assertTrue(contieneServizio(lista, "srv-interm2"),
				"Il servizio intermediato deve essere visibile dall'organizzazione del suo ente erogatore");
	}

	// ------------------------------------------------------------------
	// Issue 450: dominio del servizio nell'organizzazione di sessione
	// ------------------------------------------------------------------

	/**
	 * Contesto di partenza: due organizzazioni referenti, ciascuna con soggetto e dominio.
	 * Restituisce [soggetto1, soggetto2] e [dominio1, dominio2] tramite gli array passati.
	 */
	private void preparaDominiDueOrganizzazioni(String suffisso, Organizzazione org1, Organizzazione org2,
			Soggetto[] soggetti, Dominio[] domini) {
		soggetti[0] = creaSoggetto("sogg-1-" + suffisso, org1);
		soggetti[1] = creaSoggetto("sogg-2-" + suffisso, org2);
		domini[0] = creaDominio("dom-1-" + suffisso, soggetti[0]);
		domini[1] = creaDominio("dom-2-" + suffisso, soggetti[1]);
	}

	private ServizioUpdate getUpdateDominio(Servizio servizio, Dominio dominio, Soggetto soggettoErogatore) {
		IdentificativoServizioUpdate identificativo = new IdentificativoServizioUpdate();
		identificativo.setNome(servizio.getNome());
		identificativo.setVersione(servizio.getVersione());
		identificativo.setIdDominio(dominio.getIdDominio());
		identificativo.setIdSoggettoErogatore(soggettoErogatore.getIdSoggetto());
		identificativo.setVisibilita(servizio.getVisibilita());
		identificativo.setAdesioneDisabilitata(servizio.isAdesioneDisabilitata());
		identificativo.setMultiAdesione(servizio.isMultiAdesione());
		identificativo.setTipo(servizio.getTipo());
		identificativo.setPackage(false);
		ServizioUpdate update = new ServizioUpdate();
		update.setIdentificativo(identificativo);
		return update;
	}

	private void verificaCreazioneDominioAltraOrg(String suffisso, RuoloOrganizzazioneEnum ruolo,
			RuoloOrganizzazione ruoloSessione) {
		Organizzazione org1 = creaOrganizzazione("org-dom-1-" + suffisso, true, false);
		Organizzazione org2 = creaOrganizzazione("org-dom-2-" + suffisso, true, false);
		Soggetto[] soggetti = new Soggetto[2];
		Dominio[] domini = new Dominio[2];
		preparaDominiDueOrganizzazioni(suffisso, org1, org2, soggetti, domini);

		String principal = "test.dom.fuori.org." + suffisso;
		Utente utente = creaUtenteMultiOrg(principal, List.of(org1), ruolo);
		autenticaCome(principal);
		simulaContestoSessione(org1, ruoloSessione);

		NotAuthorizedException ex = assertThrows(NotAuthorizedException.class,
				() -> creaServizio("srv-" + suffisso, domini[1], soggetti[1], utente));
		assertEquals("AUT.403.AMM.ORG.DOMINIO.FUORI.ORG", ex.getMessage());
		assertEquals(org1.getNome(), ex.getParameters().get("orgNome"));
	}

	@Test
	public void testCreateServizio_AmmOrg_DominioAltraOrganizzazione_Forbidden() {
		verificaCreazioneDominioAltraOrg("amm", RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE,
				RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);
	}

	@Test
	public void testCreateServizio_OperatoreApi_DominioAltraOrganizzazione_Forbidden() {
		verificaCreazioneDominioAltraOrg("op", RuoloOrganizzazioneEnum.OPERATORE_API,
				RuoloOrganizzazione.OPERATORE_API);
	}

	@Test
	public void testCreateServizio_OperatoreApi_DominioPropriaOrganizzazione_Success() {
		Organizzazione org1 = creaOrganizzazione("org-dom-1-own", true, false);
		Organizzazione org2 = creaOrganizzazione("org-dom-2-own", true, false);
		Soggetto[] soggetti = new Soggetto[2];
		Dominio[] domini = new Dominio[2];
		preparaDominiDueOrganizzazioni("own", org1, org2, soggetti, domini);

		Utente utente = creaUtenteMultiOrg("test.dom.own", List.of(org1), RuoloOrganizzazioneEnum.OPERATORE_API);
		autenticaCome("test.dom.own");
		simulaContestoSessione(org1, RuoloOrganizzazione.OPERATORE_API);

		Servizio servizio = creaServizio("srv-own", domini[0], soggetti[0], utente);
		assertEquals(domini[0].getIdDominio(), servizio.getDominio().getIdDominio());
	}

	@Test
	public void testCreateServizio_SenzaContesto_DominioOrganizzazioneSenzaRuolo_Forbidden() {
		Organizzazione org1 = creaOrganizzazione("org-dom-1-noctx", true, false);
		Organizzazione org2 = creaOrganizzazione("org-dom-2-noctx", true, false);
		Soggetto[] soggetti = new Soggetto[2];
		Dominio[] domini = new Dominio[2];
		preparaDominiDueOrganizzazioni("noctx", org1, org2, soggetti, domini);

		Utente utente = creaUtenteMultiOrg("test.dom.noctx", List.of(org1),
				RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);
		autenticaCome("test.dom.noctx");
		// nessun contesto organizzazione (header assente): vale il ruolo sull'organizzazione del dominio

		NotAuthorizedException ex = assertThrows(NotAuthorizedException.class,
				() -> creaServizio("srv-noctx", domini[1], soggetti[1], utente));
		assertEquals("AUT.403", ex.getMessage());
	}

	@Test
	public void testCreateServizio_SenzaContesto_DominioOrganizzazioneConRuolo_Success() {
		Organizzazione org1 = creaOrganizzazione("org-dom-1-noctx-ok", true, false);
		Organizzazione org2 = creaOrganizzazione("org-dom-2-noctx-ok", true, false);
		Soggetto[] soggetti = new Soggetto[2];
		Dominio[] domini = new Dominio[2];
		preparaDominiDueOrganizzazioni("noctx-ok", org1, org2, soggetti, domini);

		Utente utente = creaUtenteMultiOrg("test.dom.noctx.ok", List.of(org1, org2),
				RuoloOrganizzazioneEnum.OPERATORE_API);
		autenticaCome("test.dom.noctx.ok");

		Servizio servizio = creaServizio("srv-noctx-ok", domini[1], soggetti[1], utente);
		assertEquals(domini[1].getIdDominio(), servizio.getDominio().getIdDominio());
	}

	@Test
	public void testCreateServizio_Gestore_DominioAltraOrganizzazione_Success() {
		Organizzazione org1 = creaOrganizzazione("org-dom-1-gest", true, false);
		Organizzazione org2 = creaOrganizzazione("org-dom-2-gest", true, false);
		Soggetto[] soggetti = new Soggetto[2];
		Dominio[] domini = new Dominio[2];
		preparaDominiDueOrganizzazioni("gest", org1, org2, soggetti, domini);

		Utente utente = creaUtenteMultiOrg("test.dom.gest.ref", List.of(org2), RuoloOrganizzazioneEnum.OPERATORE_API);
		// resta il gestore, con un contesto organizzazione diverso da quella del dominio
		simulaContestoSessione(org1, null);

		Servizio servizio = creaServizio("srv-gest", domini[1], soggetti[1], utente);
		assertEquals(domini[1].getIdDominio(), servizio.getDominio().getIdDominio());
	}

	@Test
	public void testAuthorizeDominio_Coordinatore_DominioAltraOrganizzazione_Success() {
		Organizzazione org1 = creaOrganizzazione("org-dom-1-coord", true, false);
		Organizzazione org2 = creaOrganizzazione("org-dom-2-coord", true, false);
		Soggetto[] soggetti = new Soggetto[2];
		Dominio[] domini = new Dominio[2];
		preparaDominiDueOrganizzazioni("coord", org1, org2, soggetti, domini);

		UtenteCreate uc = CommonUtils.getUtenteCreate();
		uc.setPrincipal("test.dom.coord");
		uc.setRuolo(RuoloUtenteEnum.COORDINATORE);
		utentiController.createUtente(uc);
		autenticaCome("test.dom.coord");
		simulaContestoSessione(org1, RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);

		DominioEntity dominio = this.dominioService.find(domini[1].getIdDominio()).get();
		servizioAuthorization.authorizeDominio(dominio, true);
		servizioAuthorization.authorizeDominio(dominio, false);
	}

	@Test
	public void testUpdateServizio_AmmOrg_SpostamentoInDominioAltraOrganizzazione_Forbidden() {
		Organizzazione org1 = creaOrganizzazione("org-dom-1-upd", true, false);
		Organizzazione org2 = creaOrganizzazione("org-dom-2-upd", true, false);
		Soggetto[] soggetti = new Soggetto[2];
		Dominio[] domini = new Dominio[2];
		preparaDominiDueOrganizzazioni("upd", org1, org2, soggetti, domini);

		// amministratore di entrambe le organizzazioni, ma in sessione opera per org1
		Utente utente = creaUtenteMultiOrg("test.dom.upd", List.of(org1, org2),
				RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);
		autenticaCome("test.dom.upd");
		simulaContestoSessione(org1, RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);
		Servizio servizio = creaServizio("srv-upd", domini[0], soggetti[0], utente);

		ServizioUpdate update = getUpdateDominio(servizio, domini[1], soggetti[1]);
		NotAuthorizedException ex = assertThrows(NotAuthorizedException.class,
				() -> serviziController.updateServizio(servizio.getIdServizio(), null, update));
		assertEquals("AUT.403.AMM.ORG.DOMINIO.FUORI.ORG", ex.getMessage());
		assertEquals(org1.getNome(), ex.getParameters().get("orgNome"));
	}

	@Test
	public void testUpdateServizio_AmmOrg_SpostamentoInDominioPropriaOrganizzazione_Success() {
		Organizzazione org1 = creaOrganizzazione("org-dom-1-upd-ok", true, false);
		Organizzazione org2 = creaOrganizzazione("org-dom-2-upd-ok", true, false);
		Soggetto[] soggetti = new Soggetto[2];
		Dominio[] domini = new Dominio[2];
		preparaDominiDueOrganizzazioni("upd-ok", org1, org2, soggetti, domini);
		Dominio altroDominioOrg1 = creaDominio("dom-1b-upd-ok", soggetti[0]);

		Utente utente = creaUtenteMultiOrg("test.dom.upd.ok", List.of(org1),
				RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);
		autenticaCome("test.dom.upd.ok");
		simulaContestoSessione(org1, RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);
		Servizio servizio = creaServizio("srv-upd-ok", domini[0], soggetti[0], utente);

		Servizio aggiornato = serviziController.updateServizio(servizio.getIdServizio(), null,
				getUpdateDominio(servizio, altroDominioOrg1, soggetti[0])).getBody();
		assertEquals(altroDominioOrg1.getIdDominio(), aggiornato.getDominio().getIdDominio());
	}

	// ------------------------------------------------------------------
	// Issue 471: visibilita` e poteri dell'amministratore dell'organizzazione
	// erogatrice (servizi e adesioni ai servizi dell'organizzazione) e aderente
	// (servizi a cui l'organizzazione ha aderito, in sola consultazione)
	// ------------------------------------------------------------------

	/**
	 * Organizzazione erogatrice con dominio e servizio (referente: un operatore dell'erogatrice),
	 * organizzazione aderente con il suo soggetto e un referente, un amministratore per ciascuna.
	 */
	private record ScenarioAmmOrg(Organizzazione orgErogatrice, Organizzazione orgAderente,
			Soggetto soggettoAderente, Utente referenteAderente, Servizio servizio,
			String ammErogatrice, String ammAderente) {}

	private ScenarioAmmOrg preparaScenarioAmmOrg(String suffisso, VisibilitaServizioEnum visibilita) {
		Organizzazione orgErogatrice = creaOrganizzazione("org-ero-" + suffisso, true, true);
		Organizzazione orgAderente = creaOrganizzazione("org-ade-" + suffisso, false, true);

		Utente referenteServizio = creaUtenteMultiOrg("ref.ero." + suffisso, List.of(orgErogatrice),
				RuoloOrganizzazioneEnum.OPERATORE_API);
		Utente referenteAderente = creaUtenteMultiOrg("ref.ade." + suffisso, List.of(orgAderente),
				RuoloOrganizzazioneEnum.OPERATORE_API);
		creaUtenteMultiOrg("amm.ero." + suffisso, List.of(orgErogatrice),
				RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);
		creaUtenteMultiOrg("amm.ade." + suffisso, List.of(orgAderente),
				RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);

		Soggetto soggettoErogatore = creaSoggetto("sogg-ero-" + suffisso, orgErogatrice);
		Soggetto soggettoAderente = creaSoggetto("sogg-ade-" + suffisso, orgAderente);
		// nome "Test": dominio ammesso dal profilo dell'API usata per avanzare nel workflow
		Dominio dominio = creaDominio("Test", soggettoErogatore);
		Servizio servizio = creaServizio("srv-ero-" + suffisso, dominio, soggettoErogatore, referenteServizio, visibilita);

		return new ScenarioAmmOrg(orgErogatrice, orgAderente, soggettoAderente, referenteAderente, servizio,
				"amm.ero." + suffisso, "amm.ade." + suffisso);
	}

	/** Torna al gestore e senza contesto organizzazione. */
	private void autenticaComeGestore() {
		autenticaCome(UTENTE_GESTORE);
		organizationContext.setIdOrganizzazione(null);
		organizationContext.setRuoloOrganizzazione(null);
		organizationContext.setInitialized(false);
	}

	private void cambiaStatoServizio(UUID idServizio, String stato) {
		StatoUpdate su = new StatoUpdate();
		su.setStato(stato);
		serviziController.updateStatoServizio(idServizio, su, null);
		this.entityManager.flush();
		this.entityManager.clear();
	}

	private void cambiaStatoAdesione(UUID idAdesione, String stato) {
		StatoUpdate su = new StatoUpdate();
		su.setStato(stato);
		adesioniController.updateStatoAdesione(idAdesione, su, null);
		this.entityManager.flush();
		this.entityManager.clear();
	}

	/**
	 * Porta l'adesione nello stato indicato senza passare dal workflow: i test che la usano verificano
	 * chi la vede e chi la autorizza, non i dati obbligatori della richiesta.
	 */
	private void impostaStatoAdesione(UUID idAdesione, String stato) {
		this.entityManager.createQuery("update AdesioneEntity a set a.stato = :stato where a.idAdesione = :id")
				.setParameter("stato", stato)
				.setParameter("id", idAdesione.toString())
				.executeUpdate();
		this.entityManager.clear();
	}

	private PagedModelItemServizio listServizi(Boolean inAttesa, Boolean mieiServizi,
			List<RuoloReferenteEnum> ruoloReferente, Boolean dashboard) {
		return serviziController.listServizi(null, null, null, null, null, null, null, null, null, null, null,
				inAttesa, mieiServizi, ruoloReferente, dashboard, null, null, null, null, null, null, null, null, null,
				0, 100, null).getBody();
	}

	private PagedModelItemAdesione listAdesioni(List<RuoloReferenteEnum> ruoloReferente, Boolean dashboard) {
		return adesioniController.listAdesioni(null, null, null, null, null, null, null, null, null,
				null, null, ruoloReferente, dashboard, null, null, null, 0, 100, null).getBody();
	}

	/** Esegue l'azione con gli stati di dashboard del ruolo indicati, ripristinando poi la configurazione. */
	private void conStatiDashboard(ConfigurazioneWorkflow workflow, ConfigurazioneRuolo ruolo, List<String> stati, Runnable azione) {
		List<ConfigurazioneStatoDashboard> originali = workflow.getStatiDashboard();
		List<ConfigurazioneStatoDashboard> nuovi = new ArrayList<>();
		if(originali != null) {
			nuovi.addAll(originali);
		}
		nuovi.add(new ConfigurazioneStatoDashboard(ruolo, stati));
		workflow.setStatiDashboard(nuovi);
		try {
			azione.run();
		} finally {
			workflow.setStatiDashboard(originali);
		}
	}

	@Test
	public void testAmmOrgErogatrice_VedeEAutorizzaServizioNonPubblicato() {
		ScenarioAmmOrg sc = preparaScenarioAmmOrg("471-srv", VisibilitaServizioEnum.PUBBLICO);
		UUID idServizio = sc.servizio().getIdServizio();
		String nome = sc.servizio().getNome();

		// bozza: visibile all'amministratore dell'erogatrice in sessione
		autenticaCome(sc.ammErogatrice());
		simulaContestoSessione(sc.orgErogatrice(), RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);
		assertEquals(idServizio, serviziController.getServizio(idServizio).getBody().getIdServizio());
		assertTrue(contieneServizio(listServizi(null, null, null, null), nome));

		autenticaComeGestore();
		creaApiDominio(idServizio);
		cambiaStatoServizio(idServizio, "richiesto_collaudo");

		autenticaCome(sc.ammErogatrice());
		simulaContestoSessione(sc.orgErogatrice(), RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);
		assertTrue(contieneServizio(listServizi(true, null, null, null), nome), "Il servizio da autorizzare deve risultare in attesa");
		assertTrue(contieneServizio(listServizi(null, true, List.of(RuoloReferenteEnum.AMMINISTRATORE_ORGANIZZAZIONE), null), nome));
		Grant grant = serviziController.getGrantServizio(idServizio).getBody();
		assertTrue(grant.getRuoli().contains(Ruolo.REFERENTE_SUPERIORE));

		cambiaStatoServizio(idServizio, "autorizzato_collaudo");

		autenticaComeGestore();
		assertEquals("autorizzato_collaudo", serviziController.getServizio(idServizio).getBody().getStato());
	}

	@Test
	public void testAmmOrg_ServizioNonPubblicato_NonVisibileSenzaContestoOFuoriOrg() {
		ScenarioAmmOrg sc = preparaScenarioAmmOrg("471-ctx", VisibilitaServizioEnum.PUBBLICO);
		UUID idServizio = sc.servizio().getIdServizio();

		// senza contesto organizzazione: nessuna visibilita` da amministratore
		autenticaCome(sc.ammErogatrice());
		assertThrows(NotFoundException.class, () -> serviziController.getServizio(idServizio));

		// amministratore dell'aderente, che non ha aderito: il servizio in bozza non e` visibile
		autenticaCome(sc.ammAderente());
		simulaContestoSessione(sc.orgAderente(), RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);
		assertThrows(NotFoundException.class, () -> serviziController.getServizio(idServizio));

		// operatore API dell'erogatrice: la visibilita` estesa vale solo per l'amministratore
		autenticaCome(sc.ammErogatrice());
		simulaContestoSessione(sc.orgErogatrice(), RuoloOrganizzazione.OPERATORE_API);
		assertThrows(NotFoundException.class, () -> serviziController.getServizio(idServizio));
	}

	@Test
	public void testAmmOrgErogatrice_VedeEAutorizzaAdesione() {
		ScenarioAmmOrg sc = preparaScenarioAmmOrg("471-ade", VisibilitaServizioEnum.PUBBLICO);
		UUID idServizio = sc.servizio().getIdServizio();
		pubblicaInCollaudo(idServizio);
		UUID idAdesione = creaAdesione(idServizio, sc.soggettoAderente(), sc.referenteAderente()).getIdAdesione();
		impostaStatoAdesione(idAdesione, "richiesto_collaudo");

		// senza contesto organizzazione: l'adesione non e` visibile
		autenticaCome(sc.ammErogatrice());
		assertThrows(NotFoundException.class, () -> adesioniController.getAdesione(idAdesione));

		simulaContestoSessione(sc.orgErogatrice(), RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);
		assertEquals(idAdesione, adesioniController.getAdesione(idAdesione).getBody().getIdAdesione());
		assertTrue(contieneAdesione(listAdesioni(), idAdesione));
		assertTrue(contieneAdesione(listAdesioni(List.of(RuoloReferenteEnum.AMMINISTRATORE_ORGANIZZAZIONE), null), idAdesione));
		Grant grant = adesioniController.getGrantAdesione(idAdesione).getBody();
		assertTrue(grant.getRuoli().contains(Ruolo.REFERENTE_SUPERIORE));

		// il permesso si verifica prima dei dati obbligatori: il 422 sui dati mancanti dell'adesione
		// indica che l'amministratore dell'erogatrice e` abilitato ad autorizzare
		assertThrows(UpdateEntitaComplessaNonValidaSemanticamenteException.class,
				() -> cambiaStatoAdesione(idAdesione, "autorizzato_collaudo"));

		// per confronto, il referente dell'adesione non e` abilitato ad autorizzare
		organizationContext.setIdOrganizzazione(null);
		organizationContext.setRuoloOrganizzazione(null);
		autenticaCome(sc.referenteAderente().getPrincipal());
		assertThrows(NotAuthorizedException.class, () -> cambiaStatoAdesione(idAdesione, "autorizzato_collaudo"));
	}

	@Test
	public void testAmmOrg_FiltroRuoloReferentePerLato() {
		ScenarioAmmOrg sc = preparaScenarioAmmOrg("471-lato", VisibilitaServizioEnum.PUBBLICO);
		UUID idServizio = sc.servizio().getIdServizio();
		pubblicaInCollaudo(idServizio);
		UUID idAdesione = creaAdesione(idServizio, sc.soggettoAderente(), sc.referenteAderente()).getIdAdesione();

		// ruoli inviati dalle linguette "Referente servizio / dominio" e "Referente adesione" della console
		List<RuoloReferenteEnum> linguettaReferenteServizio = List.of(RuoloReferenteEnum.REFERENTE_DOMINIO,
				RuoloReferenteEnum.REFERENTE_TECNICO_DOMINIO, RuoloReferenteEnum.REFERENTE_SERVIZIO,
				RuoloReferenteEnum.REFERENTE_TECNICO_SERVIZIO, RuoloReferenteEnum.AMMINISTRATORE_ORGANIZZAZIONE_EROGATRICE,
				RuoloReferenteEnum.OPERATORE_API);
		List<RuoloReferenteEnum> linguettaReferenteAdesione = List.of(RuoloReferenteEnum.REFERENTE_ADESIONE,
				RuoloReferenteEnum.REFERENTE_TECNICO_ADESIONE, RuoloReferenteEnum.AMMINISTRATORE_ORGANIZZAZIONE_ADERENTE,
				RuoloReferenteEnum.OPERATORE_API);

		// amministratore dell'erogatrice: l'adesione e` sul suo lato erogatore
		autenticaCome(sc.ammErogatrice());
		simulaContestoSessione(sc.orgErogatrice(), RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);
		assertTrue(contieneAdesione(listAdesioni(List.of(RuoloReferenteEnum.AMMINISTRATORE_ORGANIZZAZIONE), null), idAdesione));
		assertTrue(contieneAdesione(listAdesioni(List.of(RuoloReferenteEnum.AMMINISTRATORE_ORGANIZZAZIONE_EROGATRICE), null), idAdesione));
		assertFalse(contieneAdesione(listAdesioni(List.of(RuoloReferenteEnum.AMMINISTRATORE_ORGANIZZAZIONE_ADERENTE), null), idAdesione));
		assertTrue(contieneAdesione(listAdesioni(linguettaReferenteServizio, null), idAdesione));
		assertFalse(contieneAdesione(listAdesioni(linguettaReferenteAdesione, null), idAdesione));

		// sui servizi il lato erogatore equivale ad amministratore_organizzazione, il lato aderente e` un ruolo di adesione
		assertTrue(contieneServizio(listServizi(null, true, List.of(RuoloReferenteEnum.AMMINISTRATORE_ORGANIZZAZIONE_EROGATRICE), null),
				sc.servizio().getNome()));
		assertThrows(BadRequestException.class,
				() -> listServizi(null, true, List.of(RuoloReferenteEnum.AMMINISTRATORE_ORGANIZZAZIONE_ADERENTE), null));

		// amministratore dell'aderente: l'adesione e` sul suo lato aderente
		autenticaCome(sc.ammAderente());
		simulaContestoSessione(sc.orgAderente(), RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);
		assertTrue(contieneAdesione(listAdesioni(List.of(RuoloReferenteEnum.AMMINISTRATORE_ORGANIZZAZIONE), null), idAdesione));
		assertTrue(contieneAdesione(listAdesioni(List.of(RuoloReferenteEnum.AMMINISTRATORE_ORGANIZZAZIONE_ADERENTE), null), idAdesione));
		assertFalse(contieneAdesione(listAdesioni(List.of(RuoloReferenteEnum.AMMINISTRATORE_ORGANIZZAZIONE_EROGATRICE), null), idAdesione));
		assertTrue(contieneAdesione(listAdesioni(linguettaReferenteAdesione, null), idAdesione));
		assertFalse(contieneAdesione(listAdesioni(linguettaReferenteServizio, null), idAdesione));

		// senza contesto organizzazione i valori per lato non selezionano nulla
		organizationContext.setIdOrganizzazione(null);
		organizationContext.setRuoloOrganizzazione(null);
		assertFalse(contieneAdesione(listAdesioni(List.of(RuoloReferenteEnum.AMMINISTRATORE_ORGANIZZAZIONE_ADERENTE), null), idAdesione));
	}

	@Test
	public void testAmmOrgAderente_ConsultaServizioRiservatoMaNonAutorizzaAdesione() {
		ScenarioAmmOrg sc = preparaScenarioAmmOrg("471-ris", VisibilitaServizioEnum.RISERVATO);
		UUID idServizio = sc.servizio().getIdServizio();
		pubblicaInCollaudo(idServizio);
		UUID idAdesione = creaAdesione(idServizio, sc.soggettoAderente(), sc.referenteAderente()).getIdAdesione();
		impostaStatoAdesione(idAdesione, "richiesto_collaudo");

		// senza contesto organizzazione: il servizio riservato non e` visibile
		autenticaCome(sc.ammAderente());
		assertThrows(NotFoundException.class, () -> serviziController.getServizio(idServizio));

		simulaContestoSessione(sc.orgAderente(), RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);
		assertEquals(idServizio, serviziController.getServizio(idServizio).getBody().getIdServizio());
		assertTrue(contieneServizio(listServizi(null, null, null, null), sc.servizio().getNome()));

		// l'adesione si consulta, ma l'amministratore dell'aderente non ha ruoli di workflow
		assertEquals(idAdesione, adesioniController.getAdesione(idAdesione).getBody().getIdAdesione());
		assertTrue(contieneAdesione(listAdesioni(), idAdesione));
		Grant grant = adesioniController.getGrantAdesione(idAdesione).getBody();
		assertFalse(grant.getRuoli().contains(Ruolo.REFERENTE_SUPERIORE));
		assertThrows(NotFoundException.class, () -> cambiaStatoAdesione(idAdesione, "autorizzato_collaudo"));
	}

	@Test
	public void testAmmOrgErogatrice_DashboardServiziEAdesioni() {
		ScenarioAmmOrg sc = preparaScenarioAmmOrg("471-dash", VisibilitaServizioEnum.PUBBLICO);
		UUID idServizio = sc.servizio().getIdServizio();
		pubblicaInCollaudo(idServizio);
		UUID idAdesione = creaAdesione(idServizio, sc.soggettoAderente(), sc.referenteAderente()).getIdAdesione();
		impostaStatoAdesione(idAdesione, "richiesto_collaudo");
		cambiaStatoServizio(idServizio, "richiesto_produzione");

		autenticaCome(sc.ammErogatrice());
		simulaContestoSessione(sc.orgErogatrice(), RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);

		// senza stati di dashboard per referente_superiore la dashboard resta vuota
		assertFalse(contieneServizio(listServizi(null, null, null, true), sc.servizio().getNome()));
		assertFalse(contieneAdesione(listAdesioni(null, true), idAdesione));

		conStatiDashboard(this.configurazione.getServizio().getWorkflow(), ConfigurazioneRuolo.REFERENTE_SUPERIORE,
				List.of("richiesto_produzione"),
				() -> assertTrue(contieneServizio(listServizi(null, null, null, true), sc.servizio().getNome())));
		conStatiDashboard(this.configurazione.getAdesione().getWorkflow(), ConfigurazioneRuolo.REFERENTE_SUPERIORE,
				List.of("richiesto_collaudo"),
				() -> assertTrue(contieneAdesione(listAdesioni(null, true), idAdesione)));

		// l'amministratore dell'aderente non autorizza: le adesioni della sua organizzazione non
		// compaiono nella sua dashboard per gli stati di referente_superiore
		autenticaCome(sc.ammAderente());
		simulaContestoSessione(sc.orgAderente(), RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);
		conStatiDashboard(this.configurazione.getAdesione().getWorkflow(), ConfigurazioneRuolo.REFERENTE_SUPERIORE,
				List.of("richiesto_collaudo"),
				() -> assertFalse(contieneAdesione(listAdesioni(null, true), idAdesione)));
	}


	// ------------------------------------------------------------------
	// Issue 472: il ruolo operatore API dell'organizzazione non da` ruoli di workflow
	// sui servizi e sulle adesioni: contano solo i ruoli personali (referente,
	// referente tecnico, richiedente)
	// ------------------------------------------------------------------

	/**
	 * Servizio dell'organizzazione erogatrice richiesto da un operatore API ({@code opRichiedente})
	 * con un altro operatore come referente ({@code refServizio}), pubblicato in collaudo, e
	 * adesione richiesta da un operatore API dell'aderente ({@code opAderente}) con un altro
	 * operatore come referente ({@code refAderente}). {@code opEstraneo} e` un operatore API
	 * dell'erogatrice senza alcun legame con servizio e adesione.
	 */
	private record ScenarioOperatoreApi(Organizzazione orgErogatrice, Organizzazione orgAderente,
			UUID idServizio, UUID idAdesione, String opRichiedente, String refServizio, String opEstraneo,
			String opAderente, String refAderente) {}

	private ScenarioOperatoreApi preparaScenarioOperatoreApi(String suffisso) {
		Organizzazione orgErogatrice = creaOrganizzazione("org-ero-" + suffisso, true, true);
		Organizzazione orgAderente = creaOrganizzazione("org-ade-" + suffisso, false, true);

		Utente refServizio = creaUtenteMultiOrg("ref.ero." + suffisso, List.of(orgErogatrice),
				RuoloOrganizzazioneEnum.OPERATORE_API);
		creaUtenteMultiOrg("op.ero." + suffisso, List.of(orgErogatrice), RuoloOrganizzazioneEnum.OPERATORE_API);
		creaUtenteMultiOrg("op.estraneo." + suffisso, List.of(orgErogatrice), RuoloOrganizzazioneEnum.OPERATORE_API);
		Utente refAderente = creaUtenteMultiOrg("ref.ade." + suffisso, List.of(orgAderente),
				RuoloOrganizzazioneEnum.OPERATORE_API);
		creaUtenteMultiOrg("op.ade." + suffisso, List.of(orgAderente), RuoloOrganizzazioneEnum.OPERATORE_API);

		Soggetto soggettoErogatore = creaSoggetto("sogg-ero-" + suffisso, orgErogatrice);
		Soggetto soggettoAderente = creaSoggetto("sogg-ade-" + suffisso, orgAderente);
		// nome "Test": dominio ammesso dal profilo dell'API usata per avanzare nel workflow
		Dominio dominio = creaDominio("Test", soggettoErogatore);

		autenticaCome("op.ero." + suffisso);
		simulaContestoSessione(orgErogatrice, RuoloOrganizzazione.OPERATORE_API);
		UUID idServizio = creaServizio("srv-ero-" + suffisso, dominio, soggettoErogatore, refServizio).getIdServizio();

		autenticaComeGestore();
		pubblicaInCollaudo(idServizio);

		autenticaCome("op.ade." + suffisso);
		simulaContestoSessione(orgAderente, RuoloOrganizzazione.OPERATORE_API);
		UUID idAdesione = creaAdesione(idServizio, soggettoAderente, refAderente).getIdAdesione();

		return new ScenarioOperatoreApi(orgErogatrice, orgAderente, idServizio, idAdesione,
				"op.ero." + suffisso, "ref.ero." + suffisso, "op.estraneo." + suffisso,
				"op.ade." + suffisso, "ref.ade." + suffisso);
	}

	@Test
	public void testOperatoreApiErogatrice_NonReferente_NessunRuoloSulServizio() {
		ScenarioOperatoreApi sc = preparaScenarioOperatoreApi("472-srv");
		UUID idServizio = sc.idServizio();

		autenticaCome(sc.opEstraneo());
		simulaContestoSessione(sc.orgErogatrice(), RuoloOrganizzazione.OPERATORE_API);

		// il servizio pubblicato resta consultabile, ma senza ruoli ne' dati scrivibili
		assertEquals(idServizio, serviziController.getServizio(idServizio).getBody().getIdServizio());
		Grant grant = serviziController.getGrantServizio(idServizio).getBody();
		assertTrue(grant.getRuoli().isEmpty(), "Ruoli inattesi: " + grant.getRuoli());
		assertEquals(GrantType.NESSUNO, grant.getReferenti());
		assertEquals(GrantType.NESSUNO, grant.getGenerico());

		// non puo` nominarsi referente per ottenere la gestione del servizio
		ReferenteCreate rc = new ReferenteCreate();
		rc.setTipo(TipoReferenteEnum.REFERENTE);
		rc.setIdUtente(UUID.fromString(this.utenteService.findByPrincipal(sc.opEstraneo()).get().getIdUtente()));
		assertThrows(NotAuthorizedException.class,
				() -> serviziController.createReferenteServizio(idServizio, null, rc));

		// ne' accedere al monitoraggio
		autenticaComeGestore();
		ServizioEntity servizio = this.servizioService.find(idServizio).get();
		autenticaCome(sc.opEstraneo());
		simulaContestoSessione(sc.orgErogatrice(), RuoloOrganizzazione.OPERATORE_API);
		assertFalse(this.servizioAuthorization.isMonitoraggioConsentito(servizio));
	}

	@Test
	public void testOperatoreApiErogatrice_RuoliPersonaliSulServizio() {
		ScenarioOperatoreApi sc = preparaScenarioOperatoreApi("472-pers");
		UUID idServizio = sc.idServizio();

		// il richiedente resta richiedente, senza il ruolo referente
		autenticaCome(sc.opRichiedente());
		simulaContestoSessione(sc.orgErogatrice(), RuoloOrganizzazione.OPERATORE_API);
		Grant grant = serviziController.getGrantServizio(idServizio).getBody();
		assertEquals(List.of(Ruolo.RICHIEDENTE), grant.getRuoli());

		// il referente del servizio mantiene il ruolo e il monitoraggio
		autenticaCome(sc.refServizio());
		simulaContestoSessione(sc.orgErogatrice(), RuoloOrganizzazione.OPERATORE_API);
		grant = serviziController.getGrantServizio(idServizio).getBody();
		assertEquals(List.of(Ruolo.REFERENTE), grant.getRuoli());
		assertTrue(this.servizioAuthorization.isMonitoraggioConsentito(this.servizioService.find(idServizio).get()));
	}

	@Test
	public void testOperatoreApi_RuoliPersonaliSullAdesione() {
		ScenarioOperatoreApi sc = preparaScenarioOperatoreApi("472-ade");
		UUID idAdesione = sc.idAdesione();

		// lato erogatore: il richiedente del servizio vede l'adesione ma non la gestisce
		autenticaCome(sc.opRichiedente());
		simulaContestoSessione(sc.orgErogatrice(), RuoloOrganizzazione.OPERATORE_API);
		Grant grant = adesioniController.getGrantAdesione(idAdesione).getBody();
		assertTrue(grant.getRuoli().isEmpty(), "Ruoli inattesi: " + grant.getRuoli());
		assertEquals(GrantType.NESSUNO, grant.getReferenti());

		// lato aderente: il richiedente dell'adesione resta richiedente, senza il ruolo referente
		autenticaCome(sc.opAderente());
		simulaContestoSessione(sc.orgAderente(), RuoloOrganizzazione.OPERATORE_API);
		grant = adesioniController.getGrantAdesione(idAdesione).getBody();
		assertEquals(List.of(Ruolo.RICHIEDENTE), grant.getRuoli());

		// il referente dell'adesione mantiene il ruolo e la gestione dei referenti
		autenticaCome(sc.refAderente());
		simulaContestoSessione(sc.orgAderente(), RuoloOrganizzazione.OPERATORE_API);
		grant = adesioniController.getGrantAdesione(idAdesione).getBody();
		assertEquals(List.of(Ruolo.REFERENTE), grant.getRuoli());
		assertEquals(GrantType.SCRITTURA, grant.getReferenti());
	}

}
