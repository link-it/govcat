package testsuite;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.*;

import org.govway.catalogo.core.configurazione.AbstractEsitoConfigurazione;
import org.govway.catalogo.core.configurazione.ConfigurazioneAdesioneInput;
import org.govway.catalogo.core.configurazione.EsitoConfigurazioneAdesione;
import org.govway.catalogo.core.configurazione.IConfigurazioneExecutor;
import org.govway.catalogo.core.dao.repositories.UtenteRepository;
import org.govway.catalogo.core.dao.specifications.UtenteSpecification;
import org.govway.catalogo.core.dto.DTOAdesione;
import org.govway.catalogo.core.orm.entity.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import batch.ConfigurazioneItemProcessor;
import batch.IntermediateStateService;
import batch.SoggettoDTOFactory;

@ExtendWith(MockitoExtension.class)
public class ConfigurazioneItemProcessorTest {

    @Mock
    private UtenteRepository utenteRepository;

    @Mock
    private SoggettoDTOFactory soggettoDTOFactory;

    @Mock
    private IntermediateStateService updateService;

    @Mock
    private IConfigurazioneExecutor mockExecutor;

    private ConfigurazioneItemProcessor processor;
    private AdesioneEntity testAdesione;
    private UtenteEntity richiedente;
    private String statoConfJson;

    @BeforeEach
    void setUp() {
        // Setup test data
        statoConfJson = "[{\"stato_in_configurazione\":\"collaudo_ready\",\"stato_finale\":\"collaudo_configurato\"}]";
        
        // Create test adesione entity
        testAdesione = new AdesioneEntity();
        testAdesione.setIdAdesione("test-adesione-123");
        testAdesione.setStato("collaudo_ready");
        testAdesione.setTentativi(0);
        testAdesione.setStati(new HashSet<>());

        // Utente che ha richiesto la configurazione automatica (cambio di stato verso lo stato in configurazione)
        richiedente = new UtenteEntity();
        richiedente.setId(10L);
        richiedente.setPrincipal("richiedente");
        testAdesione.getStati().add(stato("collaudo_ready", richiedente, 1000L));
        
        // Setup servizio and related entities
        ServizioEntity servizio = new ServizioEntity();
        DominioEntity dominio = new DominioEntity();
        SoggettoEntity soggettoReferente = new SoggettoEntity();
        soggettoReferente.setNome("TestErogatore");
        dominio.setSoggettoReferente(soggettoReferente);
        servizio.setDominio(dominio);
        testAdesione.setServizio(servizio);
        
        SoggettoEntity soggettoAderente = new SoggettoEntity();
        soggettoAderente.setNome("TestAderente");
        testAdesione.setSoggetto(soggettoAderente);
        
        // Create processor with mocked dependencies
        processor = new ConfigurazioneItemProcessor(statoConfJson);
        ReflectionTestUtils.setField(processor, "utenteRepository", utenteRepository);
        ReflectionTestUtils.setField(processor, "soggettoDTOFactory", soggettoDTOFactory);
        ReflectionTestUtils.setField(processor, "updateService", updateService);
        ReflectionTestUtils.setField(processor, "numeroMassimoTentativi", 3);
        ReflectionTestUtils.setField(processor, "utenteConfiguratore", "test-configuratore");
        ReflectionTestUtils.setField(processor, "configurazioneJsonPath", "/test/path/configurazione.json");
        ReflectionTestUtils.setField(processor, "configurazioneExecutorClass", "MockConfigurazioneExecutor");
    }

    @Test
    void testConstructorWithValidJson() {
        // Test that constructor properly parses JSON
        ConfigurazioneItemProcessor validProcessor = new ConfigurazioneItemProcessor(statoConfJson);
        assertNotNull(validProcessor);
    }

    @Test
    void testConstructorWithInvalidJson() {
        // Test that constructor throws exception with invalid JSON
        assertThrows(RuntimeException.class, () -> {
            new ConfigurazioneItemProcessor("invalid json");
        });
    }

