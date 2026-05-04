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
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.util.List;

import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.controllers.UtentiController;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.OrganizzazioneCreate;
import org.govway.catalogo.servlets.model.RuoloOrganizzazioneEnum;
import org.govway.catalogo.servlets.model.RuoloUtenteEnum;
import org.govway.catalogo.servlets.model.Utente;
import org.govway.catalogo.servlets.model.UtenteCreate;
import org.govway.catalogo.servlets.model.UtenteOrganizzazioneCreate;
import org.govway.catalogo.servlets.model.UtenteUpdate;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.transaction.annotation.Transactional;

/**
 * Test multi-organizzazione: CRUD utente con lista organizzazioni, retrocompatibilità
 * alias id_organizzazione, verifica campi response organizzazioni e azienda_esterna.
 */
@ExtendWith(SpringExtension.class)
@SpringBootTest(classes = OpenAPI2SpringBoot.class)
@EnableAutoConfiguration(exclude = {GroovyTemplateAutoConfiguration.class})
@AutoConfigureTestDatabase(replace = Replace.ANY)
@ActiveProfiles("test")
@DirtiesContext(classMode = ClassMode.BEFORE_CLASS)
@TestInstance(TestInstance.Lifecycle.PER_METHOD)
@Transactional
public class MultiOrganizzazioneTest {

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

	private static final String UTENTE_GESTORE = "gestore";

	@BeforeEach
	public void setUp() {
		MockitoAnnotations.initMocks(this);
		when(this.securityContext.getAuthentication()).thenReturn(this.authentication);

		InfoProfilo infoProfiloGestore = new InfoProfilo(UTENTE_GESTORE,
				this.utenteService.findByPrincipal(UTENTE_GESTORE).get(), List.of());
		when(this.authentication.getPrincipal()).thenReturn(infoProfiloGestore);

		SecurityContextHolder.setContext(this.securityContext);
	}

	@AfterEach
	public void tearDown() {
		SecurityContextHolder.clearContext();
	}

	/**
	 * Crea un'organizzazione con i flag indicati e nome univoco.
	 */
	private Organizzazione creaOrganizzazione(String nome, boolean referente, boolean aderente) {
		OrganizzazioneCreate oc = CommonUtils.getOrganizzazioneCreate();
		oc.setNome(nome);
		oc.setReferente(referente);
		oc.setAderente(aderente);
		return organizzazioniController.createOrganizzazione(oc).getBody();
	}

	@Test
	public void testCreateUtenteConOrganizzazioniArray() {
		Organizzazione org1 = creaOrganizzazione("org-multi-1", true, false);
		Organizzazione org2 = creaOrganizzazione("org-multi-2", false, true);

		UtenteCreate utente = CommonUtils.getUtenteCreate();
		utente.setPrincipal("utente.multi.create");
		utente.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);

		UtenteOrganizzazioneCreate assoc1 = new UtenteOrganizzazioneCreate();
		assoc1.setIdOrganizzazione(org1.getIdOrganizzazione());
		assoc1.setRuoloOrganizzazione(RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);

		UtenteOrganizzazioneCreate assoc2 = new UtenteOrganizzazioneCreate();
		assoc2.setIdOrganizzazione(org2.getIdOrganizzazione());
		assoc2.setRuoloOrganizzazione(RuoloOrganizzazioneEnum.OPERATORE_API);

		utente.setOrganizzazioni(List.of(assoc1, assoc2));

		ResponseEntity<Utente> response = utentiController.createUtente(utente);
		assertEquals(HttpStatus.OK, response.getStatusCode());
		Utente body = response.getBody();
		assertNotNull(body);

		// Response deve contenere la lista organizzazioni
		assertNotNull(body.getOrganizzazioni());
		assertEquals(2, body.getOrganizzazioni().size());

