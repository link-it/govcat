/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
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
package batch;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import javax.sql.DataSource;

import org.govway.catalogo.core.business.utils.configurazione.ConfigurazioneReader;
import org.govway.catalogo.core.dao.repositories.AdesioneRepository;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.AdesioneEntity.STATO_CONFIGURAZIONE;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.job.Job;
import org.springframework.batch.core.step.Step;
import org.springframework.batch.core.listener.StepExecutionListener;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.infrastructure.item.ItemProcessor;
import org.springframework.batch.infrastructure.item.ItemWriter;
import org.springframework.batch.infrastructure.item.UnexpectedInputException;
import org.springframework.batch.infrastructure.item.database.JpaPagingItemReader;
import org.springframework.batch.infrastructure.item.database.builder.JpaPagingItemReaderBuilder;
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
	protected EntityManager entityManager;


	@Autowired
	protected EntityManagerFactory entityManagerFactory;

	@Autowired
	AdesioneRepository adesioneRepository;

	@Value("${org.govway.api.catalogo.configurazione.path:/var/govcat/conf/configurazione.json}")
	String configurazioneJsonPath;

	private static final Logger logger = LoggerFactory.getLogger(ConfigurazioneBatchJobConfig.class);

	@Bean(name = "ConfigurazioneJob")
	public Job configurazioneJob(JobRepository jobs,
                                 @Qualifier("configurazioneStep") Step configurazioneStep)
					throws UnexpectedInputException {
        return new JobBuilder("ConfigurazioneStep", jobs).start(configurazioneStep).build();
	}

	@Bean
	public StepExecutionListener configurazioneStepListener() {
		return new ConfigurazioneStepListener(configurazioneJsonPath);
	}

	@Bean
	@Qualifier("ConfigurazioneItemReader")
	public JpaPagingItemReader<AdesioneEntity> configurazioneItemReader(        EntityManagerFactory entityManagerFactory) throws IOException {

		ConfigurazioneReader confReader = new ConfigurazioneReader(configurazioneJsonPath);

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
	public Step configurazioneStep(JobRepository jobRepository,
			@Qualifier("ConfigurazioneItemReader") JpaPagingItemReader<AdesioneEntity> reader,
			@Qualifier("ConfigurazioneItemProcessor") ItemProcessor<AdesioneEntity, AdesioneEntity> configurazioneItemProcessor,
			@Qualifier("ConfigurazioneItemWriter") ItemWriter<AdesioneEntity> configurazioneItemWriter,
			PlatformTransactionManager transactionManager) throws IOException {
        return new StepBuilder("ConfigurazioneStep", jobRepository)
                .<AdesioneEntity, AdesioneEntity>chunk(1, transactionManager)
                .reader(reader)
                .processor(configurazioneItemProcessor)
                .writer(configurazioneItemWriter)
                .listener(configurazioneStepListener())
                .build();
	}

	@Bean
	public SoggettoDTOFactory getSoggettoDTOFactory() {
		return new SoggettoDTOFactory();
	}

}
