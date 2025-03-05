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
import java.util.UUID;

import javax.validation.ConstraintViolationException;

import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.authorization.DominioAuthorization;
import org.govway.catalogo.controllers.DominiController;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.controllers.SoggettiController;
import org.govway.catalogo.controllers.UtentiController;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.servlets.model.Dominio;
import org.govway.catalogo.servlets.model.DominioCreate;
import org.govway.catalogo.servlets.model.DominioUpdate;
import org.govway.catalogo.servlets.model.ItemDominio;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.PagedModelItemDominio;
import org.govway.catalogo.servlets.model.PagedModelReferente;
import org.govway.catalogo.servlets.model.Referente;
import org.govway.catalogo.servlets.model.ReferenteCreate;
import org.govway.catalogo.servlets.model.RuoloUtenteEnum;
import org.govway.catalogo.servlets.model.Soggetto;
import org.govway.catalogo.servlets.model.SoggettoCreate;
import org.govway.catalogo.servlets.model.TipoReferenteEnum;
import org.govway.catalogo.servlets.model.Utente;
import org.govway.catalogo.servlets.model.UtenteCreate;
import org.govway.catalogo.servlets.model.VisibilitaDominioEnum;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
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

@ExtendWith(SpringExtension.class)  // JUnit 5 extension
@SpringBootTest(classes = OpenAPI2SpringBoot.class)
@EnableAutoConfiguration(exclude = {GroovyTemplateAutoConfiguration.class})
@AutoConfigureTestDatabase(replace = Replace.ANY)
@ActiveProfiles("test")
@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
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

    private static final String UTENTE_GESTORE = "gestore";

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.initMocks(this);
        when(this.securityContext.getAuthentication()).thenReturn(this.authentication);

        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);

        when(coreAuthorization.isAnounymous()).thenReturn(true);

        SecurityContextHolder.setContext(this.securityContext);
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

        assertEquals("Dominio [" + dominioCreate2.getNome() + "] esiste gia", exception.getMessage());
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

        assertEquals("Utente non abilitato", exception.getMessage());
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

        assertEquals("Utente non specificato", exception.getMessage());
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

        assertEquals("Dominio [" + idDominioNonEsistente + "] non trovato", exception.getMessage());
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

        assertEquals("Utente non abilitato", exception.getMessage());
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

        assertEquals("Utente non specificato", exception.getMessage());
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

        assertEquals("Dominio [" + idDominioNonEsistente + "] non trovato", exception.getMessage());
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

        assertEquals("Dominio [" + idDominioNonEsistente + "] non trovato", exception.getMessage());
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

        assertEquals("Utente non abilitato", exception.getMessage());
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

        assertEquals("Utente non specificato", exception.getMessage());
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
        utente.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        utente.setRuolo(RuoloUtenteEnum.REFERENTE_SERVIZIO);
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

        // Creazione del referente
        ReferenteCreate referenteCreate = new ReferenteCreate();
        referenteCreate.setTipo(TipoReferenteEnum.REFERENTE);
//        referenteCreate.setIdUtente("test");

        org.govway.catalogo.exception.NotFoundException exception = assertThrows(org.govway.catalogo.exception.NotFoundException.class, () -> {
            controller.createReferenteDominio(idDominioNonEsistente, referenteCreate);
        });

        // Asserzioni
        assertEquals("Dominio [" + idDominioNonEsistente + "] non trovato", exception.getMessage());
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
        
        // Tentativo di creare un referente senza autorizzazione
        ReferenteCreate referenteCreate = new ReferenteCreate();
        referenteCreate.setTipo(TipoReferenteEnum.REFERENTE);
//        referenteCreate.setIdUtente("test");
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.createReferenteDominio(createdDominio.getBody().getIdDominio(), referenteCreate);
        });

        // Asserzioni
        assertEquals("Utente non abilitato", exception.getMessage());
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
        
        // Tentativo di creare un referente senza autorizzazione
        ReferenteCreate referenteCreate = new ReferenteCreate();
        referenteCreate.setTipo(TipoReferenteEnum.REFERENTE);
