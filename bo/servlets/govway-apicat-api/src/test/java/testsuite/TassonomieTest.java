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
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.controllers.TassonomieController;
import org.govway.catalogo.core.services.TassonomiaService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.model.Categoria;
import org.govway.catalogo.servlets.model.CategoriaCreate;
import org.govway.catalogo.servlets.model.CategoriaUpdate;
import org.govway.catalogo.servlets.model.ListItemCategoria;
import org.govway.catalogo.servlets.model.PagedModelItemServizio;
import org.govway.catalogo.servlets.model.PagedModelItemTassonomia;
import org.govway.catalogo.servlets.model.Tassonomia;
import org.govway.catalogo.servlets.model.TassonomiaCreate;
import org.govway.catalogo.servlets.model.TassonomiaUpdate;
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

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

@ExtendWith(SpringExtension.class)  // JUnit 5 extension
@SpringBootTest(classes = OpenAPI2SpringBoot.class)
@EnableAutoConfiguration(exclude = {GroovyTemplateAutoConfiguration.class})
@AutoConfigureTestDatabase(replace = Replace.ANY)
@ActiveProfiles("test")
@DirtiesContext(classMode = ClassMode.BEFORE_CLASS)
@TestInstance(TestInstance.Lifecycle.PER_METHOD)
@Transactional
public class TassonomieTest {

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @Mock
    private CoreAuthorization coreAuthorization;
    
    @Autowired
    private UtenteService utenteService;

    @Autowired
    private TassonomieController controller;

    @Autowired
    private TassonomiaService service;

    @Autowired
    private TassonomiaService tassonomiaService;

    @Autowired
    private TassonomieController tassonomieController;

    @PersistenceContext
    private EntityManager entityManager;

