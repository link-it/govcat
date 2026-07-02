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

import java.io.File;
import java.util.Collections;

import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * Esternalizza la configurazione di logging: se il file log4j2 esterno esiste, imposta
 * {@code logging.config} a quel file PRIMA che Spring Boot inizializzi il logging system,
 * cosi' da poter modificare livelli/appender/pattern senza ricostruire la WAR.
 *
 * Il path e' configurabile tramite la system property {@value #PATH_PROPERTY}
 * (default {@value #DEFAULT_PATH}). Se il file non esiste non viene apportata alcuna
 * modifica: vale quindi il comportamento odierno (config dentro la WAR, classpath:/log4j2.xml).
 *
 * Un eventuale {@code -Dlogging.config} esplicito impostato dall'operatore viene rispettato.
 */
public class ExternalLog4j2EnvironmentPostProcessor implements EnvironmentPostProcessor {

	static final String PATH_PROPERTY = "org.govway.api.catalogo.batch.log4j2.path";
	static final String DEFAULT_PATH = "/var/govcat/conf/govcat-batch-log4j2.xml";

	private static final String LOGGING_CONFIG_PROPERTY = "logging.config";
	private static final String PROPERTY_SOURCE_NAME = "govcatExternalLog4j2Config";

	@Override
	public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
		// Se l'operatore ha forzato esplicitamente -Dlogging.config, lo rispettiamo e non interveniamo.
		if (System.getProperty(LOGGING_CONFIG_PROPERTY) != null) {
			return;
		}

		String externalPath = environment.getProperty(PATH_PROPERTY, DEFAULT_PATH);
		File externalFile = new File(externalPath);
		if (externalFile.isFile()) {
			MapPropertySource source = new MapPropertySource(PROPERTY_SOURCE_NAME,
					Collections.singletonMap(LOGGING_CONFIG_PROPERTY, "file:" + externalFile.getAbsolutePath()));
			environment.getPropertySources().addFirst(source);
		}
		// else: nessuna modifica -> fallback a classpath:/log4j2.xml (comportamento odierno)
	}

}
