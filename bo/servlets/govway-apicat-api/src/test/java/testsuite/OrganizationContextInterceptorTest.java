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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.util.List;

import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.OrganizationContext;
import org.govway.catalogo.OrganizationContextInterceptor;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.controllers.UtentiController;
import org.govway.catalogo.core.orm.entity.RuoloOrganizzazione;
import org.govway.catalogo.core.services.OrganizzazioneService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.OrganizzazioneCreate;
import org.govway.catalogo.servlets.model.RuoloOrganizzazioneEnum;
import org.govway.catalogo.servlets.model.RuoloUtenteEnum;
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
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.transaction.annotation.Transactional;

/**
 * Test per OrganizationContextInterceptor: valida il comportamento del meccanismo di
 * risoluzione del contesto organizzazione tramite header X-Organization-Context.
 */
@ExtendWith(SpringExtension.class)
@SpringBootTest(classes = OpenAPI2SpringBoot.class)
@EnableAutoConfiguration(exclude = {GroovyTemplateAutoConfiguration.class})
@AutoConfigureTestDatabase(replace = Replace.ANY)
@ActiveProfiles("test")
@DirtiesContext(classMode = ClassMode.BEFORE_CLASS)
@TestInstance(TestInstance.Lifecycle.PER_METHOD)
@Transactional
public class OrganizationContextInterceptorTest {

	@Mock
	private SecurityContext securityContext;

	@Mock
	private Authentication authentication;

	@Autowired
	private OrganizzazioniController organizzazioniController;

	@Autowired
	private UtentiController utentiController;

	@Autowired
	private UtenteService utenteService;

	@Autowired
	private OrganizzazioneService organizzazioneService;

	@Autowired
	private OrganizationContextInterceptor interceptor;

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

