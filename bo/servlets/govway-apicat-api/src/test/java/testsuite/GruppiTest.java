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

import java.util.List;
import java.util.UUID;

import org.apache.commons.codec.binary.Base64;
import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.authorization.GruppoAuthorization;
import org.govway.catalogo.controllers.GruppiController;
import org.govway.catalogo.controllers.UtentiController;
import org.govway.catalogo.core.services.GruppoService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.model.DocumentoCreate;
import org.govway.catalogo.servlets.model.Gruppo;
import org.govway.catalogo.servlets.model.GruppoCreate;
import org.govway.catalogo.servlets.model.GruppoUpdate;
import org.govway.catalogo.servlets.model.ListItemGruppo;
import org.govway.catalogo.servlets.model.RuoloUtenteEnum;
import org.govway.catalogo.servlets.model.TipoServizio;
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
import org.springframework.context.ApplicationContext;
import org.springframework.context.event.ContextClosedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@ExtendWith(SpringExtension.class)  // JUnit 5 extension
@SpringBootTest(classes = OpenAPI2SpringBoot.class)
@EnableAutoConfiguration(exclude = {GroovyTemplateAutoConfiguration.class})
@AutoConfigureTestDatabase(replace = Replace.ANY)
@ActiveProfiles("test")
@DirtiesContext(classMode = ClassMode.BEFORE_CLASS)
@TestInstance(TestInstance.Lifecycle.PER_METHOD)
@Transactional
public class GruppiTest {

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @Mock
    private GruppoAuthorization authorization;

    @Mock
    private CoreAuthorization coreAuthorization;

    @Autowired
    UtenteService utenteService;

    @Autowired
    GruppoService gruppoService;

    @Autowired
    private GruppiController controller;
    
    @Autowired
    private UtentiController utentiController;

    @Autowired
    private WebApplicationContext wac;
    
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
        