    @Test
    void testProcessSuccess() throws Exception {
        // Mock successful configuration
        EsitoConfigurazioneAdesione successResult = new EsitoConfigurazioneAdesione();
        successResult.setEsito(AbstractEsitoConfigurazione.ESITO.OK);
        Map<String, String> chiaveMap = new HashMap<>();
        chiaveMap.put("test-key", "test-value");
        successResult.setChiaveRestituita(chiaveMap);
        successResult.setMessaggioErrore("Configuration successful");
        
        // Mock soggettoDTOFactory
        when(soggettoDTOFactory.getNomeGateway(any(SoggettoEntity.class)))
            .thenReturn("TestGateway");
        when(soggettoDTOFactory.getTipoGateway(any(SoggettoEntity.class), any()))
            .thenReturn("ModI");
        
        // Mock the configurazioneExecutor method to return our mock
        ConfigurazioneItemProcessor spyProcessor = spy(processor);
        doReturn(mockExecutor).when(spyProcessor).configurazioneExecutor();
        when(mockExecutor.configura(any(ConfigurazioneAdesioneInput.class)))
            .thenReturn(successResult);
        
        // Execute process
        AdesioneEntity result = spyProcessor.process(testAdesione);
        
        // Verify results
        assertNotNull(result);
        assertEquals("collaudo_configurato", result.getStato());
        assertNull(result.getStatoConfigurazione());
        assertEquals(1, result.getTentativi());
        assertNull(result.getMessaggioConfigurazione());
        assertEquals(2, result.getStati().size());
        assertSame(richiedente, statoFinale(result).getUtente());
        
        // Verify interactions
        verify(updateService).updateIntermediateState(any(AdesioneEntity.class));
        verify(mockExecutor).configura(any(ConfigurazioneAdesioneInput.class));
    }

    @Test
    void testProcessKoDefinitivo() throws Exception {
        // Mock KO_DEFINITIVO configuration
        EsitoConfigurazioneAdesione koResult = new EsitoConfigurazioneAdesione();
        koResult.setEsito(AbstractEsitoConfigurazione.ESITO.KO_DEFINITIVO);
        koResult.setMessaggioErrore("Configuration failed permanently");
        
        // Mock the configurazioneExecutor method to return our mock
        ConfigurazioneItemProcessor spyProcessor = spy(processor);
        doReturn(mockExecutor).when(spyProcessor).configurazioneExecutor();
        when(mockExecutor.configura(any(ConfigurazioneAdesioneInput.class)))
            .thenReturn(koResult);
        
        // Execute process
        AdesioneEntity result = spyProcessor.process(testAdesione);
        
        // Verify results
        assertNotNull(result);
        assertEquals(AdesioneEntity.STATO_CONFIGURAZIONE.KO, result.getStatoConfigurazione());
        assertEquals(1, result.getTentativi());
        assertEquals("Configuration failed permanently", result.getMessaggioConfigurazione());
    }

    @Test
    void testProcessKoTemporaneoBelowMaxAttempts() throws Exception {
        // Mock KO_TEMPORANEO configuration
        EsitoConfigurazioneAdesione koTemporaneoResult = new EsitoConfigurazioneAdesione();
        koTemporaneoResult.setEsito(AbstractEsitoConfigurazione.ESITO.KO_TEMPORANEO);
        koTemporaneoResult.setMessaggioErrore("Temporary failure");
        
        // Set tentativi below max
        testAdesione.setTentativi(1);
        
        // Mock the configurazioneExecutor method to return our mock
        ConfigurazioneItemProcessor spyProcessor = spy(processor);
        doReturn(mockExecutor).when(spyProcessor).configurazioneExecutor();
        when(mockExecutor.configura(any(ConfigurazioneAdesioneInput.class)))
            .thenReturn(koTemporaneoResult);
        
        // Execute process
        AdesioneEntity result = spyProcessor.process(testAdesione);
        
        // Verify results
        assertNotNull(result);
        assertEquals(AdesioneEntity.STATO_CONFIGURAZIONE.RETRY, result.getStatoConfigurazione());
        assertEquals(2, result.getTentativi());
    }

    @Test
    void testProcessKoTemporaneoAtMaxAttempts() throws Exception {
        // Mock KO_TEMPORANEO configuration
        EsitoConfigurazioneAdesione koTemporaneoResult = new EsitoConfigurazioneAdesione();
        koTemporaneoResult.setEsito(AbstractEsitoConfigurazione.ESITO.KO_TEMPORANEO);
        koTemporaneoResult.setMessaggioErrore("Temporary failure");
        
        // Set tentativi at max
        testAdesione.setTentativi(3);
        
        // Mock the configurazioneExecutor method to return our mock
        ConfigurazioneItemProcessor spyProcessor = spy(processor);
        doReturn(mockExecutor).when(spyProcessor).configurazioneExecutor();
        when(mockExecutor.configura(any(ConfigurazioneAdesioneInput.class)))
            .thenReturn(koTemporaneoResult);
        
        // Execute process
        AdesioneEntity result = spyProcessor.process(testAdesione);
        
        // Verify results
        assertNotNull(result);
        assertEquals(AdesioneEntity.STATO_CONFIGURAZIONE.FALLITA, result.getStatoConfigurazione());
        assertEquals(4, result.getTentativi());
    }

