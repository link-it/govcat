package testsuite;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

import java.util.UUID;

import org.apache.commons.codec.binary.Base64;
import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.authorization.GruppoAuthorization;
import org.govway.catalogo.controllers.GruppiController;
import org.govway.catalogo.controllers.UtentiController;
import org.govway.catalogo.core.services.GruppoService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.servlets.model.DocumentoCreate;
import org.govway.catalogo.servlets.model.DocumentoUpdate.TipoDocumentoEnum;
import org.govway.catalogo.servlets.model.DocumentoUpdateId;
import org.govway.catalogo.servlets.model.Gruppo;
import org.govway.catalogo.servlets.model.GruppoCreate;
import org.govway.catalogo.servlets.model.GruppoUpdate;
import org.govway.catalogo.servlets.model.TipoServizio;
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

@ExtendWith(SpringExtension.class)
@SpringBootTest(classes = OpenAPI2SpringBoot.class)
@EnableAutoConfiguration(exclude = {GroovyTemplateAutoConfiguration.class})
@AutoConfigureTestDatabase(replace = Replace.ANY)
@ActiveProfiles("test")
@DirtiesContext(classMode = ClassMode.BEFORE_CLASS)
@TestInstance(TestInstance.Lifecycle.PER_METHOD)
@Transactional
public class GruppoImmagineTest {

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
        when(this.securityContext.getAuthentication()).thenReturn(this.authentication);
        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        when(coreAuthorization.isAnounymous()).thenReturn(true);
        SecurityContextHolder.setContext(this.securityContext);

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
    public void testUpdateGruppoConImmagineSuccess() {
        // 1. Crea un gruppo con un'immagine associata
        byte[] fakeImageData = "fakeImageContent".getBytes();
        DocumentoCreate docC = new DocumentoCreate();
        docC.setFilename("test.jpeg");
        docC.setContentType("image/jpeg");
        docC.setContent(Base64.encodeBase64String(fakeImageData));

        GruppoCreate gruppoCreate = CommonUtils.getGruppoCreate();
        gruppoCreate.setImmagine(docC);
        ResponseEntity<Gruppo> createdGruppo = controller.createGruppo(gruppoCreate);
        assertEquals(HttpStatus.OK, createdGruppo.getStatusCode());

        UUID idGruppo = createdGruppo.getBody().getIdGruppo();

        // 2. Verifica che il gruppo creato abbia l'immagine
        assertNotNull(createdGruppo.getBody().getImmagine(), "Il gruppo creato deve avere un'immagine");
        UUID imageUuid = createdGruppo.getBody().getImmagine().getUuid();
        assertNotNull(imageUuid, "L'immagine deve avere un UUID");

        // 3. Riproduce il comportamento del frontend Angular in fase di update:
        //    Il frontend riceve l'oggetto immagine con uuid dalla GET del gruppo,
        //    e in _prepareBodyUpdate() costruisce:
        //    { tipo_documento: 'uuid', uuid: '<uuid-ricevuto>' }
        //    per preservare l'immagine esistente senza modificarla.
        DocumentoUpdateId immagineUpdate = new DocumentoUpdateId();
        immagineUpdate.setTipoDocumento(TipoDocumentoEnum.UUID);
        immagineUpdate.setUuid(imageUuid);

        GruppoUpdate gruppoUpdate = new GruppoUpdate();
        gruppoUpdate.setNome("Gruppo aggiornato con immagine");
        gruppoUpdate.setDescrizione("Descrizione aggiornata");
        gruppoUpdate.setTipo(TipoServizio.API);
        gruppoUpdate.setImmagine(immagineUpdate);

        // 4. Esegue l'update come farebbe il frontend
        ResponseEntity<Gruppo> updatedGruppo = controller.updateGruppo(idGruppo, gruppoUpdate);

        assertEquals(HttpStatus.OK, updatedGruppo.getStatusCode());
        assertNotNull(updatedGruppo.getBody());
        assertEquals("Gruppo aggiornato con immagine", updatedGruppo.getBody().getNome());
        assertEquals("Descrizione aggiornata", updatedGruppo.getBody().getDescrizione());
        assertNotNull(updatedGruppo.getBody().getImmagine(), "L'immagine deve essere preservata dopo l'update");
    }
}
