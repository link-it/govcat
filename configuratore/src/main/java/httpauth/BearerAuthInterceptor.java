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
package httpauth;

import java.io.IOException;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Response;

/**
 * Aggiunge alle richieste okhttp l'header Authorization con il token negoziato.
 *
 * Il token arriva dalla cache dell'{@link OutboundAuthentication}, quindi non viene negoziato a
 * ogni richiesta. Se il sistema esterno risponde 401 il token viene scartato e la richiesta
 * ritentata una sola volta: e' il caso del token revocato prima della scadenza dichiarata.
 *
 * Un header Authorization gia' presente sulla richiesta viene lasciato intatto: gli header
 * custom configurati sulle integrazioni mantengono la precedenza che hanno oggi.
 */
public class BearerAuthInterceptor implements Interceptor {

	private static final String HEADER_AUTHORIZATION = "Authorization";

	private static final Logger logger = LoggerFactory.getLogger(BearerAuthInterceptor.class);

	private final OutboundAuthentication authentication;

	public BearerAuthInterceptor(OutboundAuthentication authentication) {
		this.authentication = authentication;
	}

	@Override
	public Response intercept(Chain chain) throws IOException {
		Request request = chain.request();

		if(request.header(HEADER_AUTHORIZATION) != null) {
			return chain.proceed(request);
		}

		Optional<String> authorization = this.authentication.getAuthorizationHeader();

		if(authorization.isEmpty()) {
			return chain.proceed(request);
		}

		Response response = chain.proceed(autentica(request, authorization.get()));

		if(response.code() != 401) {
			return response;
		}

		this.authentication.invalidate();

		Optional<String> rinegoziato = this.authentication.getAuthorizationHeader();

		if(rinegoziato.isEmpty() || rinegoziato.get().equals(authorization.get())) {
			return response;
		}

		logger.info("ricevuto 401 da {}: token rinegoziato e richiesta ritentata", request.url().redact());
		response.close();

		return chain.proceed(autentica(request, rinegoziato.get()));
	}

	private static Request autentica(Request request, String authorization) {
		return request.newBuilder().header(HEADER_AUTHORIZATION, authorization).build();
	}
}
