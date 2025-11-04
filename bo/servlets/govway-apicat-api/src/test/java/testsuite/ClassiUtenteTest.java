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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.util.UUID;

import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.authorization.ClasseUtenteAuthorization;
import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.controllers.ClassiUtenteController;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.controllers.SoggettiController;
import org.govway.catalogo.controllers.UtentiController;
import org.govway.catalogo.core.services.ClasseUtenteService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.model.ClasseUtente;
import org.govway.catalogo.servlets.model.ClasseUtenteCreate;
import org.govway.catalogo.servlets.model.ClasseUtenteUpdate;
import org.govway.catalogo.servlets.model.PagedModelItemClasseUtente;
import org.govway.catalogo.servlets.model.RuoloUtenteEnum;
import org.govway.catalogo.servlets.model.Utente;
import org.govway.catalogo.servlets.model.UtenteCreate;
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

@ExtendWith(SpringExtension.class)  // JUnit 5 extension
@SpringBootTest(classes = OpenAPI2SpringBoot.class)
@EnableAutoConfiguration(exclude = {GroovyTemplateAutoConfiguration.class})
@AutoConfigureTestDatabase(replace = Replace.ANY)
@ActiveProfiles("test")
@DirtiesContext(classMode = ClassMode.BEFORE_CLASS)
@TestInstance(TestInstance.Lifecycle.PER_METHOD)
@Transactional
public class ClassiUtenteTest {

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @Mock
    private ClasseUtenteAuthorization authorization;

    @Mock
    private CoreAuthorization coreAuthorization;

    @Autowired
    UtenteService utenteService;

    @Autowired
    ClasseUtenteService classeUtenteService;

    @Autowired
    private OrganizzazioniController organizzazioniController;

    @Autowired
    private ClassiUtenteController controller;

    @Autowired
    private SoggettiController soggettiController;

