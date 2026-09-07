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

/**
 * Nomi delle chiavi di un profilo di autenticazione e loro normalizzazione.
 *
 * Le chiavi si confrontano ignorando maiuscole, trattini e underscore: nel modulo api le
 * properties passano dal relaxed binding di spring, nel batch sono lette da un file
 * java.util.Properties, e <code>token-endpoint</code>, <code>token_endpoint</code> e
 * <code>tokenEndpoint</code> devono restare equivalenti.
 */
public final class OutboundAuthKeys {

	public static final String MODE = "mode";
	public static final String TOKEN_ENDPOINT = "token-endpoint";
	public static final String CLIENT_ID = "client-id";
	public static final String CLIENT_SECRET = "client-secret";
	public static final String SCOPE = "scope";
	public static final String AUDIENCE = "audience";
	public static final String CLIENT_AUTH = "client-auth";
	public static final String REFRESH_MARGIN = "refresh-margin";

	private OutboundAuthKeys() {
	}

	/**
	 * @param value chiave o valore da confrontare, eventualmente nullo
	 * @return il valore in minuscolo e privo di trattini e underscore, stringa vuota se nullo
	 */
	public static String normalizza(String value) {
		if(value == null) {
			return "";
		}

		return value.trim().toLowerCase().replace("-", "").replace("_", "");
	}
}
