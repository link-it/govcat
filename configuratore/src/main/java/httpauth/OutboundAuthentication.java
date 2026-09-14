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

import okhttp3.Credentials;
import okhttp3.Interceptor;

/**
 * Autenticazione con cui GovCat si presenta a un sistema esterno.
 *
 * Le tre modalita' sono alternative tra loro e vengono risolte dalla configurazione
 * dall'{@link OutboundAuthRegistry}: in assenza di un profilo di autenticazione si ottiene la
 * modalita' storica, cioe' basic con le credenziali dell'integrazione, o nessuna autenticazione
 * se quelle credenziali non sono valorizzate.
 *
 * Gli header custom configurati sulle singole integrazioni restano prevalenti: non passano da
 * qui e vengono applicati dopo, come gia' avviene oggi.
 */
public class OutboundAuthentication {

	private static final OutboundAuthentication NONE = new OutboundAuthentication(OutboundAuthMode.NONE, null, null, null, null);

	private final OutboundAuthMode mode;
	private final String basicUsername;
	private final String basicPassword;
	private final ClientCredentialsTokenStore tokenStore;
	private final ClientCredentialsConfig clientCredentialsConfig;

	private OutboundAuthentication(OutboundAuthMode mode, String basicUsername, String basicPassword,
			ClientCredentialsTokenStore tokenStore, ClientCredentialsConfig clientCredentialsConfig) {
		this.mode = mode;
		this.basicUsername = basicUsername;
		this.basicPassword = basicPassword;
		this.tokenStore = tokenStore;
		this.clientCredentialsConfig = clientCredentialsConfig;
	}

	/**
	 * @return nessuna autenticazione applicata dal chiamante
	 */
	public static OutboundAuthentication none() {
		return NONE;
	}

	/**
	 * @return autenticazione basic, oppure {@link #none()} se username o password non sono
	 *         valorizzati, come da comportamento storico delle integrazioni
	 */
	public static OutboundAuthentication basic(String username, String password) {
		if(username == null || username.isEmpty() || password == null || password.isEmpty()) {
			return NONE;
		}

		return new OutboundAuthentication(OutboundAuthMode.BASIC, username, password, null, null);
	}

	/**
	 * @param tokenStore cache condivisa dei token, non nulla
	 * @param config profilo di autenticazione, non nullo
	 * @return autenticazione con token negoziato e mantenuto in cache dal tokenStore
	 */
	public static OutboundAuthentication clientCredentials(ClientCredentialsTokenStore tokenStore,
			ClientCredentialsConfig config) {
		return new OutboundAuthentication(OutboundAuthMode.OAUTH_CLIENT_CREDENTIALS, null, null, tokenStore, config);
	}

	public OutboundAuthMode getMode() {
		return this.mode;
	}

	public boolean isOauthClientCredentials() {
		return this.mode == OutboundAuthMode.OAUTH_CLIENT_CREDENTIALS;
	}

	/**
	 * @return username da usare per il basic, vuoto nelle altre modalita'
	 */
	public Optional<String> getBasicUsername() {
		return Optional.ofNullable(this.mode == OutboundAuthMode.BASIC ? this.basicUsername : null);
	}

	/**
	 * @return password da usare per il basic, vuota nelle altre modalita'
	 */
	public Optional<String> getBasicPassword() {
		return Optional.ofNullable(this.mode == OutboundAuthMode.BASIC ? this.basicPassword : null);
	}

	/**
	 * Valore dell'header Authorization. Per il client credentials il token arriva dalla cache e
	 * viene negoziato solo se scaduto.
	 *
	 * @return header da inviare, vuoto se non e' prevista alcuna autenticazione
	 * @throws IOException se la negoziazione del token non riesce
	 */
	public Optional<String> getAuthorizationHeader() throws IOException {
		switch(this.mode) {
		case BASIC:
			return Optional.of(Credentials.basic(this.basicUsername, this.basicPassword));
		case OAUTH_CLIENT_CREDENTIALS:
			return Optional.of(this.tokenStore.getAuthorizationHeader(this.clientCredentialsConfig));
		case NONE:
		default:
			return Optional.empty();
		}
	}

	/**
	 * Scarta il token in cache: la richiesta successiva ne negozia uno nuovo. Nessun effetto
	 * nelle modalita' diverse dal client credentials.
	 */
	public void invalidate() {
		if(this.isOauthClientCredentials()) {
			this.tokenStore.invalidate(this.clientCredentialsConfig);
		}
	}

	/**
	 * @return interceptor da aggiungere al client okhttp, vuoto se l'autenticazione non richiede
	 *         un token negoziato (per il basic i client generati usano gia' l'header di default)
	 */
	public Optional<Interceptor> interceptor() {
		return this.isOauthClientCredentials()
				? Optional.of(new BearerAuthInterceptor(this))
				: Optional.empty();
	}

	@Override
	public String toString() {
		return this.isOauthClientCredentials()
				? this.mode + " " + this.clientCredentialsConfig
				: this.mode.toString();
	}
}
