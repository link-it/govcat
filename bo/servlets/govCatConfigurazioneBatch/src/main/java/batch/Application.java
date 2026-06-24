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

import java.time.Instant;
import java.util.concurrent.atomic.AtomicBoolean;
import org.springframework.batch.core.ExitStatus;
import org.springframework.batch.core.job.Job;
import org.springframework.batch.core.job.JobExecution;
import org.springframework.batch.core.job.parameters.JobParameters;
import org.springframework.batch.core.job.parameters.JobParametersBuilder;
import org.springframework.batch.core.job.parameters.InvalidJobParametersException;
import org.springframework.batch.core.configuration.annotation.EnableBatchProcessing;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.batch.core.launch.JobExecutionAlreadyRunningException;
import org.springframework.batch.core.launch.JobInstanceAlreadyCompleteException;
import org.springframework.batch.core.launch.JobRestartException;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.PropertySource;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;


@SpringBootApplication(scanBasePackages= {"batch"})
@EnableBatchProcessing
@EnableScheduling
@EnableJpaRepositories(basePackages = {"org.govway.catalogo.core.dao.repositories"})
@EntityScan(basePackages = "org.govway.catalogo.core.orm.entity")
@PropertySource("classpath:govcat-batch-configurazione.properties" )
@PropertySource("file:${org.govway.api.catalogo.batch.resource.path:/var/govcat/conf/govcat-batch-configurazione.properties}"  )
@PropertySource("file:${org.govway.api.catalogo.configurazione.path:/var/govcat/conf/configurazione.json}"  )
public class Application extends SpringBootServletInitializer{

    private static final Logger logger = LoggerFactory.getLogger(Application.class);

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(Application.class);
    }

    @Autowired
	private JobLauncher jobLauncher;

	@Autowired
	@Qualifier("ConfigurazioneJob")
	private Job configurazioneJob;

    @Value("${scheduled.fixedRate}")
    private long fixedRate;

	public static final int EXIT_CODE_FAILURE = 1;

	private final AtomicBoolean running = new AtomicBoolean(false);

	@Scheduled(fixedRateString = "${scheduled.fixedRate}")
    public String runJob() throws JobExecutionAlreadyRunningException, JobRestartException, JobInstanceAlreadyCompleteException, InvalidJobParametersException, batch.JobExecutionException {
        if (!running.compareAndSet(false, true)) {
            logger.debug("[runJob] esecuzione precedente ancora in corso, tick saltato");
            return null;
        }
        try {
            JobParameters params = new JobParametersBuilder()
                    .addString("When", Instant.now().toString())
                    .addString("ConfigurazioneJob", "job")
                    .toJobParameters();
            JobExecution jobExecution = null;
            try {
                jobExecution = jobLauncher.run(configurazioneJob, params);
            } catch (Exception e) {
                logger.error(e.getMessage());
                throw new JobExecutionException(e.getMessage());
            }
            ExitStatus exitStatus = jobExecution.getExitStatus();

            return exitStatus.getExitCode();
        } finally {
            running.set(false);
        }
    }

	public static void main(String[] args) throws BeansException, Exception {
		ConfigurableApplicationContext context=null;
		try {
			context = SpringApplication.run(Application.class, args);

			String status = context.getBean(Application.class).runJob();

			if ("FAILED".equals(status)) {
				System.exit(EXIT_CODE_FAILURE);
			}
			context.close();
		}
		finally {
			if (context!= null)
				context.close();
		}
	}
}
