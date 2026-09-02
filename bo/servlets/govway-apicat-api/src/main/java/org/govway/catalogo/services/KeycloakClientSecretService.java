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
package org.govway.catalogo.services;

import java.io.IOException;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;
import java.util.TimeZone;

import jakarta.annotation.PostConstruct;

import org.govway.catalogo.core.orm.entity.AmbienteEnum;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import freemarker.template.Configuration;
import freemarker.template.TemplateExceptionHandler;
import keycloak.KeycloakInvoker;
import okhttp3.HttpUrl;

@Service
public class KeycloakClientSecretService {

	private static final Logger logger = LoggerFactory.getLogger(KeycloakClientSecretService.class);

	@Value("${org.govway.api.catalogo.keycloak.collaudo.url:#{null}}")
	private String keycloakCollaudoUrl;

	@Value("${org.govway.api.catalogo.keycloak.collaudo.username:#{null}}")
	private String keycloakCollaudoUsername;

	@Value("${org.govway.api.catalogo.keycloak.collaudo.password:#{null}}")
	private String keycloakCollaudoPassword;

	@Value("${org.govway.api.catalogo.keycloak.collaudo.realm:master}")
	private String keycloakCollaudoRealm;

	@Value("${org.govway.api.catalogo.keycloak.produzione.url:#{null}}")
	private String keycloakProduzioneUrl;

	@Value("${org.govway.api.catalogo.keycloak.produzione.username:#{null}}")
	private String keycloakProduzioneUsername;

	@Value("${org.govway.api.catalogo.keycloak.produzione.password:#{null}}")
	private String keycloakProduzionePassword;

	@Value("${org.govway.api.catalogo.keycloak.produzione.realm:master}")
	private String keycloakProduzioneRealm;

	@Autowired
	@Qualifier("keycloakCollaudoProperties")
	private Properties keycloakCollaudoProperties;

	@Autowired
	@Qualifier("keycloakProduzioneProperties")
	private Properties keycloakProduzioneProperties;

	private Map<AmbienteEnum, KeycloakInvoker> keycloakInvokers;

	@PostConstruct
	void init() throws IOException {
		Configuration cfg = new Configuration(Configuration.VERSION_2_3_29);
		cfg.setDefaultEncoding("UTF-8");
		cfg.setTemplateExceptionHandler(TemplateExceptionHandler.RETHROW_HANDLER);
		cfg.setLogTemplateExceptions(false);
		cfg.setWrapUncheckedExceptions(true);
		cfg.setFallbackOnNullLoopVariable(false);
		cfg.setSQLDateAndTimeTimeZone(TimeZone.getDefault());

		Map<AmbienteEnum, KeycloakInvoker> invokers = new EnumMap<>(AmbienteEnum.class);

		this.addInvoker(invokers, AmbienteEnum.COLLAUDO, this.keycloakCollaudoUrl, this.keycloakCollaudoUsername,
				this.keycloakCollaudoPassword, this.keycloakCollaudoRealm, this.keycloakCollaudoProperties, cfg);
		this.addInvoker(invokers, AmbienteEnum.PRODUZIONE, this.keycloakProduzioneUrl, this.keycloakProduzioneUsername,
				this.keycloakProduzionePassword, this.keycloakProduzioneRealm, this.keycloakProduzioneProperties, cfg);

		this.keycloakInvokers = invokers;
	}

	/**
	 * Keycloak e' configurato per ambiente (collaudo e produzione risiedono su istanze distinte).
	 * Un ambiente privo di url non viene configurato: la lettura del secret dei client di
	 * quell'ambiente termina con errore esplicito.
	 */
	private void addInvoker(Map<AmbienteEnum, KeycloakInvoker> invokers, AmbienteEnum ambiente, String url,
			String username, String password, String realm, Properties properties, Configuration cfg) throws IOException {
		if(url == null || url.isBlank()) {
			logger.info("KeycloakClientSecretService: keycloak non configurato per l'ambiente {}", ambiente);
			return;
		}

		invokers.put(ambiente, new KeycloakInvoker(
				HttpUrl.get(url),
				username,
				password,
				realm,
				toHeaders(properties),
				cfg));
		logger.info("KeycloakClientSecretService inizializzato per l'ambiente {} (realm={})", ambiente, realm);
	}

	/**
	 * Header aggiuntivi per l'autenticazione verso keycloak, in alternativa a username e password.
	 */
	private static Map<String, String> toHeaders(Properties properties) {
		Map<String, String> headers = new HashMap<>();

		if(properties != null) {
			for(String name: properties.stringPropertyNames()) {
				headers.put(name, properties.getProperty(name));
			}
		}

		return headers;
	}

	public String getSecret(String clientId, AmbienteEnum ambiente) throws IOException {
		if(ambiente == null) {
			throw new IOException("Ambiente del client non valorizzato, impossibile individuare keycloak");
		}

		KeycloakInvoker keycloakInvoker = this.keycloakInvokers.get(ambiente);

		if(keycloakInvoker == null) {
			throw new IOException("Keycloak non configurato per l'ambiente " + ambiente);
		}

		return keycloakInvoker.getSecret(clientId);
	}
}
