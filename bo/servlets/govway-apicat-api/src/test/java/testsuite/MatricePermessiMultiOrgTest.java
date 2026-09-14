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
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.RuoloOrganizzazione;
import org.govway.catalogo.core.services.OrganizzazioneService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.servlets.model.APICreate;
import org.govway.catalogo.servlets.model.APIDatiAmbienteCreate;
import org.govway.catalogo.servlets.model.APIDatiErogazione;
import org.govway.catalogo.servlets.model.Adesione;
import org.govway.catalogo.servlets.model.AuthTypeApiResource;
import org.govway.catalogo.servlets.model.AdesioneCreate;
import org.govway.catalogo.servlets.model.DocumentoCreate;
import org.govway.catalogo.servlets.model.Dominio;
import org.govway.catalogo.servlets.model.DominioCreate;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.OrganizzazioneCreate;
import org.govway.catalogo.servlets.model.PagedModelItemAdesione;
import org.govway.catalogo.servlets.model.PagedModelItemDominio;
import org.govway.catalogo.servlets.model.PagedModelItemServizio;
import org.govway.catalogo.servlets.model.ProtocolloEnum;
import org.govway.catalogo.servlets.model.ReferenteCreate;
import org.govway.catalogo.servlets.model.RuoloAPIEnum;
import org.govway.catalogo.servlets.model.RuoloOrganizzazioneEnum;
import org.govway.catalogo.servlets.model.RuoloUtenteEnum;
import org.govway.catalogo.servlets.model.Servizio;
import org.govway.catalogo.servlets.model.ServizioCreate;
import org.govway.catalogo.servlets.model.Soggetto;
import org.govway.catalogo.servlets.model.SoggettoCreate;
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
	private ServizioAuthorization servizioAuthorization;

	@Autowired
	private AdesioneAuthorization adesioneAuthorization;

	@Autowired
	private OrganizationContext organizationContext;

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
		ServizioCreate sc = CommonUtils.getServizioCreate();
		sc.setNome(nome);
		sc.setVisibilita(VisibilitaServizioEnum.PUBBLICO);
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

		CommonUtils.cambioStatoFinoA("pubblicato_collaudo", serviziController, idServizio);
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
		return serviziController.listServizi(null, null, null, null, null, null, null, null, null, null,
				null, mieiServizi, null, dashboard, null, null, null, null, null, null, null, null,
				0, 100, null).getBody();
	}

	private PagedModelItemAdesione listAdesioni() {
		return adesioniController.listAdesioni(null, null, null, null, null, null, null, null, null,
				null, null, null, null, null, null, 0, 100, null).getBody();
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

}
