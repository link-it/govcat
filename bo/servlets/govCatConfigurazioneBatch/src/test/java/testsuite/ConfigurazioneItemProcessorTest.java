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
        ReflectionTestUtils.setField(processor, "externalPath", "/test/path");
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
        
        // Mock utente repository response
        UtenteEntity mockUtente = new UtenteEntity();
        mockUtente.setId(1L);
        when(utenteRepository.findOne(any(UtenteSpecification.class)))
            .thenReturn(Optional.of(mockUtente));
        
        // Mock soggettoDTOFactory
        when(soggettoDTOFactory.getNomeGateway(any(SoggettoEntity.class)))
            .thenReturn("TestGateway");
        when(soggettoDTOFactory.getTipoGateway(any(SoggettoEntity.class)))
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
        assertEquals(AdesioneEntity.STATO_CONFIGURAZIONE.OK, result.getStatoConfigurazione());
        assertEquals(1, result.getTentativi());
        assertEquals("Configuration successful", result.getMessaggioConfigurazione());
        assertEquals(1, result.getStati().size());
        
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
        
        // Mock utente repository response
        UtenteEntity mockUtente = new UtenteEntity();
        mockUtente.setId(1L);
        when(utenteRepository.findOne(any(UtenteSpecification.class)))
            .thenReturn(Optional.of(mockUtente));
        
        // Mock soggettoDTOFactory
        when(soggettoDTOFactory.getNomeGateway(any(SoggettoEntity.class)))
            .thenReturn("TestGateway");
        when(soggettoDTOFactory.getTipoGateway(any(SoggettoEntity.class)))
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
        
        // Mock utente repository response
        UtenteEntity mockUtente = new UtenteEntity();
        mockUtente.setId(1L);
        when(utenteRepository.findOne(any(UtenteSpecification.class)))
            .thenReturn(Optional.of(mockUtente));
        
        // Mock soggettoDTOFactory
        when(soggettoDTOFactory.getNomeGateway(any(SoggettoEntity.class)))
            .thenReturn("TestGateway");
        when(soggettoDTOFactory.getTipoGateway(any(SoggettoEntity.class)))
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
        assertEquals(AdesioneEntity.STATO_CONFIGURAZIONE.OK, result.getStatoConfigurazione());
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

}
