package batch;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.sql.DataSource;

import org.govway.catalogo.core.business.utils.configurazione.ConfigurazioneReader;
import org.govway.catalogo.core.dao.repositories.AdesioneRepository;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.AdesioneEntity.STATO_CONFIGURAZIONE;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.StepExecutionListener;
import org.springframework.batch.core.configuration.annotation.JobBuilderFactory;
import org.springframework.batch.core.configuration.annotation.StepBuilderFactory;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.batch.item.ItemWriter;
import org.springframework.batch.item.UnexpectedInputException;
import org.springframework.batch.item.database.JpaPagingItemReader;
import org.springframework.batch.item.database.builder.JpaPagingItemReaderBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.transaction.PlatformTransactionManager;


import org.springframework.context.annotation.Configuration;

@Configuration
public class ConfigurazioneBatchJobConfig {

	@Autowired
	DataSource dataSource;

	@Autowired
	protected StepBuilderFactory steps;

	@Autowired
	protected EntityManager entityManager;


	@Autowired
	protected EntityManagerFactory entityManagerFactory;

	@Autowired
	AdesioneRepository adesioneRepository;

	@Value("${org.govway.api.catalogo.resource.path:/var/govcat/conf}")
	String externalPath;

	private static final Logger logger = LoggerFactory.getLogger(ConfigurazioneBatchJobConfig.class);

	@Bean(name = "ConfigurazioneJob")
	public Job configurazioneJob(JobBuilderFactory jobs,
			@Qualifier("configurazioneStep") Step configurazioneStep)
					throws UnexpectedInputException {
		return jobs.get("ConfigurazioneStep")
				.start(configurazioneStep)
				.build();
	}

	@Bean
	public StepExecutionListener configurazioneStepListener() {
		return new ConfigurazioneStepListener(externalPath);
	}

	@Bean
	@Qualifier("ConfigurazioneItemReader")
	public JpaPagingItemReader<AdesioneEntity> configurazioneItemReader(        EntityManagerFactory entityManagerFactory) throws IOException {

		ConfigurazioneReader confReader = new ConfigurazioneReader(externalPath);

		List<Map<String, String>> statoConf = confReader.getTuttaConfigurazioneAutomatica();
		List<String> statiInConfigurazione = statoConf.stream()
				.map(m -> m.get("stato_in_configurazione"))
				.collect(Collectors.toList());

		return new JpaPagingItemReaderBuilder<AdesioneEntity>()
				.name("configurazioneItemReader")
				.entityManagerFactory(entityManagerFactory)
				.queryString("SELECT a FROM AdesioneEntity a WHERE a.stato IN :stati_conf AND " +
						"(a.statoConfigurazione IS NULL OR a.statoConfigurazione = :stato_ok OR a.statoConfigurazione = :stato_ko_temporaneo)")
				.parameterValues(Map.of(
						"stati_conf", statiInConfigurazione,
						"stato_ko_temporaneo", STATO_CONFIGURAZIONE.RETRY,
						"stato_ok", STATO_CONFIGURAZIONE.OK
						))
				.pageSize(1)
				.build();
	}


	@Bean
	@StepScope
	@Qualifier("ConfigurazioneItemProcessor")
	public ConfigurazioneItemProcessor configurazioneItemProcessor(
			@Value("#{stepExecutionContext['STATO_CONF_JSON']}") String statoConfJson
			) {
		return new ConfigurazioneItemProcessor(statoConfJson);
	}


	@Bean
	@Qualifier("ConfigurazioneItemWriter")
	public ConfigurazioneItemWriter configurazioneItemWriter() {
		return new ConfigurazioneItemWriter();
	}

	@Bean
	@Qualifier("ConfigurazioneStep")
	public Step configurazioneStep(
			@Qualifier("ConfigurazioneItemReader") JpaPagingItemReader<AdesioneEntity> reader,
			@Qualifier("ConfigurazioneItemProcessor") ItemProcessor<AdesioneEntity, AdesioneEntity> configurazioneItemProcessor,
			@Qualifier("ConfigurazioneItemWriter") ItemWriter<AdesioneEntity> configurazioneItemWriter,
			PlatformTransactionManager transactionManager) throws IOException {
		return steps.get("ConfigurazioneStep")
				.<AdesioneEntity, AdesioneEntity>chunk(1)
				.reader(configurazioneItemReader(entityManagerFactory))
				.processor(configurazioneItemProcessor)
				.writer(configurazioneItemWriter())
				.listener(configurazioneStepListener())
				.build();
	}

	@Bean
	public SoggettoDTOFactory getSoggettoDTOFactory() {
		return new SoggettoDTOFactory();
	}

}
