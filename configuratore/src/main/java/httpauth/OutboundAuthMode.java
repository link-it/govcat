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
 * Modalita' di autenticazione utilizzabili verso i sistemi esterni (govway, keycloak, pdnd).
 *
 * NONE e BASIC descrivono le modalita' storiche, ricavate dalle properties
 * <code>*.username</code> e <code>*.password</code> di ogni integrazione. Nei profili
 * di autenticazione (<code>outbound.auth.&lt;nome&gt;.*</code>) sono ammesse solo
 * OAUTH_CLIENT_CREDENTIALS (default) e NONE, che disattiva un profilo senza cancellarlo.
 */
public enum OutboundAuthMode {

	NONE,
	BASIC,
	OAUTH_CLIENT_CREDENTIALS;

	/**
	 * @param value valore della property <code>mode</code>, con o senza underscore
	 * @return la modalita' corrispondente
	 * @throws IOException se il valore non corrisponde ad alcuna modalita'
	 */
	public static OutboundAuthMode parse(String value) throws IOException {
		String normalizzato = OutboundAuthKeys.normalizza(value);

		for(OutboundAuthMode mode: values()) {
			if(OutboundAuthKeys.normalizza(mode.name()).equals(normalizzato)) {
				return mode;
			}
		}

		throw new IOException("modalita' di autenticazione non riconosciuta: '" + value
				+ "'. Valori ammessi nei profili: oauth_client_credentials, none");
	}
}
