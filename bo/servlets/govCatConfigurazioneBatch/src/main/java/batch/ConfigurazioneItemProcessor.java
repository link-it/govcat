package batch;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.govway.catalogo.core.configurazione.ConfigurazioneAdesioneInput;
import org.govway.catalogo.core.configurazione.EsitoConfigurazioneAdesione;
import org.govway.catalogo.core.configurazione.IConfigurazioneExecutor;
import org.govway.catalogo.core.dao.repositories.AdesioneRepository;
import org.govway.catalogo.core.dao.repositories.UtenteRepository;
import org.govway.catalogo.core.dao.specifications.UtenteSpecification;
import org.govway.catalogo.core.dto.DTOAdesione;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.AdesioneEntity.STATO_CONFIGURAZIONE;
import org.govway.catalogo.core.orm.entity.StatoAdesioneEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;


public class ConfigurazioneItemProcessor implements ItemProcessor<AdesioneEntity, AdesioneEntity> {

	@Value("${numeroMassimoTentativi}")
	private int numeroMassimoTentativi;
	
	@Value("${configurazioneExecutorClass}")
	private String configurazioneExecutorClass;

	@Autowired
	private AdesioneRepository entityRepository;

	@Autowired
	private UtenteRepository utenteRepository;

    @Value("${utente_configuratore}")
	String utenteConfiguratore;
	
    @Autowired
    SoggettoDTOFactory soggettoDTOFactory;
    
	@Value("${org.govway.api.catalogo.resource.path:/var/govcat/conf}")
    String externalPath;
    
    private final List<Map<String, String>> statoConf;


    private static final Logger logger = LoggerFactory.getLogger(ConfigurazioneItemProcessor.class);
    

    public ConfigurazioneItemProcessor(
        @Value("#{stepExecutionContext['STATO_CONF_JSON']}") String statoConfJson
        ) {
            try {
                ObjectMapper om = new ObjectMapper();
                this.statoConf = om.readValue(statoConfJson, new TypeReference<>() {});
            } catch (Exception e) {
                throw new RuntimeException("Impossibile convertire JSON in statoConf", e);
            }
        }

    
    
	@Bean(name ="configurazioneExecutorClass") 
	public IConfigurazioneExecutor configurazioneExecutor() throws Exception {
		Object obj = Class.forName(this.configurazioneExecutorClass).getDeclaredConstructor().newInstance();

		if(obj instanceof IConfigurazioneExecutor) {
			return (IConfigurazioneExecutor) obj;
		} else {
			throw new Exception("Classe ["+this.configurazioneExecutorClass+"] non implementa l'interfaccia [" + IConfigurazioneExecutor.class + "]");
		}
	}


    
    
	@Override
	public AdesioneEntity process(AdesioneEntity entity) throws Exception {
		logger.info("[Processor] Configurazione della adesione [ {} ] in corso",entity.getIdAdesione());

		entity.setStatoConfigurazione(STATO_CONFIGURAZIONE.IN_CODA);

		entityRepository.save(entity);

        logger.debug("[Processor] {} configurazioni automatiche disponibili", statoConf.size());

        String statoInConf = entity.getStato();

        String statoFinale = statoConf.stream()
            .filter(m -> statoInConf.equals(m.get("stato_in_configurazione")))
            .map(m -> m.get("stato_finale"))
            .findFirst()
            .orElse(null);

        logger.debug("[Processor] {} configurazioni automatiche disponibili", statoConf.size());
		
		ConfigurazioneAdesioneInput conf = new ConfigurazioneAdesioneInput();
		AdesioneDTOConverter b = new AdesioneDTOConverter(entity, externalPath);
		b.setDto(new DTOAdesione(null, null, null, null, null, null, null, null));
		DTOAdesione c = b.converter(soggettoDTOFactory);

		conf.setAdesione(c);

		EsitoConfigurazioneAdesione configurato = configurazioneExecutor().configura(conf);

		ObjectMapper objectMapper = new ObjectMapper();
		String json = null;
		// Serialize object to JSON
		json  = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(configurato.getChiaveRestituita());

		logger.info("valore di ritorno ricevuti dal configuratore:  ");
		logger.info("chiave restituita:  {}", json);
		logger.info("messaggio di errore:  {}", configurato.getMessaggioErrore());
		logger.info("esito:  {}", configurato.getEsito());

		if (entity.getTentativi()==null) entity.setTentativi(0);

		entity.setTentativi(entity.getTentativi()+1);
		switch (configurato.getEsito()) {
		case OK:
			entity.setStato(statoFinale);
			StatoAdesioneEntity e = new StatoAdesioneEntity();
			e.setUuid(UUID.randomUUID().toString());
			e.setAdesione(entity);
			e.setStato(statoFinale);
			e.setData(new Date());
			UtenteSpecification utenteSpec = new UtenteSpecification();
			utenteSpec.setPrincipal(Optional.of(this.utenteConfiguratore));
			e.setUtente(utenteRepository.findOne(utenteSpec).orElse(null));
			entity.getStati().add(e);

			entity.setStatoConfigurazione(STATO_CONFIGURAZIONE.OK);

			break;

		case KO_DEFINITIVO:
			entity.setStatoConfigurazione(STATO_CONFIGURAZIONE.KO);
			break;

		case KO_TEMPORANEO:
			if (entity.getTentativi() >= numeroMassimoTentativi) {
				entity.setStatoConfigurazione(STATO_CONFIGURAZIONE.FALLITA);
			} else {
				entity.setStatoConfigurazione(STATO_CONFIGURAZIONE.RETRY);
			}
			break;
		}

		entity.setMessaggioConfigurazione(configurato.getMessaggioErrore());
		logger.info("[Processor] Configurazione della adesione [ {} ] completata",entity.getIdAdesione());

		return entity;

	}
}