    private static final String UTENTE_GESTORE = "gestore";

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.initMocks(this);
        when(this.securityContext.getAuthentication()).thenReturn(this.authentication);
        InfoProfilo infoProfiloGestore = new InfoProfilo(UTENTE_GESTORE, this.utenteService.findByPrincipal(UTENTE_GESTORE).get(),
                List.of());
        when(this.authentication.getPrincipal()).thenReturn(infoProfiloGestore);
        SecurityContextHolder.setContext(this.securityContext);
    }

    @AfterEach
    public void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    public void testCreateTassonomiaSuccess() {
        TassonomiaCreate tassonomiaCreate = CommonUtils.getTassonomiaCreate();
        ResponseEntity<Tassonomia> responseTassonomia = controller.createTassonomia(tassonomiaCreate);
        assertNotNull(responseTassonomia.getBody());
        assertEquals(HttpStatus.OK, responseTassonomia.getStatusCode());
        assertEquals(CommonUtils.NOME_TASSONOMIA, responseTassonomia.getBody().getNome());
        assertEquals(CommonUtils.DESCRIZIONE_TASSONOMIA, responseTassonomia.getBody().getDescrizione());
    }

    @Test
    public void testCreateTassonomiaConflict() {
        TassonomiaCreate tassonomiaCreate = CommonUtils.getTassonomiaCreate();
        ResponseEntity<Tassonomia> responseTassonomia = controller.createTassonomia(tassonomiaCreate);
        assertEquals(HttpStatus.OK, responseTassonomia.getStatusCode());

        ConflictException exception = assertThrows(ConflictException.class, () -> {
            controller.createTassonomia(tassonomiaCreate);
        });
        assertEquals("Tassonomia [" + tassonomiaCreate.getNome() + "] esiste gia", exception.getMessage());
    }

    @Test
    public void testCreateTassonomiaCategoriaSuccess() {
        TassonomiaCreate tassonomiaCreate = CommonUtils.getTassonomiaCreate();
        ResponseEntity<Tassonomia> responseTassonomia = controller.createTassonomia(tassonomiaCreate);
        assertEquals(HttpStatus.OK, responseTassonomia.getStatusCode());

        UUID idTassonomia = responseTassonomia.getBody().getIdTassonomia();
        CategoriaCreate categoriaCreate = new CategoriaCreate();
        categoriaCreate.setNome("xyz");
        categoriaCreate.setDescrizione("descrizione xyz");
        
        ResponseEntity<Categoria> responseCategoria = controller.createTassonomiaCategoria(idTassonomia, categoriaCreate);
        assertEquals(HttpStatus.OK, responseCategoria.getStatusCode());
        assertEquals(categoriaCreate.getNome(), responseCategoria.getBody().getNome());
        assertEquals(categoriaCreate.getDescrizione(), responseCategoria.getBody().getDescrizione());
    }

    @Test
    public void testCreateTassonomiaCategoriaNotFound() {
        UUID idTassonomiaNonEsistente = UUID.randomUUID();
        CategoriaCreate categoriaCreate = new CategoriaCreate();
        categoriaCreate.setNome("xyz");
        categoriaCreate.setDescrizione("descrizione xyz");

        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.createTassonomiaCategoria(idTassonomiaNonEsistente, categoriaCreate);
        });
        assertEquals("Tassonomia [" + idTassonomiaNonEsistente + "] non trovata", exception.getMessage());
    }

    @Test
    public void testDeleteCategoriaSuccess() {
        TassonomiaCreate tassonomiaCreate = CommonUtils.getTassonomiaCreate();
        ResponseEntity<Tassonomia> responseTassonomia = controller.createTassonomia(tassonomiaCreate);
        assertEquals(HttpStatus.OK, responseTassonomia.getStatusCode());

        UUID idTassonomia = responseTassonomia.getBody().getIdTassonomia();
        CategoriaCreate categoriaCreate = new CategoriaCreate();
        categoriaCreate.setNome("xyz");
        categoriaCreate.setDescrizione("descrizione xyz");
        ResponseEntity<Categoria> categoria = controller.createTassonomiaCategoria(idTassonomia, categoriaCreate);

        UUID idCategoria = categoria.getBody().getIdCategoria();
        ResponseEntity<Void> response = controller.deleteCategoria(idTassonomia, idCategoria);
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
    }

    @Test
    public void testDeleteCategoriaNotFound() {
        UUID idTassonomia = UUID.randomUUID();
        UUID idCategoriaNonEsistente = UUID.randomUUID();

        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.deleteCategoria(idTassonomia, idCategoriaNonEsistente);
        });
        assertEquals("Categoria [" + idCategoriaNonEsistente + "] non trovata", exception.getMessage());
    }

    @Test
    public void testGetTassonomiaSuccess() {
        TassonomiaCreate tassonomiaCreate = CommonUtils.getTassonomiaCreate();
        ResponseEntity<Tassonomia> responseTassonomia = controller.createTassonomia(tassonomiaCreate);
        assertEquals(HttpStatus.OK, responseTassonomia.getStatusCode());

        UUID idTassonomia = responseTassonomia.getBody().getIdTassonomia();
        ResponseEntity<Tassonomia> responseGetTassonomia = controller.getTassonomia(idTassonomia);
        assertEquals(HttpStatus.OK, responseGetTassonomia.getStatusCode());
        assertNotNull(responseGetTassonomia.getBody());
        assertEquals(tassonomiaCreate.getNome(), responseGetTassonomia.getBody().getNome());
        assertEquals(tassonomiaCreate.getDescrizione(), responseGetTassonomia.getBody().getDescrizione());
    }

    @Test
    public void testGetTassonomiaNotFound() {
        UUID idTassonomiaNonEsistente = UUID.randomUUID();

        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.getTassonomia(idTassonomiaNonEsistente);
        });
        assertEquals("Tassonomia [" + idTassonomiaNonEsistente + "] non trovata", exception.getMessage());
    }
    
    @Test
    void testListTassonomieSuccessNoFilters() {
        // Creazione di alcune tassonomie
        TassonomiaCreate tassonomiaCreate1 = CommonUtils.getTassonomiaCreate();
        ResponseEntity<Tassonomia> responseTassonomia1 = controller.createTassonomia(tassonomiaCreate1);
        assertEquals(HttpStatus.OK, responseTassonomia1.getStatusCode());

        TassonomiaCreate tassonomiaCreate2 = CommonUtils.getTassonomiaCreate();
        tassonomiaCreate2.setNome("Second Tassonomia");
        ResponseEntity<Tassonomia> responseTassonomia2 = controller.createTassonomia(tassonomiaCreate2);
        assertEquals(HttpStatus.OK, responseTassonomia2.getStatusCode());

        // Chiamata alla lista delle tassonomie senza filtri
        ResponseEntity<PagedModelItemTassonomia> responseList = controller.listTassonomie(null, null, 0, 10, null);

        // Verifica del successo della chiamata e della lista delle tassonomie
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
        assertNotNull(responseList.getBody());
        assertEquals(2, responseList.getBody().getContent().size());
    }

    @Test
    void testListTassonomieWithFilters() {
        // Creazione di alcune tassonomie
        TassonomiaCreate tassonomiaCreate1 = CommonUtils.getTassonomiaCreate();
        ResponseEntity<Tassonomia> responseTassonomia1 = controller.createTassonomia(tassonomiaCreate1);
        assertEquals(HttpStatus.OK, responseTassonomia1.getStatusCode());

        TassonomiaCreate tassonomiaCreate2 = CommonUtils.getTassonomiaCreate();
        tassonomiaCreate2.setNome("Second Tassonomia");
        ResponseEntity<Tassonomia> responseTassonomia2 = controller.createTassonomia(tassonomiaCreate2);
        assertEquals(HttpStatus.OK, responseTassonomia2.getStatusCode());

        // Chiamata alla lista delle tassonomie con filtro per nome
        ResponseEntity<PagedModelItemTassonomia> responseList = controller.listTassonomie(null, "Second", 0, 10, null);

        // Verifica del successo della chiamata e del filtro applicato
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
        assertNotNull(responseList.getBody());
        assertEquals(1, responseList.getBody().getContent().size());
        assertEquals("Second Tassonomia", responseList.getBody().getContent().get(0).getNome());
    }

    @Test
    void testListTassonomieNotFound() {
        // Chiamata alla lista delle tassonomie con filtro che non corrisponde a nessuna tassonomia
        ResponseEntity<PagedModelItemTassonomia> responseList = controller.listTassonomie(null, "NonEsistente", 0, 10, null);

        // Verifica che non ci siano tassonomie nella lista
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
        assertNotNull(responseList.getBody());
        assertEquals(0, responseList.getBody().getContent().size());
    }

    @Test
    void testListTassonomieWithPagination() {
        // Creazione di alcune tassonomie
        for (int i = 0; i < 15; i++) {
            TassonomiaCreate tassonomiaCreate = CommonUtils.getTassonomiaCreate();
            tassonomiaCreate.setNome("Tassonomia " + i);
            controller.createTassonomia(tassonomiaCreate);
        }

        // Chiamata alla lista delle tassonomie con paginazione
        ResponseEntity<PagedModelItemTassonomia> responseList = controller.listTassonomie(null, null, 0, 10, null);

        // Verifica che la paginazione funzioni correttamente
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
        assertNotNull(responseList.getBody());
        assertEquals(10, responseList.getBody().getContent().size()); // Prima pagina, 10 elementi
    }

    @Test
    void testListCategorieSuccessNoFilters() {
        // Creazione di una tassonomia e alcune categorie
        TassonomiaCreate tassonomiaCreate = CommonUtils.getTassonomiaCreate();
        ResponseEntity<Tassonomia> responseTassonomia = controller.createTassonomia(tassonomiaCreate);
        assertEquals(HttpStatus.OK, responseTassonomia.getStatusCode());

        UUID idTassonomia = responseTassonomia.getBody().getIdTassonomia();

        CategoriaCreate categoriaCreate1 = new CategoriaCreate();
        categoriaCreate1.setNome("nome categoria");
        categoriaCreate1.setDescrizione("descrizione xyz");
        controller.createTassonomiaCategoria(idTassonomia, categoriaCreate1);
        
        CategoriaCreate categoriaCreate2 = new CategoriaCreate();
        categoriaCreate2.setDescrizione("descrizione xyz");
        categoriaCreate2.setNome("Seconda Categoria");
        controller.createTassonomiaCategoria(idTassonomia, categoriaCreate2);

        // Chiamata alla lista delle categorie senza filtri
        ResponseEntity<ListItemCategoria> responseList = controller.listCategorie(idTassonomia, null);

        // Verifica del successo della chiamata e della lista delle categorie
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
        assertNotNull(responseList.getBody());
        assertEquals(2, responseList.getBody().getContent().size());
    }

    @Test
    void testListCategorieWithFilters() {
        // Creazione di una tassonomia e alcune categorie
        TassonomiaCreate tassonomiaCreate = CommonUtils.getTassonomiaCreate();
        ResponseEntity<Tassonomia> responseTassonomia = controller.createTassonomia(tassonomiaCreate);
        assertEquals(HttpStatus.OK, responseTassonomia.getStatusCode());

        UUID idTassonomia = responseTassonomia.getBody().getIdTassonomia();

        CategoriaCreate categoriaCreate1 = new CategoriaCreate();
        categoriaCreate1.setNome("nome categoria");
        categoriaCreate1.setDescrizione("descrizione xyz");
        controller.createTassonomiaCategoria(idTassonomia, categoriaCreate1);
        
        CategoriaCreate categoriaCreate2 = new CategoriaCreate();
        categoriaCreate2.setDescrizione("descrizione xyz");
        categoriaCreate2.setNome("Seconda Categoria");
        controller.createTassonomiaCategoria(idTassonomia, categoriaCreate2);

        // Chiamata alla lista delle categorie con filtro per nome
        ResponseEntity<ListItemCategoria> responseList = controller.listCategorie(idTassonomia, "Seconda");

        // Verifica del successo della chiamata e del filtro applicato
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
        assertNotNull(responseList.getBody());
        assertEquals(1, responseList.getBody().getContent().size());
        assertEquals("Seconda Categoria", responseList.getBody().getContent().get(0).getNome());
    }

    @Test
    void testListCategorieNotFound() {
        // Creazione di una tassonomia
        TassonomiaCreate tassonomiaCreate = CommonUtils.getTassonomiaCreate();
        ResponseEntity<Tassonomia> responseTassonomia = controller.createTassonomia(tassonomiaCreate);
        assertEquals(HttpStatus.OK, responseTassonomia.getStatusCode());

        UUID idTassonomia = responseTassonomia.getBody().getIdTassonomia();

        // Chiamata alla lista delle categorie con filtro che non corrisponde a nessuna categoria
        ResponseEntity<ListItemCategoria> responseList = controller.listCategorie(idTassonomia, "NonEsistente");

        // Verifica che non ci siano categorie nella lista
        assertEquals(HttpStatus.OK, responseList.getStatusCode());
        assertNotNull(responseList.getBody());
        assertEquals(0, responseList.getBody().getContent().size());
    }

    @Test
    void testUpdateCategoriaSuccess() {
        // Creazione di una tassonomia e di una categoria
        TassonomiaCreate tassonomiaCreate = CommonUtils.getTassonomiaCreate();
        ResponseEntity<Tassonomia> responseTassonomia = controller.createTassonomia(tassonomiaCreate);
        assertEquals(HttpStatus.OK, responseTassonomia.getStatusCode());

        UUID idTassonomia = responseTassonomia.getBody().getIdTassonomia();

        CategoriaCreate categoriaCreate = new CategoriaCreate();
        categoriaCreate.setNome("nome categoria");
        categoriaCreate.setDescrizione("descrizione xyz");
        ResponseEntity<Categoria> responseCategoria = controller.createTassonomiaCategoria(idTassonomia, categoriaCreate);
        assertEquals(HttpStatus.OK, responseCategoria.getStatusCode());

        UUID idCategoria = responseCategoria.getBody().getIdCategoria();

        // Preparazione dell'aggiornamento
        CategoriaUpdate categoriaUpdate = new CategoriaUpdate();
        categoriaUpdate.setNome("Categoria Aggiornata");
        categoriaUpdate.setDescrizione("Descrizione aggiornata");

        // Chiamata al metodo di aggiornamento
        ResponseEntity<Categoria> responseUpdateCategoria = controller.updateCategoria(idTassonomia, idCategoria, categoriaUpdate);

        // Verifica del successo dell'aggiornamento
        assertEquals(HttpStatus.OK, responseUpdateCategoria.getStatusCode());
        assertNotNull(responseUpdateCategoria.getBody());
        assertEquals("Categoria Aggiornata", responseUpdateCategoria.getBody().getNome());
        assertEquals("Descrizione aggiornata", responseUpdateCategoria.getBody().getDescrizione());
    }

    @Test
    void testUpdateCategoriaNotFound() {
        UUID idTassonomia = UUID.randomUUID();
        UUID idCategoriaNonEsistente = UUID.randomUUID();

        // Preparazione dell'aggiornamento
        CategoriaUpdate categoriaUpdate = new CategoriaUpdate();
        categoriaUpdate.setNome("Categoria Aggiornata");
        categoriaUpdate.setDescrizione("Descrizione aggiornata");

        // Tentativo di aggiornare una categoria inesistente
        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.updateCategoria(idTassonomia, idCategoriaNonEsistente, categoriaUpdate);
        });

        // Verifica del messaggio di errore
        assertEquals("Categoria [" + idCategoriaNonEsistente + "] per Tassonomia [" + idTassonomia + "] non trovata", exception.getMessage());
    }

    @Test
    void testUpdateCategoriaWrongTassonomia() {
        // Creazione di due tassonomie e una categoria associata alla prima tassonomia
        TassonomiaCreate tassonomiaCreate1 = CommonUtils.getTassonomiaCreate();
        ResponseEntity<Tassonomia> responseTassonomia1 = controller.createTassonomia(tassonomiaCreate1);
        assertEquals(HttpStatus.OK, responseTassonomia1.getStatusCode());

        UUID idTassonomia1 = responseTassonomia1.getBody().getIdTassonomia();

        CategoriaCreate categoriaCreate = new CategoriaCreate();
        categoriaCreate.setNome("nome categoria");
        categoriaCreate.setDescrizione("descrizione xyz");
        ResponseEntity<Categoria> responseCategoria = controller.createTassonomiaCategoria(idTassonomia1, categoriaCreate);
        assertEquals(HttpStatus.OK, responseCategoria.getStatusCode());

        UUID idCategoria = responseCategoria.getBody().getIdCategoria();

        // Creazione di una seconda tassonomia
        TassonomiaCreate tassonomiaCreate2 = CommonUtils.getTassonomiaCreate();
        tassonomiaCreate2.setNome("Seconda Tassonomia");
        ResponseEntity<Tassonomia> responseTassonomia2 = controller.createTassonomia(tassonomiaCreate2);
        assertEquals(HttpStatus.OK, responseTassonomia2.getStatusCode());

        UUID idTassonomia2 = responseTassonomia2.getBody().getIdTassonomia();

        // Preparazione dell'aggiornamento
        CategoriaUpdate categoriaUpdate = new CategoriaUpdate();
        categoriaUpdate.setNome("Categoria Aggiornata");
        categoriaUpdate.setDescrizione("Descrizione aggiornata");

        // Tentativo di aggiornare la categoria appartenente alla prima tassonomia con la seconda
        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.updateCategoria(idTassonomia2, idCategoria, categoriaUpdate);
        });

        // Verifica del messaggio di errore
        assertEquals("Categoria [" + idCategoria + "] per Tassonomia [" + idTassonomia2 + "] non trovata", exception.getMessage());
    }

    @Test
    void testUpdateTassonomiaSuccess() {
        // Creazione di una tassonomia
        TassonomiaCreate tassonomiaCreate = CommonUtils.getTassonomiaCreate();
        ResponseEntity<Tassonomia> responseTassonomia = controller.createTassonomia(tassonomiaCreate);
        assertEquals(HttpStatus.OK, responseTassonomia.getStatusCode());

        UUID idTassonomia = responseTassonomia.getBody().getIdTassonomia();

        // Preparazione dell'aggiornamento
        TassonomiaUpdate tassonomiaUpdate = new TassonomiaUpdate();
        tassonomiaUpdate.setNome("Tassonomia Aggiornata");
        tassonomiaUpdate.setDescrizione("Descrizione aggiornata");

        // Chiamata al metodo di aggiornamento
        ResponseEntity<Tassonomia> responseUpdateTassonomia = controller.updateTassonomia(idTassonomia, tassonomiaUpdate);

        // Verifica del successo dell'aggiornamento
        assertEquals(HttpStatus.OK, responseUpdateTassonomia.getStatusCode());
        assertNotNull(responseUpdateTassonomia.getBody());
        assertEquals("Tassonomia Aggiornata", responseUpdateTassonomia.getBody().getNome());
        assertEquals("Descrizione aggiornata", responseUpdateTassonomia.getBody().getDescrizione());
    }

    @Test
    void testUpdateTassonomiaNotFound() {
        UUID idTassonomiaNonEsistente = UUID.randomUUID();

        // Preparazione dell'aggiornamento
        TassonomiaUpdate tassonomiaUpdate = new TassonomiaUpdate();
        tassonomiaUpdate.setNome("Tassonomia Aggiornata");
        tassonomiaUpdate.setDescrizione("Descrizione aggiornata");

        // Tentativo di aggiornare una tassonomia inesistente
        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            controller.updateTassonomia(idTassonomiaNonEsistente, tassonomiaUpdate);
        });

        // Verifica del messaggio di errore
        assertEquals("Tassonomia [" + idTassonomiaNonEsistente + "] non trovata", exception.getMessage());
    }

    @Test
    void testGetServiziCategoria_Successo() {
    	TassonomiaCreate tassonomiaCreate = CommonUtils.getTassonomiaCreate();
        ResponseEntity<Tassonomia> responseTassonomia = controller.createTassonomia(tassonomiaCreate);

        UUID idTassonomia = responseTassonomia.getBody().getIdTassonomia();

        CategoriaCreate categoriaCreate = new CategoriaCreate();
        categoriaCreate.setNome("nuova categoria");
        categoriaCreate.setDescrizione("descrizione categoria");
        ResponseEntity<Categoria> responseCategoria = controller.createTassonomiaCategoria(idTassonomia, categoriaCreate);

        UUID idCategoria = responseCategoria.getBody().getIdCategoria();
              
        ResponseEntity<PagedModelItemServizio> response = controller.getServiziCategoria(idTassonomia, idCategoria);
        
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertNotNull(response.getBody().getContent());
    }

    @Test
    void testGetServiziCategoria_TassonomiaNonTrovata() {
        UUID idTassonomia = UUID.randomUUID();
        UUID idCategoria = UUID.randomUUID();
        
        NotFoundException ex = assertThrows(NotFoundException.class, () -> {
            controller.getServiziCategoria(idTassonomia, idCategoria);
        });
        
        assertTrue(ex.getMessage().contains("Categoria [" + idCategoria + "] per Tassonomia [" + idTassonomia + "] non trovata"));
    }

    @Test
    void testGetServiziCategoria_CategoriaNonTrovata() {
    	TassonomiaCreate tassonomiaCreate = CommonUtils.getTassonomiaCreate();
        ResponseEntity<Tassonomia> responseTassonomia = controller.createTassonomia(tassonomiaCreate);

        UUID idTassonomia = responseTassonomia.getBody().getIdTassonomia();
        UUID idCategoria = UUID.randomUUID();
        
        NotFoundException ex = assertThrows(NotFoundException.class, () -> {
            controller.getServiziCategoria(idTassonomia, idCategoria);
        });
        
        assertNotNull(ex.getMessage());
    }

    @Test
    void testGetCategoria_Successo() {
    	TassonomiaCreate tassonomiaCreate = CommonUtils.getTassonomiaCreate();
        ResponseEntity<Tassonomia> responseTassonomia = controller.createTassonomia(tassonomiaCreate);

        UUID idTassonomia = responseTassonomia.getBody().getIdTassonomia();

        CategoriaCreate categoriaCreate = new CategoriaCreate();
        categoriaCreate.setNome("categoria");
        categoriaCreate.setDescrizione("categoria descrizione");
        ResponseEntity<Categoria> responseCategoria = controller.createTassonomiaCategoria(idTassonomia, categoriaCreate);

        UUID idCategoria = responseCategoria.getBody().getIdCategoria();
              
        ResponseEntity<Categoria> response = controller.getCategoria(idTassonomia, idCategoria);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void testGetCategoria_TassonomiaNonTrovata() {
        UUID idTassonomia = UUID.randomUUID();
        UUID idCategoria = UUID.randomUUID();
        
        NotFoundException ex = assertThrows(NotFoundException.class, () -> {
            controller.getCategoria(idTassonomia, idCategoria);
        });
        
        assertTrue(ex.getMessage().contains("Categoria [" + idCategoria + "] per Tassonomia [" + idTassonomia + "] non trovata"));
    }

    @Test
    void testGetCategoria_CategoriaNonTrovata() {
    	TassonomiaCreate tassonomiaCreate = CommonUtils.getTassonomiaCreate();
        ResponseEntity<Tassonomia> responseTassonomia = controller.createTassonomia(tassonomiaCreate);

        UUID idTassonomia = responseTassonomia.getBody().getIdTassonomia();
        UUID idCategoria = UUID.randomUUID();
        
        NotFoundException ex = assertThrows(NotFoundException.class, () -> {
            controller.getCategoria(idTassonomia, idCategoria);
        });
        
        assertNotNull(ex.getMessage());
    }
    
    @Test
    void testDeleteTassonomia_Successo() {
    	TassonomiaCreate tassonomiaCreate = CommonUtils.getTassonomiaCreate();
        ResponseEntity<Tassonomia> responseTassonomia = controller.createTassonomia(tassonomiaCreate);

        UUID idTassonomia = responseTassonomia.getBody().getIdTassonomia();
              
        ResponseEntity<Void> response = controller.deleteTassonomia(idTassonomia);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
    }

    @Test
    void testDeleteTassonomia_TassonomiaNonTrovata() {
        UUID idTassonomia = UUID.randomUUID();
        
        NotFoundException ex = assertThrows(NotFoundException.class, () -> {
            controller.deleteTassonomia(idTassonomia);
        });
        
        assertTrue(ex.getMessage().contains("Tassonomia [" + idTassonomia + "] non trovata"));
    }

    @Test
    void testDeleteTassonomia_ErrorePerAssociataCategoria() {
    	TassonomiaCreate tassonomiaCreate = CommonUtils.getTassonomiaCreate();
        ResponseEntity<Tassonomia> responseTassonomia = controller.createTassonomia(tassonomiaCreate);
        entityManager.flush();
        entityManager.clear();
        UUID idTassonomia = responseTassonomia.getBody().getIdTassonomia();
        CategoriaCreate categoriaCreate = new CategoriaCreate();
        categoriaCreate.setNome("categoria");
        categoriaCreate.setDescrizione("categoria descrizione");
        controller.createTassonomiaCategoria(idTassonomia, categoriaCreate);
        entityManager.flush();
        entityManager.clear();
        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            controller.deleteTassonomia(idTassonomia);
        });
        assertTrue(ex.getMessage().contains("Tassonomia [" + responseTassonomia.getBody().getNome() + "] non eliminabile in quanto associata a [1] categorie"));
        assertNotNull(ex.getMessage());
    }
}
