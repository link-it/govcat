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

/**
 * Modo in cui GovCat presenta le proprie credenziali al token endpoint.
 *
 * CLIENT_SECRET_BASIC (default) invia client_id e client_secret nell'header Authorization,
 * CLIENT_SECRET_POST li invia nel body della richiesta: gli authorization server in uso si
 * dividono tra le due modalita', quindi la scelta e' configurabile per profilo.
 */
public enum ClientAuthMethod {

	CLIENT_SECRET_BASIC,
	CLIENT_SECRET_POST;

	/**
	 * @param value valore della property <code>client-auth</code>, nullo per il default
	 * @return la modalita' corrispondente, CLIENT_SECRET_BASIC se il valore non e' valorizzato
	 * @throws IOException se il valore non corrisponde ad alcuna modalita'
	 */
	public static ClientAuthMethod parse(String value) throws IOException {
		if(value == null || value.isBlank()) {
			return CLIENT_SECRET_BASIC;
		}

		String normalizzato = OutboundAuthKeys.normalizza(value);

		for(ClientAuthMethod method: values()) {
			if(OutboundAuthKeys.normalizza(method.name()).equals(normalizzato)) {
				return method;
			}
		}

		throw new IOException("autenticazione del client verso il token endpoint non riconosciuta: '"
				+ value + "'. Valori ammessi: client_secret_basic, client_secret_post");
	}
}