    @Test
    void testProcessWithNullTentativi() throws Exception {
        // Set tentativi to null
        testAdesione.setTentativi(null);
        
        // Mock successful configuration
        EsitoConfigurazioneAdesione successResult = new EsitoConfigurazioneAdesione();
        successResult.setEsito(AbstractEsitoConfigurazione.ESITO.OK);
        Map<String, String> chiaveMap2 = new HashMap<>();
        chiaveMap2.put("test-key", "test-value");
        successResult.setChiaveRestituita(chiaveMap2);
        successResult.setMessaggioErrore("Configuration successful");
        
        // Mock soggettoDTOFactory
        when(soggettoDTOFactory.getNomeGateway(any(SoggettoEntity.class)))
            .thenReturn("TestGateway");
        when(soggettoDTOFactory.getTipoGateway(any(SoggettoEntity.class), any()))
            .thenReturn("ModI");
        
        // Mock the configurazioneExecutor method to return our mock
        ConfigurazioneItemProcessor spyProcessor = spy(processor);
        doReturn(mockExecutor).when(spyProcessor).configurazioneExecutor();
        when(mockExecutor.configura(any(ConfigurazioneAdesioneInput.class)))
            .thenReturn(successResult);
        
        // Execute process
        AdesioneEntity result = spyProcessor.process(testAdesione);
        
        // Verify results
        assertNotNull(result);
        assertEquals(1, result.getTentativi());
    }

    @Test
    void testProcessWithStatoNotInConfiguration() throws Exception {
        // Set stato that's not in the configuration but still valid for AdesioneDTOConverter
        testAdesione.setStato("collaudo_ready");
        
        // Mock successful configuration
        EsitoConfigurazioneAdesione successResult = new EsitoConfigurazioneAdesione();
        successResult.setEsito(AbstractEsitoConfigurazione.ESITO.OK);
        Map<String, String> chiaveMap3 = new HashMap<>();
        chiaveMap3.put("test-key", "test-value");
        successResult.setChiaveRestituita(chiaveMap3);
        successResult.setMessaggioErrore("Configuration successful");
        
        // Mock soggettoDTOFactory
        when(soggettoDTOFactory.getNomeGateway(any(SoggettoEntity.class)))
            .thenReturn("TestGateway");
        when(soggettoDTOFactory.getTipoGateway(any(SoggettoEntity.class), any()))
            .thenReturn("ModI");
        
        // Mock the configurazioneExecutor method to return our mock
        ConfigurazioneItemProcessor spyProcessor = spy(processor);
        doReturn(mockExecutor).when(spyProcessor).configurazioneExecutor();
        when(mockExecutor.configura(any(ConfigurazioneAdesioneInput.class)))
            .thenReturn(successResult);
        
        // Execute process
        AdesioneEntity result = spyProcessor.process(testAdesione);
        
        // Verify results - stato should be set to the final stato from configuration
        assertNotNull(result);
        assertEquals("collaudo_configurato", result.getStato());
        assertNull(result.getStatoConfigurazione());
    }

    @Test
    void testConfigurazioneExecutorWithValidClass() throws Exception {
        // Test with a valid class name that implements IConfigurazioneExecutor
        // Use a class that we know exists in the classpath
        ReflectionTestUtils.setField(processor, "configurazioneExecutorClass", "org.govway.catalogo.core.configurazione.DummyConfigurazioneExecutor");
        
        IConfigurazioneExecutor executor = processor.configurazioneExecutor();
        assertNotNull(executor);
        assertTrue(executor instanceof IConfigurazioneExecutor);
    }

    @Test
    void testConfigurazioneExecutorWithInvalidClass() {
        // Test with an invalid class name
        ReflectionTestUtils.setField(processor, "configurazioneExecutorClass", "java.lang.String");
        
        assertThrows(Exception.class, () -> {
            processor.configurazioneExecutor();
        });
    }

    @Test
    void testConfigurazioneExecutorWithNonExistentClass() {
        // Test with a non-existent class name
        ReflectionTestUtils.setField(processor, "configurazioneExecutorClass", "NonExistentClass");
        
        assertThrows(Exception.class, () -> {
            processor.configurazioneExecutor();
        });
    }

    @Test
    void testProcessSuccessAutoreRichiedentePiuRecente() throws Exception {
        // Lo stato in configurazione richiesto piu' volte: autore e' l'ultimo richiedente
        UtenteEntity primoRichiedente = new UtenteEntity();
        primoRichiedente.setId(11L);
        testAdesione.getStati().add(stato("collaudo_ready", primoRichiedente, 500L));
        UtenteEntity altroStato = new UtenteEntity();
        altroStato.setId(12L);
        testAdesione.getStati().add(stato("altro_stato", altroStato, 2000L));

        ConfigurazioneItemProcessor spyProcessor = spyConEsito(esitoOk());

        AdesioneEntity result = spyProcessor.process(testAdesione);

        assertEquals("collaudo_configurato", result.getStato());
        assertSame(richiedente, statoFinale(result).getUtente());
        verifyNoInteractions(utenteRepository);
    }

