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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.NotImplementedException;
import org.govway.catalogo.pdnd.controllers.IPDNDClient;
import org.govway.catalogo.pdnd.controllers.PDNDClientFactory;
import org.govway.catalogo.pdnd.controllers.PDNDController;
import org.govway.catalogo.servlets.pdnd.model.AmbienteEnum;
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
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.transaction.annotation.Transactional;

/**
 * Verifica il download dei file di un descrittore e-service esposto da GovCat: a differenza
 * delle operazioni sul ciclo di vita e' una lettura, consentita a chiunque acceda al
 * catalogo, ma resta disponibile unicamente con l'API PDND v3.
 */
@ExtendWith(SpringExtension.class)
@SpringBootTest(classes = OpenAPI2SpringBoot.class)
@EnableAutoConfiguration
@AutoConfigureTestDatabase(replace = Replace.ANY)
@ActiveProfiles("test")
@DirtiesContext(classMode = ClassMode.BEFORE_CLASS)
@TestInstance(TestInstance.Lifecycle.PER_METHOD)
@Transactional
public class PdndDocumentiTest {

    private static final String UTENTE_GESTORE = "gestore";
    private static final UUID ESERVICE_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private static final UUID DESCRIPTOR_ID = UUID.fromString("44444444-4444-4444-4444-444444444444");
    private static final UUID DOCUMENT_ID = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    /** Il client verso la PDND e' simulato: i test verificano l'endpoint, non l'integrazione. */
    @MockitoBean
    private PDNDClientFactory clientFactory;

    @Autowired
    private PDNDController controller;

    @Autowired
    private UtenteService utenteService;

    private IPDNDClient client;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.initMocks(this);
        SecurityContextHolder.setContext(this.securityContext);
        CommonUtils.getSessionUtente(UTENTE_GESTORE, this.securityContext, this.authentication, this.utenteService);

        this.client = mock(IPDNDClient.class);
        when(this.clientFactory.getClientCollaudo()).thenReturn(this.client);
        when(this.clientFactory.getClientProduzione()).thenReturn(this.client);
    }

    @AfterEach
    public void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    public void ilDocumentoScaricatoRiportaNomeEContentTypeDellaPdnd() {
        when(this.client.downloadEServiceDescriptorDocument(ESERVICE_ID, DESCRIPTOR_ID, DOCUMENT_ID))
                .thenReturn(file("openapi.yaml", "application/yaml", "openapi: 3.0.3"));

        ResponseEntity<Resource> response = this.controller.downloadEServiceDescriptorDocument(
                AmbienteEnum.COLLAUDO, ESERVICE_ID, DESCRIPTOR_ID, DOCUMENT_ID);

        assertEquals(MediaType.parseMediaType("application/yaml"), response.getHeaders().getContentType());
        assertEquals("openapi.yaml", response.getHeaders().getContentDisposition().getFilename());
        verify(this.client).downloadEServiceDescriptorDocument(ESERVICE_ID, DESCRIPTOR_ID, DOCUMENT_ID);
    }

    @Test
    public void lInterfacciaScaricataRiportaLaSpecificaDellEService() {
        when(this.client.downloadEServiceDescriptorInterface(ESERVICE_ID, DESCRIPTOR_ID))
                .thenReturn(file("interface.yaml", "application/yaml", "openapi: 3.0.3"));

        ResponseEntity<Resource> response = this.controller.downloadEServiceDescriptorInterface(
                AmbienteEnum.PRODUZIONE, ESERVICE_ID, DESCRIPTOR_ID);

        assertEquals("interface.yaml", response.getHeaders().getContentDisposition().getFilename());
        verify(this.client).downloadEServiceDescriptorInterface(ESERVICE_ID, DESCRIPTOR_ID);
    }

    @Test
    public void iDownloadNonSonoDisponibiliConApiPdndV1() {
        when(this.clientFactory.isVersioneV1()).thenReturn(true);

        assertEquals("SYS.501", assertThrows(NotImplementedException.class,
                () -> this.controller.downloadEServiceDescriptorDocument(AmbienteEnum.COLLAUDO, ESERVICE_ID,
                        DESCRIPTOR_ID, DOCUMENT_ID)).getMessage());
        assertEquals("SYS.501", assertThrows(NotImplementedException.class,
                () -> this.controller.downloadEServiceDescriptorInterface(AmbienteEnum.COLLAUDO, ESERVICE_ID,
                        DESCRIPTOR_ID)).getMessage());

        verify(this.client, never()).downloadEServiceDescriptorDocument(ESERVICE_ID, DESCRIPTOR_ID, DOCUMENT_ID);
        verify(this.client, never()).downloadEServiceDescriptorInterface(ESERVICE_ID, DESCRIPTOR_ID);
    }

    private ResponseEntity<Resource> file(String nome, String contentType, String contenuto) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(nome, StandardCharsets.UTF_8).build().toString())
                .contentType(MediaType.parseMediaType(contentType))
                .body(new ByteArrayResource(contenuto.getBytes(StandardCharsets.UTF_8)));
    }
}
