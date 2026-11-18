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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.govway.catalogo.reverse_proxy.costanti.Costanti;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.core.io.FileSystemResourceLoader;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockFilterConfig;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockServletContext;

class FrontendRoutingFilterTest {

    private MockServletContext servletContext;
    private FrontendRoutingFilter filter;

    @BeforeEach
    void setUp() throws Exception {
        servletContext = new MockServletContext("src/main/webapp", new FileSystemResourceLoader());
        filter = new FrontendRoutingFilter();
        filter.init(new MockFilterConfig(servletContext));
    }

    private MockHttpServletResponse execute(String method, String path, MockFilterChain chain) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(servletContext, method, "/govcat-web" + path);
        request.setContextPath("/govcat-web");
        request.setServletPath(path);
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, chain);
        return response;
    }

    private void assertForwarded(String method, String path) throws Exception {
        MockFilterChain chain = new MockFilterChain();
        MockHttpServletResponse response = execute(method, path, chain);
        assertEquals(FrontendRoutingFilter.FRONTEND_INDEX, response.getForwardedUrl(), path);
        assertNull(chain.getRequest(), "la catena non deve proseguire per " + path);
    }

    private void assertPassedThrough(String method, String path) throws Exception {
        MockFilterChain chain = new MockFilterChain();
        MockHttpServletResponse response = execute(method, path, chain);
        assertNull(response.getForwardedUrl(), path);
        assertNotNull(chain.getRequest(), "la catena deve proseguire per " + path);
    }

    // Rotte di primo livello di app.routes.ts, comprese quelle non elencate dal vecchio filtro (Issue 460)
    @ParameterizedTest
    @ValueSource(strings = {
            "/organizzazione-manage/x", "/organizzazione-manage/x/utenti", "/servizi-generici", "/tassonomie",
            "/monitoraggio", "/monitoraggio/transazioni",
            "/servizi/x", "/adesioni/x", "/gruppi", "/domini", "/soggetti", "/organizzazioni", "/client",
            "/utenti", "/classi-utente", "/pdnd", "/notifications", "/profile", "/dashboard", "/auth/login",
            "/rotta-futura/123"})
    void rotteFrontendInoltrateAdIndex(String path) throws Exception {
        assertForwarded("GET", path);
    }

    @Test
    void headInoltrataAdIndex() throws Exception {
        assertForwarded("HEAD", "/tassonomie");
    }

    @ParameterizedTest
    @ValueSource(strings = {"POST", "PUT", "DELETE", "PATCH", "OPTIONS"})
    void metodiDiversiDaGetHeadNonInoltrati(String method) throws Exception {
        assertPassedThrough(method, "/tassonomie");
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "/main-ABC123.js", "/styles.css", "/favicon.ico", "/assets/images/logo.svg", "/assets/i18n/it.json",
            "/chunk-XYZ.js.map", "/media/roboto.woff2", "/servizi/mancante.png", "/INDEX.JSP", "/robots.txt"})
    void risorseStaticheNonInoltrate(String path) throws Exception {
        assertPassedThrough("GET", path);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            Costanti.PROXY_API_PREFIX, Costanti.PROXY_API_PREFIX + "/servizi",
            Costanti.PROXY_PDND_PREFIX + "/eservices", Costanti.PROXY_MONITOR_PREFIX + "/transazioni",
            "/assets/config/app-config", "/csp/allowed-origin", "/actuator/health", "/error",
            "/code-grant-authorization"})
    void endpointServerNonInoltrati(String path) throws Exception {
        assertPassedThrough("GET", path);
    }

    @ParameterizedTest
    @ValueSource(strings = {"/", "/includes", "/WEB-INF"})
    void radiceERisorseEsistentiNonInoltrate(String path) throws Exception {
        assertPassedThrough("GET", path);
    }

    @Test
    void prefissoServerSoloSuSegmentoIntero() throws Exception {
        // "/errori" non è "/error": è una rotta del frontend
        assertForwarded("GET", "/errori");
    }
}
