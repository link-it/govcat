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
 * Parametri di un profilo di autenticazione client credentials, immutabili dopo la lettura
 * delle properties.
 */
public class ClientCredentialsConfig {

	/** Frazione di expires_in oltre la quale il token viene rinegoziato. */
	public static final double REFRESH_MARGIN_DEFAULT = 0.9d;

	private final String nome;
	private final String tokenEndpoint;
	private final String clientId;
	private final String clientSecret;
	private final String scope;
	private final String audience;
	private final ClientAuthMethod clientAuthMethod;
	private final double refreshMargin;

	/**
	 * @param nome nome del profilo, usato solo nei log e nei messaggi di errore
	 * @param scope null se il token endpoint non richiede scope
	 * @param audience null se il token endpoint non richiede audience
	 * @param clientAuthMethod null per CLIENT_SECRET_BASIC
	 * @param refreshMargin null per {@link #REFRESH_MARGIN_DEFAULT}
	 * @throws IOException se un parametro obbligatorio non e' valorizzato o il margine non e' valido
	 */
	public ClientCredentialsConfig(String nome, String tokenEndpoint, String clientId, String clientSecret,
			String scope, String audience, ClientAuthMethod clientAuthMethod, Double refreshMargin) throws IOException {

		this.nome = nome;
		this.tokenEndpoint = richiedi(nome, OutboundAuthKeys.TOKEN_ENDPOINT, tokenEndpoint);
		this.clientId = richiedi(nome, OutboundAuthKeys.CLIENT_ID, clientId);
		this.clientSecret = richiedi(nome, OutboundAuthKeys.CLIENT_SECRET, clientSecret);
		this.scope = vuotoComeNull(scope);
		this.audience = vuotoComeNull(audience);
		this.clientAuthMethod = clientAuthMethod == null ? ClientAuthMethod.CLIENT_SECRET_BASIC : clientAuthMethod;
		this.refreshMargin = refreshMargin == null ? REFRESH_MARGIN_DEFAULT : refreshMargin;

		if(this.refreshMargin <= 0d || this.refreshMargin > 1d) {
			throw new IOException("profilo di autenticazione '" + nome + "': " + OutboundAuthKeys.REFRESH_MARGIN
					+ " deve essere maggiore di 0 e minore o uguale a 1, trovato " + this.refreshMargin);
		}
	}

	private static String richiedi(String nome, String chiave, String valore) throws IOException {
		if(valore == null || valore.isBlank()) {
			throw new IOException("profilo di autenticazione '" + nome + "': " + chiave + " non valorizzato");
		}

		return valore.trim();
	}

	private static String vuotoComeNull(String valore) {
		return valore == null || valore.isBlank() ? null : valore.trim();
	}

	/**
	 * Chiave di cache del token negoziato. Due integrazioni configurate con lo stesso token
	 * endpoint e le stesse credenziali condividono un unico token: e' il caso di
	 * monitoraggio, statistiche e allarmi, che puntano alla medesima installazione govway.
	 *
	 * @return chiave di cache, non contiene il client secret
	 */
	public String cacheKey() {
		return this.tokenEndpoint + "|" + this.clientId + "|"
				+ (this.scope == null ? "" : this.scope) + "|"
				+ (this.audience == null ? "" : this.audience) + "|"
				+ this.clientAuthMethod;
	}

	public String getNome() {
		return this.nome;
	}

	public String getTokenEndpoint() {
		return this.tokenEndpoint;
	}

	public String getClientId() {
		return this.clientId;
	}

	public String getClientSecret() {
		return this.clientSecret;
	}

	public String getScope() {
		return this.scope;
	}

	public String getAudience() {
		return this.audience;
	}

	public ClientAuthMethod getClientAuthMethod() {
		return this.clientAuthMethod;
	}

	public double getRefreshMargin() {
		return this.refreshMargin;
	}

	/**
	 * @return descrizione priva di credenziali, utilizzabile nei log
	 */
	@Override
	public String toString() {
		return "profilo[" + this.nome + "] token_endpoint[" + this.tokenEndpoint + "] client_id["
				+ this.clientId + "] client_auth[" + this.clientAuthMethod + "]";
	}
}
