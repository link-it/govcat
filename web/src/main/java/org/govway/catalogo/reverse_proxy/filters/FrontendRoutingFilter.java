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
package org.govway.catalogo.reverse_proxy.filters;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.net.MalformedURLException;
import java.util.List;
import java.util.regex.Pattern;

import org.govway.catalogo.reverse_proxy.costanti.Costanti;

/**
 * Rimanda all'applicazione Angular (index.jsp) le rotte del frontend aperte da indirizzo
 * diretto, da segnalibro o con F5.
 * <p>
 * Le rotte non sono elencate una per una: viene inoltrata ogni richiesta GET/HEAD che non sia
 * una risorsa statica (esistente o con estensione da file statico) e non sia un endpoint del
 * server (proxy verso le API, controller, servlet di errore, actuator), così che una nuova rotta
 * Angular non richieda di modificare il filtro.
 */
@WebFilter(urlPatterns = {"/*"})
public class FrontendRoutingFilter implements Filter {

    static final String FRONTEND_INDEX = "/index.jsp";

    private static final Pattern STATIC_RESOURCE = Pattern.compile(
            ".*\\.(js|css|ico|png|jpg|jpeg|gif|woff2?|ttf|eot|svg|json|map|html|jsp|txt|xml|pdf|webmanifest)$",
            Pattern.CASE_INSENSITIVE);

    /** Percorsi serviti dal server e non dall'applicazione Angular. */
    private static final List<String> SERVER_PATH_PREFIXES = List.of(
            Costanti.PROXY_API_PREFIX,
            Costanti.PROXY_PDND_PREFIX,
            Costanti.PROXY_MONITOR_PREFIX,
            "/assets",
            "/csp",
            "/actuator",
            "/error",
            "/code-grant-authorization");

    private ServletContext servletContext;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        this.servletContext = filterConfig.getServletContext();
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;

        if (shouldForwardToFrontend(req)) {
            request.getRequestDispatcher(FRONTEND_INDEX).forward(request, response);
        } else {
            chain.doFilter(request, response);
        }
    }

    boolean shouldForwardToFrontend(HttpServletRequest req) {
        String method = req.getMethod();
        if (!"GET".equals(method) && !"HEAD".equals(method)) {
            return false;
        }

        // Percorso già decodificato e normalizzato dal container
        String path = req.getServletPath() + (req.getPathInfo() != null ? req.getPathInfo() : "");

        if (path.isEmpty() || "/".equals(path)) {
            // Gestito dal welcome-file
            return false;
        }

        if (STATIC_RESOURCE.matcher(path).matches()) {
            // Una risorsa statica mancante deve restituire 404, non la pagina dell'applicazione
            return false;
        }

        if (isServerPath(path)) {
            return false;
        }

        return !isExistingResource(path);
    }

    private static boolean isServerPath(String path) {
        for (String prefix : SERVER_PATH_PREFIXES) {
            if (path.equals(prefix) || path.startsWith(prefix + "/")) {
                return true;
            }
        }
        return false;
    }

    private boolean isExistingResource(String path) {
        if (this.servletContext == null) {
            return false;
        }
        try {
            return this.servletContext.getResource(path) != null;
        } catch (MalformedURLException e) {
            return false;
        }
    }

    @Override
    public void destroy() {
        // No destruction required
    }
}