        // aggiorno il web application context che in alcuni casi non viene aggiornato dopo la ripulitura
        RequestContextHolder.resetRequestAttributes();
        MockServletContext mockServletContext = new MockServletContext();
        mockServletContext.setAttribute(WebApplicationContext.ROOT_WEB_APPLICATION_CONTEXT_ATTRIBUTE, wac);
        MockHttpServletRequest request = new MockHttpServletRequest(mockServletContext);
        ServletRequestAttributes attrs = new ServletRequestAttributes(request);
        RequestContextHolder.setRequestAttributes(attrs);
    }

    @AfterEach
    public void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    public void testCreateGruppoSuccess() {
        GruppoCreate gruppo = CommonUtils.getGruppoCreate();
        ResponseEntity<Gruppo> createdGruppo = controller.createGruppo(gruppo);

        assertEquals(HttpStatus.OK, createdGruppo.getStatusCode());
        assertNotNull(createdGruppo.getBody());
        assertEquals(CommonUtils.NOME_GRUPPO, createdGruppo.getBody().getNome());
        assertEquals(CommonUtils.DESCRIZIONE_GRUPPO, createdGruppo.getBody().getDescrizione());
    }
    
    @Test
    public void testReadGruppoSuccessCoordinatore() {
        GruppoCreate gruppo = CommonUtils.getGruppoCreate();
        ResponseEntity<Gruppo> createdGruppo = controller.createGruppo(gruppo);
        
        UtenteCreate utente = CommonUtils.getUtenteCreate();
        utente.setRuolo(RuoloUtenteEnum.REFERENTE_SERVIZIO);
        
        ResponseEntity<Utente> responseUtente = utentiController.createUtente(utente);
        
        
        CommonUtils.getSessionUtente(responseUtente.getBody().getPrincipal(), securityContext, authentication, utenteService);

        Gruppo gruppox = controller.getGruppo(createdGruppo.getBody().getIdGruppo()).getBody();
        //System.out.println(gruppox.getNome());
    }

    @Test
    public void testCreateGruppoConflict() {
        GruppoCreate gruppo1 = CommonUtils.getGruppoCreate();
        controller.createGruppo(gruppo1);

        GruppoCreate gruppo2 = CommonUtils.getGruppoCreate();  // Identico a gruppo1
        ConflictException exception = assertThrows(ConflictException.class, () -> {
            controller.createGruppo(gruppo2);
        });

        assertEquals("Gruppo [" + gruppo2.getNome() + "] esiste gia", exception.getMessage());
    }

    @Test
    public void testCreateGruppoUnauthorized() {
    	CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);
        
        GruppoCreate gruppo = CommonUtils.getGruppoCreate();
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.createGruppo(gruppo);
        });

        assertEquals("Utente non abilitato", exception.getMessage());
    }
    
    @Test
    public void testCreateGruppoUtenteAnonimo() {
    	this.tearDown();        
        
    	GruppoCreate gruppo = CommonUtils.getGruppoCreate();
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.createGruppo(gruppo);
        });

        assertEquals("Utente non specificato", exception.getMessage());
    }

    @Test
    public void testDeleteGruppoSuccess() {
        GruppoCreate gruppoCreate = CommonUtils.getGruppoCreate();
        ResponseEntity<Gruppo> createdGruppo = controller.createGruppo(gruppoCreate);
        assertEquals(HttpStatus.OK, createdGruppo.getStatusCode());

        UUID idGruppo = createdGruppo.getBody().getIdGruppo();
        
        ResponseEntity<Void> responseDelete = controller.deleteGruppo(idGruppo);

        assertEquals(HttpStatus.OK, responseDelete.getStatusCode());
    }
    
    @Test
    public void testCreateReadDeleteGruppoReferenteServizioSuccess() {
    	UtenteCreate utente = CommonUtils.getUtenteCreate();
        utente.setRuolo(RuoloUtenteEnum.REFERENTE_SERVIZIO);
        utente.setReferenteTecnico(false);
        utente.setPrincipal("unoqualsiasi");
        
        ResponseEntity<Utente> responseUtente = utentiController.createUtente(utente);
        
        CommonUtils.getSessionUtente(responseUtente.getBody().getPrincipal(), securityContext, authentication, utenteService);
    	
        GruppoCreate gruppoCreate = CommonUtils.getGruppoCreate();
        ResponseEntity<Gruppo> createdGruppo = controller.createGruppo(gruppoCreate);
        assertEquals(HttpStatus.OK, createdGruppo.getStatusCode());

        UUID idGruppo = createdGruppo.getBody().getIdGruppo();
        ResponseEntity<Gruppo> readGruppo = controller.getGruppo(idGruppo);
        
        assertEquals(HttpStatus.OK, readGruppo.getStatusCode());
        
        ResponseEntity<Void> responseDelete = controller.deleteGruppo(idGruppo);

        assertEquals(HttpStatus.OK, responseDelete.getStatusCode());
    }
    
    @Test
    public void testCreateGruppoCoordinatoreErrore() {
    	UtenteCreate utente = CommonUtils.getUtenteCreate();
        utente.setRuolo(RuoloUtenteEnum.COORDINATORE);
        utente.setReferenteTecnico(false);
        utente.setPrincipal("unoqualsiasi");
        
        ResponseEntity<Utente> responseUtente = utentiController.createUtente(utente);
        
        CommonUtils.getSessionUtente(responseUtente.getBody().getPrincipal(), securityContext, authentication, utenteService);
    	
        GruppoCreate gruppoCreate = CommonUtils.getGruppoCreate();
        
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
        	controller.createGruppo(gruppoCreate);
        });

        assertEquals("Required: Ruolo AMMINISTRATORE", exception.getMessage());
    }
    
    /*
    @Test
    public void testReadGruppoCoordinatoreError() {
    	UtenteCreate utente = CommonUtils.getUtenteCreate();
        utente.setRuolo(RuoloUtenteEnum.COORDINATORE);
        utente.setReferenteTecnico(false);
        utente.setPrincipal("unoqualsiasi");
        
        ResponseEntity<Utente> responseUtente = utentiController.createUtente(utente);
        
        CommonUtils.getSessionUtente(responseUtente.getBody().getPrincipal(), securityContext, authentication, utenteService);
    	
        GruppoCreate gruppoCreate = CommonUtils.getGruppoCreate();
        ResponseEntity<Gruppo> createdGruppo = controller.createGruppo(gruppoCreate);
        assertEquals(HttpStatus.OK, createdGruppo.getStatusCode());

        UUID idGruppo = createdGruppo.getBody().getIdGruppo();

        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
        	controller.getGruppo(idGruppo);
        });

        assertEquals("Utente non abilitato", exception.getMessage());
    }
	*/
    
    @Test
    public void testDeleteGruppoNotFound() {
        UUID idGruppoNonEsistente = UUID.randomUUID();

        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.deleteGruppo(idGruppoNonEsistente);
        });

        assertEquals("Gruppo [" + idGruppoNonEsistente + "] non trovato", exception.getMessage());
    }

    @Test
    public void testDeleteGruppoUnauthorized() {
        GruppoCreate gruppoCreate = CommonUtils.getGruppoCreate();
        ResponseEntity<Gruppo> createdGruppo = controller.createGruppo(gruppoCreate);
        assertEquals(HttpStatus.OK, createdGruppo.getStatusCode());

        UUID idGruppo = createdGruppo.getBody().getIdGruppo();
        
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);
        
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.deleteGruppo(idGruppo);
        });

        assertEquals("Utente non abilitato", exception.getMessage());
    }
    
    @Test
    public void testDeleteGruppoUtenteAnonimo() {
        GruppoCreate gruppoCreate = CommonUtils.getGruppoCreate();
        ResponseEntity<Gruppo> createdGruppo = controller.createGruppo(gruppoCreate);
        assertEquals(HttpStatus.OK, createdGruppo.getStatusCode());

        UUID idGruppo = createdGruppo.getBody().getIdGruppo();
        
        this.tearDown();
        
        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.deleteGruppo(idGruppo);
        });

        assertEquals("Utente non specificato", exception.getMessage());
    }

    @Test
    public void testGetGruppoSuccess() {
        GruppoCreate gruppoCreate = CommonUtils.getGruppoCreate();
        ResponseEntity<Gruppo> createdGruppo = controller.createGruppo(gruppoCreate);
        assertEquals(HttpStatus.OK, createdGruppo.getStatusCode());

        UUID idGruppo = createdGruppo.getBody().getIdGruppo();
        ResponseEntity<Gruppo> responseGruppo = controller.getGruppo(idGruppo);

        assertEquals(HttpStatus.OK, responseGruppo.getStatusCode());
        assertNotNull(responseGruppo.getBody());
        assertEquals(idGruppo, responseGruppo.getBody().getIdGruppo());
        assertEquals(CommonUtils.NOME_GRUPPO, responseGruppo.getBody().getNome());
    }

    @Test
    public void testGetGruppoNotFound() {
        UUID idGruppoNonEsistente = UUID.randomUUID();

        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.getGruppo(idGruppoNonEsistente);
        });

        assertEquals("Gruppo [" + idGruppoNonEsistente + "] non trovato", exception.getMessage());
    }

