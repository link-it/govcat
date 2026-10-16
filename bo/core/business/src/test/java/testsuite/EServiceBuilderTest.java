package testsuite;

import org.govway.catalogo.core.business.utils.ConfigurazioneEService;
import org.govway.catalogo.core.business.utils.EServiceBuilder;
import org.govway.catalogo.core.business.utils.UrlInvocazioneConfigurata;
import org.govway.catalogo.core.business.utils.UrlInvocazioneRisolta;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import org.govway.catalogo.core.orm.entity.AllegatoServizioEntity;
import org.govway.catalogo.core.orm.entity.PackageServizioEntity;
import org.govway.catalogo.core.orm.entity.AllegatoApiEntity;
import org.govway.catalogo.core.orm.entity.AllegatoApiEntity.TIPOLOGIA;
import org.govway.catalogo.core.orm.entity.AllegatoApiEntity.VISIBILITA;
import org.govway.catalogo.core.orm.entity.ApiConfigEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ApiConfigUrlInvocazioneEntity;
import org.govway.catalogo.core.orm.entity.DocumentoEntity;
import org.govway.catalogo.core.orm.entity.DominioEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.govway.catalogo.core.orm.entity.TipoServizio;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.govway.catalogo.stampe.StampePdf;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.HashSet;
import java.util.Set;

import java.lang.reflect.Field;

import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;

@ExtendWith(MockitoExtension.class)
class EServiceBuilderTest {
	@InjectMocks
    private EServiceBuilder eServiceBuilder;

    @Mock
    private Logger logger;

    @Mock
    private StampePdf stampePdf;
    @Autowired
	private ConfigurazioneEService configurazione;
    
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
    	/*
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
        */
        configurazione = new ConfigurazioneEService();
        configurazione.setPdfLogo("abc");
    	 
        //when(eServiceBuilder.getUrlInvocazione(api, true)).thenReturn("https://collaudo.url");
        //when(eServiceBuilder.getUrlInvocazione(api, false)).thenReturn("https://produzione.url");
    	
        //ReflectionTestUtils.setField(eServiceBuilder, "logger", logger);
        //ReflectionTestUtils.setField(StampePdf.class, "_instance", stampePdf); // solo se necessario
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
        
        Set<AllegatoApiEntity> allegati = new HashSet<AllegatoApiEntity>();
        AllegatoApiEntity allegato = new AllegatoApiEntity();
        allegato.setApi(api);
        allegato.setTipologia(TIPOLOGIA.GENERICO);
        allegato.setVisibilita(VISIBILITA.PUBBLICO);
        allegato.setDocumento(documento);
        allegati.add(allegato);
        AllegatoApiEntity allegato2 = new AllegatoApiEntity();
        allegato2.setApi(api);
        allegato2.setTipologia(TIPOLOGIA.GENERICO);
        allegato2.setVisibilita(VISIBILITA.PUBBLICO);
        allegato2.setDocumento(documento2);
        allegati.add(allegato2);
        api.setAllegati(allegati);
        // Associa servizio
        Set<ServizioEntity> servizi = new HashSet<>();
        servizi.add(servizio);
        api.setServizi(servizi);

