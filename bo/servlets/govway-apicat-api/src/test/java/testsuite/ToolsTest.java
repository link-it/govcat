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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

import javax.wsdl.WSDLException;

import org.apache.http.HttpStatus;
import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.controllers.ToolsController;
import org.govway.catalogo.core.business.utils.ServiceInfo;
import org.govway.catalogo.core.business.utils.WsdlUtils;
import org.govway.catalogo.core.orm.entity.DocumentoEntity;
import org.govway.catalogo.core.services.DocumentoService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.model.DocumentoApiInline;
import org.govway.catalogo.servlets.model.DocumentoApiRef;
import org.govway.catalogo.servlets.model.DocumentoCreate;
import org.govway.catalogo.servlets.model.ListaRisorseApiRichiesta;
import org.govway.catalogo.servlets.model.ProtocolloEnum;
import org.govway.catalogo.servlets.model.ServizioWsdl;
import org.govway.catalogo.servlets.model.TipoApiRisorsaEnum;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
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
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.transaction.annotation.Transactional;

@ExtendWith(SpringExtension.class)  // JUnit 5 extension
@SpringBootTest(classes = OpenAPI2SpringBoot.class)
@EnableAutoConfiguration(exclude = {GroovyTemplateAutoConfiguration.class})
@AutoConfigureTestDatabase(replace = Replace.ANY)
@ActiveProfiles("test")
@DirtiesContext(classMode = ClassMode.BEFORE_CLASS)
@TestInstance(TestInstance.Lifecycle.PER_METHOD)
@Transactional
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
    
    private String wsdl = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
            "<definitions name = \"HelloService\"\n"
            + "   targetNamespace = \"http://www.examples.com/wsdl/HelloService.wsdl\"\n"
            + "   xmlns = \"http://schemas.xmlsoap.org/wsdl/\"\n"
            + "   xmlns:soap = \"http://schemas.xmlsoap.org/wsdl/soap/\"\n"
            + "   xmlns:tns = \"http://www.examples.com/wsdl/HelloService.wsdl\"\n"
            + "   xmlns:xsd = \"http://www.w3.org/2001/XMLSchema\">\n"
            + " \n"
            + "   <message name = \"SayHelloRequest\">\n"
            + "      <part name = \"firstName\" type = \"xsd:string\"/>\n"
            + "   </message>\n"
            + "	\n"
            + "   <message name = \"SayHelloResponse\">\n"
            + "      <part name = \"greeting\" type = \"xsd:string\"/>\n"
            + "   </message>\n"
            + "\n"
            + "   <portType name = \"Hello_PortType\">\n"
            + "      <operation name = \"sayHello\">\n"
            + "         <input message = \"tns:SayHelloRequest\"/>\n"
            + "         <output message = \"tns:SayHelloResponse\"/>\n"
            + "      </operation>\n"
            + "   </portType>\n"
            + "\n"
            + "   <binding name = \"Hello_Binding\" type = \"tns:Hello_PortType\">\n"
            + "      <soap:binding style = \"rpc\"\n"
            + "         transport = \"http://schemas.xmlsoap.org/soap/http\"/>\n"
            + "      <operation name = \"sayHello\">\n"
            + "         <soap:operation soapAction = \"sayHello\"/>\n"
            + "         <input>\n"
            + "            <soap:body\n"
            + "               encodingStyle = \"http://schemas.xmlsoap.org/soap/encoding/\"\n"
            + "               namespace = \"urn:examples:helloservice\"\n"
            + "               use = \"encoded\"/>\n"
            + "         </input>\n"
            + "		\n"
            + "         <output>\n"
            + "            <soap:body\n"
            + "               encodingStyle = \"http://schemas.xmlsoap.org/soap/encoding/\"\n"
            + "               namespace = \"urn:examples:helloservice\"\n"
            + "               use = \"encoded\"/>\n"
            + "         </output>\n"
            + "      </operation>\n"
            + "   </binding>\n"
            + "\n"
            + "   <service name = \"Hello_Service\">\n"
            + "      <documentation>WSDL File for HelloService</documentation>\n"
            + "      <port binding = \"tns:Hello_Binding\" name = \"Hello_Port\">\n"
            + "         <soap:address\n"
            + "            location = \"http://www.examples.com/SayHello/\" />\n"
            + "      </port>\n"
            + "   </service>\n"
            + "</definitions>";

    @BeforeEach
    private void setUp() {
        MockitoAnnotations.initMocks(this);
        when(this.securityContext.getAuthentication()).thenReturn(this.authentication);

        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);

        when(coreAuthorization.isAnounymous()).thenReturn(true);

        SecurityContextHolder.setContext(this.securityContext);
    }

    @AfterEach
    private void tearDown() {
        SecurityContextHolder.clearContext();
    }
    
    
    @Test
    public void testListaRisorseApi_SOAP_Success() {
    	DocumentoApiInline documento = new DocumentoApiInline();
        documento.setDocument(Base64.getEncoder().encodeToString(wsdl.getBytes()));
        documento.setType(TipoApiRisorsaEnum.INLINE);
        documento.setContentType("application/soap+xml");

        ListaRisorseApiRichiesta richiesta = new ListaRisorseApiRichiesta();
        richiesta.setDocument(documento);
        richiesta.setApiType(ProtocolloEnum.SOAP);

        ResponseEntity<List<String>> response = toolsController.listaRisorseApi(richiesta);
        assertNotNull(response);
        assertEquals(200, response.getStatusCodeValue());
    }
    
    @Test
    public void testListaRisorseApi_REST_Success() {
    	DocumentoApiInline documento = new DocumentoApiInline();
        documento.setContentType("application/yaml");
        documento.setDocument(Base64.getEncoder().encodeToString(CommonUtils.openApiSpec.getBytes()));
        documento.setType(TipoApiRisorsaEnum.INLINE);

        ListaRisorseApiRichiesta richiesta = new ListaRisorseApiRichiesta();
        richiesta.setDocument(documento);
        richiesta.setApiType(ProtocolloEnum.REST);

        ResponseEntity<List<String>> response = toolsController.listaRisorseApi(richiesta);
        assertNotNull(response);
        assertEquals(200, response.getStatusCodeValue());
    }
    
    @Test
    public void testListaRisorseApiBadRequest() {
        DocumentoApiInline documento = new DocumentoApiInline();
        documento.setDocument(Base64.getEncoder().encodeToString("test-document".getBytes()));
        documento.setType(TipoApiRisorsaEnum.INLINE);

        ListaRisorseApiRichiesta richiesta = new ListaRisorseApiRichiesta();
        richiesta.setDocument(documento);

        assertThrows(BadRequestException.class, () -> toolsController.listaRisorseApi(richiesta));
    }

    @Test
    public void testListaRisorseApiNotFound() {
        DocumentoApiInline documento = new DocumentoApiInline();
        documento.setDocument(Base64.getEncoder().encodeToString("test-document".getBytes()));
        documento.setType(TipoApiRisorsaEnum.INLINE);

        ListaRisorseApiRichiesta richiesta = new ListaRisorseApiRichiesta();
        richiesta.setDocument(documento);

        assertThrows(BadRequestException.class, () -> toolsController.listaRisorseApi(richiesta));
    }

    @Test
    public void testListaOperazioniWsdl_SOAP_Success() throws WSDLException, IOException {

        DocumentoApiInline documento = new DocumentoApiInline();
        documento.setDocument(Base64.getEncoder().encodeToString(wsdl.getBytes()));
        documento.setType(TipoApiRisorsaEnum.INLINE);
        documento.setContentType("application/soap+xml");

        ListaRisorseApiRichiesta richiesta = new ListaRisorseApiRichiesta();
        richiesta.setDocument(documento);
        richiesta.setApiType(ProtocolloEnum.SOAP);

        ResponseEntity<List<ServizioWsdl>> response = toolsController.listaOperazioniWsdl(richiesta);

        assertNotNull(response.getBody());
        assertEquals("200 OK", response.getStatusCode().toString());
    }
    
    @Test
    public void testListaOperazioniWsdlRestApiTypeBadRequest() {

        DocumentoApiInline documento = new DocumentoApiInline();
        documento.setDocument(Base64.getEncoder().encodeToString("wsdl contenuto".getBytes()));
        documento.setType(TipoApiRisorsaEnum.INLINE);

        ListaRisorseApiRichiesta richiesta = new ListaRisorseApiRichiesta();
        richiesta.setDocument(documento);
        richiesta.setApiType(ProtocolloEnum.REST);

        BadRequestException exception = assertThrows(BadRequestException.class, () -> toolsController.listaOperazioniWsdl(richiesta));
        assertEquals("Impossibile recuperare le informazioni sulle azioni/risorse dal descrittore fornito", exception.getMessage());
    }

    @Test
    public void testListaOperazioniWsdlBadRequest() {

        DocumentoApiRef documento = new DocumentoApiRef();
        documento.setUuid("non-existent-uuid");
        documento.setType(TipoApiRisorsaEnum.INLINE);

        ListaRisorseApiRichiesta richiesta = new ListaRisorseApiRichiesta();
        richiesta.setDocument(documento);
        richiesta.setApiType(ProtocolloEnum.SOAP);

        assertThrows(BadRequestException.class, () -> toolsController.listaOperazioniWsdl(richiesta));
    }
}