//    @Test
//    public void testGetGruppoUnauthorized() {
//        GruppoCreate gruppoCreate = CommonUtils.getGruppoCreate();
//        ResponseEntity<Gruppo> createdGruppo = controller.createGruppo(gruppoCreate);
//        assertEquals(HttpStatus.OK, createdGruppo.getStatusCode());
//
//        UUID idGruppo = createdGruppo.getBody().getIdGruppo();
//        InfoProfilo infoProfiloNonAutorizzato = new InfoProfilo("xxx", this.utenteService.find("xxx").get(), List.of());
//        when(this.authentication.getPrincipal()).thenReturn(infoProfiloNonAutorizzato);
//
//        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
//            controller.getGruppo(idGruppo);
//        });
//
//        assertEquals("Required: Ruolo AMMINISTRATORE", exception.getMessage());
//
//        InfoProfilo infoProfiloGestore = new InfoProfilo(UTENTE_GESTORE, this.utenteService.find(UTENTE_GESTORE).get(), List.of());
//        when(this.authentication.getPrincipal()).thenReturn(infoProfiloGestore);
//    }

    @Test
    public void testListGruppiSuccessNoFilters() {
        GruppoCreate gruppoCreate1 = CommonUtils.getGruppoCreate();
        ResponseEntity<Gruppo> createdGruppo1 = controller.createGruppo(gruppoCreate1);
        assertEquals(HttpStatus.OK, createdGruppo1.getStatusCode());

        GruppoCreate gruppoCreate2 = CommonUtils.getGruppoCreate();
        gruppoCreate2.setNome("Second Group");
        ResponseEntity<Gruppo> createdGruppo2 = controller.createGruppo(gruppoCreate2);
        assertEquals(HttpStatus.OK, createdGruppo2.getStatusCode());

        ResponseEntity<ListItemGruppo> responseList = controller.listGruppi(null, null, null, null, null, null);

        assertEquals(HttpStatus.OK, responseList.getStatusCode());
        assertNotNull(responseList.getBody());
        assertEquals(2, responseList.getBody().getContent().size());
    }

    @Test
    public void testListGruppiWithFilters() {
        GruppoCreate gruppoCreate1 = CommonUtils.getGruppoCreate();
        ResponseEntity<Gruppo> createdGruppo1 = controller.createGruppo(gruppoCreate1);
        assertEquals(HttpStatus.OK, createdGruppo1.getStatusCode());

        GruppoCreate gruppoCreate2 = CommonUtils.getGruppoCreate();
        gruppoCreate2.setNome("Second Group");
        ResponseEntity<Gruppo> createdGruppo2 = controller.createGruppo(gruppoCreate2);
        assertEquals(HttpStatus.OK, createdGruppo2.getStatusCode());

        ResponseEntity<ListItemGruppo> responseList = controller.listGruppi(null, null, null, "Second Group",null, null);

        assertEquals(HttpStatus.OK, responseList.getStatusCode());
        assertNotNull(responseList.getBody());
        assertEquals(1, responseList.getBody().getContent().size());
        assertEquals("Second Group", responseList.getBody().getContent().get(0).getNome());
    }

    @Test
    public void testListGruppiNotFoundWithFilters() {
        ResponseEntity<ListItemGruppo> responseList = controller.listGruppi(null, null, null, "GruppoInesistente", null, null);

        assertEquals(HttpStatus.OK, responseList.getStatusCode());
        assertNotNull(responseList.getBody());
        assertEquals(0, responseList.getBody().getContent().size());
    }

