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

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.util.Base64;

import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.controllers.ToolsController;
import org.govway.catalogo.core.services.DocumentoService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.servlets.model.DocumentoApiInline;
import org.govway.catalogo.servlets.model.ListaRisorseApiRichiesta;
import org.govway.catalogo.servlets.model.TipoApiRisorsaEnum;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
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

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

//@JsonIgnoreProperties(ignoreUnknown = true)
@ExtendWith(SpringExtension.class)  // JUnit 5 extension
@SpringBootTest(classes = OpenAPI2SpringBoot.class)
@EnableAutoConfiguration(exclude = {GroovyTemplateAutoConfiguration.class})
@AutoConfigureTestDatabase(replace = Replace.ANY)
@ActiveProfiles("test")
@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
public class ToolsTest {

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @Mock
    private CoreAuthorization coreAuthorization;

    @Mock
    private DocumentoService documentoService;

    @InjectMocks
    private ToolsController toolsController;

    @Autowired
    UtenteService utenteService;

    private static final String UTENTE_GESTORE = "gestore";

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.initMocks(this);
        when(this.securityContext.getAuthentication()).thenReturn(this.authentication);
        
        // Configura `coreAuthorization` per essere utilizzato nei test
        when(coreAuthorization.isAnounymous()).thenReturn(true);

        // Imposta il contesto di sicurezza in SecurityContextHolder
        SecurityContextHolder.setContext(this.securityContext);
    }
/*
    @Test
    @Transactional
    public void testListaRisorseApiSuccess() {
    	 // Arrange
        DocumentoApiInline documento = new DocumentoApiInline();
        documento.setDocument(Base64.getEncoder().encodeToString("correct-format-document".getBytes()));
        documento.setType(TipoApiRisorsaEnum.INLINE);

        ListaRisorseApiRichiesta richiesta = new ListaRisorseApiRichiesta();
        richiesta.setDocument(documento);

        // Configura il comportamento mock, ad esempio cercare l'entità del documento
        DocumentoEntity mockDocumentoEntity = new DocumentoEntity();
        when(documentoService.find("some-key")).thenReturn(Optional.of(mockDocumentoEntity));

        // Act
        try {
            ResponseEntity<List<String>> response = toolsController.listaRisorseApi(richiesta);

            // Assert
            assertNotNull(response);
            assertEquals(200, response.getStatusCodeValue());
            verify(documentoService).find("some-key");
        } catch (BadRequestException e) {
            // Aggiungi log o ulteriori informazioni per capire il motivo dell'eccezione
            System.out.println("BadRequestException: " + e.getMessage());
            throw e;  // Rilancia l'eccezione per permettere al test di fallire correttamente
        }
    }
*/
    @Test
    public void testListaRisorseApiBadRequest() {
        // Arrange
        DocumentoApiInline documento = new DocumentoApiInline();
        documento.setDocument(Base64.getEncoder().encodeToString("test-document".getBytes()));
        documento.setType(TipoApiRisorsaEnum.INLINE);

        ListaRisorseApiRichiesta richiesta = new ListaRisorseApiRichiesta();
        richiesta.setDocument(documento);

        // Act & Assert
        assertThrows(BadRequestException.class, () -> toolsController.listaRisorseApi(richiesta));
    }

    @Test
    public void testListaRisorseApiNotFound() {
        // Arrange
        DocumentoApiInline documento = new DocumentoApiInline();
        documento.setDocument(Base64.getEncoder().encodeToString("test-document".getBytes()));
        documento.setType(TipoApiRisorsaEnum.INLINE);

        ListaRisorseApiRichiesta richiesta = new ListaRisorseApiRichiesta();
        richiesta.setDocument(documento);

        // Act & Assert
        assertThrows(BadRequestException.class, () -> toolsController.listaRisorseApi(richiesta));
    }
}

