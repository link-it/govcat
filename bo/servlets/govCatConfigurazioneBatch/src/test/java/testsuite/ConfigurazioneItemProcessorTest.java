package testsuite;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import java.lang.reflect.Field;
import java.util.*;

import org.govway.catalogo.core.configurazione.AbstractEsitoConfigurazione.ESITO;
import org.govway.catalogo.core.configurazione.ConfigurazioneAdesioneInput;
import org.govway.catalogo.core.configurazione.EsitoConfigurazioneAdesione;
import org.govway.catalogo.core.configurazione.IConfigurazioneExecutor;
import org.govway.catalogo.core.dao.repositories.UtenteRepository;
import org.govway.catalogo.core.dto.DTOAdesione;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.StatoAdesioneEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.orm.entity.AdesioneEntity.STATO_CONFIGURAZIONE;
import org.govway.catalogo.core.orm.entity.NotificaEntity.STATO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.util.ReflectionTestUtils;

import batch.AdesioneDTOConverter;
import batch.ConfigurazioneItemProcessor;
import batch.IntermediateStateService;
import batch.SoggettoDTOFactory;

public class ConfigurazioneItemProcessorTest {

    @Mock
    private UtenteRepository utenteRepository;

    @Mock
    private IntermediateStateService updateService;

    @Mock
    private SoggettoDTOFactory soggettoDTOFactory;
    
    @InjectMocks
    private AdesioneDTOConverter adesioneDTOConverter;

    @Mock
    private IConfigurazioneExecutor configurazioneExecutor;

    //@InjectMocks
    //private ConfigurazioneItemProcessor processor;
    
    private TestableConfigurazioneItemProcessor processor;

    //private final String statoConfJson = "[ { \"stato_in_configurazione\": \"collaudo\", \"stato_finale\": \"ATTIVA\" } ]";

    private void injectField(Object target, String fieldName, Object value) {
        try {
            Field field = ConfigurazioneItemProcessor.class.getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (Exception e) {
            throw new RuntimeException("Failed to inject field: " + fieldName, e);
        }
    }

    
    @BeforeEach
    void setUp() throws Exception {
        MockitoAnnotations.openMocks(this);
        
        when(soggettoDTOFactory.getNomeGateway(any())).thenReturn("nome-mock");
        when(soggettoDTOFactory.getTipoGateway(any())).thenReturn("tipo-mock");
        
        String statoConfJson = "[ { \"tipo\": \"PDND\", \"chiave\": \"valore\" } ]";
        IConfigurazioneExecutor fakeExecutor = mock(IConfigurazioneExecutor.class);
        processor = new TestableConfigurazioneItemProcessor(statoConfJson, fakeExecutor);
        
        ReflectionTestUtils.setField(adesioneDTOConverter, "soggettoDTOFactory", soggettoDTOFactory);
        
        adesioneDTOConverter = mock(AdesioneDTOConverter.class);

        processor = new TestableConfigurazioneItemProcessor("{}", mock(IConfigurazioneExecutor.class));

        injectField(processor, "adesioneDTOConverter", adesioneDTOConverter);
        
        //ReflectionTestUtils.setField(processor, "adesioneDTOConverter", adesioneDTOConverter);
        
        //processor = new ConfigurazioneItemProcessor(statoConfJson);
        ReflectionTestUtils.setField(processor, "numeroMassimoTentativi", 3);
        ReflectionTestUtils.setField(processor, "configurazioneExecutorClass", configurazioneExecutor.getClass().getName());
        ReflectionTestUtils.setField(processor, "utenteConfiguratore", "admin");
        ReflectionTestUtils.setField(processor, "utenteRepository", utenteRepository);
        ReflectionTestUtils.setField(processor, "soggettoDTOFactory", soggettoDTOFactory);
        ReflectionTestUtils.setField(processor, "updateService", updateService);
        ReflectionTestUtils.setField(processor, "externalPath", "/tmp");
		
        
        //ReflectionTestUtils.setField(processor, "configurazioneExecutor", configurazioneExecutor);
        ConfigurazioneAdesioneInput confAd = new ConfigurazioneAdesioneInput();
        DTOAdesione dtoAdesione = new DTOAdesione(null, null, null, null, null, null, null, statoConfJson);
        confAd.setAdesione(dtoAdesione);
        processor.configurazioneExecutor().configura(confAd);
    }
    
    private AdesioneEntity getAdesioneEntity(int numTentativi) {
    	AdesioneEntity entity = new AdesioneEntity();
        entity.setId(1L);
        entity.setStato("collaudo");
        entity.setTentativi(numTentativi);
        entity.setStati(new HashSet<StatoAdesioneEntity>());
        return entity;
    }

    @Test
    void testProcessWithEsitoOk() throws Exception {
    	AdesioneEntity entity = this.getAdesioneEntity(0);
        EsitoConfigurazioneAdesione esito = new EsitoConfigurazioneAdesione();
        esito.setEsito(ESITO.OK);
        esito.setMessaggioErrore("ok");
        esito.setChiaveRestituita(Map.of("chiave", "valore"));

        when(configurazioneExecutor.configura(any(ConfigurazioneAdesioneInput.class))).thenReturn(esito);
        Specification<UtenteEntity> spec = any();
        when(utenteRepository.findOne(spec)).thenReturn(Optional.empty());

        AdesioneEntity result = processor.process(entity);

        assertThat(result.getStatoConfigurazione()).isEqualTo(STATO_CONFIGURAZIONE.OK);
        assertThat(result.getTentativi()).isEqualTo(1);
        assertThat(result.getStato()).isEqualTo("ATTIVA");
        assertThat(result.getStati()).hasSize(1);
    }

    @Test
    void testProcessWithKoTemporaneo() throws Exception {
    	AdesioneEntity entity = this.getAdesioneEntity(0);

        EsitoConfigurazioneAdesione esito = new EsitoConfigurazioneAdesione();
        esito.setEsito(ESITO.KO_TEMPORANEO);
        esito.setMessaggioErrore("temporaneo");

        when(configurazioneExecutor.configura(any())).thenReturn(esito);

        AdesioneEntity result = processor.process(entity);

        assertThat(result.getStatoConfigurazione()).isEqualTo(STATO_CONFIGURAZIONE.RETRY);
        assertThat(result.getTentativi()).isEqualTo(1);
    }

    @Test
    void testProcessWithKoDefinitivo() throws Exception {
    	AdesioneEntity entity = this.getAdesioneEntity(1);

        EsitoConfigurazioneAdesione esito = new EsitoConfigurazioneAdesione();
        esito.setEsito(ESITO.KO_DEFINITIVO);
        esito.setMessaggioErrore("ko definitivo");

        when(configurazioneExecutor.configura(any())).thenReturn(esito);

        AdesioneEntity result = processor.process(entity);

        assertThat(result.getStatoConfigurazione()).isEqualTo(STATO_CONFIGURAZIONE.KO);
        assertThat(result.getMessaggioConfigurazione()).isEqualTo("ko definitivo");
    }

    @Test
    void testProcessWithKoTemporaneoAndMaxTentativi() throws Exception {
    	AdesioneEntity entity = this.getAdesioneEntity(3);

        EsitoConfigurazioneAdesione esito = new EsitoConfigurazioneAdesione();
        esito.setEsito(ESITO.KO_TEMPORANEO);
        esito.setMessaggioErrore("ko definitivo");

        when(configurazioneExecutor.configura(any())).thenReturn(esito);

        AdesioneEntity result = processor.process(entity);

        assertThat(result.getStatoConfigurazione()).isEqualTo(STATO_CONFIGURAZIONE.FALLITA);
    }
}
