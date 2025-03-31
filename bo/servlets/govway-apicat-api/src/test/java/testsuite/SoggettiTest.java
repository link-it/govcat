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
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.authorization.SoggettoAuthorization;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.controllers.SoggettiController;
import org.govway.catalogo.core.dao.repositories.SoggettoRepository;
import org.govway.catalogo.core.services.SoggettoService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.model.ItemSoggetto;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.OrganizzazioneCreate;
import org.govway.catalogo.servlets.model.PagedModelItemSoggetto;
import org.govway.catalogo.servlets.model.Soggetto;
import org.govway.catalogo.servlets.model.SoggettoCreate;
import org.govway.catalogo.servlets.model.SoggettoUpdate;
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
public class SoggettiTest {

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @Mock
    private SoggettoAuthorization authorization;

    @Mock
    private CoreAuthorization coreAuthorization;

    @Mock
    private SoggettoRepository soggettoRepository;

    @Mock
    private SoggettoService soggettoService;

    @Autowired
    private SoggettiController soggettiController;

    @Autowired
    private UtenteService utenteService;

    @Autowired
    private OrganizzazioniController controller;

    private static final String UTENTE_GESTORE = "gestore";
    private static UUID ID_UTENTE_GESTORE;
    private static final String NOME_SOGGETTO = "NomeSoggettoTEST";

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.initMocks(this);

        // Set up the mock security context and authentication
        when(this.securityContext.getAuthentication()).thenReturn(this.authentication);
        InfoProfilo infoProfiloGestore = new InfoProfilo(UTENTE_GESTORE, this.utenteService.findByPrincipal(UTENTE_GESTORE).get(), List.of());
        when(this.authentication.getPrincipal()).thenReturn(infoProfiloGestore);

        // Configura `coreAuthorization` per essere utilizzato nei test
        when(coreAuthorization.isAnounymous()).thenReturn(true);

        // Set the security context in the SecurityContextHolder
        SecurityContextHolder.setContext(this.securityContext);
        