//        referenteCreate.setIdUtente("test");
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.createReferenteDominio(createdDominio.getBody().getIdDominio(), referenteCreate);
        });

        // Asserzioni
        assertEquals("Utente non specificato", exception.getMessage());
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

        // Creazione di un referente non valido (per esempio, senza il tiporeferente definito)
        ReferenteCreate referenteCreate = new ReferenteCreate();
//        referenteCreate.setIdUtente("test");  // Nome del referente mancante

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
        utente.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        utente.setRuolo(RuoloUtenteEnum.REFERENTE_SERVIZIO);
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
        org.govway.catalogo.core.exceptions.NotFoundException exception = assertThrows(org.govway.catalogo.core.exceptions.NotFoundException.class, () -> {
            controller.deleteReferenteDominio(idDominioNonEsistente, idUtente, TipoReferenteEnum.REFERENTE);
        });
        
        // Asserzioni
        assertEquals("Referente [" + idUtente + "] non trovato per dominio [" + idDominioNonEsistente + "] e tipo [REFERENTE]", exception.getMessage());
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
        utente.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        utente.setRuolo(RuoloUtenteEnum.REFERENTE_SERVIZIO);
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

        // Asserzioni
        assertEquals("Utente non abilitato", exception.getMessage());
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
        utente.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        utente.setRuolo(RuoloUtenteEnum.REFERENTE_SERVIZIO);
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

        // Asserzioni
        assertEquals("Utente non specificato", exception.getMessage());
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

        org.govway.catalogo.core.exceptions.NotFoundException exception = assertThrows(org.govway.catalogo.core.exceptions.NotFoundException.class, () -> {
            controller.deleteReferenteDominio(createdDominio.getBody().getIdDominio(), idUtenteNonEsistente, TipoReferenteEnum.REFERENTE);
        });

        // Asserzioni
        assertEquals("Referente [" + idUtenteNonEsistente + "] non trovato per dominio [" + createdDominio.getBody().getIdDominio() + "] e tipo [REFERENTE]", exception.getMessage());
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
        utente.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        utente.setRuolo(RuoloUtenteEnum.REFERENTE_SERVIZIO);
        ResponseEntity<Utente> responseUtente = controllerUtenti.createUtente(utente);
        
        UtenteCreate utente2 = CommonUtils.getUtenteCreate();
        utente2.setPrincipal("altrousername");
        utente2.setNome("utente 2");
        utente2.setCognome("cognome 2");
        utente2.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        utente2.setRuolo(RuoloUtenteEnum.REFERENTE_SERVIZIO);
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
            utente.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
            utente.setRuolo(RuoloUtenteEnum.REFERENTE_SERVIZIO);
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
        utente.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        utente.setRuolo(RuoloUtenteEnum.REFERENTE_SERVIZIO);
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
            utente.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
            utente.setRuolo(RuoloUtenteEnum.REFERENTE_SERVIZIO);
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
        utente.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        utente.setRuolo(RuoloUtenteEnum.REFERENTE_SERVIZIO);
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
            utente.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
            utente.setRuolo(RuoloUtenteEnum.REFERENTE_SERVIZIO);
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
        utente.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        utente.setRuolo(RuoloUtenteEnum.REFERENTE_SERVIZIO);
        ResponseEntity<Utente> responseUtente = controllerUtenti.createUtente(utente);
        
        UtenteCreate utente2 = CommonUtils.getUtenteCreate();
        utente2.setPrincipal("altrousername");
        utente2.setNome("utente 2");
        utente2.setCognome("cognome 2");
        utente2.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        utente2.setRuolo(RuoloUtenteEnum.REFERENTE_SERVIZIO);
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
        assertEquals("Dominio [" + idDominioNonEsistente + "] non trovato", exception.getMessage());
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

}

