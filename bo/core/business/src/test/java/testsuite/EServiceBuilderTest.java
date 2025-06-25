package testsuite;

import org.apache.commons.codec.binary.Base64;
import org.govway.catalogo.core.business.utils.EServiceBuilder;
import org.govway.catalogo.core.business.utils.OpenapiUtils;
import org.govway.catalogo.core.orm.entity.AllegatoApiEntity;
import org.govway.catalogo.core.orm.entity.ApiConfigEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.AuthTypeEntity;
import org.govway.catalogo.core.orm.entity.DocumentoEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.TipoServizio;

import org.govway.catalogo.stampe.StampePdf;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import org.springframework.test.util.ReflectionTestUtils;
import org.slf4j.Logger;

@ExtendWith(MockitoExtension.class)
class EServiceBuilderTest {
	/*
	@InjectMocks
    private EServiceBuilder eServiceBuilder;

    @Mock
    private Logger logger;

    @Mock
    private StampePdf stampePdf;
    
    @Mock private ApiEntity api;
    @Mock private ApiConfigEntity collaudo;
    @Mock private ApiConfigEntity produzione;
    @Mock private DocumentoEntity specificaCollaudo;
    @Mock private DocumentoEntity specificaProduzione;
    
	private static final String openApiSpec = 
		    "openapi: 3.0.0\n" +
		    	    "info:\n" +
		    	    "  title: API di Test\n" +
		    	    "  description: Una semplice API di test per dimostrare OpenAPI\n" +
		    	    "  version: 1.0.0\n" +
		    	    "servers:\n" +
		    	    "  - url: http://localhost:8080\n" +
		    	    "    description: Server locale di sviluppo\n" +
		    	    "paths:\n" +
		    	    "  /hello:\n" +
		    	    "    get:\n" +
		    	    "      summary: Ottiene un messaggio di saluto\n" +
		    	    "      description: Ritorna un messaggio di benvenuto\n" +
		    	    "      operationId: getHello\n" +
		    	    "      responses:\n" +
		    	    "        '200':\n" +
		    	    "          description: Risposta con il saluto\n" +
		    	    "          content:\n" +
		    	    "            application/json:\n" +
		    	    "              schema:\n" +
		    	    "                type: object\n" +
		    	    "                properties:\n" +
		    	    "                  message:\n" +
		    	    "                    type: string\n" +
		    	    "                    example: \"Ciao, mondo!\"\n";

    @BeforeEach
    void setUp() {
    	
    	MockitoAnnotations.openMocks(this);

        when(api.getCollaudo()).thenReturn(collaudo);
        when(collaudo.getSpecifica()).thenReturn(specificaCollaudo);
        when(specificaCollaudo.getFilename()).thenReturn("spec-collaudo.pdf");
        when(specificaCollaudo.getRawData()).thenReturn("COLLAUDO".getBytes());

        when(api.getProduzione()).thenReturn(produzione);
        when(produzione.getSpecifica()).thenReturn(specificaProduzione);
        when(specificaProduzione.getFilename()).thenReturn("spec-produzione.pdf");
        when(specificaProduzione.getRawData()).thenReturn("PRODUZIONE".getBytes());

        when(api.getAllegati()).thenReturn(Collections.emptySet());

        when(api.getRuolo()).thenReturn(ApiEntity.RUOLO.EROGATO_SOGGETTO_DOMINIO);
        when(api.getNome()).thenReturn("API Test");
        when(api.getVersione()).thenReturn(1);
        when(api.getDescrizione()).thenReturn("Descrizione di test".getBytes());

        when(api.getAuthType()).thenReturn(Collections.emptyList());
    	 
        //when(eServiceBuilder.getUrlInvocazione(api, true)).thenReturn("https://collaudo.url");
        //when(eServiceBuilder.getUrlInvocazione(api, false)).thenReturn("https://produzione.url");
    	
        ReflectionTestUtils.setField(eServiceBuilder, "logger", logger);
        ReflectionTestUtils.setField(StampePdf.class, "_instance", stampePdf); // solo se necessario
    }

    private ApiEntity createApiEntity() {
        // Configurazione collaudo
        ApiConfigEntity configCollaudo = new ApiConfigEntity();
        DocumentoEntity documento = new DocumentoEntity();
        documento.setTipo("application/yaml");
        documento.setRawData(openApiSpec.getBytes());
        documento.setFilename("openapi.yaml");
        configCollaudo.setSpecifica(documento);

        // Configurazione produzione
        ApiConfigEntity configProduzione = new ApiConfigEntity();
        DocumentoEntity documento2 = new DocumentoEntity();
        documento.setTipo("application/yaml");
        documento.setRawData(openApiSpec.getBytes());
        documento.setFilename("openapi2.yaml");
        configProduzione.setSpecifica(documento);

        // Servizio associato
        ServizioEntity servizio = new ServizioEntity();
        servizio.setId(1L);
        servizio.setNome("Servizio test");
        servizio.setTipo(TipoServizio.GENERICO);

        // Costruzione ApiEntity
        ApiEntity api = new ApiEntity();
        api.setId(1L);
        api.setIdApi("test-id-api");
        api.setNome("API test");
        api.setVersione(1);
        api.setRuolo(ApiEntity.RUOLO.EROGATO_SOGGETTO_DOMINIO);
        api.setDescrizione("Descrizione API".getBytes(StandardCharsets.UTF_8));
        api.setUrlInvocazione("http://test/api");

        // Associa configurazioni
        api.setCollaudo(configCollaudo);
        api.setProduzione(configProduzione);

        // Associa servizio
        Set<ServizioEntity> servizi = new HashSet<>();
        servizi.add(servizio);
        api.setServizi(servizi);

        return api;
    }

    
    @Test
    void testGetApiFiles_withFullyInitializedApi() {
        ApiEntity api = this.createApiEntity();
        String prefix = "test-prefix";

        Map<String, byte[]> result = eServiceBuilder.getApiFiles(api, prefix, true);

        assertNotNull(result);
        assertFalse(result.isEmpty());
        assertTrue(result.keySet().stream().anyMatch(name -> name.contains("collaudo")));
    }
    */
}