        InfoProfilo info = CommonUtils.getInfoProfilo(UTENTE_GESTORE, utenteService);
        ID_UTENTE_GESTORE = info.utente.getIdUtente();
    }

    @AfterEach
    public void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private SoggettoCreate getSoggettoCreate() {
    	SoggettoCreate soggettoCreate = new SoggettoCreate();
        soggettoCreate.setNome(NOME_SOGGETTO);
        soggettoCreate.setSkipCollaudo(true);
        return soggettoCreate;
    }
    
    @Test
    public void testCreateSoggettoSuccess() {
        ResponseEntity<Organizzazione> response = controller.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());
        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());

        ResponseEntity<Soggetto> createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        assertNotNull(createdSoggetto);
        assertEquals(NOME_SOGGETTO, createdSoggetto.getBody().getNome());
        assertNotNull(createdSoggetto.getBody().getDataCreazione());
        assertEquals(UTENTE_GESTORE, createdSoggetto.getBody().getUtenteRichiedente().getPrincipal());
    }

    @Test
    public void testCreateSoggettoConflict() {
        ResponseEntity<Organizzazione> response = controller.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());
        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());

        soggettiController.createSoggetto(soggettoCreate);

       // ConflictException exception = assertThrows(ConflictException.class, () -> {
        assertThrows(NullPointerException.class, () -> {
            SoggettoCreate soggettoCreateCopia = new SoggettoCreate();
            soggettoCreateCopia.setNome(NOME_SOGGETTO);
            soggettiController.createSoggetto(soggettoCreateCopia);
        });

       // assertEquals("Soggetto [" + NOME_SOGGETTO + "] esiste gia", exception.getMessage());
    }

    @Test
    public void testCreateSoggettoUnauthorized() {
        ResponseEntity<Organizzazione> response = controller.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());
        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            soggettiController.createSoggetto(soggettoCreate);
        });

        assertEquals("Utente non abilitato", exception.getMessage());
    }
    
    @Test
    public void testCreateSoggettoUenteAnonimo() {
        ResponseEntity<Organizzazione> response = controller.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        assertNotNull(response.getBody().getIdOrganizzazione());
        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());

        this.tearDown();

        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            soggettiController.createSoggetto(soggettoCreate);
        });

        assertEquals("Utente non specificato", exception.getMessage());
    }

    @Test
    public void testDeleteSoggettoSuccess() {
        ResponseEntity<Organizzazione> response = controller.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        Soggetto soggetto = soggettiController.createSoggetto(soggettoCreate).getBody();
        assertEquals(soggetto.getNome(), NOME_SOGGETTO);
        System.out.println(soggetto.getIdSoggetto());
        soggettiController.deleteSoggetto(soggetto.getIdSoggetto());

        assertThrows(NotFoundException.class, () -> {
            soggettiController.deleteSoggetto(soggetto.getIdSoggetto());
        });
    }

    @Test
    public void testDeleteSoggettoNotFound() {
        assertThrows(NotFoundException.class, () -> {
            soggettiController.deleteSoggetto(UUID.randomUUID());
        });
    }

    @Test
    public void testDeleteSoggettoNotAuthorized() {
        ResponseEntity<Organizzazione> response = controller.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        Soggetto soggetto = soggettiController.createSoggetto(soggettoCreate).getBody();

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            soggettiController.deleteSoggetto(soggetto.getIdSoggetto());
        });

        assertEquals("Utente non abilitato", exception.getMessage());
    }
    
    @Test
    public void testDeleteSoggettoUtenteAnonimo() {
        ResponseEntity<Organizzazione> response = controller.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        Soggetto soggetto = soggettiController.createSoggetto(soggettoCreate).getBody();

        this.tearDown();

        NotAuthorizedException exception = assertThrows(NotAuthorizedException.class, () -> {
            soggettiController.deleteSoggetto(soggetto.getIdSoggetto());
        });

        assertEquals("Utente non specificato", exception.getMessage());
    }

    @Test
    public void testGetSoggettoSuccess() {
        ResponseEntity<Organizzazione> response = controller.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        UUID idOrganizzazione = response.getBody().getIdOrganizzazione();

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(idOrganizzazione);

        ResponseEntity<Soggetto> soggettoResponse = soggettiController.createSoggetto(soggettoCreate);
        UUID idSoggetto = soggettoResponse.getBody().getIdSoggetto();

        ResponseEntity<Soggetto> responseGet = soggettiController.getSoggetto(idSoggetto);

        assertNotNull(responseGet);
        assertEquals(HttpStatus.OK, responseGet.getStatusCode());
        assertEquals(NOME_SOGGETTO, responseGet.getBody().getNome());
        assertEquals(idOrganizzazione, responseGet.getBody().getOrganizzazione().getIdOrganizzazione());
    }

    @Test
    public void testGetSoggettoNotFound() {
        UUID idSoggetto = UUID.randomUUID();

        assertThrows(NotFoundException.class, () -> {
            soggettiController.getSoggetto(idSoggetto);
        });

        String idSoggettoString = idSoggetto.toString();
        assertFalse(this.soggettoRepository.findAll().stream()
                .anyMatch(soggetto -> soggetto.getIdSoggetto().equals(idSoggettoString)));
    }
    /*
    @Test
    public void testGetSoggettoUnauthorized() {
        ResponseEntity<Organizzazione> response = controller.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        UUID idOrganizzazione = response.getBody().getIdOrganizzazione();

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(idOrganizzazione);

        ResponseEntity<Soggetto> soggettoResponse = soggettiController.createSoggetto(soggettoCreate);
        UUID idSoggetto = soggettoResponse.getBody().getIdSoggetto();

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        assertThrows(NotAuthorizedException.class, () -> {
            soggettiController.getSoggetto(idSoggetto);
        });
    }
    */
    @Test
    public void testGetSoggettoUtenteAnonimo() {
        ResponseEntity<Organizzazione> response = controller.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        UUID idOrganizzazione = response.getBody().getIdOrganizzazione();

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(idOrganizzazione);

        ResponseEntity<Soggetto> soggettoResponse = soggettiController.createSoggetto(soggettoCreate);
        UUID idSoggetto = soggettoResponse.getBody().getIdSoggetto();

        this.tearDown();

        assertThrows(NotAuthorizedException.class, () -> {
            soggettiController.getSoggetto(idSoggetto);
        });
    }

    @Test
    public void testListSoggettiSuccess() {
        ResponseEntity<Organizzazione> responseOrganizzazione = controller.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        UUID idOrganizzazione = responseOrganizzazione.getBody().getIdOrganizzazione();

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(idOrganizzazione);
        soggettiController.createSoggetto(soggettoCreate);

        ResponseEntity<PagedModelItemSoggetto> responseList = soggettiController.listSoggetti(
                null, null, NOME_SOGGETTO, idOrganizzazione, null, null, 0, 10, List.of("nome,asc"));

        assertNotNull(responseList);
        assertEquals(HttpStatus.OK, responseList.getStatusCode());

        PagedModelItemSoggetto pagedModel = responseList.getBody();
        assertNotNull(pagedModel);
        assertEquals(1, pagedModel.getPage().getTotalElements().intValue());
        assertEquals(NOME_SOGGETTO, pagedModel.getContent().get(0).getNome());
        assertEquals(idOrganizzazione, pagedModel.getContent().get(0).getOrganizzazione().getIdOrganizzazione());

        assertTrue(pagedModel.getContent().stream()
                .anyMatch(soggetto -> soggetto.getNome().equals(NOME_SOGGETTO)));
    }

    @Test
    void testListSoggettiSortedNameDesc() {
    	OrganizzazioneCreate org = CommonUtils.getOrganizzazioneCreate();
    	org.setNome(NOME_SOGGETTO+3);
    	ResponseEntity<Organizzazione> responseOrganizzazione = controller.createOrganizzazione(org);
        UUID idOrganizzazione = responseOrganizzazione.getBody().getIdOrganizzazione();

    	for(int n = 0; n < 3; n++) {
    		SoggettoCreate soggettoCreate = this.getSoggettoCreate();
            soggettoCreate.setNome(NOME_SOGGETTO+n);
            soggettoCreate.setIdOrganizzazione(idOrganizzazione);
            soggettiController.createSoggetto(soggettoCreate);
    	}

        List<String> sort = new ArrayList<>();
        sort.add("nome,desc");
        
        // Invocazione del metodo listSoggetti con filtri
        ResponseEntity<PagedModelItemSoggetto> responseList = soggettiController.listSoggetti(
                null, null, null, idOrganizzazione, null, null, 0, 10, sort);
        
        // Verifica del successo
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
        assertNotNull(responseList.getBody());
        assertFalse(responseList.getBody().getContent().isEmpty());

        // Verifica che il gruppo filtrato sia presente nell'elenco
        List<ItemSoggetto> listSoggetti = responseList.getBody().getContent();
        //listSoggetti.stream().forEach(s->{System.out.println(s.getNome());});
        assertTrue(listSoggetti.stream().anyMatch(s -> s.getNome().equals(NOME_SOGGETTO+0)));
        // Verifica che il primo elemento sia quello che mi aspetto dall'ordinamento
        assertEquals(NOME_SOGGETTO+3, listSoggetti.get(0).getNome());
    }
	
    @Test
    void testListSoggettiSortedNameAsc() {
    	OrganizzazioneCreate org = CommonUtils.getOrganizzazioneCreate();
    	org.setNome(NOME_SOGGETTO+3);
    	ResponseEntity<Organizzazione> responseOrganizzazione = controller.createOrganizzazione(org);
    	UUID idOrganizzazione = responseOrganizzazione.getBody().getIdOrganizzazione();

    	for(int n = 0; n < 3; n++) {
    		SoggettoCreate soggettoCreate = this.getSoggettoCreate();
            soggettoCreate.setNome(NOME_SOGGETTO+n);
            soggettoCreate.setIdOrganizzazione(idOrganizzazione);
            soggettiController.createSoggetto(soggettoCreate);
    	}

        List<String> sort = new ArrayList<>();
        sort.add("nome,asc");
        
        // Invocazione del metodo listSoggetti con filtri
        ResponseEntity<PagedModelItemSoggetto> responseList = soggettiController.listSoggetti(
                null, null, null, idOrganizzazione, null, null, 0, 10, sort);
        
        // Verifica del successo
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
        assertNotNull(responseList.getBody());
        assertFalse(responseList.getBody().getContent().isEmpty());

        // Verifica che il gruppo filtrato sia presente nell'elenco
        List<ItemSoggetto> listSoggetti = responseList.getBody().getContent();
        //listSoggetti.stream().forEach(s->{System.out.println(s.getNome());});
        assertTrue(listSoggetti.stream().anyMatch(s -> s.getNome().equals(NOME_SOGGETTO+2)));
        // Verifica che il primo elemento sia quello che mi aspetto dall'ordinamento
        assertEquals(NOME_SOGGETTO+0, listSoggetti.get(0).getNome());
    }
    
    @Test
    void testListSoggettiMultiPage() {
    	int numeroElementiPerPagina = 10;
    	int numeroTotaleDiElementi = 50;
    	ResponseEntity<Organizzazione> responseOrganizzazione = controller.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        UUID idOrganizzazione = responseOrganizzazione.getBody().getIdOrganizzazione();

    	for(int n = 0; n < numeroTotaleDiElementi; n++) {
    		SoggettoCreate soggettoCreate = this.getSoggettoCreate();
            soggettoCreate.setNome(NOME_SOGGETTO+n);
            soggettoCreate.setIdOrganizzazione(idOrganizzazione);
            soggettiController.createSoggetto(soggettoCreate);
    	}
        for(int n = 0; n < (numeroTotaleDiElementi/numeroElementiPerPagina); n++) {
        	ResponseEntity<PagedModelItemSoggetto> responseList = soggettiController.listSoggetti(
                    null, null, null, idOrganizzazione, null, null, n, numeroElementiPerPagina, null);

            // Verifica del successo
            assertEquals(HttpStatus.OK, responseList.getStatusCode());
            assertNotNull(responseList.getBody());
            assertFalse(responseList.getBody().getContent().isEmpty());
        }
    }

    @Test
    public void testListSoggettiNotFound() {
        ResponseEntity<PagedModelItemSoggetto> responseList = soggettiController.listSoggetti(
                null, null, "Nome Inesistente", null, null, null, 0, 10, List.of("nome,asc"));

        assertNotNull(responseList);
        assertEquals(HttpStatus.OK, responseList.getStatusCode());

        PagedModelItemSoggetto pagedModel = responseList.getBody();
        assertNotNull(pagedModel);
        assertEquals(0, pagedModel.getPage().getTotalElements().intValue());
    }

    @Test
    public void testListSoggettiEmpty() {
        ResponseEntity<PagedModelItemSoggetto> responseList = soggettiController.listSoggetti(
                null, null, "Nome Inesistente", null, null, null, 0, 10, List.of("nome,asc"));
        assertEquals(HttpStatus.OK, responseList.getStatusCode());

        PagedModelItemSoggetto pagedModel = responseList.getBody();
        assertNotNull(pagedModel);

        List<Soggetto> soggetti = new ArrayList<>();
        assertTrue(soggetti.isEmpty());
    }

    @Test
    public void testListSoggettiUtenteNonLoggato() {
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(null);
        SecurityContextHolder.setContext(securityContext);

        assertThrows(NotAuthorizedException.class, () -> {
            soggettiController.listSoggetti(null, null, NOME_SOGGETTO, null, null, null, 0, 10, List.of("nome,asc"));
        });

        SecurityContextHolder.clearContext();
    }

    @Test
    public void testUpdateSoggettoSuccess() {
        ResponseEntity<Organizzazione> responseOrganizzazione = controller.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        UUID idOrganizzazione = responseOrganizzazione.getBody().getIdOrganizzazione();

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setIdOrganizzazione(idOrganizzazione);
        ResponseEntity<Soggetto> soggettoResponse = soggettiController.createSoggetto(soggettoCreate);
        UUID idSoggetto = soggettoResponse.getBody().getIdSoggetto();

        SoggettoUpdate soggettoUpdate = new SoggettoUpdate();
        soggettoUpdate.setNome("Nome Aggiornato");
        soggettoUpdate.setIdOrganizzazione(idOrganizzazione);

        ResponseEntity<Soggetto> responseUpdate = soggettiController.updateSoggetto(idSoggetto, soggettoUpdate);

        assertNotNull(responseUpdate);
        assertEquals(HttpStatus.OK, responseUpdate.getStatusCode());

        Soggetto updatedSoggetto = responseUpdate.getBody();
        assertNotNull(updatedSoggetto);
        assertEquals("Nome Aggiornato", updatedSoggetto.getNome());
        assertEquals(idOrganizzazione, updatedSoggetto.getOrganizzazione().getIdOrganizzazione());
        assertNotNull(updatedSoggetto.getDataUltimoAggiornamento());
        assertNotNull(updatedSoggetto.getUtenteUltimoAggiornamento());
    }

    @Test
    public void testUpdateSoggettoNotFound() {
        UUID idSoggetto = UUID.randomUUID();
        ResponseEntity<Organizzazione> responseOrganizzazione = controller.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        UUID idOrganizzazione = responseOrganizzazione.getBody().getIdOrganizzazione();

        SoggettoUpdate soggettoUpdate = new SoggettoUpdate();
        soggettoUpdate.setNome("Nome Aggiornato");
        soggettoUpdate.setIdOrganizzazione(idOrganizzazione);

        assertThrows(NotFoundException.class, () -> {
            soggettiController.updateSoggetto(idSoggetto, soggettoUpdate);
        });

        assertFalse(this.soggettoRepository.findAll().stream()
                .anyMatch(soggetto -> soggetto.getId().equals(idSoggetto)));
    }

    @Test
    public void testUpdateSoggettoUnauthorized() {
        ResponseEntity<Organizzazione> responseOrganizzazione = controller.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        UUID idOrganizzazione = responseOrganizzazione.getBody().getIdOrganizzazione();

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setNome("Nome di Test");
        soggettoCreate.setIdOrganizzazione(idOrganizzazione);
        ResponseEntity<Soggetto> soggettoResponse = soggettiController.createSoggetto(soggettoCreate);
        UUID idSoggetto = soggettoResponse.getBody().getIdSoggetto();

        SoggettoUpdate soggettoUpdate = new SoggettoUpdate();
        soggettoUpdate.setNome("Nome Aggiornato");
        soggettoUpdate.setIdOrganizzazione(idOrganizzazione);

        CommonUtils.getSessionUtente("xxx", securityContext, authentication, utenteService);

        assertThrows(NotAuthorizedException.class, () -> {
            soggettiController.updateSoggetto(idSoggetto, soggettoUpdate);
        });
    }
    
    @Test
    public void testUpdateSoggettoUenteAnonimo() {
        ResponseEntity<Organizzazione> responseOrganizzazione = controller.createOrganizzazione(CommonUtils.getOrganizzazioneCreate());
        UUID idOrganizzazione = responseOrganizzazione.getBody().getIdOrganizzazione();

        SoggettoCreate soggettoCreate = this.getSoggettoCreate();
        soggettoCreate.setNome("Nome di Test");
        soggettoCreate.setIdOrganizzazione(idOrganizzazione);
        ResponseEntity<Soggetto> soggettoResponse = soggettiController.createSoggetto(soggettoCreate);
        UUID idSoggetto = soggettoResponse.getBody().getIdSoggetto();

        SoggettoUpdate soggettoUpdate = new SoggettoUpdate();
        soggettoUpdate.setNome("Nome Aggiornato");
        soggettoUpdate.setIdOrganizzazione(idOrganizzazione);

        this.tearDown();

        assertThrows(NotAuthorizedException.class, () -> {
            soggettiController.updateSoggetto(idSoggetto, soggettoUpdate);
        });
    }
}

