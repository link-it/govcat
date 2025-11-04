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
package org.govway.catalogo.reverse_proxy;

import jakarta.servlet.ServletContext;
import jakarta.servlet.ServletException;

import org.govway.catalogo.reverse_proxy.config.WebConsoleConfig;
import org.govway.catalogo.reverse_proxy.costanti.Costanti;
import org.govway.catalogo.reverse_proxy.filters.ApiProxyFilter;
import org.govway.catalogo.reverse_proxy.filters.MonitorProxyFilter;
import org.govway.catalogo.reverse_proxy.filters.PdndProxyFilter;
import org.govway.catalogo.reverse_proxy.servlets.ProxyServletApi;
import org.govway.catalogo.reverse_proxy.servlets.ProxyServletMonitor;
import org.govway.catalogo.reverse_proxy.servlets.ProxyServletPdnd;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.autoconfigure.metrics.jersey.JerseyServerMetricsAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.PropertySource;


@SpringBootApplication(exclude = JerseyServerMetricsAutoConfiguration.class)
@PropertySource("classpath:govcat-web.properties")
@PropertySource(value = "file:${org.govway.catalogo.resource.path:/var/govcat/conf/govcat-web.properties}", ignoreResourceNotFound = true)
public class Application  extends SpringBootServletInitializer {

//	private ServletContext servletContext;
	
	@Autowired
	protected WebConsoleConfig webConsoleConfig;
	
	@Autowired
	private ApiProxyFilter proxyFilterApi;
	
	@Autowired
	private PdndProxyFilter proxyFilterPdnd;
	
	@Autowired
	private MonitorProxyFilter proxyFilterMonitor;
	
	@Override
	protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
		return application.sources(Application.class);
	}
	
	@Override	
	public void onStartup(ServletContext servletContext) throws ServletException {
//		this.servletContext = servletContext;
		super.onStartup(servletContext);	
	}
	
	@Bean
	public ServletRegistrationBean<ProxyServletApi> proxyServletApiRegistrationBean(){
		ServletRegistrationBean<ProxyServletApi> reg = new ServletRegistrationBean<>(new ProxyServletApi(), Costanti.PROXY_API_URL_PATTERN);
		
		reg.addInitParameter(Costanti.INIT_PARAMETER_PROXY_TO, this.webConsoleConfig.getUrlGovWayCatalogoAPI());
		reg.addInitParameter(Costanti.INIT_PARAMETER_PREFIX, Costanti.PROXY_API_PREFIX);
		reg.addInitParameter(Costanti.INIT_PARAMETER_MAX_THREADS, Costanti.INIT_PARAMETER_MAX_THREADS_VALUE_15);
		
		reg.setLoadOnStartup(3);
		
		return reg;
	}
	
	@Bean
	public ServletRegistrationBean<ProxyServletPdnd> proxyServletPdndRegistrationBean(){
		ServletRegistrationBean<ProxyServletPdnd> reg = new ServletRegistrationBean<>(new ProxyServletPdnd(), Costanti.PROXY_PDND_URL_PATTERN);
		
		reg.addInitParameter(Costanti.INIT_PARAMETER_PROXY_TO, this.webConsoleConfig.getUrlGovWayCatalogoPdnd());
		reg.addInitParameter(Costanti.INIT_PARAMETER_PREFIX, Costanti.PROXY_PDND_PREFIX);
		reg.addInitParameter(Costanti.INIT_PARAMETER_MAX_THREADS, Costanti.INIT_PARAMETER_MAX_THREADS_VALUE_15);
		
		reg.setLoadOnStartup(4);
		
		return reg;
	}
	
	@Bean
	public ServletRegistrationBean<ProxyServletMonitor> proxyServletMonitorRegistrationBean(){
		ServletRegistrationBean<ProxyServletMonitor> reg = new ServletRegistrationBean<>(new ProxyServletMonitor(), Costanti.PROXY_MONITOR_URL_PATTERN);
		
		reg.addInitParameter(Costanti.INIT_PARAMETER_PROXY_TO, this.webConsoleConfig.getUrlGovWayCatalogoMonitor());
		reg.addInitParameter(Costanti.INIT_PARAMETER_PREFIX, Costanti.PROXY_MONITOR_PREFIX);
		reg.addInitParameter(Costanti.INIT_PARAMETER_MAX_THREADS, Costanti.INIT_PARAMETER_MAX_THREADS_VALUE_15);
		
		reg.setLoadOnStartup(5);
		
		return reg;
	}
	
//	@Bean(name ="webConsoleConfig") 
//	public WebConsoleConfig webConsoleConfig() {
//		return new WebConsoleConfig();		  
//	}
	
//	@Bean
//    public FilterRegistrationBean<Filter> securityFilterChain(
//            @Qualifier(AbstractSecurityWebApplicationInitializer.DEFAULT_FILTER_NAME) Filter securityFilter) {
//        FilterRegistrationBean<Filter> registration = new FilterRegistrationBean<>(securityFilter);
//        registration.setOrder(10);
//        registration
//                .setName(AbstractSecurityWebApplicationInitializer.DEFAULT_FILTER_NAME);
//        return registration;
//    }
	
	@Bean
	public FilterRegistrationBean<ApiProxyFilter> jwtCheckerApiFilter(){
	    FilterRegistrationBean<ApiProxyFilter> registrationBean = new FilterRegistrationBean<>();
	       
	    registrationBean.addInitParameter(Costanti.URL_PREFIX, Costanti.PROXY_API_PREFIX);
	    registrationBean.setFilter(proxyFilterApi);
	    registrationBean.addUrlPatterns(Costanti.PROXY_API_URL_PATTERN);
	    registrationBean.setName(Costanti.PROXY_API_FILTER_NAME);
	    registrationBean.setOrder(11);
	        
	    return registrationBean;    
	}
	
	@Bean
	public FilterRegistrationBean<PdndProxyFilter> jwtCheckerPdndFilter(){
	    FilterRegistrationBean<PdndProxyFilter> registrationBean = new FilterRegistrationBean<>();
	        
	    registrationBean.addInitParameter(Costanti.URL_PREFIX, Costanti.PROXY_PDND_PREFIX);
	    registrationBean.setFilter(proxyFilterPdnd);
	    registrationBean.addUrlPatterns(Costanti.PROXY_PDND_URL_PATTERN);
	    registrationBean.setName(Costanti.PROXY_PDND_FILTER_NAME);
	    registrationBean.setOrder(12);
	        
	    return registrationBean;    
	}
	
	@Bean
	public FilterRegistrationBean<MonitorProxyFilter> jwtCheckerMonitorFilter(){
	    FilterRegistrationBean<MonitorProxyFilter> registrationBean = new FilterRegistrationBean<>();
	        
	    registrationBean.addInitParameter(Costanti.URL_PREFIX, Costanti.PROXY_MONITOR_PREFIX);
	    registrationBean.setFilter(proxyFilterMonitor);
	    registrationBean.addUrlPatterns(Costanti.PROXY_MONITOR_URL_PATTERN);
	    registrationBean.setName(Costanti.PROXY_MONITOR_FILTER_NAME);
	    registrationBean.setOrder(13);
	        
	    return registrationBean;    
	}
}
