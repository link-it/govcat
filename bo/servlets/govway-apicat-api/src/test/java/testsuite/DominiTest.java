/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2025 Link.it srl (https://link.it).
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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import jakarta.validation.ConstraintViolationException;

import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.OrganizationContext;
import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.authorization.DominioAuthorization;
import org.govway.catalogo.controllers.DominiController;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.controllers.SoggettiController;
import org.govway.catalogo.controllers.UtentiController;
import org.govway.catalogo.core.orm.entity.RuoloOrganizzazione;
import org.govway.catalogo.core.services.OrganizzazioneService;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.UpdateEntitaComplessaNonValidaSemanticamenteException;
import org.govway.catalogo.servlets.model.Dominio;
import org.govway.catalogo.servlets.model.DominioCreate;
import org.govway.catalogo.servlets.model.DominioUpdate;
import org.govway.catalogo.servlets.model.ItemDominio;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.OrganizzazioneCreate;
import org.govway.catalogo.servlets.model.PagedModelItemDominio;
import org.govway.catalogo.servlets.model.PagedModelReferente;
import org.govway.catalogo.servlets.model.Referente;
import org.govway.catalogo.servlets.model.ReferenteCreate;
import org.govway.catalogo.servlets.model.RuoloOrganizzazioneEnum;
import org.govway.catalogo.servlets.model.RuoloUtenteEnum;
import org.govway.catalogo.servlets.model.Soggetto;
import org.govway.catalogo.servlets.model.SoggettoCreate;
import org.govway.catalogo.servlets.model.TipoReferenteEnum;
import org.govway.catalogo.servlets.model.Utente;
import org.govway.catalogo.servlets.model.UtenteCreate;
import org.govway.catalogo.servlets.model.UtenteOrganizzazioneCreate;
import org.govway.catalogo.servlets.model.VisibilitaDominioEnum;
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
import org.springframework.dao.InvalidDataAccessApiUsageException;
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

@ExtendWith(SpringExtension.class)  // JUnit 5 extension
@SpringBootTest(classes = OpenAPI2SpringBoot.class)
@EnableAutoConfiguration(exclude = {GroovyTemplateAutoConfiguration.class})
@AutoConfigureTestDatabase(replace = Replace.ANY)
@ActiveProfiles("test")
@DirtiesContext(classMode = ClassMode.BEFORE_CLASS)
@TestInstance(TestInstance.Lifecycle.PER_METHOD)
@Transactional
public class DominiTest {

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @Mock
    private DominioAuthorization authorization;

    @Mock
    private CoreAuthorization coreAuthorization;

    @Autowired
    private UtenteService utenteService;

    @Autowired
    private UtentiController controllerUtenti;

    @Autowired
    private OrganizzazioniController organizzazioniController;

    @Autowired
    private DominiController controller;

    @Autowired
    private SoggettiController soggettiController;

    @Autowired
    private OrganizationContext organizationContext;

    @Autowired
    private OrganizzazioneService organizzazioneService;

    private static final String UTENTE_GESTORE = "gestore";
    private static final String UTENTE_QUALSIASI = "utente_qualsiasi";

    @BeforeEach
    public void setUp() {
        Locale.setDefault(Locale.ENGLISH);
        MockitoAnnotations.initMocks(this);
        when(this.securityContext.getAuthentication()).thenReturn(this.authentication);

        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);

        when(coreAuthorization.isAnounymous()).thenReturn(true);

        SecurityContextHolder.setContext(this.securityContext);

        // Reset dello stato del bean request-scoped per evitare leak tra test
        organizationContext.setIdOrganizzazione(null);
        organizationContext.setRuoloOrganizzazione(null);
        organizationContext.setInitialized(false);
    }

    @AfterEach
    public void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private SoggettoCreate getSoggettoCreate() {
    	SoggettoCreate soggettoCreate = new SoggettoCreate();
    	soggettoCreate.setNome("xxx");
        soggettoCreate.setSkipCollaudo(true);
        soggettoCreate.setReferente(true);
        return soggettoCreate;
    }
    
    private DominioCreate getDominioCreate() {
    	DominioCreate dominio = CommonUtils.getDominioCreate();
    	dominio.setSkipCollaudo(true);
    	return dominio;
    }
    
    @Test
    public void testCreateDominioSuccess() {
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());

        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());
        
        DominioCreate dominio = this.getDominioCreate();
        dominio.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = controller.createDominio(dominio);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());
        assertEquals(CommonUtils.DESCRIZIONE_DOMINIO, createdDominio.getBody().getDescrizione());
        assertEquals(CommonUtils.NOME_DOMINIO, createdDominio.getBody().getNome());
        assertEquals(CommonUtils.TAG, createdDominio.getBody().getTag());
        assertEquals(CommonUtils.VISIBILITA_DOMINIO, createdDominio.getBody().getVisibilita());
    }

    @Test
    public void testCreateDominioConflict() {
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        DominioCreate dominioCreate1 = this.getDominioCreate();
        dominioCreate1.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio1 = controller.createDominio(dominioCreate1);
        assertEquals(HttpStatus.OK, createdDominio1.getStatusCode());

        DominioCreate dominioCreate2 = this.getDominioCreate();
        dominioCreate2.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ConflictException exception = assertThrows(ConflictException.class, () -> {
            controller.createDominio(dominioCreate2);
        });

        assertEquals("DOM.409", exception.getMessage());
    }

    @Test
    public void testCreateDominioUnauthorized() {
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        DominioCreate dominioCreate = this.getDominioCreate();
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);
        
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.createDominio(dominioCreate);
        });

        assertEquals("UT.403", exception.getMessage());
    }
    
    @Test
    public void testCreateDominioUtenteAnonimo() {
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        DominioCreate dominioCreate = this.getDominioCreate();
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());

        this.tearDown();
        
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.createDominio(dominioCreate);
        });

        assertEquals("AUT.403", exception.getMessage());
    }

    @Test
    public void testDeleteDominioSuccess() {
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        DominioCreate dominioCreate = this.getDominioCreate();
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = controller.createDominio(dominioCreate);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        ResponseEntity<Void> responseDelete = controller.deleteDominio(createdDominio.getBody().getIdDominio());

        assertEquals(HttpStatus.OK, responseDelete.getStatusCode());
    }

    @Test
    public void testDeleteDominioNotFound() {
        UUID idDominioNonEsistente = UUID.randomUUID();

        org.govway.catalogo.exception.NotFoundException exception = assertThrows(org.govway.catalogo.exception.NotFoundException.class, () -> {
            controller.deleteDominio(idDominioNonEsistente);
        });

        assertEquals("DOM.404", exception.getMessage());
    }

    @Test
    public void testDeleteDominioUnauthorized() {
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        DominioCreate dominioCreate = this.getDominioCreate();
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = controller.createDominio(dominioCreate);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);
        
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.deleteDominio(createdDominio.getBody().getIdDominio());
        });

        assertEquals("UT.403", exception.getMessage());
    }
    
    @Test
    public void testDeleteDominioUtenteAnonimo() {
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        DominioCreate dominioCreate = this.getDominioCreate();
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = controller.createDominio(dominioCreate);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        this.tearDown();

        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.deleteDominio(createdDominio.getBody().getIdDominio());
        });

        assertEquals("AUT.403", exception.getMessage());
    }

    @Test
    public void testGetDominioSuccess() {
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        DominioCreate dominioCreate = this.getDominioCreate();
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = controller.createDominio(dominioCreate);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        ResponseEntity<Dominio> responseDominio = controller.getDominio(createdDominio.getBody().getIdDominio());

        assertNotNull(responseDominio.getBody());
        assertEquals(HttpStatus.OK, responseDominio.getStatusCode());
        assertEquals(createdDominio.getBody().getIdDominio(), responseDominio.getBody().getIdDominio());
        assertEquals(createdDominio.getBody().getNome(), responseDominio.getBody().getNome());
        assertEquals(createdDominio.getBody().getDescrizione(), responseDominio.getBody().getDescrizione());
    }

    @Test
    public void testGetDominioNotFound() {
        UUID idDominioNonEsistente = UUID.randomUUID();

        org.govway.catalogo.exception.NotFoundException exception = assertThrows(org.govway.catalogo.exception.NotFoundException.class, () -> {
            controller.getDominio(idDominioNonEsistente);
        });

        assertEquals("DOM.404", exception.getMessage());
    }

    @Test
    public void testUpdateDominioSuccess() {
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        DominioCreate dominioCreate = this.getDominioCreate();
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = controller.createDominio(dominioCreate);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());
        assertNotNull(createdDominio.getBody());

        DominioUpdate dominioUpdate = new DominioUpdate();
        dominioUpdate.setNome("UpdatedDomainName");
        dominioUpdate.setDescrizione("Descrizione aggiornata");
        dominioUpdate.setVisibilita(VisibilitaDominioEnum.PUBBLICO);
        dominioUpdate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        dominioUpdate.setDeprecato(false);
        dominioUpdate.setTag("x");

        ResponseEntity<Dominio> responseUpdate = controller.updateDominio(createdDominio.getBody().getIdDominio(), dominioUpdate);

        assertNotNull(responseUpdate.getBody());
        assertEquals("UpdatedDomainName", responseUpdate.getBody().getNome());
        assertEquals("Descrizione aggiornata", responseUpdate.getBody().getDescrizione());
        assertEquals(HttpStatus.OK, responseUpdate.getStatusCode());
    }

    @Test
    public void testUpdateDominioNotFound() {
        UUID idDominioNonEsistente = UUID.randomUUID();
        UUID idSoggettoNonEsistente = UUID.randomUUID();

        DominioUpdate dominioUpdate = new DominioUpdate();
        dominioUpdate.setNome("UpdatedDomainName");
        dominioUpdate.setDescrizione("Descrizione aggiornata");
        dominioUpdate.setVisibilita(VisibilitaDominioEnum.PUBBLICO);
        dominioUpdate.setIdSoggettoReferente(idSoggettoNonEsistente);
        dominioUpdate.setDeprecato(false);
        dominioUpdate.setTag("x");

        org.govway.catalogo.exception.NotFoundException exception = assertThrows(org.govway.catalogo.exception.NotFoundException.class, () -> {
            controller.updateDominio(idDominioNonEsistente, dominioUpdate);
        });

        assertEquals("DOM.404", exception.getMessage());
    }

    @Test
    public void testUpdateDominioUnauthorized() {
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        DominioCreate dominioCreate = this.getDominioCreate();
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = controller.createDominio(dominioCreate);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        DominioUpdate dominioUpdate = new DominioUpdate();
        dominioUpdate.setNome("UpdatedDomainName");
        dominioUpdate.setDescrizione("Descrizione aggiornata");
        dominioUpdate.setVisibilita(VisibilitaDominioEnum.PUBBLICO);
        dominioUpdate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        dominioUpdate.setDeprecato(false);
        dominioUpdate.setTag("x");

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);
        
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.updateDominio(createdDominio.getBody().getIdDominio(), dominioUpdate);
        });

        assertEquals("UT.403", exception.getMessage());
    }
    
    @Test
    public void testUpdateDominioUtenteAnonimo() {
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        DominioCreate dominioCreate = this.getDominioCreate();
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = controller.createDominio(dominioCreate);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        DominioUpdate dominioUpdate = new DominioUpdate();
        dominioUpdate.setNome("UpdatedDomainName");
        dominioUpdate.setDescrizione("Descrizione aggiornata");
        dominioUpdate.setVisibilita(VisibilitaDominioEnum.PUBBLICO);
        dominioUpdate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        dominioUpdate.setDeprecato(false);
        dominioUpdate.setTag("x");

        this.tearDown();

        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.updateDominio(createdDominio.getBody().getIdDominio(), dominioUpdate);
        });

        assertEquals("AUT.403", exception.getMessage());
    }

    @Test
    public void testListDominiSuccessNoFilters() {
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        DominioCreate dominioCreate1 = this.getDominioCreate();
        dominioCreate1.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio1 = controller.createDominio(dominioCreate1);
        assertEquals(HttpStatus.OK, createdDominio1.getStatusCode());

        DominioCreate dominioCreate2 = this.getDominioCreate();
        dominioCreate2.setNome("SecondDomain");
        dominioCreate2.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio2 = controller.createDominio(dominioCreate2);
        assertEquals(HttpStatus.OK, createdDominio2.getStatusCode());

        ResponseEntity<PagedModelItemDominio> responseList = controller.listDomini(null, null, null, null, null, null, null, 0, 10, null);

        assertNotNull(responseList.getBody());
        assertEquals(2, responseList.getBody().getContent().size());
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
    }

    @Test
    void testListDominiSortedUsernameDesc() {
    	ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

    	for(int n = 0; n < 3; n++) {
    		DominioCreate dominioCreate = this.getDominioCreate();
    		dominioCreate.setNome("NomeDominio"+n);
            dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
            ResponseEntity<Dominio> createdDominio1 = controller.createDominio(dominioCreate);
            assertEquals(HttpStatus.OK, createdDominio1.getStatusCode());
    	}

        List<String> sort = new ArrayList<>();
        sort.add("nome,desc");
        
        ResponseEntity<PagedModelItemDominio> responseList = controller.listDomini(null, null, null, null, null, null, null, 0, 10, sort);
        
        // Verifica del successo
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
        assertNotNull(responseList.getBody());
        assertFalse(responseList.getBody().getContent().isEmpty());

        // Verifica che il gruppo filtrato sia presente nell'elenco
        List<ItemDominio> listDomini = responseList.getBody().getContent();
        //listSoggetti.stream().forEach(s->{System.out.println(s.getNome());});
        assertTrue(listDomini.stream().anyMatch(s -> s.getNome().equals("NomeDominio"+0)));
        // Verifica che il primo elemento sia quello che mi aspetto dall'ordinamento
        assertEquals("NomeDominio"+2, listDomini.get(0).getNome());
    }
	
    @Test
    void testListDominiSortedUsernameAsc() {
    	ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

    	for(int n = 0; n < 3; n++) {
    		DominioCreate dominioCreate = this.getDominioCreate();
    		dominioCreate.setNome("NomeDominio"+n);
            dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
            ResponseEntity<Dominio> createdDominio1 = controller.createDominio(dominioCreate);
            assertEquals(HttpStatus.OK, createdDominio1.getStatusCode());
    	}

        List<String> sort = new ArrayList<>();
        sort.add("nome,asc");
        
        ResponseEntity<PagedModelItemDominio> responseList = controller.listDomini(null, null, null, null, null, null, null, 0, 10, sort);
        
        // Verifica del successo
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
        assertNotNull(responseList.getBody());
        assertFalse(responseList.getBody().getContent().isEmpty());

        // Verifica che il gruppo filtrato sia presente nell'elenco
        List<ItemDominio> listDomini = responseList.getBody().getContent();
        //listSoggetti.stream().forEach(s->{System.out.println(s.getNome());});
        assertTrue(listDomini.stream().anyMatch(s -> s.getNome().equals("NomeDominio"+2)));
        // Verifica che il primo elemento sia quello che mi aspetto dall'ordinamento
        assertEquals("NomeDominio"+0, listDomini.get(0).getNome());
    }
    
    @Test
    void testListDominiMultiPage() {
    	int numeroElementiPerPagina = 10;
    	int numeroTotaleDiElementi = 50;
    	ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

    	for(int n = 0; n < numeroTotaleDiElementi; n++) {
    		DominioCreate dominioCreate = this.getDominioCreate();
    		dominioCreate.setNome("NomeDominio"+n);
            dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
            ResponseEntity<Dominio> createdDominio1 = controller.createDominio(dominioCreate);
            assertEquals(HttpStatus.OK, createdDominio1.getStatusCode());
    	}
        for(int n = 0; n < (numeroTotaleDiElementi/numeroElementiPerPagina); n++) {
        	ResponseEntity<PagedModelItemDominio> responseList = controller.listDomini(null, null, null, null, null, null, null, n, numeroElementiPerPagina, null);
            
            // Verifica del successo
            assertEquals(HttpStatus.OK, responseList.getStatusCode());
            assertNotNull(responseList.getBody());
            assertFalse(responseList.getBody().getContent().isEmpty());
        }
    }

    @Test
    public void testListDominiWithFilters() {
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        DominioCreate dominioCreate1 = this.getDominioCreate();
        dominioCreate1.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        dominioCreate1.setDeprecato(true);
        ResponseEntity<Dominio> createdDominio1 = controller.createDominio(dominioCreate1);
        assertEquals(HttpStatus.OK, createdDominio1.getStatusCode());

        DominioCreate dominioCreate2 = this.getDominioCreate();
        dominioCreate2.setNome("SecondDomain");
        dominioCreate2.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        dominioCreate2.setDeprecato(false);
        ResponseEntity<Dominio> createdDominio2 = controller.createDominio(dominioCreate2);
        assertEquals(HttpStatus.OK, createdDominio2.getStatusCode());

        ResponseEntity<PagedModelItemDominio> responseList = controller.listDomini(null, null, null, null, true, null, null, 0, 10, null);

        assertNotNull(responseList.getBody());
        assertEquals(1, responseList.getBody().getContent().size());
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
    }
    
    @Test
    void testListDominiUtenteAnonimo() {
        // Dipendenza
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        // Creazione di un dominio
        DominioCreate dominioCreate1 = this.getDominioCreate();
        dominioCreate1.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio1 = controller.createDominio(dominioCreate1);
        assertEquals(HttpStatus.OK, createdDominio1.getStatusCode());

        this.tearDown();
        
        // Tentativo di recuperare la lista di domini senza autorizzazione
        assertThrows(NotAuthorizedException.class, () -> {
            controller.listDomini(null, null, null, null, null, null, null, 0, 10, null);
        });
    }
    
    @Test
    void testCreateReferenteDominioSuccess() {
        // Dipendenza
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        // Creazione del dominio
        DominioCreate dominioCreate = this.getDominioCreate();
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = controller.createDominio(dominioCreate);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        UtenteCreate utente = CommonUtils.getUtenteCreate();
        CommonUtils.setOrganizzazione(utente, response.getBody().getIdOrganizzazione());
        utente.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        ResponseEntity<Utente> responseUtente = controllerUtenti.createUtente(utente);

        // Creazione del referente
        ReferenteCreate referenteCreate = new ReferenteCreate();
        referenteCreate.setTipo(TipoReferenteEnum.REFERENTE);
        referenteCreate.setIdUtente(responseUtente.getBody().getIdUtente());
        ResponseEntity<Referente> createdReferente = controller.createReferenteDominio(createdDominio.getBody().getIdDominio(), referenteCreate);

        // Asserzioni
        assertEquals(HttpStatus.OK, createdReferente.getStatusCode());
        assertEquals(referenteCreate.getIdUtente(), createdReferente.getBody().getUtente().getIdUtente());
    }
    
    @Test
    void testCreateReferenteDominioNotFound() {
        UUID idDominioNonEsistente = UUID.randomUUID();

        InfoProfilo info = CommonUtils.getInfoProfilo(UTENTE_QUALSIASI, utenteService);
        
        // Creazione del referente
        ReferenteCreate referenteCreate = new ReferenteCreate();
        referenteCreate.setTipo(TipoReferenteEnum.REFERENTE);
        referenteCreate.setIdUtente(UUID.fromString(info.utente.getIdUtente()));

        org.govway.catalogo.exception.NotFoundException exception = assertThrows(org.govway.catalogo.exception.NotFoundException.class, () -> {
            controller.createReferenteDominio(idDominioNonEsistente, referenteCreate);
        });

        // Asserzioni
        assertEquals("DOM.404", exception.getMessage());
    }

    @Test
    void testCreateReferenteDominioUnauthorized() {
        // Dipendenza
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        // Creazione del dominio
        DominioCreate dominioCreate = this.getDominioCreate();
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = controller.createDominio(dominioCreate);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);
        
        InfoProfilo info = CommonUtils.getInfoProfilo(UTENTE_QUALSIASI, utenteService);
        
        // Tentativo di creare un referente senza autorizzazione
        ReferenteCreate referenteCreate = new ReferenteCreate();
        referenteCreate.setTipo(TipoReferenteEnum.REFERENTE);
        referenteCreate.setIdUtente(UUID.fromString(info.utente.getIdUtente()));
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.createReferenteDominio(createdDominio.getBody().getIdDominio(), referenteCreate);
        });

        // Asserzioni
        assertEquals("UT.403", exception.getMessage());
    }
    
    @Test
    void testCreateReferenteDominioUtenteAnonimo() {
        // Dipendenza
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        // Creazione del dominio
        DominioCreate dominioCreate = this.getDominioCreate();
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = controller.createDominio(dominioCreate);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        this.tearDown();        
        
        InfoProfilo info = CommonUtils.getInfoProfilo(UTENTE_QUALSIASI, utenteService);
        
        // Tentativo di creare un referente senza autorizzazione
        ReferenteCreate referenteCreate = new ReferenteCreate();
        referenteCreate.setTipo(TipoReferenteEnum.REFERENTE);
        referenteCreate.setIdUtente(UUID.fromString(info.utente.getIdUtente()));
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.createReferenteDominio(createdDominio.getBody().getIdDominio(), referenteCreate);
        });

        // Asserzioni
        assertEquals("AUT.403", exception.getMessage());
    }

    @Test
    void testCreateReferenteDominioInvalidReferente() {
        // Dipendenza
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        // Creazione del dominio
        DominioCreate dominioCreate = this.getDominioCreate();
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = controller.createDominio(dominioCreate);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        InfoProfilo info = CommonUtils.getInfoProfilo(UTENTE_QUALSIASI, utenteService);
        
        // Creazione di un referente non valido (per esempio, senza il tiporeferente definito)
        ReferenteCreate referenteCreate = new ReferenteCreate();
        referenteCreate.setIdUtente(UUID.fromString(info.utente.getIdUtente()));  // Nome del referente mancante

        ConstraintViolationException exception = assertThrows(ConstraintViolationException.class, () -> {
            controller.createReferenteDominio(createdDominio.getBody().getIdDominio(), referenteCreate);
        });

        // Asserzioni
        assertEquals("createReferenteDominio.arg1.tipo: must not be null", exception.getMessage());
    }

    @Test
    void testDeleteReferenteDominioSuccess() {
        // Dipendenza
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        // Creazione del dominio
        DominioCreate dominioCreate = this.getDominioCreate();
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = controller.createDominio(dominioCreate);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        UtenteCreate utente = CommonUtils.getUtenteCreate();
        CommonUtils.setOrganizzazione(utente, response.getBody().getIdOrganizzazione());
        utente.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        ResponseEntity<Utente> responseUtente = controllerUtenti.createUtente(utente);
        
        // Creazione del referente
        ReferenteCreate referenteCreate = new ReferenteCreate();
        referenteCreate.setTipo(TipoReferenteEnum.REFERENTE);
        referenteCreate.setIdUtente(responseUtente.getBody().getIdUtente());
        ResponseEntity<Referente> createdReferente = controller.createReferenteDominio(createdDominio.getBody().getIdDominio(), referenteCreate);
        assertEquals(HttpStatus.OK, createdReferente.getStatusCode());

        // Cancellazione del referente
        ResponseEntity<Void> responseDelete = controller.deleteReferenteDominio(createdDominio.getBody().getIdDominio(), createdReferente.getBody().getUtente().getIdUtente(), TipoReferenteEnum.REFERENTE);

        // Asserzioni
        assertEquals(HttpStatus.OK, responseDelete.getStatusCode());
    }

    @Test
    void testDeleteReferenteDominioNotFound() {
    	UUID idDominioNonEsistente = UUID.randomUUID();
    	UUID idUtente = UUID.randomUUID();

        // Tentativo di cancellare un referente per un dominio inesistente
        // Accept both NotFoundException types since either can be thrown
    	RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            controller.deleteReferenteDominio(idDominioNonEsistente, idUtente, TipoReferenteEnum.REFERENTE);
        });

        // Verify it's one of the expected exception types
        assertTrue(exception instanceof NotFoundException ||
                   exception instanceof org.govway.catalogo.core.exceptions.NotFoundException);
    }

    @Test
    void testDeleteReferenteDominioUnauthorized() {
        // Dipendenza
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        // Creazione del dominio
        DominioCreate dominioCreate = this.getDominioCreate();
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = controller.createDominio(dominioCreate);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        UtenteCreate utente = CommonUtils.getUtenteCreate();
        CommonUtils.setOrganizzazione(utente, response.getBody().getIdOrganizzazione());
        utente.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        ResponseEntity<Utente> responseUtente = controllerUtenti.createUtente(utente);
        
        // Creazione del referente
        ReferenteCreate referenteCreate = new ReferenteCreate();
        referenteCreate.setTipo(TipoReferenteEnum.REFERENTE);
        referenteCreate.setIdUtente(responseUtente.getBody().getIdUtente());
        ResponseEntity<Referente> createdReferente = controller.createReferenteDominio(createdDominio.getBody().getIdDominio(), referenteCreate);
        assertEquals(HttpStatus.OK, createdReferente.getStatusCode());

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);
        
        // Tentativo di cancellare il referente senza autorizzazione
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.deleteReferenteDominio(createdDominio.getBody().getIdDominio(), createdReferente.getBody().getUtente().getIdUtente(), TipoReferenteEnum.REFERENTE);
        });

    }

    @Test
    void testDeleteReferenteDominioUtenteAnonimo() {
        // Dipendenza
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        // Creazione del dominio
        DominioCreate dominioCreate = this.getDominioCreate();
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = controller.createDominio(dominioCreate);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        UtenteCreate utente = CommonUtils.getUtenteCreate();
        CommonUtils.setOrganizzazione(utente, response.getBody().getIdOrganizzazione());
        utente.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        ResponseEntity<Utente> responseUtente = controllerUtenti.createUtente(utente);
        
        // Creazione del referente
        ReferenteCreate referenteCreate = new ReferenteCreate();
        referenteCreate.setTipo(TipoReferenteEnum.REFERENTE);
        referenteCreate.setIdUtente(responseUtente.getBody().getIdUtente());
        ResponseEntity<Referente> createdReferente = controller.createReferenteDominio(createdDominio.getBody().getIdDominio(), referenteCreate);
        assertEquals(HttpStatus.OK, createdReferente.getStatusCode());

        this.tearDown();

        // Tentativo di cancellare il referente senza autorizzazione
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.deleteReferenteDominio(createdDominio.getBody().getIdDominio(), createdReferente.getBody().getUtente().getIdUtente(), TipoReferenteEnum.REFERENTE);
        });

    }
    
    @Test
    void testDeleteReferenteDominioInvalidReferente() {
        // Dipendenza
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        // Creazione del dominio
        DominioCreate dominioCreate = this.getDominioCreate();
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = controller.createDominio(dominioCreate);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        // Tentativo di cancellare un referente inesistente
        UUID idUtenteNonEsistente = UUID.randomUUID();

        // Accept both NotFoundException types since either can be thrown
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            controller.deleteReferenteDominio(createdDominio.getBody().getIdDominio(), idUtenteNonEsistente, TipoReferenteEnum.REFERENTE);
        });

        // Verify it's one of the expected exception types
        assertTrue(exception instanceof NotFoundException ||
                   exception instanceof org.govway.catalogo.core.exceptions.NotFoundException);
    }

    @Test
    void testListReferentiDominioSuccessNoFilters() {
        // Dipendenza
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        // Creazione del dominio
        DominioCreate dominioCreate = this.getDominioCreate();
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = controller.createDominio(dominioCreate);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        UtenteCreate utente = CommonUtils.getUtenteCreate();
        CommonUtils.setOrganizzazione(utente, response.getBody().getIdOrganizzazione());
        utente.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        ResponseEntity<Utente> responseUtente = controllerUtenti.createUtente(utente);
        
        UtenteCreate utente2 = CommonUtils.getUtenteCreate();
        utente2.setPrincipal("altrousername");
        utente2.setNome("utente 2");
        utente2.setCognome("cognome 2");
        CommonUtils.setOrganizzazione(utente2, response.getBody().getIdOrganizzazione());
        utente2.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        ResponseEntity<Utente> responseUtente2 = controllerUtenti.createUtente(utente2);
        
        // Creazione del referente
        ReferenteCreate referenteCreate = new ReferenteCreate();
        referenteCreate.setTipo(TipoReferenteEnum.REFERENTE);
        referenteCreate.setIdUtente(responseUtente.getBody().getIdUtente());
        ResponseEntity<Referente> createdReferente1 = controller.createReferenteDominio(createdDominio.getBody().getIdDominio(), referenteCreate);
        assertEquals(HttpStatus.OK, createdReferente1.getStatusCode());

        ReferenteCreate referenteCreate2 = new ReferenteCreate();
        referenteCreate2.setTipo(TipoReferenteEnum.REFERENTE);
        referenteCreate2.setIdUtente(responseUtente2.getBody().getIdUtente());
        ResponseEntity<Referente> createdReferente2 = controller.createReferenteDominio(createdDominio.getBody().getIdDominio(), referenteCreate2);
        assertEquals(HttpStatus.OK, createdReferente2.getStatusCode());

        // Recupero della lista di referenti senza filtri
        ResponseEntity<PagedModelReferente> responseList = controller.listReferentiDominio(createdDominio.getBody().getIdDominio(), null, null, 0, 10, null);

        // Asserzioni
        assertNotNull(responseList.getBody());
        assertEquals(2, responseList.getBody().getContent().size());
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
    }

    @Test
    void testListReferentiDominioSortedUsernameDesc() {
    	// Dipendenza
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        // Creazione del dominio
        DominioCreate dominioCreate = this.getDominioCreate();
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = controller.createDominio(dominioCreate);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

    	for(int n = 0; n < 3; n++) {
    		UtenteCreate utente = CommonUtils.getUtenteCreate();
    		utente.setPrincipal("nomeUtente"+n);
            CommonUtils.setOrganizzazione(utente, response.getBody().getIdOrganizzazione());
            utente.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
            ResponseEntity<Utente> responseUtente = controllerUtenti.createUtente(utente);
            
            // Creazione del referente
            ReferenteCreate referenteCreate = new ReferenteCreate();
            referenteCreate.setTipo(TipoReferenteEnum.REFERENTE);
            referenteCreate.setIdUtente(responseUtente.getBody().getIdUtente());
            ResponseEntity<Referente> createdReferente1 = controller.createReferenteDominio(createdDominio.getBody().getIdDominio(), referenteCreate);
            assertEquals(HttpStatus.OK, createdReferente1.getStatusCode());
    	}
    	UtenteCreate utente = CommonUtils.getUtenteCreate();
		utente.setPrincipal("nomeUtente"+3);
        CommonUtils.setOrganizzazione(utente, response.getBody().getIdOrganizzazione());
        utente.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        ResponseEntity<Utente> responseUtente = controllerUtenti.createUtente(utente);
        
        // Creazione del referente
        ReferenteCreate referenteCreate = new ReferenteCreate();
        referenteCreate.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        referenteCreate.setIdUtente(responseUtente.getBody().getIdUtente());
        ResponseEntity<Referente> createdReferente1 = controller.createReferenteDominio(createdDominio.getBody().getIdDominio(), referenteCreate);
        assertEquals(HttpStatus.OK, createdReferente1.getStatusCode());

        List<String> sort = new ArrayList<>();
        sort.add("tipo,desc");
        
        // Recupero della lista di referent
        ResponseEntity<PagedModelReferente> responseList = controller.listReferentiDominio(createdDominio.getBody().getIdDominio(), null, null, 0, 10, sort);

        // Verifica del successo
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
        assertNotNull(responseList.getBody());
        assertFalse(responseList.getBody().getContent().isEmpty());

        // Verifica che il gruppo filtrato sia presente nell'elenco
        List<Referente> listReferenti = responseList.getBody().getContent();
        //System.out.println(responseList.getBody().getContent().get(0));
        //listSoggetti.stream().forEach(s->{System.out.println(s.getNome());});
        assertTrue(listReferenti.stream().anyMatch(s -> s.getUtente().getPrincipal().equals("nomeUtente"+0)));
        // Verifica che il primo elemento sia quello che mi aspetto dall'ordinamento
        assertEquals("nomeUtente"+3, listReferenti.get(0).getUtente().getPrincipal());
    }
	
    @Test
    void testListReferentiDominioSortedUsernameAsc() {
    	// Dipendenza
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        // Creazione del dominio
        DominioCreate dominioCreate = this.getDominioCreate();
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = controller.createDominio(dominioCreate);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

    	for(int n = 0; n < 3; n++) {
    		UtenteCreate utente = CommonUtils.getUtenteCreate();
    		utente.setPrincipal("nomeUtente"+n);
            CommonUtils.setOrganizzazione(utente, response.getBody().getIdOrganizzazione());
            utente.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
            ResponseEntity<Utente> responseUtente = controllerUtenti.createUtente(utente);
            
            // Creazione del referente
            ReferenteCreate referenteCreate = new ReferenteCreate();
            referenteCreate.setTipo(TipoReferenteEnum.REFERENTE);
            referenteCreate.setIdUtente(responseUtente.getBody().getIdUtente());
            ResponseEntity<Referente> createdReferente1 = controller.createReferenteDominio(createdDominio.getBody().getIdDominio(), referenteCreate);
            assertEquals(HttpStatus.OK, createdReferente1.getStatusCode());
    	}
    	UtenteCreate utente = CommonUtils.getUtenteCreate();
		utente.setPrincipal("nomeUtente"+3);
        CommonUtils.setOrganizzazione(utente, response.getBody().getIdOrganizzazione());
        utente.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        ResponseEntity<Utente> responseUtente = controllerUtenti.createUtente(utente);
        
        // Creazione del referente
        ReferenteCreate referenteCreate = new ReferenteCreate();
        referenteCreate.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        referenteCreate.setIdUtente(responseUtente.getBody().getIdUtente());
        ResponseEntity<Referente> createdReferente1 = controller.createReferenteDominio(createdDominio.getBody().getIdDominio(), referenteCreate);
        assertEquals(HttpStatus.OK, createdReferente1.getStatusCode());

        List<String> sort = new ArrayList<>();
        sort.add("tipo,asc");
        
        // Recupero della lista di referent
        ResponseEntity<PagedModelReferente> responseList = controller.listReferentiDominio(createdDominio.getBody().getIdDominio(), null, null, 0, 10, sort);

        // Verifica del successo
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
        assertNotNull(responseList.getBody());
        assertFalse(responseList.getBody().getContent().isEmpty());

        // Verifica che il gruppo filtrato sia presente nell'elenco
        List<Referente> listReferenti = responseList.getBody().getContent();
        //listSoggetti.stream().forEach(s->{System.out.println(s.getNome());});
        assertTrue(listReferenti.stream().anyMatch(s -> s.getUtente().getPrincipal().equals("nomeUtente"+2)));
        // Verifica che il primo elemento sia quello che mi aspetto dall'ordinamento
        assertEquals("nomeUtente"+0, listReferenti.get(0).getUtente().getPrincipal());
    }
    
    @Test
    void testListReferentiDominioMultiPage() {
    	int numeroElementiPerPagina = 10;
    	int numeroTotaleDiElementi = 50;
    	// Dipendenza
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        // Creazione del dominio
        DominioCreate dominioCreate = this.getDominioCreate();
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = controller.createDominio(dominioCreate);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

    	for(int n = 0; n < numeroTotaleDiElementi; n++) {
    		UtenteCreate utente = CommonUtils.getUtenteCreate();
    		utente.setPrincipal("nomeUtente"+n);
            CommonUtils.setOrganizzazione(utente, response.getBody().getIdOrganizzazione());
            utente.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
            ResponseEntity<Utente> responseUtente = controllerUtenti.createUtente(utente);
            
            // Creazione del referente
            ReferenteCreate referenteCreate = new ReferenteCreate();
            referenteCreate.setTipo(TipoReferenteEnum.REFERENTE);
            referenteCreate.setIdUtente(responseUtente.getBody().getIdUtente());
            ResponseEntity<Referente> createdReferente1 = controller.createReferenteDominio(createdDominio.getBody().getIdDominio(), referenteCreate);
            assertEquals(HttpStatus.OK, createdReferente1.getStatusCode());
    	}
        for(int n = 0; n < (numeroTotaleDiElementi/numeroElementiPerPagina); n++) {
        	// Recupero della lista di referent
            ResponseEntity<PagedModelReferente> responseList = controller.listReferentiDominio(createdDominio.getBody().getIdDominio(), null, null, n, numeroElementiPerPagina, null);

            // Verifica del successo
            assertEquals(HttpStatus.OK, responseList.getStatusCode());
            assertNotNull(responseList.getBody());
            assertFalse(responseList.getBody().getContent().isEmpty());
        }
    }

    @Test
    void testListReferentiDominioWithFilters() {
        // Dipendenza
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        // Creazione del dominio
        DominioCreate dominioCreate = this.getDominioCreate();
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = controller.createDominio(dominioCreate);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        UtenteCreate utente = CommonUtils.getUtenteCreate();
        CommonUtils.setOrganizzazione(utente, response.getBody().getIdOrganizzazione());
        utente.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        ResponseEntity<Utente> responseUtente = controllerUtenti.createUtente(utente);
        
        UtenteCreate utente2 = CommonUtils.getUtenteCreate();
        utente2.setPrincipal("altrousername");
        utente2.setNome("utente 2");
        utente2.setCognome("cognome 2");
        CommonUtils.setOrganizzazione(utente2, response.getBody().getIdOrganizzazione());
        utente2.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        ResponseEntity<Utente> responseUtente2 = controllerUtenti.createUtente(utente2);
        
        // Creazione del referente
        ReferenteCreate referenteCreate = new ReferenteCreate();
        referenteCreate.setTipo(TipoReferenteEnum.REFERENTE);
        referenteCreate.setIdUtente(responseUtente.getBody().getIdUtente());
        ResponseEntity<Referente> createdReferente1 = controller.createReferenteDominio(createdDominio.getBody().getIdDominio(), referenteCreate);
        assertEquals(HttpStatus.OK, createdReferente1.getStatusCode());

        ReferenteCreate referenteCreate2 = new ReferenteCreate();
        referenteCreate2.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        referenteCreate2.setIdUtente(responseUtente2.getBody().getIdUtente());
        ResponseEntity<Referente> createdReferente2 = controller.createReferenteDominio(createdDominio.getBody().getIdDominio(), referenteCreate2);
        assertEquals(HttpStatus.OK, createdReferente2.getStatusCode());

        // Recupero della lista di referenti con filtri (solo PRIMARI)
        ResponseEntity<PagedModelReferente> responseList = controller.listReferentiDominio(createdDominio.getBody().getIdDominio(), null, TipoReferenteEnum.REFERENTE_TECNICO, 0, 10, null);

        // Asserzioni
        assertNotNull(responseList.getBody());
        assertEquals(1, responseList.getBody().getContent().size());
        assertEquals(TipoReferenteEnum.REFERENTE_TECNICO, responseList.getBody().getContent().get(0).getTipo());
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
    }

    @Test
    void testListReferentiDominioNotFound() {
        UUID idDominioNonEsistente = UUID.randomUUID();

        // Tentativo di recuperare referenti per un dominio inesistente
        org.govway.catalogo.exception.NotFoundException exception = assertThrows(org.govway.catalogo.exception.NotFoundException.class, () -> {
            controller.listReferentiDominio(idDominioNonEsistente, null, null, 0, 10, null);
        });

        // Asserzioni
        assertEquals("DOM.404", exception.getMessage());
    }

    @Test
    void testListReferentiDominioUnauthorized() {
        // Dipendenza
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        // Creazione del dominio
        DominioCreate dominioCreate = this.getDominioCreate();
        dominioCreate.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = controller.createDominio(dominioCreate);
        assertEquals(HttpStatus.OK, createdDominio.getStatusCode());

        this.tearDown();

        // Tentativo di recuperare la lista di referenti senza autorizzazione
        assertThrows(NotAuthorizedException.class, () -> {
            controller.listReferentiDominio(createdDominio.getBody().getIdDominio(), null, null, 0, 10, null);
        });
    }
    
    @Autowired
    UtentiController utentiController;
    
    @Test
    public void testListDominiSpecialCharacterSuccess() {
    	String q = "dominio_";

        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());

        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());

        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);

        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        DominioCreate dominioCreate1 = this.getDominioCreate();
        dominioCreate1.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        
        ResponseEntity<Dominio> createdDominio1 = controller.createDominio(dominioCreate1);
        
        assertEquals(HttpStatus.OK, createdDominio1.getStatusCode());

        DominioCreate dominioCreate2 = this.getDominioCreate();
        dominioCreate2.setNome("SecondDomain");
        dominioCreate2.setDescrizione("dominio questa e' la descrizione");
        dominioCreate2.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());

        ResponseEntity<Dominio> createdDominio2 = controller.createDominio(dominioCreate2);

        assertEquals(HttpStatus.OK, createdDominio2.getStatusCode());

        ResponseEntity<PagedModelItemDominio> responseList = controller.listDomini(null, null, null, null, null, null, q, 0, 10, null);
        
        assertNotNull(responseList.getBody());
        assertEquals(0, responseList.getBody().getContent().size());
    }
    
    @Test
    public void testListDominiSpecialCharacterSuccess2() {
    	String q = "dominio";
        ResponseEntity<Organizzazione> response = organizzazioniController.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());

        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);

        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        DominioCreate dominioCreate1 = this.getDominioCreate();
        dominioCreate1.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());

        ResponseEntity<Dominio> createdDominio1 = controller.createDominio(dominioCreate1);

        assertEquals(HttpStatus.OK, createdDominio1.getStatusCode());

        DominioCreate dominioCreate2 = this.getDominioCreate();
        dominioCreate2.setNome("SecondDomain");
        dominioCreate2.setDescrizione("dominio questa e' la descrizione");
        dominioCreate2.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());

        ResponseEntity<Dominio> createdDominio2 = controller.createDominio(dominioCreate2);

        assertEquals(HttpStatus.OK, createdDominio2.getStatusCode());

        ResponseEntity<PagedModelItemDominio> responseList = controller.listDomini(null, null, null, null, null, null, q, 0, 10, null);

        assertNotNull(responseList.getBody());
        assertEquals(1, responseList.getBody().getContent().size());
        //Questo e' il nome del dominio con la descrizione contenente la keyword "dominio"
        assertEquals(dominioCreate2.getNome(), responseList.getBody().getContent().get(0).getNome());
    }

    // =========================================================================
    // Test gestione domini da parte di AMMINISTRATORE_ORGANIZZAZIONE
    // =========================================================================

    private Organizzazione creaOrgConNome(String nome) {
        OrganizzazioneCreate oc = CommonUtils.getOrganizzazioneCreate();
        oc.setNome(nome);
        oc.setReferente(true);
        return organizzazioniController.createOrganizzazione(oc).getBody();
    }

    private Soggetto creaSoggettoIn(UUID idOrgUuid, String nomeSoggetto) {
        SoggettoCreate sc = this.getSoggettoCreate();
        sc.setNome(nomeSoggetto);
        sc.setIdOrganizzazione(idOrgUuid);
        return soggettiController.createSoggetto(sc).getBody();
    }

    private Dominio creaDominioCon(UUID idSoggetto, String nomeDominio) {
        DominioCreate dc = this.getDominioCreate();
        dc.setNome(nomeDominio);
        dc.setIdSoggettoReferente(idSoggetto);
        return controller.createDominio(dc).getBody();
    }

    private void autenticaComeUtente(String principal) {
        InfoProfilo info = new InfoProfilo(principal,
                this.utenteService.findByPrincipal(principal).get(), List.of());
        when(this.authentication.getPrincipal()).thenReturn(info);
    }

    private void creaUtenteAmmOrgEAutentica(String principal, UUID idOrgUuid) {
        UtenteCreate uc = CommonUtils.getUtenteCreate();
        uc.setPrincipal(principal);
        uc.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        UtenteOrganizzazioneCreate assoc = new UtenteOrganizzazioneCreate();
        assoc.setIdOrganizzazione(idOrgUuid);
        assoc.setRuoloOrganizzazione(RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);
        uc.setOrganizzazioni(List.of(assoc));
        controllerUtenti.createUtente(uc);
        autenticaComeUtente(principal);
    }

    private void creaUtenteOperatoreApiEAutentica(String principal, UUID idOrgUuid) {
        UtenteCreate uc = CommonUtils.getUtenteCreate();
        uc.setPrincipal(principal);
        uc.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        UtenteOrganizzazioneCreate assoc = new UtenteOrganizzazioneCreate();
        assoc.setIdOrganizzazione(idOrgUuid);
        assoc.setRuoloOrganizzazione(RuoloOrganizzazioneEnum.OPERATORE_API);
        uc.setOrganizzazioni(List.of(assoc));
        controllerUtenti.createUtente(uc);
        autenticaComeUtente(principal);
    }

    private void setOrgContext(UUID idOrgUuid, RuoloOrganizzazione ruolo) {
        Long idLong = organizzazioneService.find(idOrgUuid).get().getId();
        organizationContext.setIdOrganizzazione(idLong);
        organizationContext.setRuoloOrganizzazione(ruolo);
        organizationContext.setInitialized(true);
    }

    @Test
    public void testCreateDominioComeAmmOrgSuccess() {
        Organizzazione org = creaOrgConNome("org-ammorg-create-ok");
        Soggetto sog = creaSoggettoIn(org.getIdOrganizzazione(), "sog-ammorg-create-ok");

        creaUtenteAmmOrgEAutentica("ammorg.create.ok", org.getIdOrganizzazione());
        setOrgContext(org.getIdOrganizzazione(), RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);

        DominioCreate dc = this.getDominioCreate();
        dc.setNome("dom-ammorg-ok");
        dc.setIdSoggettoReferente(sog.getIdSoggetto());

        ResponseEntity<Dominio> response = controller.createDominio(dc);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("dom-ammorg-ok", response.getBody().getNome());
    }

    @Test
    public void testCreateDominioComeAmmOrgAltraOrgForbidden() {
        Organizzazione orgX = creaOrgConNome("org-ammorg-x");
        Organizzazione orgY = creaOrgConNome("org-ammorg-y");
        Soggetto sogY = creaSoggettoIn(orgY.getIdOrganizzazione(), "sog-ammorg-y");

        creaUtenteAmmOrgEAutentica("ammorg.x.create.bad", orgX.getIdOrganizzazione());
        setOrgContext(orgX.getIdOrganizzazione(), RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);

        DominioCreate dc = this.getDominioCreate();
        dc.setNome("dom-fuori-org");
        dc.setIdSoggettoReferente(sogY.getIdSoggetto());

        NotAuthorizedException ex = assertThrows(NotAuthorizedException.class,
                () -> controller.createDominio(dc));
        assertEquals("AUT.403.AMM.ORG.DOMINIO.FUORI.ORG", ex.getMessage());
    }

    @Test
    public void testCreateDominioComeAmmOrgSenzaContestoForbidden() {
        Organizzazione org1 = creaOrgConNome("org-ammorg-multi-1");
        Organizzazione org2 = creaOrgConNome("org-ammorg-multi-2");
        Soggetto sog = creaSoggettoIn(org1.getIdOrganizzazione(), "sog-ammorg-multi");

        // Utente AMM_ORG su due organizzazioni: senza contesto sessione il fallback non scatta
        UtenteCreate uc = CommonUtils.getUtenteCreate();
        uc.setPrincipal("ammorg.multi.nocontext");
        uc.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        UtenteOrganizzazioneCreate a1 = new UtenteOrganizzazioneCreate();
        a1.setIdOrganizzazione(org1.getIdOrganizzazione());
        a1.setRuoloOrganizzazione(RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);
        UtenteOrganizzazioneCreate a2 = new UtenteOrganizzazioneCreate();
        a2.setIdOrganizzazione(org2.getIdOrganizzazione());
        a2.setRuoloOrganizzazione(RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);
        uc.setOrganizzazioni(List.of(a1, a2));
        controllerUtenti.createUtente(uc);
        autenticaComeUtente("ammorg.multi.nocontext");
        // Volutamente nessun setOrgContext

        DominioCreate dc = this.getDominioCreate();
        dc.setNome("dom-no-context");
        dc.setIdSoggettoReferente(sog.getIdSoggetto());

        NotAuthorizedException ex = assertThrows(NotAuthorizedException.class,
                () -> controller.createDominio(dc));
        // Fallback senza contesto org → hasRuoloInOrganizzazioneSessione=false → AUT_403
        assertEquals("AUT.403", ex.getMessage());
    }

    @Test
    public void testCreateDominioComeOperatoreApiForbidden() {
        Organizzazione org = creaOrgConNome("org-operapi-create");
        Soggetto sog = creaSoggettoIn(org.getIdOrganizzazione(), "sog-operapi-create");

        creaUtenteOperatoreApiEAutentica("operapi.create.bad", org.getIdOrganizzazione());
        setOrgContext(org.getIdOrganizzazione(), RuoloOrganizzazione.OPERATORE_API);

        DominioCreate dc = this.getDominioCreate();
        dc.setNome("dom-operapi");
        dc.setIdSoggettoReferente(sog.getIdSoggetto());

        NotAuthorizedException ex = assertThrows(NotAuthorizedException.class,
                () -> controller.createDominio(dc));
        // OPERATORE_API non è AMM_ORG → AUT_403 dal requireAmmOrgSu
        assertEquals("AUT.403", ex.getMessage());
    }

    @Test
    public void testUpdateDominioComeAmmOrgSuccess() {
        Organizzazione org = creaOrgConNome("org-ammorg-update-ok");
        Soggetto sog = creaSoggettoIn(org.getIdOrganizzazione(), "sog-ammorg-update-ok");
        Dominio dom = creaDominioCon(sog.getIdSoggetto(), "dom-ammorg-update-ok");

        creaUtenteAmmOrgEAutentica("ammorg.update.ok", org.getIdOrganizzazione());
        setOrgContext(org.getIdOrganizzazione(), RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);

        DominioUpdate du = new DominioUpdate();
        du.setNome("dom-ammorg-update-ok-modificato");
        du.setIdSoggettoReferente(sog.getIdSoggetto());
        du.setVisibilita(VisibilitaDominioEnum.PUBBLICO);
        du.setDeprecato(false);
        du.setSkipCollaudo(true);

        ResponseEntity<Dominio> response = controller.updateDominio(dom.getIdDominio(), du);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("dom-ammorg-update-ok-modificato", response.getBody().getNome());
    }

    @Test
    public void testUpdateDominioComeAmmOrgAltraOrgForbidden() {
        Organizzazione orgX = creaOrgConNome("org-ammorg-update-x");
        Organizzazione orgY = creaOrgConNome("org-ammorg-update-y");
        Soggetto sogY = creaSoggettoIn(orgY.getIdOrganizzazione(), "sog-update-y");
        Dominio dom = creaDominioCon(sogY.getIdSoggetto(), "dom-in-y");

        creaUtenteAmmOrgEAutentica("ammorg.x.update.bad", orgX.getIdOrganizzazione());
        setOrgContext(orgX.getIdOrganizzazione(), RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);

        DominioUpdate du = new DominioUpdate();
        du.setNome("tentativo");
        du.setIdSoggettoReferente(sogY.getIdSoggetto());
        du.setVisibilita(VisibilitaDominioEnum.PUBBLICO);

        NotAuthorizedException ex = assertThrows(NotAuthorizedException.class,
                () -> controller.updateDominio(dom.getIdDominio(), du));
        assertEquals("AUT.403.AMM.ORG.DOMINIO.FUORI.ORG", ex.getMessage());
    }

    @Test
    public void testUpdateDominioComeAmmOrgSpostaSuAltraOrgForbidden() {
        Organizzazione orgX = creaOrgConNome("org-sposta-x");
        Organizzazione orgY = creaOrgConNome("org-sposta-y");
        Soggetto sogX = creaSoggettoIn(orgX.getIdOrganizzazione(), "sog-sposta-x");
        Soggetto sogY = creaSoggettoIn(orgY.getIdOrganizzazione(), "sog-sposta-y");
        Dominio dom = creaDominioCon(sogX.getIdSoggetto(), "dom-da-spostare");

        creaUtenteAmmOrgEAutentica("ammorg.sposta", orgX.getIdOrganizzazione());
        setOrgContext(orgX.getIdOrganizzazione(), RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);

        DominioUpdate du = new DominioUpdate();
        du.setNome("dom-da-spostare");
        du.setIdSoggettoReferente(sogY.getIdSoggetto()); // tenta lo spostamento verso org Y
        du.setVisibilita(VisibilitaDominioEnum.PUBBLICO);

        NotAuthorizedException ex = assertThrows(NotAuthorizedException.class,
                () -> controller.updateDominio(dom.getIdDominio(), du));
        assertEquals("AUT.403.AMM.ORG.DOMINIO.FUORI.ORG", ex.getMessage());
    }

    @Test
    public void testDeleteDominioComeAmmOrgSuccess() {
        Organizzazione org = creaOrgConNome("org-ammorg-delete-ok");
        Soggetto sog = creaSoggettoIn(org.getIdOrganizzazione(), "sog-ammorg-delete-ok");
        Dominio dom = creaDominioCon(sog.getIdSoggetto(), "dom-ammorg-delete-ok");

        creaUtenteAmmOrgEAutentica("ammorg.delete.ok", org.getIdOrganizzazione());
        setOrgContext(org.getIdOrganizzazione(), RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);

        ResponseEntity<Void> response = controller.deleteDominio(dom.getIdDominio());
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    public void testDeleteDominioComeAmmOrgAltraOrgForbidden() {
        Organizzazione orgX = creaOrgConNome("org-ammorg-delete-x");
        Organizzazione orgY = creaOrgConNome("org-ammorg-delete-y");
        Soggetto sogY = creaSoggettoIn(orgY.getIdOrganizzazione(), "sog-delete-y");
        Dominio dom = creaDominioCon(sogY.getIdSoggetto(), "dom-delete-y");

        creaUtenteAmmOrgEAutentica("ammorg.x.delete.bad", orgX.getIdOrganizzazione());
        setOrgContext(orgX.getIdOrganizzazione(), RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);

        NotAuthorizedException ex = assertThrows(NotAuthorizedException.class,
                () -> controller.deleteDominio(dom.getIdDominio()));
        assertEquals("AUT.403.AMM.ORG.DOMINIO.FUORI.ORG", ex.getMessage());
    }

    @Test
    public void testCreateReferenteDominioComeAmmOrgSuccess() {
        Organizzazione org = creaOrgConNome("org-ammorg-ref-ok");
        Soggetto sog = creaSoggettoIn(org.getIdOrganizzazione(), "sog-ammorg-ref-ok");
        Dominio dom = creaDominioCon(sog.getIdSoggetto(), "dom-ammorg-ref-ok");

        // L'utente referente da associare deve essere associato all'organizzazione del dominio
        UtenteCreate referenteUtente = CommonUtils.getUtenteCreate();
        referenteUtente.setPrincipal("ref.candidato.ok");
        referenteUtente.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        UtenteOrganizzazioneCreate refAssoc = new UtenteOrganizzazioneCreate();
        refAssoc.setIdOrganizzazione(org.getIdOrganizzazione());
        refAssoc.setRuoloOrganizzazione(RuoloOrganizzazioneEnum.OPERATORE_API);
        referenteUtente.setOrganizzazioni(List.of(refAssoc));
        Utente refCreato = controllerUtenti.createUtente(referenteUtente).getBody();

        creaUtenteAmmOrgEAutentica("ammorg.ref.ok", org.getIdOrganizzazione());
        setOrgContext(org.getIdOrganizzazione(), RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);

        ReferenteCreate rc = new ReferenteCreate();
        rc.setIdUtente(refCreato.getIdUtente());
        rc.setTipo(TipoReferenteEnum.REFERENTE);

        ResponseEntity<Referente> response = controller.createReferenteDominio(dom.getIdDominio(), rc);
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    public void testCreateReferenteDominioComeAmmOrgAltraOrgForbidden() {
        Organizzazione orgX = creaOrgConNome("org-ammorg-ref-x");
        Organizzazione orgY = creaOrgConNome("org-ammorg-ref-y");
        Soggetto sogY = creaSoggettoIn(orgY.getIdOrganizzazione(), "sog-ref-y");
        Dominio dom = creaDominioCon(sogY.getIdSoggetto(), "dom-ref-y");

        // Candidato referente in org Y (irrilevante: il check di authorization scatta prima)
        UtenteCreate referenteUtente = CommonUtils.getUtenteCreate();
        referenteUtente.setPrincipal("ref.candidato.bad");
        referenteUtente.setRuolo(RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE);
        UtenteOrganizzazioneCreate refAssoc = new UtenteOrganizzazioneCreate();
        refAssoc.setIdOrganizzazione(orgY.getIdOrganizzazione());
        refAssoc.setRuoloOrganizzazione(RuoloOrganizzazioneEnum.OPERATORE_API);
        referenteUtente.setOrganizzazioni(List.of(refAssoc));
        Utente refCreato = controllerUtenti.createUtente(referenteUtente).getBody();

        creaUtenteAmmOrgEAutentica("ammorg.x.ref.bad", orgX.getIdOrganizzazione());
        setOrgContext(orgX.getIdOrganizzazione(), RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);

        ReferenteCreate rc = new ReferenteCreate();
        rc.setIdUtente(refCreato.getIdUtente());
        rc.setTipo(TipoReferenteEnum.REFERENTE);

        NotAuthorizedException ex = assertThrows(NotAuthorizedException.class,
                () -> controller.createReferenteDominio(dom.getIdDominio(), rc));
        assertEquals("AUT.403.AMM.ORG.DOMINIO.FUORI.ORG", ex.getMessage());
    }

    @Test
    public void testListDominiComeAmmOrgFiltraOrgSessione() {
        Organizzazione orgX = creaOrgConNome("org-list-x");
        Organizzazione orgY = creaOrgConNome("org-list-y");
        Soggetto sogX = creaSoggettoIn(orgX.getIdOrganizzazione(), "sog-list-x");
        Soggetto sogY = creaSoggettoIn(orgY.getIdOrganizzazione(), "sog-list-y");
        creaDominioCon(sogX.getIdSoggetto(), "dom-list-x-1");
        creaDominioCon(sogX.getIdSoggetto(), "dom-list-x-2");
        creaDominioCon(sogY.getIdSoggetto(), "dom-list-y-1");

        creaUtenteAmmOrgEAutentica("ammorg.list", orgX.getIdOrganizzazione());
        setOrgContext(orgX.getIdOrganizzazione(), RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE);

        ResponseEntity<PagedModelItemDominio> response =
                controller.listDomini(null, null, null, null, null, null, null, 0, 50, null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        // Vede solo i due domini di X, non quello di Y
        boolean visibileX1 = response.getBody().getContent().stream()
                .anyMatch(d -> "dom-list-x-1".equals(d.getNome()));
        boolean visibileX2 = response.getBody().getContent().stream()
                .anyMatch(d -> "dom-list-x-2".equals(d.getNome()));
        boolean visibileY1 = response.getBody().getContent().stream()
                .anyMatch(d -> "dom-list-y-1".equals(d.getNome()));
        assertTrue(visibileX1, "Dominio dom-list-x-1 dovrebbe essere visibile");
        assertTrue(visibileX2, "Dominio dom-list-x-2 dovrebbe essere visibile");
        assertFalse(visibileY1, "Dominio dom-list-y-1 NON dovrebbe essere visibile");
    }
}

