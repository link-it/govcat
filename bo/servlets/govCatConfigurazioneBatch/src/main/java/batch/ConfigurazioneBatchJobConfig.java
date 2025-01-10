package batch;

import java.io.IOException;
import java.util.Map;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.sql.DataSource;

import org.govway.catalogo.core.business.utils.configurazione.ConfigurazioneReader;
import org.govway.catalogo.core.dao.repositories.AdesioneRepository;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.AdesioneEntity.STATO_CONFIGURAZIONE;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.configuration.annotation.EnableBatchProcessing;
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
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.context.annotation.Configuration;


@Configuration
@EnableBatchProcessing
@EnableTransactionManagement
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

	@Bean(name = "ConfigurazioneJob")
	public Job configurazioneJob(JobBuilderFactory jobs,
			@Qualifier("configurazioneStep") Step configurazioneStep)
					throws UnexpectedInputException {
		return jobs.get("ConfigurazioneStep")
				.start(configurazioneStep)
				.build();
	}

	@Bean
	@StepScope
	@Qualifier("ConfigurazioneItemReader")
	public JpaPagingItemReader<AdesioneEntity> configurazioneItemReader(EntityManagerFactory entityManagerFactory) {
	    return new JpaPagingItemReaderBuilder<AdesioneEntity>()
	        .name("configurazioneItemReader")
	        .entityManagerFactory(entityManagerFactory)
	        .queryString("SELECT a FROM AdesioneEntity a WHERE (a.stato = :stato1 OR a.stato = :stato2) AND"
	        		+ " (a.statoConfigurazione IS NULL OR a.statoConfigurazione = :stato_ok OR a.statoConfigurazione = :stato_ko_temporaneo )")
	        .parameterValues(Map.of("stato1", "autorizzato_collaudo", "stato2", "autorizzato_produzione","stato_ko_temporaneo", STATO_CONFIGURAZIONE.KO_TEMPORANEO_RITENTA,"stato_ok",STATO_CONFIGURAZIONE.OK))
	        .pageSize(1)
	        .build();
	}
	
	@Bean
	@StepScope
	@Qualifier("ConfigurazioneItemProcessor")
	public ItemProcessor<AdesioneEntity, AdesioneEntity> configurazioneItemProcessor() {
	    return new ConfigurazioneItemProcessor();
	}

	@Bean
	@StepScope
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
	            .build();
	}
	
	@Bean
	public SoggettoDTOFactory getSoggettoDTOFactory() {
		return new SoggettoDTOFactory();
	}

}
