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

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configurazione Spring MVC per l'applicazione GovCat.
 *
 * Registra gli interceptor necessari per la gestione delle richieste HTTP.
 *
 * Compatibile con Java 21 e Tomcat 11 (Jakarta EE 10+).
 */
@Configuration
@EnableScheduling
@EnableAsync
public class WebMvcConfig implements WebMvcConfigurer {

    @Autowired
    private ReadOnlyModeInterceptor readOnlyModeInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Registra l'interceptor per la modalità readonly su tutti i path
        registry.addInterceptor(readOnlyModeInterceptor)
                .addPathPatterns("/**");
    }
}
