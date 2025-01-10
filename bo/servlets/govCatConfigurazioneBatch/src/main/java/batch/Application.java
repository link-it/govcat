package batch;

import java.time.Instant;

import org.springframework.batch.core.ExitStatus;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.batch.core.JobParametersInvalidException;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.batch.core.repository.JobExecutionAlreadyRunningException;
import org.springframework.batch.core.repository.JobInstanceAlreadyCompleteException;
import org.springframework.batch.core.repository.JobRestartException;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@SpringBootApplication(scanBasePackages = { "batch"})
@EnableJpaRepositories(basePackages = {"org.govway.catalogo.core.dao.repositories"})
@EntityScan(basePackages = {"org.govway.catalogo.core.orm.entity"})
@Configuration
@EnableScheduling
@PropertySource("classpath:govcat-batch-configurazione.properties" )
@PropertySource("file:${org.govway.api.catalogo.resource.path:/var/govcat/conf}/govcat-batch-configurazione.properties"  )
public class Application extends SpringBootServletInitializer{

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

	@Scheduled(fixedRateString = "${scheduled.fixedRate}")
    public String runJob() throws JobExecutionAlreadyRunningException, JobRestartException, JobInstanceAlreadyCompleteException, JobParametersInvalidException, batch.JobExecutionException {
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
