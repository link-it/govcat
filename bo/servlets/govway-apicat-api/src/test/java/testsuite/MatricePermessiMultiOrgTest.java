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

import java.util.List;
import java.util.UUID;

import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.OrganizationContext;
import org.govway.catalogo.authorization.AdesioneAuthorization;
import org.govway.catalogo.authorization.ServizioAuthorization;
import org.govway.catalogo.controllers.DominiController;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.controllers.SoggettiController;
import org.govway.catalogo.controllers.UtentiController;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.RuoloOrganizzazione;
import org.govway.catalogo.core.services.OrganizzazioneService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.servlets.model.AdesioneCreate;
import org.govway.catalogo.servlets.model.Dominio;
import org.govway.catalogo.servlets.model.DominioCreate;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.OrganizzazioneCreate;
import org.govway.catalogo.servlets.model.PagedModelItemDominio;
import org.govway.catalogo.servlets.model.RuoloOrganizzazioneEnum;
import org.govway.catalogo.servlets.model.RuoloUtenteEnum;
import org.govway.catalogo.servlets.model.ServizioCreate;
import org.govway.catalogo.servlets.model.Soggetto;
import org.govway.catalogo.servlets.model.SoggettoCreate;
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
import org.springframework.boot.autoconfigure.groovy.template.GroovyTemplateAutoConfiguration;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace;
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
@EnableAutoConfiguration(exclude = {GroovyTemplateAutoConfiguration.class})
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
				null, null, null, null, null, null, null, 0, 100, null).getBody();

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
				null, null, null, null, null, null, null, 0, 100, null).getBody();

		boolean visto1 = list.getContent().stream().anyMatch(d -> "gest-dom-1".equals(d.getNome()));
		boolean visto2 = list.getContent().stream().anyMatch(d -> "gest-dom-2".equals(d.getNome()));
		assertTrue(visto1, "Il gestore deve vedere dom di org1");
		assertTrue(visto2, "Il gestore deve vedere dom di org2");
	}

}
