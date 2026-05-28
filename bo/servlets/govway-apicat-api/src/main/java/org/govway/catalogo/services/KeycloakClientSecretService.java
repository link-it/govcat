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
import java.util.TimeZone;

import jakarta.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import freemarker.template.Configuration;
import freemarker.template.TemplateExceptionHandler;
import keycloak.KeycloakInvoker;
import okhttp3.HttpUrl;

@Service
public class KeycloakClientSecretService {

	private static final Logger logger = LoggerFactory.getLogger(KeycloakClientSecretService.class);

	@Value("${org.govway.api.catalogo.keycloak.url:http://127.0.0.1:9083/auth}")
	private String keycloakUrl;

	@Value("${org.govway.api.catalogo.keycloak.username:admin}")
	private String keycloakUsername;

	@Value("${org.govway.api.catalogo.keycloak.password:admin}")
	private String keycloakPassword;

	@Value("${org.govway.api.catalogo.keycloak.realm:master}")
	private String keycloakRealm;

	private KeycloakInvoker keycloakInvoker;

	@PostConstruct
	void init() throws IOException {
		Configuration cfg = new Configuration(Configuration.VERSION_2_3_29);
		cfg.setDefaultEncoding("UTF-8");
		cfg.setTemplateExceptionHandler(TemplateExceptionHandler.RETHROW_HANDLER);
		cfg.setLogTemplateExceptions(false);
		cfg.setWrapUncheckedExceptions(true);
		cfg.setFallbackOnNullLoopVariable(false);
		cfg.setSQLDateAndTimeTimeZone(TimeZone.getDefault());

		this.keycloakInvoker = new KeycloakInvoker(
				HttpUrl.get(this.keycloakUrl),
				this.keycloakUsername,
				this.keycloakPassword,
				this.keycloakRealm,
				cfg);
		logger.info("KeycloakClientSecretService inizializzato (realm={})", this.keycloakRealm);
	}

	public String getSecret(String clientId) throws IOException {
		return this.keycloakInvoker.getSecret(clientId);
	}
}
