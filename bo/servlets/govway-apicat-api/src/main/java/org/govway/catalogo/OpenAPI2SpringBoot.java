/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2025 Link.it srl (https://link.it).
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
package org.govway.catalogo;

import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Properties;
import java.util.stream.Collectors;

import javax.naming.NamingException;
import javax.persistence.EntityManagerFactory;
import javax.sql.DataSource;

import org.apache.tika.Tika;
import org.govway.catalogo.assembler.*;
import org.govway.catalogo.authorization.*;
import org.govway.catalogo.cache.CacheConfiguration;
import org.govway.catalogo.cache.CatalogoCache;
import org.govway.catalogo.cache.GovwayCache;
import org.govway.catalogo.controllers.csv.ServizioBuilder;
import org.govway.catalogo.core.business.utils.ConfigurazioneEService;
import org.govway.catalogo.core.business.utils.EServiceBuilder;
import org.govway.catalogo.core.business.utils.NotificheUtils;
import org.govway.catalogo.core.business.utils.SchedaAdesioneBuilder;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.monitoraggioutils.FiltriUtils;
import org.govway.catalogo.monitoraggioutils.IMonitoraggioClient;
import org.govway.catalogo.monitoraggioutils.IStatisticheClient;
import org.govway.catalogo.monitoraggioutils.allarmi.AllarmiClient;
import org.govway.catalogo.monitoraggioutils.transazioni.TransazioneBuilder;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneProfilo;
import org.govway.catalogo.servlets.pdnd.client.api.impl.ApiClient;
import org.openapitools.jackson.nullable.JsonNullableModule;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.PropertySource;
import org.springframework.context.annotation.PropertySources;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.jndi.JndiTemplate;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.util.FileCopyUtils;

import com.fasterxml.jackson.databind.Module;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;


@SpringBootApplication
@ComponentScan(basePackages = {"org.govway.catalogo.core.orm.entity","org.govway.catalogo.controllers","org.govway.catalogo", "org.govway.catalogo.core.services", "org.openapitools.configuration"})
@EnableJpaRepositories(entityManagerFactoryRef = "entityManagerFactory",
transactionManagerRef = "transactionManager",
basePackages = {"org.govway.catalogo.core.dao.repositories"})
@EnableTransactionManagement

@PropertySources({
    @PropertySource("classpath:govcat-api.properties" ),
    @PropertySource(value = "file:${org.govway.api.catalogo.resource.path:/var/govcat}/govcat-api.properties", ignoreResourceNotFound = true)
    }
)
public class OpenAPI2SpringBoot extends SpringBootServletInitializer {
 
    @Value("${spring.datasource.jndi-name}")
	String jndiName;
	
    @Bean
    public DataSource dataSource() throws NamingException {
		DataSource lookup = (DataSource) new JndiTemplate().lookup(this.jndiName);
		return lookup;
    }

    @Bean
    @ConfigurationProperties(prefix="spring.jpa.properties")
    public Properties jpaProperties() {
    	return new Properties();
    }
    
    @Bean(name ="transactionManager") 
	public JpaTransactionManager jpaTransactionManager(EntityManagerFactory entityManagerFactory) {
		JpaTransactionManager transactionManager = new JpaTransactionManager();
		transactionManager.setEntityManagerFactory(entityManagerFactory);
		transactionManager.setRollbackOnCommitFailure(true);
		return transactionManager;		  
	}

	@Bean(name ="entityManagerFactory") 
	public LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource dataSource) throws NamingException {

		LocalContainerEntityManagerFactoryBean entityManagerFactoryBean = new LocalContainerEntityManagerFactoryBean();

//		entityManagerFactoryBean.setDataSource(dataSource());
		entityManagerFactoryBean.setDataSource(dataSource);
		HibernateJpaVendorAdapter hibernateJpaVendorAdapter = new HibernateJpaVendorAdapter();
		hibernateJpaVendorAdapter.setGenerateDdl(false);
		entityManagerFactoryBean.setJpaVendorAdapter(hibernateJpaVendorAdapter);
		entityManagerFactoryBean.setPackagesToScan(OrganizzazioneEntity.class.getPackage().getName());
		
		Properties jpaProperties = jpaProperties();
		entityManagerFactoryBean.setJpaProperties(jpaProperties);

		return entityManagerFactoryBean;
	}

    @Value("${monitor.client_class}")
	String monitorClientClass;
    
    @Value("${statistiche.client_class}")
	String statisticheClientClass;
    
	@Bean(name ="monitorClientClass") 
	public IMonitoraggioClient monitorClientClass() throws Exception {
		Object obj = Class.forName(this.monitorClientClass).getDeclaredConstructor().newInstance();

		if(obj instanceof IMonitoraggioClient) {
			return (IMonitoraggioClient) obj;
		} else {
			throw new Exception("Classe ["+this.monitorClientClass+"] non implementa l'interfaccia [" + IMonitoraggioClient.class + "]");
		}
	}

	@Bean(name ="statisticheClientClass") 
	public IStatisticheClient statisticheClientClass() throws Exception {
		Object obj = Class.forName(this.statisticheClientClass).getDeclaredConstructor().newInstance();

		if(obj instanceof IStatisticheClient) {
			return (IStatisticheClient) obj;
		} else {
			throw new Exception("Classe ["+this.statisticheClientClass+"] non implementa l'interfaccia [" + IStatisticheClient.class + "]");
		}
	}

	@Value("${org.govway.api.catalogo.resource.path:/var/govcat/conf}")
	String externalPath;
	
	@Bean(name ="configurazione") 
	public Configurazione configurazione(IMonitoraggioClient monitoraggioClient) throws IOException {
		Resource resource = new FileSystemResource(this.externalPath+"/configurazione.json");
		InputStream inputStream = resource.getInputStream();
		byte[] fileData = FileCopyUtils.copyToByteArray(inputStream);
		String outputString = new String(fileData);
		ObjectMapper om = new ObjectMapper();
		om.setPropertyNamingStrategy(PropertyNamingStrategy.SNAKE_CASE);

		Configurazione configurazione = om.readValue(outputString, Configurazione.class);
		
		configurazione.getMonitoraggio().setLimitata(monitoraggioClient.isLimitata());
		
		return configurazione;
	}


	@Bean
	public NotificheUtils notificheUtils() {
		return new NotificheUtils();
	}

	@Bean
	public TransazioneBuilder transazioneBuilder() {
		return new TransazioneBuilder();
	}
	
	@Value("${monitor.catalogo.cache.enabled}")
	private boolean catalogoCacheEnable;
	
	@Value("${monitor.catalogo.cache.ttl}")
	private long catalogoCacheTtl;

	@Value("${monitor.catalogo.cache.maxElements}")
	private Integer catalogoCacheMaxElements;

	@Bean
	public CatalogoCache catalogoCache() {
		CacheConfiguration cacheConfiguration = new CacheConfiguration();
		cacheConfiguration.setEnabled(this.catalogoCacheEnable);
		cacheConfiguration.setTtl(this.catalogoCacheTtl);
		cacheConfiguration.setMaxElements(this.catalogoCacheMaxElements);
		return new CatalogoCache(cacheConfiguration);
	}
	
	@Value("${monitor.govway.cache.enabled}")
	private boolean govwayCacheEnable;
	
	@Value("${monitor.govway.cache.ttl}")
	private long govwayCacheTtl;

	@Value("${monitor.govway.cache.maxElements}")
	private Integer govwayCacheMaxElements;

	@Bean
	public GovwayCache govwayCache() {
		CacheConfiguration cacheConfiguration = new CacheConfiguration();
		cacheConfiguration.setEnabled(this.govwayCacheEnable);
		cacheConfiguration.setTtl(this.govwayCacheTtl);
		cacheConfiguration.setMaxElements(this.govwayCacheMaxElements);
		return new GovwayCache(cacheConfiguration);
	}
	
    @Bean
    public FiltriUtils filtriUtils() {
    	return new FiltriUtils();
    }

    @Bean
    public ServizioBuilder servizioBuilder() {
    	return new ServizioBuilder();
    }
    
    @Bean
    public ProfiloUtenteAssembler profiloAssembler() {
    	return new ProfiloUtenteAssembler();
    }
    
    @Bean
    public AllarmiClient allarmiClient() {
    	return new AllarmiClient();
    }
    
    @Bean
    public Tika tika() {
    	return new Tika();
    }
    
    @Bean
    public CategoriaEngineAssembler categoriaEngineAssembler() {
    	return new CategoriaEngineAssembler();
    }
    
    @Bean
    public CategoriaServizioItemAssembler categoriaServizioItemAssembler() {
    	return new CategoriaServizioItemAssembler();
    }
    
    @Bean
    public NotificaItemAssembler notificaItemAssembler() {
    	return new NotificaItemAssembler();
    }
    
    @Bean
    public NotificaDettaglioAssembler notificaDettaglioAssembler() {
    	return new NotificaDettaglioAssembler();
    }
    
    @Bean
    public NotificaEngineAssembler notificaCoreAssembler() {
    	return new NotificaEngineAssembler();
    }
    
    @Bean
    public OrganizzazioneItemAssembler organizzazioneItemAssembler() {
    	return new OrganizzazioneItemAssembler();
    }
    
    @Bean
    public OrganizzazioneDettaglioAssembler organizzazioneDettaglioAssembler() {
    	return new OrganizzazioneDettaglioAssembler();
    }
    
    @Bean
    public SoggettoItemAssembler soggettoItemAssembler() {
    	return new SoggettoItemAssembler();
    }
    
    @Bean
    public SoggettoDettaglioAssembler soggettoDettaglioAssembler() {
    	return new SoggettoDettaglioAssembler();
    }
    
    @Bean
    public ClasseUtenteItemAssembler classeutenteItemAssembler() {
    	return new ClasseUtenteItemAssembler();
    }
    
    @Bean
    public ClasseUtenteDettaglioAssembler classeutenteDettaglioAssembler() {
    	return new ClasseUtenteDettaglioAssembler();
    }

    @Bean
    public UtenteItemAssembler utenteItemAssembler() {
    	return new UtenteItemAssembler();
    }
    
    @Bean
    public UtenteEngineAssembler utenteEngineAssembler() {
    	return new UtenteEngineAssembler();
    }
    
    @Bean
    public UtenteDettaglioAssembler utenteDettaglioAssembler() {
    	return new UtenteDettaglioAssembler();
    }

    @Bean
    public GruppoItemAssembler gruppoItemAssembler() {
    	return new GruppoItemAssembler();
    }
    
    @Bean
    public GruppoDettaglioAssembler gruppoDettaglioAssembler() {
    	return new GruppoDettaglioAssembler();
    }

    @Bean
    public GruppoEngineAssembler gruppoEngineAssembler() {
    	return new GruppoEngineAssembler();
    }

    @Bean
    public DominioItemAssembler dominioItemAssembler() {
    	return new DominioItemAssembler();
    }
    
    @Bean
    public DominioDettaglioAssembler dominioDettaglioAssembler() {
    	return new DominioDettaglioAssembler();
    }

    @Bean
    public DominioEngineAssembler dominioEngineAssembler() {
    	return new DominioEngineAssembler();
    }

    @Bean
    public ServizioItemAssembler servizioItemAssembler() {
    	return new ServizioItemAssembler();
    }
    
    @Bean
    public ServizioGruppoItemAssembler servizioGruppoItemAssembler() {
    	return new ServizioGruppoItemAssembler();
    }
    
    @Bean
    public ServizioDettaglioAssembler servizioDettaglioAssembler() {
    	return new ServizioDettaglioAssembler();
    }

    @Bean
    public ServizioEngineAssembler servizioEngineAssembler() {
    	return new ServizioEngineAssembler();
    }

    @Bean
    public ApiEngineAssembler apiEngineAssembler() {
    	return new ApiEngineAssembler();
    }

    @Bean
    public CoreEngineAssembler coreEngineAssembler() {
    	return new CoreEngineAssembler();
    }

    @Bean
    public ClientEngineAssembler clientEngineAssembler() {
    	return new ClientEngineAssembler();
    }

    @Bean
    public ApiItemAssembler apiItemAssembler() {
    	return new ApiItemAssembler();
    }
    
    @Bean
    public ApiDettaglioAssembler apiDettaglioAssembler() {
    	return new ApiDettaglioAssembler();
    }

    @Bean
    public AdesioneItemAssembler adesioneItemAssembler() {
    	return new AdesioneItemAssembler();
    }
    
    @Bean
    public AdesioneDettaglioAssembler adesioneDettaglioAssembler() {
    	return new AdesioneDettaglioAssembler();
    }

    @Bean
    public AdesioneEngineAssembler adesioneEngineAssembler() {
    	return new AdesioneEngineAssembler();
    }

    @Bean
    public TassonomiaItemAssembler tassonomiaItemAssembler() {
    	return new TassonomiaItemAssembler();
    }
    
    @Bean
    public TassonomiaDettaglioAssembler tassonomiaDettaglioAssembler() {
    	return new TassonomiaDettaglioAssembler();
    }

    @Bean
    public CategoriaItemAssembler categoriaItemAssembler() {
    	return new CategoriaItemAssembler();
    }
    
    @Bean
    public CategoriaDettaglioAssembler categoriaDettaglioAssembler() {
    	return new CategoriaDettaglioAssembler();
    }

    @Bean
    public ItemMessaggioServizioAssembler itemMessaggioAssembler() {
    	return new ItemMessaggioServizioAssembler();
    }

    @Bean
    public DocumentoAllegatoAssembler documentoAllegatoAssembler() {
    	return new DocumentoAllegatoAssembler();
    }

    @Bean
    public DocumentoAssembler documentoAssembler() {
    	return new DocumentoAssembler();
    }

    @Bean
    public AllegatoServizioAssembler allegatoServizioAssembler() {
    	return new AllegatoServizioAssembler();
    }

    @Bean
    public ClientDettaglioAssembler clientDettaglioAssembler() {
    	return new ClientDettaglioAssembler();
    }

    @Bean
    public ClientItemAssembler clientItemAssembler() {
    	return new ClientItemAssembler();
    }

    @Bean
    public ClientAdesioneItemAssembler clientAdesioneItemAssembler() {
    	return new ClientAdesioneItemAssembler();
    }

    @Bean
    public ItemMessaggioAdesioneAssembler itemMessaggioAdesioneAssembler() {
    	return new ItemMessaggioAdesioneAssembler();
    }

    @Bean
    public ErogazioneItemAssembler erogazioneItemAssembler() {
    	return new ErogazioneItemAssembler();
    }

    @Bean
    public RequestUtils requestUtils() {
    	return new RequestUtils();
    }

    @Bean
    public AllegatoApiAssembler allegatoApiAssembler() {
    	return new AllegatoApiAssembler();
    }

    @Bean
    public ReferenteServizioAssembler referenteServizioAssembler() {
    	return new ReferenteServizioAssembler();
    }

    @Bean
    public ReferenteAdesioneAssembler referenteAdesioneAssembler() {
    	return new ReferenteAdesioneAssembler();
    }

    @Bean
    public ReferenteDominioAssembler referenteDominioAssembler() {
    	return new ReferenteDominioAssembler();
    }
    
    @Bean
    public HttpsEstensioneClientAssembler httpsEstensioneClientAssembler(){
    	return new HttpsEstensioneClientAssembler();
    }
    @Bean
    public HttpsPdndEstensioneClientAssembler httpsPdndEstensioneClientAssembler(){
    	return new HttpsPdndEstensioneClientAssembler();
    }
    @Bean
    public PdndEstensioneClientAssembler pdndEstensioneClientAssembler(){
    	return new PdndEstensioneClientAssembler();
    }
    @Bean
    public HttpsPdndSignEstensioneClientAssembler httpsPdndSignEstensioneClientAssembler(){
    	return new HttpsPdndSignEstensioneClientAssembler();
    }
    @Bean
    public SignPdndEstensioneClientAssembler signPdndEstensioneClientAssembler(){
    	return new SignPdndEstensioneClientAssembler();
    }
    @Bean
    public HttpsSignEstensioneClientAssembler httpsSignEstensioneClientAssembler(){
    	return new HttpsSignEstensioneClientAssembler();
    }
    @Bean
    public SignEstensioneClientAssembler signEstensioneClientAssembler(){
    	return new SignEstensioneClientAssembler();
    }
    @Bean
    public IndirizzoIpEstensioneClientAssembler indirizzoIpEstensioneClientAssembler(){
    	return new IndirizzoIpEstensioneClientAssembler();
    }
    @Bean
    public NoDatiEstensioneClientAssembler noDatiEstensioneClientAssembler(){
    	return new NoDatiEstensioneClientAssembler();
    }
    @Bean
    public OAuthAuthorizationCodeEstensioneClientAssembler oauthAuthorizationCodeEstensioneClientAssembler(){
    	return new OAuthAuthorizationCodeEstensioneClientAssembler();
    }
    @Bean
    public OAuthClientCredentialsEstensioneClientAssembler oauthClientCredentialsEstensioneClientAssembler(){
    	return new OAuthClientCredentialsEstensioneClientAssembler();
    }
    @Bean
    public HttpBasicEstensioneClientAssembler httpBasicEstensioneClientAssembler(){
    	return new HttpBasicEstensioneClientAssembler();
    }

    @Bean
    public ClientAuthorization ClientAuthorization() {
    	return new ClientAuthorization();
    }
    
    @Bean
    public ClasseUtenteAuthorization ClasseUtenteAuthorization() {
    	return new ClasseUtenteAuthorization();
    }
    
    @Bean
    public CoreAuthorization CoreAuthorization() {
    	return new CoreAuthorization();
    }
    

    @Bean
    public DominioAuthorization DominioAuthorization() {
    	return new DominioAuthorization();
    }
    

    @Bean
    public GruppoAuthorization GruppoAuthorization() {
    	return new GruppoAuthorization();
    }
    
    @Bean
    public OrganizzazioneAuthorization OrganizzazioneAuthorization() {
    	return new OrganizzazioneAuthorization();
    }
    

    @Bean
    public ServizioAuthorization ServizioAuthorization() {
    	return new ServizioAuthorization();
    }
    
    @Bean
    public PackageAuthorization PackageAuthorization() {
    	return new PackageAuthorization();
    }
    
    @Bean
    public AdesioneAuthorization AdesioneAuthorization() {
    	return new AdesioneAuthorization();
    }
    

    @Bean
    public SoggettoAuthorization SoggettoAuthorization() {
    	return new SoggettoAuthorization();
    }
    

    @Bean
    public UtenteAuthorization UtenteAuthorization() {
    	return new UtenteAuthorization();
    }

    @Bean
    public EServiceBuilder eServiceBuilder() {
        return new EServiceBuilder();
    }

    @Bean
    public SchedaAdesioneBuilder schedaAdesioneBuilder() {
        return new SchedaAdesioneBuilder();
    }

    @Value("${pdf.logo}")
	String pdfLogoResource;
    
    @Value("${template.url_invocazione}")
	String templateUrlInvocazione;
    
    @Value("${baseurl.collaudo}")
	String baseUrlCollaudo;
    
    @Value("${baseurl.produzione}")
	String baseUrlProduzione;

    @Bean
    public ConfigurazioneEService configurazioneEService(Configurazione configurazione) {
        ConfigurazioneEService configurazioneEService = new ConfigurazioneEService();

        Map<String, String> pr = new HashMap<>();
        
        for(ConfigurazioneProfilo p: configurazione.getServizio().getApi().getProfili()) {
        	pr.put(p.getCodiceInterno(), p.getEtichetta());
        }
        
		configurazioneEService.setProfili(pr);
		configurazioneEService.setTemplateUrlInvocazione(this.templateUrlInvocazione);
		configurazioneEService.setDefaultUrlPrefixCollaudo(this.baseUrlCollaudo);
		configurazioneEService.setDefaultUrlPrefixProduzione(this.baseUrlProduzione);
		Optional.ofNullable(configurazione.getAdesione().getStatiSchedaAdesione()).ifPresent(list -> {
			configurazioneEService.setStatiSchedaAdesione(list.stream().collect(Collectors.toSet()));
		});
        
		Optional.ofNullable(this.getClass().getResourceAsStream(pdfLogoResource)).ifPresent(is -> {

			try {
				configurazioneEService.setPdfLogo(Base64.getEncoder().encodeToString(is.readAllBytes()));
			} catch (IOException e) {}

		});
		
        return configurazioneEService;
    }

    @Bean
    public Module jsonNullableModule() {
        return new JsonNullableModule();
    }

    @Bean
    @ConfigurationProperties(prefix="pdnd.v1.collaudo.client.properties")
    public Properties pdndV1CollaudoClientProperties() {
    	return new Properties();
    }

    @Bean
    @ConfigurationProperties(prefix="pdnd.v1.produzione.client.properties")
    public Properties pdndV1ProduzioneClientProperties() {
    	return new Properties();
    }

    @Value("${pdnd.v1.collaudo.client.url}")
	String pdndV1CollaudoClientUrl;
    
    @Value("${pdnd.v1.collaudo.client.username:#{null}}")
	String pdndV1CollaudoClientUsername;
    
    @Value("${pdnd.v1.collaudo.client.password:#{null}}")
	String pdndV1CollaudoClientPassword;
    
    @Value("${pdnd.v1.produzione.client.url}")
	String pdndV1ProduzioneClientUrl;
    
    @Value("${pdnd.v1.produzione.client.username:#{null}}")
	String pdndV1ProduzioneClientUsername;
    
    @Value("${pdnd.v1.produzione.client.password:#{null}}")
	String pdndV1ProduzioneClientPassword;
    
    @Bean(name = "PDNDClientCollaudo")
    public ApiClient getApiClientStaging() {
    	ApiClient apiClient = new ApiClient();
    	
		apiClient.setBasePath(pdndV1CollaudoClientUrl);

    	if(pdndV1CollaudoClientUsername!=null && !pdndV1CollaudoClientUsername.isEmpty() && pdndV1CollaudoClientPassword!=null && !pdndV1CollaudoClientPassword.isEmpty()) {
			apiClient.addDefaultHeader("Authorization", "Basic " + new String(Base64.getEncoder().encode((pdndV1CollaudoClientUsername+":"+pdndV1CollaudoClientPassword).getBytes())));
    	}
    	
    	Properties p = pdndV1CollaudoClientProperties();
    			
    	for(String name: p.stringPropertyNames()) {
        	apiClient.addDefaultHeader(name, p.getProperty(name));
    	}
    	return apiClient;
    }
    
    @Bean(name = "PDNDClientProduzione")
    public ApiClient getApiClientProduzione() {
    	ApiClient apiClient = new ApiClient();
    	
		apiClient.setBasePath(pdndV1ProduzioneClientUrl);

    	if(pdndV1ProduzioneClientUsername!=null && !pdndV1ProduzioneClientUsername.isEmpty() && pdndV1ProduzioneClientPassword!=null && !pdndV1ProduzioneClientPassword.isEmpty()) {
			apiClient.addDefaultHeader("Authorization", "Basic " + new String(Base64.getEncoder().encode((pdndV1ProduzioneClientUsername+":"+pdndV1ProduzioneClientPassword).getBytes())));
    	}
    	
    	Properties p = pdndV1ProduzioneClientProperties();
    			
    	for(String name: p.stringPropertyNames()) {
        	apiClient.addDefaultHeader(name, p.getProperty(name));
    	}
    	return apiClient;
    }

    @Bean
    public ProfiloEngineAssembler profiloEngineAssembler() { return new ProfiloEngineAssembler(); }

    @Bean
    public ProfiloDettaglioAssembler profiloDettaglioAssembler() { return new ProfiloDettaglioAssembler(profiloEngineAssembler()); }

    @Bean
    public ProfiloItemAssembler profiloItemAssembler() { return new ProfiloItemAssembler(profiloEngineAssembler()); }

    @Bean
    public DominioProfiloAssembler dominioProfiloAssembler() { return new DominioProfiloAssembler(soggettoItemAssembler(), dominioEngineAssembler()); }

    @Bean
    public SoggettoProfiloAssembler soggettoProfiloAssembler() { return new SoggettoProfiloAssembler(organizzazioneItemAssembler()); }

    @Bean
    public ProfiloAuthorization profiloAuthorization() { return new ProfiloAuthorization(); }
}
