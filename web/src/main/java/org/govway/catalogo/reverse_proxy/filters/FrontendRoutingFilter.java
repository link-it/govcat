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

import javax.servlet.*;
import javax.servlet.annotation.WebFilter;
import javax.servlet.http.HttpServletRequest;
import java.io.IOException;

@WebFilter(urlPatterns = {"/servizi/*", "/adesioni/*", "/gruppi/*", "/domini/*", "/soggetti/*", "/organizzazioni/*", "/client/*", "/utenti/*", "/classi-utente/*", "/pdnd/*", "/notifications/*", "/profile/*", "/dashboard/*"})
public class FrontendRoutingFilter implements Filter {

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        // No initialization required
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        String path = req.getRequestURI().substring(req.getContextPath().length());

        // Forward only non-static, non-servlet, non-API frontend routes to index.jsp
        if (shouldForwardToFrontend(path)) {
            RequestDispatcher dispatcher = request.getRequestDispatcher("/index.jsp");
            dispatcher.forward(request, response);
        } else {
            chain.doFilter(request, response);
        }
    }

    private boolean shouldForwardToFrontend(String path) {
        // Static resource extensions
        if (path.matches(".*\\.(js|css|ico|png|jpg|jpeg|gif|woff2?|ttf|eot|svg|json|map|html)$")) {
            return false;
        }

        // Backend endpoints - let them pass
        return !path.contains("/proxyServlet");
    }

    @Override
    public void destroy() {
        // No destruction required
    }
}