		// Reset dello stato del bean request-scoped
		organizationContext.setIdOrganizzazione(null);
		organizationContext.setRuoloOrganizzazione(null);
		organizationContext.setInitialized(false);
	}

	@AfterEach
	public void tearDown() {
		SecurityContextHolder.clearContext();
	}

	private Organizzazione creaOrganizzazione(String nome) {
		OrganizzazioneCreate oc = CommonUtils.getOrganizzazioneCreate();
		oc.setNome(nome);
		return organizzazioniController.createOrganizzazione(oc).getBody();
	}

	/**
	 * Crea un utente associato a una lista di organizzazioni con il ruolo indicato
	 * e imposta la security context con quell'utente come principal autenticato.
	 */
	private Utente creaUtenteEAutentica(String principal, List<Organizzazione> orgs, RuoloOrganizzazioneEnum ruolo) {
		UtenteCreate uc = CommonUtils.getUtenteCreate();
		uc.setPrincipal(principal);
		uc.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
		uc.setOrganizzazioni(orgs.stream().map(o -> {
			UtenteOrganizzazioneCreate a = new UtenteOrganizzazioneCreate();
			a.setIdOrganizzazione(o.getIdOrganizzazione());
			a.setRuoloOrganizzazione(ruolo);
			return a;
		}).toList());
		Utente creato = utentiController.createUtente(uc).getBody();

		// Setta il nuovo utente come principal autenticato
		InfoProfilo infoUtente = new InfoProfilo(principal,
				this.utenteService.findByPrincipal(principal).get(), List.of());
		when(this.authentication.getPrincipal()).thenReturn(infoUtente);

		return creato;
	}

	@Test
	public void testHeaderValido_ContestoPopolato() throws Exception {
		Organizzazione org = creaOrganizzazione("org-interc-1");
		creaUtenteEAutentica("interc.valido", List.of(org), RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);

		MockHttpServletRequest req = new MockHttpServletRequest();
		req.addHeader(OrganizationContextInterceptor.HEADER_NAME, org.getIdOrganizzazione().toString());
		MockHttpServletResponse resp = new MockHttpServletResponse();

		boolean result = interceptor.preHandle(req, resp, new Object());

		assertTrue(result);
		assertTrue(organizationContext.isInitialized());
		assertTrue(organizationContext.hasOrganizzazione());
		assertNotNull(organizationContext.getIdOrganizzazione());
		Long expectedId = organizzazioneService.find(org.getIdOrganizzazione()).get().getId();
		assertEquals(expectedId, organizationContext.getIdOrganizzazione());
		assertEquals(RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE,
				organizationContext.getRuoloOrganizzazione());
	}

	@Test
	public void testHeaderOrgNonAssociata_BadRequest() throws Exception {
		Organizzazione orgUtente = creaOrganizzazione("org-interc-owner");
		Organizzazione orgAltrui = creaOrganizzazione("org-interc-other");
		creaUtenteEAutentica("interc.altrui", List.of(orgUtente), RuoloOrganizzazioneEnum.OPERATORE_API);

		MockHttpServletRequest req = new MockHttpServletRequest();
		req.addHeader(OrganizationContextInterceptor.HEADER_NAME, orgAltrui.getIdOrganizzazione().toString());
		MockHttpServletResponse resp = new MockHttpServletResponse();

		boolean result = interceptor.preHandle(req, resp, new Object());

		assertFalse(result);
		assertEquals(400, resp.getStatus());
		assertFalse(organizationContext.hasOrganizzazione());
	}

	@Test
	public void testHeaderAssenteUnaOrg_AutoDetect() throws Exception {
		Organizzazione org = creaOrganizzazione("org-interc-unica");
		creaUtenteEAutentica("interc.unica", List.of(org), RuoloOrganizzazioneEnum.OPERATORE_API);

		MockHttpServletRequest req = new MockHttpServletRequest();
		// Nessun header X-Organization-Context
		MockHttpServletResponse resp = new MockHttpServletResponse();

		boolean result = interceptor.preHandle(req, resp, new Object());

		assertTrue(result);
		assertTrue(organizationContext.hasOrganizzazione());
		Long expectedId = organizzazioneService.find(org.getIdOrganizzazione()).get().getId();
		assertEquals(expectedId, organizationContext.getIdOrganizzazione());
		assertEquals(RuoloOrganizzazione.OPERATORE_API,
				organizationContext.getRuoloOrganizzazione());
	}

	@Test
	public void testHeaderAssenteMultiOrg_ContestoVuoto() throws Exception {
		Organizzazione org1 = creaOrganizzazione("org-interc-multi-1");
		Organizzazione org2 = creaOrganizzazione("org-interc-multi-2");
		creaUtenteEAutentica("interc.multi", List.of(org1, org2), RuoloOrganizzazioneEnum.OPERATORE_API);

		MockHttpServletRequest req = new MockHttpServletRequest();
		MockHttpServletResponse resp = new MockHttpServletResponse();

		boolean result = interceptor.preHandle(req, resp, new Object());

		// Con N org senza header, il contesto è vuoto ma la richiesta prosegue
		assertTrue(result);
		assertTrue(organizationContext.isInitialized());
		assertFalse(organizationContext.hasOrganizzazione());
		assertNull(organizationContext.getIdOrganizzazione());
	}

	@Test
	public void testUtenteAnonimo_ContestoVuoto() throws Exception {
		// Utente non autenticato
		SecurityContextHolder.clearContext();

		MockHttpServletRequest req = new MockHttpServletRequest();
		req.addHeader(OrganizationContextInterceptor.HEADER_NAME, "any-value");
		MockHttpServletResponse resp = new MockHttpServletResponse();

		boolean result = interceptor.preHandle(req, resp, new Object());

		assertTrue(result);
		assertTrue(organizationContext.isInitialized());
		assertFalse(organizationContext.hasOrganizzazione());
	}

	@Test
	public void testHeaderConPiuOrgSceltaSpecifica() throws Exception {
		Organizzazione org1 = creaOrganizzazione("org-interc-scelta-1");
		Organizzazione org2 = creaOrganizzazione("org-interc-scelta-2");
		creaUtenteEAutentica("interc.scelta", List.of(org1, org2),
				RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);

		// Sceglie esplicitamente org2 via header
		MockHttpServletRequest req = new MockHttpServletRequest();
		req.addHeader(OrganizationContextInterceptor.HEADER_NAME, org2.getIdOrganizzazione().toString());
		MockHttpServletResponse resp = new MockHttpServletResponse();

		boolean result = interceptor.preHandle(req, resp, new Object());

		assertTrue(result);
		Long expectedId = organizzazioneService.find(org2.getIdOrganizzazione()).get().getId();
		assertEquals(expectedId, organizationContext.getIdOrganizzazione());
	}

}