		// Verifica che entrambe le associazioni siano presenti con il ruolo corretto
		boolean trovataOrg1 = body.getOrganizzazioni().stream().anyMatch(uo ->
				uo.getOrganizzazione().getIdOrganizzazione().equals(org1.getIdOrganizzazione())
				&& uo.getRuoloOrganizzazione() == RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);
		boolean trovataOrg2 = body.getOrganizzazioni().stream().anyMatch(uo ->
				uo.getOrganizzazione().getIdOrganizzazione().equals(org2.getIdOrganizzazione())
				&& uo.getRuoloOrganizzazione() == RuoloOrganizzazioneEnum.OPERATORE_API);
		assertTrue(trovataOrg1, "Associazione con org1 non trovata");
		assertTrue(trovataOrg2, "Associazione con org2 non trovata");
	}

	@Test
	public void testCreateUtenteConAziendaEsterna() {
		UtenteCreate utente = CommonUtils.getUtenteCreate();
		utente.setPrincipal("utente.esterna");
		utente.setAziendaEsterna("Software House Esterna SRL");

		ResponseEntity<Utente> response = utentiController.createUtente(utente);
		assertEquals(HttpStatus.OK, response.getStatusCode());

		Utente body = response.getBody();
		assertNotNull(body);
		assertEquals("Software House Esterna SRL", body.getAziendaEsterna());
	}

	@Test
	public void testUpdateUtenteAggiungiOrganizzazione() {
		Organizzazione org1 = creaOrganizzazione("org-upd-1", true, false);
		Organizzazione org2 = creaOrganizzazione("org-upd-2", false, true);

		UtenteCreate create = CommonUtils.getUtenteCreate();
		create.setPrincipal("utente.update.add");
		create.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
		UtenteOrganizzazioneCreate assoc1 = new UtenteOrganizzazioneCreate();
		assoc1.setIdOrganizzazione(org1.getIdOrganizzazione());
		assoc1.setRuoloOrganizzazione(RuoloOrganizzazioneEnum.OPERATORE_API);
		create.setOrganizzazioni(List.of(assoc1));

		Utente creato = utentiController.createUtente(create).getBody();
		assertNotNull(creato);
		assertEquals(1, creato.getOrganizzazioni().size());

		// Update: aggiungo la seconda organizzazione
		UtenteUpdate update = new UtenteUpdate();
		update.setPrincipal(create.getPrincipal());
		update.setNome(create.getNome());
		update.setCognome(create.getCognome());
		update.setEmailAziendale(create.getEmailAziendale());
		update.setTelefonoAziendale(create.getTelefonoAziendale());
		update.setStato(create.getStato());
		update.setRuolo(create.getRuolo());

		UtenteOrganizzazioneCreate u1 = new UtenteOrganizzazioneCreate();
		u1.setIdOrganizzazione(org1.getIdOrganizzazione());
		u1.setRuoloOrganizzazione(RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE); // ruolo cambiato
		UtenteOrganizzazioneCreate u2 = new UtenteOrganizzazioneCreate();
		u2.setIdOrganizzazione(org2.getIdOrganizzazione());
		u2.setRuoloOrganizzazione(RuoloOrganizzazioneEnum.OPERATORE_API);
		update.setOrganizzazioni(List.of(u1, u2));

		ResponseEntity<Utente> updateResp = utentiController.updateUtente(creato.getIdUtente(), update);
		assertEquals(HttpStatus.OK, updateResp.getStatusCode());

		Utente aggiornato = updateResp.getBody();
		assertNotNull(aggiornato);
		assertEquals(2, aggiornato.getOrganizzazioni().size());

		// Verifica che il ruolo di org1 sia stato aggiornato ad AMM_ORG
		boolean ruoloCorrettoOrg1 = aggiornato.getOrganizzazioni().stream().anyMatch(uo ->
				uo.getOrganizzazione().getIdOrganizzazione().equals(org1.getIdOrganizzazione())
				&& uo.getRuoloOrganizzazione() == RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);
		assertTrue(ruoloCorrettoOrg1);
	}

	@Test
	public void testUpdateUtenteRimuoviOrganizzazione() {
		Organizzazione org1 = creaOrganizzazione("org-rm-1", true, false);
		Organizzazione org2 = creaOrganizzazione("org-rm-2", false, true);

		UtenteCreate create = CommonUtils.getUtenteCreate();
		create.setPrincipal("utente.update.rm");
		create.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
		UtenteOrganizzazioneCreate a1 = new UtenteOrganizzazioneCreate();
		a1.setIdOrganizzazione(org1.getIdOrganizzazione());
		a1.setRuoloOrganizzazione(RuoloOrganizzazioneEnum.OPERATORE_API);
		UtenteOrganizzazioneCreate a2 = new UtenteOrganizzazioneCreate();
		a2.setIdOrganizzazione(org2.getIdOrganizzazione());
		a2.setRuoloOrganizzazione(RuoloOrganizzazioneEnum.OPERATORE_API);
		create.setOrganizzazioni(List.of(a1, a2));

		Utente creato = utentiController.createUtente(create).getBody();
		assertEquals(2, creato.getOrganizzazioni().size());

		// Update: rimuovo la seconda organizzazione
		UtenteUpdate update = new UtenteUpdate();
		update.setPrincipal(create.getPrincipal());
		update.setNome(create.getNome());
		update.setCognome(create.getCognome());
		update.setEmailAziendale(create.getEmailAziendale());
		update.setTelefonoAziendale(create.getTelefonoAziendale());
		update.setStato(create.getStato());
		update.setRuolo(create.getRuolo());
		update.setOrganizzazioni(List.of(a1));

		Utente aggiornato = utentiController.updateUtente(creato.getIdUtente(), update).getBody();
		assertNotNull(aggiornato);
		assertEquals(1, aggiornato.getOrganizzazioni().size());
		assertEquals(org1.getIdOrganizzazione(),
				aggiornato.getOrganizzazioni().get(0).getOrganizzazione().getIdOrganizzazione());
	}

	@Test
	public void testCreateUtenteNessunRuoloOrganizzazione() {
		// Crea utente con associazione ma ruolo null (NESSUN_RUOLO = sola lettura)
		Organizzazione org = creaOrganizzazione("org-nessun-ruolo", true, false);

		UtenteCreate utente = CommonUtils.getUtenteCreate();
		utente.setPrincipal("utente.no.ruolo");
		utente.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);

		UtenteOrganizzazioneCreate assoc = new UtenteOrganizzazioneCreate();
		assoc.setIdOrganizzazione(org.getIdOrganizzazione());
		// ruolo_organizzazione non impostato = null
		utente.setOrganizzazioni(List.of(assoc));

		Utente creato = utentiController.createUtente(utente).getBody();
		assertNotNull(creato);
		assertEquals(1, creato.getOrganizzazioni().size());
		assertNull(creato.getOrganizzazioni().get(0).getRuoloOrganizzazione(),
				"Il ruolo dell'associazione deve essere null (nessun ruolo)");
	}

}