    private static final String UTENTE_GESTORE = "gestore";

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.initMocks(this);
        // Set up the mock security context and authentication
        when(this.securityContext.getAuthentication()).thenReturn(this.authentication);

        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);

        // Configura `coreAuthorization` per essere utilizzato nei test
        when(coreAuthorization.isAnounymous()).thenReturn(true);

        // Set the security context in the SecurityContextHolder
        SecurityContextHolder.setContext(this.securityContext);
    }

    @AfterEach
    public void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    public void testCreateClasseUtenteSuccess() {
        // Creazione del modello di input
        ClasseUtenteCreate classeUtenteCreate = new ClasseUtenteCreate();
        classeUtenteCreate.setNome("nome classe");
        classeUtenteCreate.setDescrizione("una descrizione");

        // Esecuzione del metodo
        ResponseEntity<ClasseUtente> response = controller.createClasseUtente(classeUtenteCreate);

        // Asserzioni
        assertNotNull(response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(classeUtenteCreate.getNome(), response.getBody().getNome());
        assertEquals(classeUtenteCreate.getDescrizione(), response.getBody().getDescrizione());
    }

    @Test
    public void testCreateClasseUtenteConflict() {
        // Creazione del modello di input
        ClasseUtenteCreate classeUtenteCreate = new ClasseUtenteCreate();
        classeUtenteCreate.setNome("xxxx");
        classeUtenteCreate.setDescrizione("yyyy");

        // Prima creazione (dovrebbe avere successo)
        controller.createClasseUtente(classeUtenteCreate);

        // Tentativo di creare una seconda ClasseUtente con lo stesso nome
        ConflictException exception = assertThrows(ConflictException.class, () -> {
            controller.createClasseUtente(classeUtenteCreate);
        });

        // Asserzioni
        assertEquals("CLS.404", exception.getMessage());
    }

    @Test
    public void testCreateClasseUtenteUnauthorized() {
        // Creazione del modello di input
        ClasseUtenteCreate classeUtenteCreate = new ClasseUtenteCreate();
        classeUtenteCreate.setNome("xxxx");
        classeUtenteCreate.setDescrizione("yyyy");

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Tentativo di creare la ClasseUtente senza autorizzazione
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
        	ResponseEntity<ClasseUtente> cu = controller.createClasseUtente(classeUtenteCreate);
        	System.out.println("NOME CLASSE UTENTE: "+cu.getBody().getNome());
	    });

        // Asserzioni
        assertEquals("UT.403", exception.getMessage());
    }
    
    @Test
    public void testCreateClasseUtenteUtenteAnonimo() {
        // Creazione del modello di input
        ClasseUtenteCreate classeUtenteCreate = new ClasseUtenteCreate();
        classeUtenteCreate.setNome("xxxx");
        classeUtenteCreate.setDescrizione("yyyy");

        this.tearDown();
        
        // Tentativo di creare la ClasseUtente senza autorizzazione
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
        	ResponseEntity<ClasseUtente> cu = controller.createClasseUtente(classeUtenteCreate);
        	System.out.println("NOME CLASSE UTENTE: "+cu.getBody().getNome());
	    });

        // Asserzioni
        assertEquals("AUT.403", exception.getMessage());
    }

    @Test
    public void testDeleteClasseUtenteSuccess() {
        // Creazione della ClasseUtente
        ClasseUtenteCreate classeUtenteCreate = new ClasseUtenteCreate();
        classeUtenteCreate.setNome("xxxx");
        classeUtenteCreate.setDescrizione("yyyy");
        ResponseEntity<ClasseUtente> responseClasseUtente = controller.createClasseUtente(classeUtenteCreate);
        assertNotNull(responseClasseUtente.getBody());

        // Cancellazione della `ClasseUtente`
        ResponseEntity<Void> responseDelete = controller.deleteClasseUtente(responseClasseUtente.getBody().getIdClasseUtente());

        // Asserzioni
        assertEquals(HttpStatus.OK, responseDelete.getStatusCode());
    }

    @Test
    public void testDeleteClasseUtenteNotFound() {
        UUID idClasseUtenteNonEsistente = UUID.randomUUID();

        // Tentativo di cancellare una `ClasseUtente` inesistente
        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.deleteClasseUtente(idClasseUtenteNonEsistente);
        });

        // Asserzioni
        assertEquals("CLS.404", exception.getMessage());
    }

    @Test
    public void testDeleteClasseUtenteUnauthorized() {
        // Creazione della ClasseUtente
        ClasseUtenteCreate classeUtenteCreate = new ClasseUtenteCreate();
        classeUtenteCreate.setNome("xxxx");
        classeUtenteCreate.setDescrizione("yyyy");
        ResponseEntity<ClasseUtente> responseClasseUtente = controller.createClasseUtente(classeUtenteCreate);
        assertNotNull(responseClasseUtente.getBody());

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Tentativo di cancellare la `ClasseUtente` senza autorizzazione
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.deleteClasseUtente(responseClasseUtente.getBody().getIdClasseUtente());
        });

        // Asserzioni
        assertEquals("UT.403", exception.getMessage());
    }
    
    @Test
    public void testDeleteClasseUtenteUtenteAnonimo() {
        // Creazione della ClasseUtente
        ClasseUtenteCreate classeUtenteCreate = new ClasseUtenteCreate();
        classeUtenteCreate.setNome("xxxx");
        classeUtenteCreate.setDescrizione("yyyy");
        ResponseEntity<ClasseUtente> responseClasseUtente = controller.createClasseUtente(classeUtenteCreate);
        assertNotNull(responseClasseUtente.getBody());

        this.tearDown();

        // Tentativo di cancellare la `ClasseUtente` senza autorizzazione
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.deleteClasseUtente(responseClasseUtente.getBody().getIdClasseUtente());
        });

        // Asserzioni
        assertEquals("AUT.403", exception.getMessage());
    }

    @Test
    public void testGetClasseUtenteSuccess() {
        // Creazione della ClasseUtente
        ClasseUtenteCreate classeUtenteCreate = new ClasseUtenteCreate();
        classeUtenteCreate.setNome("xxxx");
        classeUtenteCreate.setDescrizione("yyyy");
        ResponseEntity<ClasseUtente> responseCreate = controller.createClasseUtente(classeUtenteCreate);
        assertNotNull(responseCreate.getBody());

        // Recupero della ClasseUtente
        ResponseEntity<ClasseUtente> responseGet = controller.getClasseUtente(responseCreate.getBody().getIdClasseUtente());

        // Asserzioni
        assertNotNull(responseGet.getBody());
        assertEquals(HttpStatus.OK, responseGet.getStatusCode());
        assertEquals(responseCreate.getBody().getIdClasseUtente(), responseGet.getBody().getIdClasseUtente());
        assertEquals(responseCreate.getBody().getNome(), responseGet.getBody().getNome());
    }

    @Test
    public void testGetClasseUtenteNotFound() {
        UUID idClasseUtenteNonEsistente = UUID.randomUUID();

        // Tentativo di recuperare una ClasseUtente inesistente
        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.getClasseUtente(idClasseUtenteNonEsistente);
        });

        // Asserzioni
        assertEquals("CLS.404", exception.getMessage());
    }

    /*
    @Test
    public void testGetClasseUtenteUnauthorized() {
        // Creazione della ClasseUtente
        ClasseUtenteCreate classeUtenteCreate = new ClasseUtenteCreate();
        classeUtenteCreate.setNome("xxxx");
        classeUtenteCreate.setDescrizione("yyyy");
        ResponseEntity<ClasseUtente> responseCreate = controller.createClasseUtente(classeUtenteCreate);
        assertNotNull(responseCreate.getBody());

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Tentativo di recuperare la ClasseUtente senza autorizzazione
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.getClasseUtente(responseCreate.getBody().getIdClasseUtente());
        });

        // Asserzioni
        assertEquals("UT.403", exception.getMessage());
    }
    */
    
    @Test
    public void testGetClasseUtenteUtenteAnonimo() {
        // Creazione della ClasseUtente
        ClasseUtenteCreate classeUtenteCreate = new ClasseUtenteCreate();
        classeUtenteCreate.setNome("xxxx");
        classeUtenteCreate.setDescrizione("yyyy");
        ResponseEntity<ClasseUtente> responseCreate = controller.createClasseUtente(classeUtenteCreate);
        assertNotNull(responseCreate.getBody());

        this.tearDown();

        // Tentativo di recuperare la ClasseUtente senza autorizzazione
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.getClasseUtente(responseCreate.getBody().getIdClasseUtente());
        });

        // Asserzioni
        assertEquals("AUT.403", exception.getMessage());
    }

    @Test
    public void testListClassiUtenteSuccessNoFilters() {
        // Creazione di alcune ClassiUtente
        ClasseUtenteCreate classeUtenteCreate1 = new ClasseUtenteCreate();
        classeUtenteCreate1.setNome("xxxx1");
        classeUtenteCreate1.setDescrizione("yyyy1");
        ClasseUtenteCreate classeUtenteCreate2 = new ClasseUtenteCreate();
        classeUtenteCreate2.setNome("xxxx2");
        classeUtenteCreate2.setDescrizione("yyyy2");
        classeUtenteCreate2.setNome("SecondaClasse");
        controller.createClasseUtente(classeUtenteCreate1);
        controller.createClasseUtente(classeUtenteCreate2);

        // Recupero della lista di ClassiUtente senza filtri
        ResponseEntity<PagedModelItemClasseUtente> responseList = controller.listClassiUtente(null, null, null, 0, 10, null);

        // Asserzioni
        assertNotNull(responseList.getBody());
        assertEquals(2, responseList.getBody().getContent().size());
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
    }

    @Test
    public void testListClassiUtenteUnauthorized() {
        SecurityContextHolder.clearContext();

        // Tentativo di recuperare la lista di ClassiUtente senza essere loggato
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.listClassiUtente(null, null, null, 0, 10, null);
        });
    }

    @Test
    public void testUpdateClasseUtenteSuccess() {
        // Creazione della ClasseUtente
        ClasseUtenteCreate classeUtenteCreate = new ClasseUtenteCreate();
        classeUtenteCreate.setNome("xxxx");
        classeUtenteCreate.setDescrizione("yyyy");
        ResponseEntity<ClasseUtente> responseCreate = controller.createClasseUtente(classeUtenteCreate);
        assertNotNull(responseCreate.getBody());

        // Preparazione dell'update
        ClasseUtenteUpdate classeUtenteUpdate = new ClasseUtenteUpdate();
        classeUtenteUpdate.setNome("NuovoNome");

        // Aggiornamento della ClasseUtente
        ResponseEntity<ClasseUtente> responseUpdate = controller.updateClasseUtente(responseCreate.getBody().getIdClasseUtente(), classeUtenteUpdate);

        // Asserzioni
        assertNotNull(responseUpdate.getBody());
        assertEquals("NuovoNome", responseUpdate.getBody().getNome());
        assertEquals(HttpStatus.OK, responseUpdate.getStatusCode());
    }

    @Test
    public void testUpdateClasseUtenteNotFound() {
        UUID idClasseUtenteNonEsistente = UUID.randomUUID();

        // Preparazione dell'update
        ClasseUtenteUpdate classeUtenteUpdate = new ClasseUtenteUpdate();
        classeUtenteUpdate.setNome("NuovoNome");

        // Tentativo di aggiornare una ClasseUtente inesistente
        assertThrows(NotFoundException.class, () -> {
            controller.updateClasseUtente(idClasseUtenteNonEsistente, classeUtenteUpdate);
        });

        // Asserzioni
        //assertEquals("ClasseUtente [" + idClasseUtenteNonEsistente + "] non trovata", exception.getMessage());
    }

    @Test
    public void testUpdateClasseUtenteUnauthorized() {
        // Creazione della ClasseUtente
        ClasseUtenteCreate classeUtenteCreate = new ClasseUtenteCreate();
        classeUtenteCreate.setNome("xxxx");
        classeUtenteCreate.setDescrizione("yyyy");
        ResponseEntity<ClasseUtente> responseCreate = controller.createClasseUtente(classeUtenteCreate);
        assertNotNull(responseCreate.getBody());

        // Preparazione dell'update
        ClasseUtenteUpdate classeUtenteUpdate = new ClasseUtenteUpdate();
        classeUtenteUpdate.setNome("NuovoNome");

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        // Tentativo di aggiornare la `ClasseUtente` senza autorizzazione
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.updateClasseUtente(responseCreate.getBody().getIdClasseUtente(), classeUtenteUpdate);
        });

        // Asserzioni
        assertEquals("UT.403", exception.getMessage());
    }
    
    @Test
    public void testUpdateClasseUtenteUtenteAnonimo() {
        // Creazione della ClasseUtente
        ClasseUtenteCreate classeUtenteCreate = new ClasseUtenteCreate();
        classeUtenteCreate.setNome("xxxx");
        classeUtenteCreate.setDescrizione("yyyy");
        ResponseEntity<ClasseUtente> responseCreate = controller.createClasseUtente(classeUtenteCreate);
        assertNotNull(responseCreate.getBody());

        // Preparazione dell'update
        ClasseUtenteUpdate classeUtenteUpdate = new ClasseUtenteUpdate();
        classeUtenteUpdate.setNome("NuovoNome");

        this.tearDown();
        
        // Tentativo di aggiornare la `ClasseUtente` senza autorizzazione
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.updateClasseUtente(responseCreate.getBody().getIdClasseUtente(), classeUtenteUpdate);
        });

        // Asserzioni
        assertEquals("AUT.403", exception.getMessage());
    }
    
    @Autowired
    UtentiController utentiController;
    
    @Test
    public void testCreateDeleteClasseUtenteReferenteServizioSuccess() {
    	UtenteCreate utente = CommonUtils.getUtenteCreate();
        utente.setRuolo(RuoloUtenteEnum.REFERENTE_SERVIZIO);
        utente.setReferenteTecnico(false);
        utente.setPrincipal("unoqualsiasi");
        
        ResponseEntity<Utente> responseUtente = utentiController.createUtente(utente);
        
        CommonUtils.getSessionUtente(responseUtente.getBody().getPrincipal(), securityContext, authentication, utenteService);

    	// Creazione della ClasseUtente
        ClasseUtenteCreate classeUtenteCreate = new ClasseUtenteCreate();
        classeUtenteCreate.setNome("xxxx");
        classeUtenteCreate.setDescrizione("yyyy");
        ResponseEntity<ClasseUtente> responseClasseUtente = controller.createClasseUtente(classeUtenteCreate);
        assertNotNull(responseClasseUtente.getBody());

        // Cancellazione della `ClasseUtente`
        ResponseEntity<Void> responseDelete = controller.deleteClasseUtente(responseClasseUtente.getBody().getIdClasseUtente());

        // Asserzioni
        assertEquals(HttpStatus.OK, responseDelete.getStatusCode());
    }
    
    @Test
    public void testCreateClasseUtenteCoordinatoreError() {
    	UtenteCreate utente = CommonUtils.getUtenteCreate();
        utente.setRuolo(RuoloUtenteEnum.COORDINATORE);
        utente.setReferenteTecnico(false);
        utente.setPrincipal("unoqualsiasi");
        
        ResponseEntity<Utente> responseUtente = utentiController.createUtente(utente);
        
        CommonUtils.getSessionUtente(responseUtente.getBody().getPrincipal(), securityContext, authentication, utenteService);

    	// Creazione della ClasseUtente
        ClasseUtenteCreate classeUtenteCreate = new ClasseUtenteCreate();
        classeUtenteCreate.setNome("xxxx");
        classeUtenteCreate.setDescrizione("yyyy");

        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
        	controller.createClasseUtente(classeUtenteCreate);
    	});

        assertEquals("AUT.403", exception.getMessage());
    }
}

