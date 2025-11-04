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
package org.govway.catalogo.reverse_proxy.servlets;

import jakarta.servlet.annotation.WebServlet;

import org.eclipse.jetty.client.HttpClient;
import org.eclipse.jetty.client.http.HttpClientTransportOverHTTP;
import org.eclipse.jetty.io.ClientConnector;
import org.eclipse.jetty.util.ProcessorUtils;
import org.eclipse.jetty.util.ssl.SslContextFactory;

@WebServlet("${org.govway.catalogo.servlet.api.path}")
public class ProxyServletApi extends org.eclipse.jetty.proxy.ProxyServlet.Transparent {
	
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	
	public static final String PROXY_API_PREFIX = "${org.govway.catalogo.servlet.api.path}";
	
	
	@Override
	protected HttpClient newHttpClient() {
		{
	        int selectors = Math.max(1, ProcessorUtils.availableProcessors() / 2);
	        String value = getServletConfig().getInitParameter("selectors");
	        if (value != null)
	            selectors = Integer.parseInt(value);

            // TLS config (Jetty 11): create SSL context factory and configure via ClientConnector
            SslContextFactory.Client ssl = new SslContextFactory.Client();
            ssl.setTrustAll(true);
            ssl.setEndpointIdentificationAlgorithm(null);

            ClientConnector clientConnector = new ClientConnector();
            clientConnector.setSslContextFactory(ssl);
            clientConnector.setSelectors(selectors);

            HttpClient client = new HttpClient(new HttpClientTransportOverHTTP(clientConnector));

            return client;
	    }
	}
}