//    @Test
//    public void testListGruppiUnauthorized() {
//        SecurityContextHolder.clearContext();
//
//        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
//            controller.listGruppi(null, null, null, null, null, null);
//        });
//
//        InfoProfilo infoProfiloGestore = new InfoProfilo(UTENTE_GESTORE, this.utenteService.find(UTENTE_GESTORE).get(), List.of());
//        when(this.authentication.getPrincipal()).thenReturn(infoProfiloGestore);
//        SecurityContextHolder.setContext(this.securityContext);
//    }

    @Test
    public void testUpdateGruppoSuccess() {
        GruppoCreate gruppoCreate = CommonUtils.getGruppoCreate();
        ResponseEntity<Gruppo> createdGruppo = controller.createGruppo(gruppoCreate);
        assertEquals(HttpStatus.OK, createdGruppo.getStatusCode());

        UUID idGruppo = createdGruppo.getBody().getIdGruppo();
        GruppoUpdate gruppoUpdate = new GruppoUpdate();
        gruppoUpdate.setNome("Gruppo aggiornato");
        gruppoUpdate.setDescrizione("Descrizione aggiornata");
        gruppoUpdate.setTipo(TipoServizio.API);
        
        ResponseEntity<Gruppo> updatedGruppo = controller.updateGruppo(idGruppo, gruppoUpdate);

        assertEquals(HttpStatus.OK, updatedGruppo.getStatusCode());
        assertNotNull(updatedGruppo.getBody());
        assertEquals("Gruppo aggiornato", updatedGruppo.getBody().getNome());
        assertEquals("Descrizione aggiornata", updatedGruppo.getBody().getDescrizione());
    }

    @Test
    public void testUpdateGruppoNotFound() {
        InfoProfilo infoProfiloGestore = new InfoProfilo(UTENTE_GESTORE, this.utenteService.findByPrincipal(UTENTE_GESTORE).get(), List.of());
        when(this.authentication.getPrincipal()).thenReturn(infoProfiloGestore);

        UUID idGruppoNonEsistente = UUID.randomUUID();

        GruppoUpdate gruppoUpdate = new GruppoUpdate();
        gruppoUpdate.setNome("Updated Group Name");
        gruppoUpdate.setDescrizione("Descrizione aggiornata");
        gruppoUpdate.setTipo(TipoServizio.API);

        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.updateGruppo(idGruppoNonEsistente, gruppoUpdate);
        });

        assertEquals("Gruppo [" + idGruppoNonEsistente + "] non trovato", exception.getMessage());
    }

    @Test
    public void testUpdateGruppoUnauthorized() {
        GruppoCreate gruppoCreate = CommonUtils.getGruppoCreate();
        ResponseEntity<Gruppo> createdGruppo = controller.createGruppo(gruppoCreate);
        assertEquals(HttpStatus.OK, createdGruppo.getStatusCode());

        UUID idGruppo = createdGruppo.getBody().getIdGruppo();
        
        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);
        
        GruppoUpdate gruppoUpdate = new GruppoUpdate();
        gruppoUpdate.setNome("Updated Group Name");
        gruppoUpdate.setDescrizione("Descrizione aggiornata");
        gruppoUpdate.setTipo(TipoServizio.API);

        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.updateGruppo(idGruppo, gruppoUpdate);
        });

        assertEquals("Utente non abilitato", exception.getMessage());
    }
    
    @Test
    public void testUpdateGruppoUenteAnonimo() {
        GruppoCreate gruppoCreate = CommonUtils.getGruppoCreate();
        ResponseEntity<Gruppo> createdGruppo = controller.createGruppo(gruppoCreate);
        assertEquals(HttpStatus.OK, createdGruppo.getStatusCode());

        UUID idGruppo = createdGruppo.getBody().getIdGruppo();
        
        this.tearDown();

        GruppoUpdate gruppoUpdate = new GruppoUpdate();
        gruppoUpdate.setNome("Updated Group Name");
        gruppoUpdate.setDescrizione("Descrizione aggiornata");
        gruppoUpdate.setTipo(TipoServizio.API);

        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            controller.updateGruppo(idGruppo, gruppoUpdate);
        });

        assertEquals("Utente non specificato", exception.getMessage());
    }

    @EventListener
    public void handleContextClosed(ContextClosedEvent event) {
        System.out.println("ContextClosedEvent fired!");
    }
    
    @Test
    public void testGetImmagineGruppoSuccess() {
        byte[] fakeImageData = "fakeImageContent".getBytes();
        DocumentoCreate docC = new DocumentoCreate();
        docC.setFilename("xyz.jpeg");
        docC.setContentType("image/jpeg");
        docC.setContent(Base64.encodeBase64String(fakeImageData));

        GruppoCreate gruppoCreate = CommonUtils.getGruppoCreate();
        gruppoCreate.setImmagine(docC);
        ResponseEntity<Gruppo> createdGruppo = controller.createGruppo(gruppoCreate);
        assertEquals(HttpStatus.OK, createdGruppo.getStatusCode());

        UUID idGruppo = createdGruppo.getBody().getIdGruppo();
        ResponseEntity<Resource> responseImmagine = controller.getImmagineGruppo(idGruppo);

        assertEquals(HttpStatus.OK, responseImmagine.getStatusCode());
        assertNotNull(responseImmagine.getBody());
    }

    @Test
    public void testGetImmagineGruppoImageNotFound() {
        GruppoCreate gruppoCreate = CommonUtils.getGruppoCreate();
        ResponseEntity<Gruppo> createdGruppo = controller.createGruppo(gruppoCreate);
        assertEquals(HttpStatus.OK, createdGruppo.getStatusCode());

        UUID idGruppo = createdGruppo.getBody().getIdGruppo();

        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.getImmagineGruppo(idGruppo);
        });

        assertEquals("Imagine per il gruppo [" + idGruppo + "] non trovata", exception.getMessage());
    }

    @Test
    public void testGetImmagineGruppoNotFound() {
        UUID idGruppoNonEsistente = UUID.randomUUID();

        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.getImmagineGruppo(idGruppoNonEsistente);
        });

        assertEquals("Gruppo [" + idGruppoNonEsistente + "] non trovato", exception.getMessage());
    }
}

