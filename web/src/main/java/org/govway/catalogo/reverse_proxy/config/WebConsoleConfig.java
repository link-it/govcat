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
package org.govway.catalogo.reverse_proxy.config;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;

import jakarta.annotation.PostConstruct;

import org.govway.catalogo.reverse_proxy.security.AuthorizationInfo;
import org.govway.catalogo.reverse_proxy.whitelist.Whitelist;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

@Configuration
@PropertySource("classpath:govcat-web.properties" )
@PropertySource(value = {"file:${org.govway.catalogo.resource.path:/var/govcat/conf/govcat-web.properties}" }, ignoreResourceNotFound  = true )
public class WebConsoleConfig {
	
	private static Logger log = LoggerFactory.getLogger(WebConsoleConfig.class);
	
	@Value("${org.govway.catalogo.resource.path}")
	private String resourcePath;
	
	@Value("${org.govway.catalogo.api.url}")
	private String urlGovWayCatalogoAPI;
	
	@Value("${org.govway.catalogo.pdnd.url}")
	private String urlGovWayCatalogoPdnd;
	
	@Value("${org.govway.catalogo.monitor.url}")
	private String urlGovWayCatalogoMonitor;
	
	@Value("${org.govway.catalogo.api.headerAuthentication}")
	private String headerAuthenticationGovWayCatalogoAPI;
	
	@Value("${org.govway.catalogo.api.headerAuthentication.autorizzaRichiesteAnonime.enabled:false}")
	private Boolean headerAuthenticationAutorizzaRichiesteAnonimeGovWayCatalogoAPI;
	
	@Value("${org.govway.catalogo.api.header.username}")
	private String nomeHeaderUsernameGovWayCatalogoAPI;
	
	@Value("${org.govway.catalogo.api.header.email}")
	private String nomeHeaderEmailGovWayCatalogoAPI;
	
	@Value("${org.govway.catalogo.api.header.first_name}")
	private String nomeHeaderFirstNameGovWayCatalogoAPI;
	
	@Value("${org.govway.catalogo.api.header.last_name}")
	private String nomeHeaderLastNameGovWayCatalogoAPI;
	
	@Value("${org.govway.catalogo.api.header.cf}")
	private String nomeHeaderCfGovWayCatalogoAPI;
	
	@Value("${org.govway.catalogo.api.header.ruoli}")
	private String nomeHeaderRuoliGovWayCatalogoAPI;
	
	@Value("${org.govway.catalogo.api.header.sede}")
	private String nomeHeaderSedeGovWayCatalogoAPI;
	
	@Value("${org.govway.catalogo.api.header.matricola}")
	private String nomeHeaderMatricolaGovWayCatalogoAPI;
	
	@Value("${org.govway.catalogo.api.header.organization}")
	private String nomeHeaderOrganizationGovWayCatalogoAPI;
	
	@Value("${org.govway.catalogo.api.header.classi}")
	private String nomeHeaderClassiGovWayCatalogoAPI;
	
	@Value("${org.govway.catalogo.api.header.organization.value.default}")
	private String valoreDefaultHeaderOrganizationGovWayCatalogoAPI;
	
	@Value("${org.govway.catalogo.api.header.classi.value.default}")
	private String valoreDefaultHeaderClassiGovWayCatalogoAPI;
	
	@Value("${org.govway.catalogo.api.header.classi.value.pattern}")
	private String patternHeaderClassiGovWayCatalogoAPI;
	
	@Value("${org.govway.catalogo.authenticator.className}")
	private String authenticatorClassName;
	
	@Value("${org.govway.catalogo.restituisciErroreSeTrovoHeaderAutenticazione:true}")
	private Boolean restituisciErroreSeTrovoHeaderAutenticazione;
	
	@Autowired
	Whitelist withelist;
	
	private AuthorizationInfo authorizationInfo;
	
	@PostConstruct
	public void init() throws InstantiationException, IllegalAccessException, ClassNotFoundException, NoSuchMethodException, SecurityException, IllegalArgumentException, InvocationTargetException {
		this.logProperties();
		
		// caricamento handler autorizzazione
        Class<?> classe = Class.forName(this.authenticatorClassName);
        
        Constructor<?> costruttore = classe.getDeclaredConstructor();

        // Istanzia l'oggetto della classe
        this.authorizationInfo = (AuthorizationInfo) costruttore.newInstance();
        
        this.authorizationInfo.setConfig(this);
		
	}

	public String getUrlGovWayCatalogoAPI() {
		return urlGovWayCatalogoAPI;
	}
	
	public String getUrlGovWayCatalogoPdnd() {
		return urlGovWayCatalogoPdnd;
	}
	
	public String getUrlGovWayCatalogoMonitor() {
		return urlGovWayCatalogoMonitor;
	}

	public String getHeaderAuthenticationGovWayCatalogoAPI() {
		return headerAuthenticationGovWayCatalogoAPI;
	}
	
	public boolean isHeaderAuthenticationAutorizzaRichiesteAnonimeGovWayCatalogoAPI() {
		return headerAuthenticationAutorizzaRichiesteAnonimeGovWayCatalogoAPI != null ? headerAuthenticationAutorizzaRichiesteAnonimeGovWayCatalogoAPI : false;
	}
	
