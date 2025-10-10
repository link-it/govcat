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

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Interceptor che blocca le operazioni di scrittura (POST, PUT, DELETE, PATCH)
 * quando l'applicazione è configurata in modalità readonly.
 *
 * La modalità può essere configurata tramite la property api.mode:
 * - full: tutte le operazioni sono permesse (default)
 * - readonly: solo le operazioni GET sono permesse
 */
@Component
public class ReadOnlyModeInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(ReadOnlyModeInterceptor.class);

    private static final String MODE_READONLY = "readonly";
//    private static final String MODE_FULL = "full";

    @Value("${api.mode:full}")
    private String apiMode;

    @Autowired
    RequestUtils requestUtils;
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {

    	
    	InfoProfilo infoProfilo = this.requestUtils.getPrincipal();
    	
    	String idUtente = (infoProfilo != null && infoProfilo.utente != null) ? infoProfilo.utente.getIdUtente() : "anonimo";
    	
        String method = request.getMethod();


        log.info("Operazione {} {} invocata dall'utente {}", method, request.getRequestURI(), idUtente);
        
        // Se siamo in modalità readonly, blocca tutte le operazioni tranne GET
        if (MODE_READONLY.equalsIgnoreCase(apiMode)) {
            if (!method.equalsIgnoreCase("GET") && !method.equalsIgnoreCase("HEAD") && !method.equalsIgnoreCase("OPTIONS")) {
                log.warn("Operazione {} bloccata su {} - API in modalità readonly", method, request.getRequestURI());
                response.setStatus(HttpServletResponse.SC_METHOD_NOT_ALLOWED);
                response.setContentType("application/json");
                response.getWriter().write(
                    String.format("{\"type\":\"about:blank\",\"title\":\"Method Not Allowed\"," +
                        "\"status\":405,\"detail\":\"Operazione %s non permessa in modalità readonly. " +
                        "Solo operazioni di lettura (GET) sono consentite.\"}", method)
                );
                return false;
            }
        }

        // In modalità full, tutte le operazioni sono permesse
        return true;
    }
}