        return api;
    }

    /**
     * Costruisce un grafo minimo api -> servizio -> dominio -> soggetto referente,
     * sufficiente a risolvere url_invocazione, prefix e canale lungo la gerarchia.
     */
    private ApiEntity createApiPerUrl() {
        SoggettoEntity soggetto = new SoggettoEntity();
        soggetto.setNome("soggetto");

        DominioEntity dominio = new DominioEntity();
        dominio.setSoggettoReferente(soggetto);

        ServizioEntity servizio = new ServizioEntity();
        servizio.setFruizione(false);
        servizio.setDominio(dominio);

        ApiEntity api = new ApiEntity();
        api.setNome("apitest");
        api.setVersione(2);
        Set<ServizioEntity> servizi = new HashSet<>();
        servizi.add(servizio);
        api.setServizi(servizi);
        return api;
    }

    @Test
    void testGetUrlInvocazione_placeholderCanale() throws Exception {
        EServiceBuilder builder = new EServiceBuilder();

        ConfigurazioneEService conf = new ConfigurazioneEService();
        conf.setTemplateUrlInvocazione("#prefix#/#canale##nome#/v#versione#");
        conf.setDefaultUrlPrefixProduzione("https://host");
        conf.setDefaultUrlPrefixCollaudo("https://host");

        Field field = EServiceBuilder.class.getDeclaredField("configurazione");
        field.setAccessible(true);
        field.set(builder, conf);

        // Canale assente a tutti i livelli: nessun token dangling, nessun doppio slash nel path
        ApiEntity apiSenzaCanale = createApiPerUrl();
        String urlSenzaCanale = builder.getUrlInvocazione(apiSenzaCanale, false);
        assertEquals("https://host/apitest/v2", urlSenzaCanale);
        assertFalse(urlSenzaCanale.contains("#canale#"));
        // doppio slash ammesso solo nello schema (https://), non nel resto del path
        assertFalse(urlSenzaCanale.substring("https://".length()).contains("//"));

        // Canale valorizzato sull'api: URL = .../<canale><nome>/v<versione>
        ApiEntity apiConCanale = createApiPerUrl();
        apiConCanale.setCanale("canale-");
        String urlConCanale = builder.getUrlInvocazione(apiConCanale, false);
        assertEquals("https://host/canale-apitest/v2", urlConCanale);
    }

    /**
     * Builder con il template, i prefix di default e le URL censite per ambiente usati dai test
     * sulle URL di invocazione.
     */
    private EServiceBuilder createBuilderPerUrl() throws Exception {
        EServiceBuilder builder = new EServiceBuilder();

        ConfigurazioneEService conf = new ConfigurazioneEService();
        conf.setTemplateUrlInvocazione("#prefix#/#nome#/v#versione#");
        conf.setDefaultUrlPrefixProduzione("https://host-prod");
        conf.setDefaultUrlPrefixCollaudo("https://host-coll");
        conf.setEtichettaUrlInvocazioneDefault("Gateway predefinito");
        conf.setUrlInvocazioneCollaudo(List.of(
                new UrlInvocazioneConfigurata("gw_esterno", "Rete internet", "https://gw-coll-esterno", null),
                new UrlInvocazioneConfigurata("gw_dedicato", "Gateway dedicato", null, "#prefix#/dedicato/#nome#")));
        conf.setUrlInvocazioneProduzione(List.of(
                new UrlInvocazioneConfigurata("gw_esterno", "Rete internet", "https://gw-prod-esterno", null)));

        Field field = EServiceBuilder.class.getDeclaredField("configurazione");
        field.setAccessible(true);
        field.set(builder, conf);

        return builder;
    }

    /** Associa alla specifica dell'ambiente indicato le URL elencate, nell'ordine. */
    private void setUrlInvocazione(ApiEntity api, boolean collaudo, String... identificativi) {
        ApiConfigEntity config = new ApiConfigEntity();

        int posizione = 1;
        for(String identificativo: identificativi) {
            ApiConfigUrlInvocazioneEntity url = new ApiConfigUrlInvocazioneEntity();
            url.setApiConfig(config);
            url.setPosizione(posizione++);
            url.setIdentificativo(identificativo);
            config.getUrlInvocazione().add(url);
        }

        if(collaudo) {
            api.setCollaudo(config);
        } else {
            api.setProduzione(config);
        }
    }

    @Test
    void testGetUrlInvocazioni_senzaSelezioneRestituisceLaPredefinita() throws Exception {
        EServiceBuilder builder = createBuilderPerUrl();
        ApiEntity api = createApiPerUrl();

        List<UrlInvocazioneRisolta> urls = builder.getUrlInvocazioni(api, false);

        assertEquals(1, urls.size());
        assertEquals(EServiceBuilder.ID_URL_INVOCAZIONE_DEFAULT, urls.get(0).identificativo());
        assertEquals("Gateway predefinito", urls.get(0).etichetta());
        assertEquals(builder.getUrlInvocazione(api, false), urls.get(0).url());
        assertEquals("https://host-prod/apitest/v2", urls.get(0).url());
    }

    @Test
    void testGetUrlInvocazioni_selezionePredefinitaPiuGatewayCensito() throws Exception {
        EServiceBuilder builder = createBuilderPerUrl();
        ApiEntity api = createApiPerUrl();
        setUrlInvocazione(api, false, EServiceBuilder.ID_URL_INVOCAZIONE_DEFAULT, "gw_esterno");

        List<UrlInvocazioneRisolta> urls = builder.getUrlInvocazioni(api, false);

        assertEquals(2, urls.size());
        assertEquals("https://host-prod/apitest/v2", urls.get(0).url());
        assertEquals("gw_esterno", urls.get(1).identificativo());
        assertEquals("Rete internet", urls.get(1).etichetta());
        // Il solo prefisso e` configurato: il path e` quello della URL predefinita
        assertEquals("https://gw-prod-esterno/apitest/v2", urls.get(1).url());
    }

    @Test
    void testGetUrlInvocazioni_senzaPredefinitaSoloIlGatewaySelezionato() throws Exception {
        EServiceBuilder builder = createBuilderPerUrl();
        ApiEntity api = createApiPerUrl();
        setUrlInvocazione(api, false, "gw_esterno");

        List<UrlInvocazioneRisolta> urls = builder.getUrlInvocazioni(api, false);

        assertEquals(1, urls.size());
        assertEquals("gw_esterno", urls.get(0).identificativo());
        assertEquals("https://gw-prod-esterno/apitest/v2", urls.get(0).url());
    }

    @Test
    void testGetUrlInvocazioni_templateConfiguratoSovrascriveQuelloPredefinito() throws Exception {
        EServiceBuilder builder = createBuilderPerUrl();
        ApiEntity api = createApiPerUrl();
        setUrlInvocazione(api, true, "gw_dedicato");

        List<UrlInvocazioneRisolta> urls = builder.getUrlInvocazioni(api, true);

        assertEquals(1, urls.size());
        // Template sovrascritto, prefisso ereditato da quello della URL predefinita di collaudo
        assertEquals("https://host-coll/dedicato/apitest", urls.get(0).url());
    }

    @Test
    void testGetUrlInvocazioni_selezioneDiUnAmbienteNonInfluenzaLAltro() throws Exception {
        EServiceBuilder builder = createBuilderPerUrl();
        ApiEntity api = createApiPerUrl();
        setUrlInvocazione(api, true, "gw_esterno");

        assertEquals("https://gw-coll-esterno/apitest/v2", builder.getUrlInvocazioni(api, true).get(0).url());

        // Produzione non ha alcuna selezione: resta la URL predefinita
        List<UrlInvocazioneRisolta> produzione = builder.getUrlInvocazioni(api, false);
        assertEquals(1, produzione.size());
        assertEquals(EServiceBuilder.ID_URL_INVOCAZIONE_DEFAULT, produzione.get(0).identificativo());
        assertEquals("https://host-prod/apitest/v2", produzione.get(0).url());
    }

    @Test
    void testGetUrlInvocazioni_identificativoNonPiuCensitoIgnorato() throws Exception {
        EServiceBuilder builder = createBuilderPerUrl();
        ApiEntity api = createApiPerUrl();
        setUrlInvocazione(api, false, "gw_rimosso", "gw_esterno");

        List<UrlInvocazioneRisolta> urls = builder.getUrlInvocazioni(api, false);

        assertEquals(1, urls.size());
        assertEquals("gw_esterno", urls.get(0).identificativo());
    }

    @Test
    void testGetUrlInvocazioni_selezioneTuttaNonPiuCensitaRicadeSullaPredefinita() throws Exception {
        EServiceBuilder builder = createBuilderPerUrl();
        ApiEntity api = createApiPerUrl();
        setUrlInvocazione(api, false, "gw_rimosso");

        List<UrlInvocazioneRisolta> urls = builder.getUrlInvocazioni(api, false);

        assertEquals(1, urls.size());
        assertEquals(EServiceBuilder.ID_URL_INVOCAZIONE_DEFAULT, urls.get(0).identificativo());
        assertEquals("https://host-prod/apitest/v2", urls.get(0).url());
    }

    @Test
    void testGetUrlInvocazione_nonCambiaConLaSelezione() throws Exception {
        EServiceBuilder builder = createBuilderPerUrl();
        ApiEntity api = createApiPerUrl();
        String attesa = builder.getUrlInvocazione(api, false);

        setUrlInvocazione(api, false, "gw_esterno");

        assertEquals(attesa, builder.getUrlInvocazione(api, false));
    }

    @Test
    void testApplicaServerUrls_openapi3DichiaraTuttiIServer() throws Exception {
        byte[] spec = ("{\"openapi\":\"3.0.0\",\"servers\":[{\"url\":\"https://originale\",\"description\":\"Originale\"}]}")
                .getBytes(StandardCharsets.UTF_8);

        byte[] risultato = EServiceBuilder.applicaServerUrls(spec, List.of(
                new UrlInvocazioneRisolta(EServiceBuilder.ID_URL_INVOCAZIONE_DEFAULT, null, "https://principale/api"),
                new UrlInvocazioneRisolta("gw_esterno", "Rete internet", "https://esterno/api")));

        String json = new String(risultato, StandardCharsets.UTF_8);
        assertTrue(json.contains("\"url\":\"https://principale/api\""));
        assertTrue(json.contains("\"url\":\"https://esterno/api\""));
        assertTrue(json.contains("\"description\":\"Rete internet\""));
        // Senza etichetta il primo server conserva la description del documento originale
        assertTrue(json.contains("\"description\":\"Originale\""));
    }

    @Test
    void testApplicaServerUrls_etichettaDelPrimoServerSovrascriveLaDescription() throws Exception {
        byte[] spec = ("{\"openapi\":\"3.0.0\",\"servers\":[{\"url\":\"https://originale\",\"description\":\"Originale\"}]}")
                .getBytes(StandardCharsets.UTF_8);

        byte[] risultato = EServiceBuilder.applicaServerUrls(spec, List.of(
                new UrlInvocazioneRisolta(EServiceBuilder.ID_URL_INVOCAZIONE_DEFAULT, "Gateway predefinito", "https://principale/api")));

        String json = new String(risultato, StandardCharsets.UTF_8);
        assertTrue(json.contains("\"description\":\"Gateway predefinito\""));
        assertFalse(json.contains("Originale"));
    }

    @Test
    void testApplicaServerUrls_swagger2IgnoraLeUrlUlteriori() throws Exception {
        byte[] spec = "{\"swagger\":\"2.0\"}".getBytes(StandardCharsets.UTF_8);

        byte[] risultato = EServiceBuilder.applicaServerUrls(spec, List.of(
                new UrlInvocazioneRisolta(EServiceBuilder.ID_URL_INVOCAZIONE_DEFAULT, null, "https://principale/api"),
                new UrlInvocazioneRisolta("gw_esterno", "Rete internet", "https://esterno/api")));

        String json = new String(risultato, StandardCharsets.UTF_8);
        assertTrue(json.contains("\"host\":\"principale\""));
        assertTrue(json.contains("\"basePath\":\"/api\""));
        assertFalse(json.contains("esterno"));
    }

    @Test
    void testGetApiFiles_withFullyInitializedApi() throws Exception {
        // 1. Crea il builder
        EServiceBuilder builder = new EServiceBuilder();
        
        // 2. Inizializza la configurazione con un logo (per evitare NPE)
        ConfigurazioneEService configurazione = new ConfigurazioneEService();
        configurazione.setPdfLogo("logo.pdf");

        // 3. Setta il campo 'configurazione' via reflection
        Field field = EServiceBuilder.class.getDeclaredField("configurazione");
        field.setAccessible(true);
        field.set(builder, configurazione);

        // 4. Crea un'istanza di ApiEntity (valida, come nel tuo codice)
        ApiEntity api = createApiEntity();

        // 5. Chiama il metodo da testare
        //Map<String,byte[]> result = builder.getApiFiles(api, "PREFIX", true);

        // 6. Asserzioni base (modifica a piacere)
        //assertThat(result).isNotNull();
        //assertThat(result).isNotEmpty();
    }




    /**
     * Issue 325: due componenti con lo stesso nome e versione, resi possibili dal fatto che il
     * criterio di univocita` del servizio comprende il dominio, non devono sovrascriversi le voci
     * nello zip del package.
     */
    @Test
    void testGetEServicePackageComponentiOmonimiSuDominiDiversi() throws Exception {
        EServiceBuilder builder = creaBuilder();

        // Stesso nome di file sui due componenti: senza un prefisso distinto una delle due voci
        // andrebbe persa.
        ServizioEntity _package = creaPackage(
                creaComponentePackage("Componente", "1", "dominio-a", "api-a", "allegato.pdf", "contenuto-a"),
                creaComponentePackage("Componente", "1", "dominio-b", "api-b", "allegato.pdf", "contenuto-b"));

        Map<String, String> voci = vociZip(builder.getEService(_package, false, false, false));

        assertEquals(2, voci.size(), voci.toString());
        assertEquals("contenuto-a", voci.get("Componente_1_dominio-aallegati/allegato.pdf"), voci.toString());
        assertEquals("contenuto-b", voci.get("Componente_1_dominio-ballegati/allegato.pdf"), voci.toString());
    }

    /**
     * Issue 325: senza omonimi il prefisso resta nome_versione, cosi` il layout dell'export non
     * cambia per i package gia` esistenti.
     */
    @Test
    void testGetEServicePackageComponentiDistintiMantengonoIlPrefisso() throws Exception {
        EServiceBuilder builder = creaBuilder();

        ServizioEntity _package = creaPackage(
                creaComponentePackage("Primo", "1", "dominio-a", "api-a", "allegato.pdf", "contenuto-a"),
                creaComponentePackage("Secondo", "2", "dominio-b", "api-b", "allegato.pdf", "contenuto-b"));

        Map<String, String> voci = vociZip(builder.getEService(_package, false, false, false));

        assertEquals(2, voci.size(), voci.toString());
        assertEquals("contenuto-a", voci.get("Primo_1allegati/allegato.pdf"), voci.toString());
        assertEquals("contenuto-b", voci.get("Secondo_2allegati/allegato.pdf"), voci.toString());
    }

    /**
     * Issue 325: componenti omonimi e senza dominio restano distinguibili tramite l'id servizio.
     */
    @Test
    void testGetEServicePackageComponentiOmonimiSenzaDominio() throws Exception {
        EServiceBuilder builder = creaBuilder();

        ServizioEntity primo = creaComponentePackage("Componente", "1", null, "api-a", "allegato.pdf", "contenuto-a");
        ServizioEntity secondo = creaComponentePackage("Componente", "1", null, "api-b", "allegato.pdf", "contenuto-b");

        Map<String, String> voci = vociZip(builder.getEService(creaPackage(primo, secondo), false, false, false));

        assertEquals(2, voci.size(), voci.toString());
        assertEquals("contenuto-a", voci.get("Componente_1_" + primo.getIdServizio() + "allegati/allegato.pdf"), voci.toString());
        assertEquals("contenuto-b", voci.get("Componente_1_" + secondo.getIdServizio() + "allegati/allegato.pdf"), voci.toString());
    }

    private EServiceBuilder creaBuilder() throws Exception {
        EServiceBuilder builder = new EServiceBuilder();

        Field field = EServiceBuilder.class.getDeclaredField("configurazione");
        field.setAccessible(true);
        field.set(builder, new ConfigurazioneEService());

        return builder;
    }

    private ServizioEntity creaComponentePackage(String nome, String versione, String nomeDominio, String nomeApi, String nomeAllegato, String contenuto) {
        ServizioEntity servizio = new ServizioEntity();
        servizio.setIdServizio(UUID.randomUUID().toString());
        servizio.setNome(nome);
        servizio.setVersione(versione);

        if(nomeDominio != null) {
            DominioEntity dominio = new DominioEntity();
            dominio.setNome(nomeDominio);
            servizio.setDominio(dominio);
        }

        DocumentoEntity documento = new DocumentoEntity();
        documento.setFilename(nomeAllegato);
        documento.setRawData(contenuto.getBytes(StandardCharsets.UTF_8));

        AllegatoServizioEntity allegato = new AllegatoServizioEntity();
        allegato.setServizio(servizio);
        allegato.setTipologia(AllegatoServizioEntity.TIPOLOGIA.GENERICO);
        allegato.setVisibilita(AllegatoServizioEntity.VISIBILITA.PUBBLICO);
        allegato.setDocumento(documento);
        servizio.getAllegati().add(allegato);

        ApiEntity api = new ApiEntity();
        api.setNome(nomeApi);
        api.setVersione(1);
        api.setRuolo(ApiEntity.RUOLO.EROGATO_SOGGETTO_ADERENTE);
        api.setCollaudo(new ApiConfigEntity());
        servizio.getApi().add(api);

        return servizio;
    }

    private ServizioEntity creaPackage(ServizioEntity... componenti) {
        ServizioEntity _package = new ServizioEntity();
        _package.setIdServizio(UUID.randomUUID().toString());
        _package.setNome("Package");
        _package.setVersione("1");
        _package.set_package(true);

        for(ServizioEntity componente: componenti) {
            PackageServizioEntity pse = new PackageServizioEntity();
            pse.set_package(_package);
            pse.setServizio(componente);
            _package.getComponenti().add(pse);
        }

        return _package;
    }

    private Map<String, String> vociZip(byte[] zip) throws IOException {
        Map<String, String> voci = new HashMap<>();

        try(ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zip))) {
            ZipEntry entry;
            while((entry = zis.getNextEntry()) != null) {
                voci.put(entry.getName(), new String(zis.readAllBytes(), StandardCharsets.UTF_8));
            }
        }

        return voci;
    }

}