	public String getNomeHeaderCfGovWayCatalogoAPI() {
		return nomeHeaderCfGovWayCatalogoAPI;
	}
	
	public String getNomeHeaderEmailGovWayCatalogoAPI() {
		return nomeHeaderEmailGovWayCatalogoAPI;
	}
	
	public String getNomeHeaderFirstNameGovWayCatalogoAPI() {
		return nomeHeaderFirstNameGovWayCatalogoAPI;
	}
	
	public String getNomeHeaderLastNameGovWayCatalogoAPI() {
		return nomeHeaderLastNameGovWayCatalogoAPI;
	}
	
	public String getNomeHeaderUsernameGovWayCatalogoAPI() {
		return nomeHeaderUsernameGovWayCatalogoAPI;
	}
	
	public String getNomeHeaderSedeGovWayCatalogoAPI() {
		return nomeHeaderSedeGovWayCatalogoAPI;
	}
	
	public String getNomeHeaderMatricolaGovWayCatalogoAPI() {
		return nomeHeaderMatricolaGovWayCatalogoAPI;
	}
	
	public String getNomeHeaderRuoliGovWayCatalogoAPI() {
		return nomeHeaderRuoliGovWayCatalogoAPI;
	}
	
	public String getNomeHeaderOrganizationGovWayCatalogoAPI() {
		return nomeHeaderOrganizationGovWayCatalogoAPI;
	}
	
	public String getNomeHeaderClassiGovWayCatalogoAPI() {
		return nomeHeaderClassiGovWayCatalogoAPI;
	}
	
	public String getValoreDefaultHeaderOrganizationGovWayCatalogoAPI() {
		return valoreDefaultHeaderOrganizationGovWayCatalogoAPI;
	}
	
	public String getValoreDefaultHeaderClassiGovWayCatalogoAPI() {
		return valoreDefaultHeaderClassiGovWayCatalogoAPI;
	}
	
	public String getPatternHeaderClassiGovWayCatalogoAPI() {
		return patternHeaderClassiGovWayCatalogoAPI;
	}
	
	public Boolean getRestituisciErroreSeTrovoHeaderAutenticazione() {
		return restituisciErroreSeTrovoHeaderAutenticazione;
	}
	
	public Whitelist getWhitelist() {
		return withelist;
	}
	
	public AuthorizationInfo getAuthorizationInfo() {
		return authorizationInfo;
	}
	
	public void logProperties() {
		log.info(" ****** Configurazione ******* ");
		
		log.info("org.govway.catalogo.resource.path: [{}]", resourcePath);
		log.info("org.govway.catalogo.authenticator.className: [{}]", authenticatorClassName);
		log.info("org.govway.catalogo.api.url: [{}]", urlGovWayCatalogoAPI);
		log.info("org.govway.catalogo.pdnd.url: [{}]", urlGovWayCatalogoPdnd);
		log.info("org.govway.catalogo.monitor.url: [{}]", urlGovWayCatalogoMonitor);
		log.info("org.govway.catalogo.restituisciErroreSeTrovoHeaderAutenticazione: [{}]", restituisciErroreSeTrovoHeaderAutenticazione);
		log.info("org.govway.catalogo.api.headerAuthentication: [{}]", headerAuthenticationGovWayCatalogoAPI);
		log.info("org.govway.catalogo.api.headerAuthentication.autorizzaRichiesteAnonime.enabled: [{}]", headerAuthenticationAutorizzaRichiesteAnonimeGovWayCatalogoAPI);
		log.info("org.govway.catalogo.api.header.username: [{}]", nomeHeaderUsernameGovWayCatalogoAPI);
		log.info("org.govway.catalogo.api.header.email: [{}]", nomeHeaderEmailGovWayCatalogoAPI);
		log.info("org.govway.catalogo.api.header.first_name: [{}]", nomeHeaderFirstNameGovWayCatalogoAPI);
		log.info("org.govway.catalogo.api.header.last_name: [{}]", nomeHeaderLastNameGovWayCatalogoAPI);
		log.info("org.govway.catalogo.api.header.cf: [{}]", nomeHeaderCfGovWayCatalogoAPI);
		log.info("org.govway.catalogo.api.header.ruoli: [{}]", nomeHeaderRuoliGovWayCatalogoAPI);
		log.info("org.govway.catalogo.api.header.sede: [{}]", nomeHeaderSedeGovWayCatalogoAPI);
		log.info("org.govway.catalogo.api.header.matricola: [{}]", nomeHeaderMatricolaGovWayCatalogoAPI);
		log.info("org.govway.catalogo.api.header.organization: [{}]", nomeHeaderOrganizationGovWayCatalogoAPI);
		log.info("org.govway.catalogo.api.header.classi: [{}]", nomeHeaderClassiGovWayCatalogoAPI);
		log.info("org.govway.catalogo.api.header.organization.value.default: [{}]", valoreDefaultHeaderOrganizationGovWayCatalogoAPI);
		log.info("org.govway.catalogo.api.header.classi.value.default: [{}]", valoreDefaultHeaderClassiGovWayCatalogoAPI);
		log.info("org.govway.catalogo.api.header.classi.value.pattern: [{}]", patternHeaderClassiGovWayCatalogoAPI);

		log.info(" ****** Fine Configurazione ******* ");
	}
	
}