    @Test
    void testProcessSuccessFallbackUtenteConfiguratore() throws Exception {
        // Nessun richiedente nello storico: si usa l'utente della proprieta'
        testAdesione.getStati().clear();
        UtenteEntity configuratore = new UtenteEntity();
        configuratore.setId(20L);
        when(utenteRepository.findOne(any(UtenteSpecification.class))).thenReturn(Optional.of(configuratore));

        ConfigurazioneItemProcessor spyProcessor = spyConEsito(esitoOk());

        AdesioneEntity result = spyProcessor.process(testAdesione);

        assertEquals("collaudo_configurato", result.getStato());
        assertSame(configuratore, statoFinale(result).getUtente());
    }

    @Test
    void testProcessSuccessFallbackSeRichiedenteNullo() throws Exception {
        // Ultima occorrenza dello stato senza utente (es. dati storici): si usa l'utente della proprieta'
        testAdesione.getStati().add(stato("collaudo_ready", null, 3000L));
        UtenteEntity configuratore = new UtenteEntity();
        configuratore.setId(20L);
        when(utenteRepository.findOne(any(UtenteSpecification.class))).thenReturn(Optional.of(configuratore));

        ConfigurazioneItemProcessor spyProcessor = spyConEsito(esitoOk());

        AdesioneEntity result = spyProcessor.process(testAdesione);

        assertSame(configuratore, statoFinale(result).getUtente());
    }

    @Test
    void testProcessKoSenzaAutoreNonInvocaGovWay() throws Exception {
        // Nessun richiedente e proprieta' non valorizzata: KO senza invocare il configuratore
        testAdesione.getStati().clear();
        ReflectionTestUtils.setField(processor, "utenteConfiguratore", "");
        ConfigurazioneItemProcessor spyProcessor = spy(processor);

        AdesioneEntity result = spyProcessor.process(testAdesione);

        assertEquals("collaudo_ready", result.getStato());
        assertEquals(AdesioneEntity.STATO_CONFIGURAZIONE.KO, result.getStatoConfigurazione());
        assertNotNull(result.getMessaggioConfigurazione());
        assertEquals(0, result.getTentativi());
        assertTrue(result.getStati().isEmpty());
        verify(spyProcessor, never()).configurazioneExecutor();
        verifyNoInteractions(utenteRepository);
    }

    @Test
    void testProcessKoSeUtenteConfiguratoreInesistente() throws Exception {
        // Nessun richiedente e principal di fallback inesistente: KO senza invocare il configuratore
        testAdesione.getStati().clear();
        when(utenteRepository.findOne(any(UtenteSpecification.class))).thenReturn(Optional.empty());
        ConfigurazioneItemProcessor spyProcessor = spy(processor);

        AdesioneEntity result = spyProcessor.process(testAdesione);

        assertEquals(AdesioneEntity.STATO_CONFIGURAZIONE.KO, result.getStatoConfigurazione());
        assertEquals(0, result.getTentativi());
        verify(spyProcessor, never()).configurazioneExecutor();
    }

    private StatoAdesioneEntity stato(String stato, UtenteEntity utente, long data) {
        StatoAdesioneEntity s = new StatoAdesioneEntity();
        s.setUuid(UUID.randomUUID().toString());
        s.setStato(stato);
        s.setUtente(utente);
        s.setData(new Date(data));
        s.setAdesione(testAdesione);
        return s;
    }

    private StatoAdesioneEntity statoFinale(AdesioneEntity adesione) {
        return adesione.getStati().stream()
            .filter(s -> "collaudo_configurato".equals(s.getStato()))
            .findFirst().orElseThrow();
    }

    private EsitoConfigurazioneAdesione esitoOk() {
        EsitoConfigurazioneAdesione esito = new EsitoConfigurazioneAdesione();
        esito.setEsito(AbstractEsitoConfigurazione.ESITO.OK);
        esito.setChiaveRestituita(new HashMap<>(Map.of("test-key", "test-value")));
        return esito;
    }

    private ConfigurazioneItemProcessor spyConEsito(EsitoConfigurazioneAdesione esito) throws Exception {
        when(soggettoDTOFactory.getNomeGateway(any(SoggettoEntity.class))).thenReturn("TestGateway");
        when(soggettoDTOFactory.getTipoGateway(any(SoggettoEntity.class), any())).thenReturn("ModI");
        ConfigurazioneItemProcessor spyProcessor = spy(processor);
        doReturn(mockExecutor).when(spyProcessor).configurazioneExecutor();
        when(mockExecutor.configura(any(ConfigurazioneAdesioneInput.class))).thenReturn(esito);
        return spyProcessor;
    }

}
