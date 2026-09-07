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
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.gson.FieldNamingPolicy;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonSyntaxException;

import okhttp3.Credentials;
import okhttp3.FormBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.ResponseBody;

/**
 * Cache dei token negoziati con il flusso client credentials.
 *
 * Il token viene negoziato solo quando la cache non ne contiene uno ancora valido: mai a ogni
 * chiamata verso il sistema esterno. La cache vive qui e non nei client http perche' questi
 * ultimi non sono riutilizzati (monitoraggio, statistiche e cache eventi costruiscono un nuovo
 * client a ogni invocazione), quindi un token conservato nel client verrebbe perso subito.
 *
 * Una istanza va condivisa da tutte le integrazioni dello stesso processo: nel modulo api e' un
 * bean singleton, nel batch un campo del ConfigurazioneExecutor.
 *
 * La classe e' thread safe. La negoziazione e' serializzata per chiave di cache: alla scadenza
 * il primo thread rinegozia e gli altri riusano il token appena ottenuto, evitando la raffica di
 * richieste al token endpoint che si avrebbe con l'api multi thread e con il tick del batch.
 */
public class ClientCredentialsTokenStore {

	private static final Logger logger = LoggerFactory.getLogger(ClientCredentialsTokenStore.class);

	private static final String TOKEN_TYPE_DEFAULT = "Bearer";

	/**
	 * Durata attribuita al token quando il token endpoint non restituisce expires_in: il token
	 * resta in cache per un tempo prudenziale invece di essere rinegoziato a ogni chiamata.
	 */
	private static final long EXPIRES_IN_DEFAULT_SECONDI = 60L;

	private static final int CONNECT_TIMEOUT_SECONDI_DEFAULT = 10;
	private static final int READ_TIMEOUT_SECONDI_DEFAULT = 30;

	/**
	 * Per questo tempo dopo una negoziazione fallita le richieste successive sullo stesso profilo
	 * terminano subito con lo stesso errore, invece di accodarsi in attesa del lock: con un
	 * authorization server irraggiungibile l'attesa sarebbe quella del timeout, moltiplicata per
	 * il numero di richieste in corso.
	 */
	private static final long FALLIMENTO_RECENTE_MILLIS = 5000L;

	private final OkHttpClient client;
	private final Gson gson;

	private final Map<String, CachedToken> cache = new ConcurrentHashMap<>();
	private final Map<String, Object> locks = new ConcurrentHashMap<>();
	private final Map<String, Fallimento> fallimenti = new ConcurrentHashMap<>();

	/** Numero di negoziazioni effettuate, esposto per i test e per la diagnostica. */
	private final AtomicLong negoziazioni = new AtomicLong();

	public ClientCredentialsTokenStore() {
		this(CONNECT_TIMEOUT_SECONDI_DEFAULT, READ_TIMEOUT_SECONDI_DEFAULT);
	}

	public ClientCredentialsTokenStore(int connectTimeoutSecondi, int readTimeoutSecondi) {
		this.client = new OkHttpClient.Builder()
				.connectTimeout(connectTimeoutSecondi, TimeUnit.SECONDS)
				.readTimeout(readTimeoutSecondi, TimeUnit.SECONDS)
				.build();
		this.gson = new GsonBuilder()
				.setFieldNamingPolicy(FieldNamingPolicy.LOWER_CASE_WITH_UNDERSCORES)
				.create();
	}

	/**
	 * Valore dell'header Authorization da inviare al sistema esterno, con il token preso dalla
	 * cache se ancora valido.
	 *
	 * @param config profilo di autenticazione
	 * @return header completo, ad esempio <code>Bearer eyJ...</code>
	 * @throws IOException se la negoziazione fallisce
	 */
	public String getAuthorizationHeader(ClientCredentialsConfig config) throws IOException {
		CachedToken token = getToken(config);
		return token.tokenType + " " + token.accessToken;
	}

	/**
	 * Rimuove dalla cache il token del profilo: alla richiesta successiva viene rinegoziato.
	 * Usato quando il sistema esterno risponde 401, cioe' quando il token e' stato revocato
	 * prima della scadenza dichiarata.
	 *
	 * @param config profilo di autenticazione
	 */
	public void invalidate(ClientCredentialsConfig config) {
		if(config != null) {
			this.cache.remove(config.cacheKey());
		}
	}

	/**
	 * @return numero di negoziazioni effettuate da questa istanza
	 */
	public long getNumeroNegoziazioni() {
		return this.negoziazioni.get();
	}

	private CachedToken getToken(ClientCredentialsConfig config) throws IOException {
		String key = config.cacheKey();

		CachedToken cached = this.cache.get(key);

		if(cached != null && !cached.scaduto()) {
			return cached;
		}

		verificaFallimentoRecente(key);

		// la negoziazione di una stessa chiave e' serializzata: gli altri thread in attesa
		// trovano in cache il token appena negoziato e non ne richiedono uno nuovo
		Object lock = this.locks.computeIfAbsent(key, k -> new Object());

		synchronized(lock) {
			CachedToken ricontrollo = this.cache.get(key);

			if(ricontrollo != null && !ricontrollo.scaduto()) {
				return ricontrollo;
			}

			// un altro thread potrebbe aver appena fallito mentre si attendeva il lock
			verificaFallimentoRecente(key);

			try {
				CachedToken negoziato = negozia(config);
				this.cache.put(key, negoziato);
				this.fallimenti.remove(key);
				return negoziato;
			} catch(IOException e) {
				this.fallimenti.put(key, new Fallimento(e.getMessage()));
				throw e;
			}
		}
	}

	private void verificaFallimentoRecente(String key) throws IOException {
		Fallimento fallimento = this.fallimenti.get(key);

		if(fallimento == null) {
			return;
		}

		if(fallimento.scaduto()) {
			this.fallimenti.remove(key);
			return;
		}

		throw new IOException("negoziazione del token non ritentata: l'ultimo tentativo, meno di "
				+ (FALLIMENTO_RECENTE_MILLIS / 1000) + " secondi fa, e' fallito. " + fallimento.messaggio);
	}

	private CachedToken negozia(ClientCredentialsConfig config) throws IOException {
		FormBody.Builder form = new FormBody.Builder().add("grant_type", "client_credentials");

		if(config.getScope() != null) {
			form.add("scope", config.getScope());
		}

		if(config.getAudience() != null) {
			form.add("audience", config.getAudience());
		}

		Request.Builder builder = new Request.Builder().url(config.getTokenEndpoint());

		if(config.getClientAuthMethod() == ClientAuthMethod.CLIENT_SECRET_POST) {
			form.add("client_id", config.getClientId());
			form.add("client_secret", config.getClientSecret());
		} else {
			builder.header("Authorization", Credentials.basic(config.getClientId(), config.getClientSecret()));
		}

		// il content type application/x-www-form-urlencoded lo imposta FormBody
		RequestBody body = form.build();
		Request request = builder.post(body).build();

		logger.debug("negoziazione token client credentials: {}", config);

		TokenResponse tokenResponse;

		try(Response response = this.client.newCall(request).execute()) {
			String content = leggiBody(response);

			if(!response.isSuccessful()) {
				throw new IOException("negoziazione del token non riuscita per il " + config
						+ ": codice " + response.code() + ", risposta: " + descriviErrore(content));
			}

			tokenResponse = deserializza(config, content);
		}

		if(tokenResponse == null || tokenResponse.getAccessToken() == null || tokenResponse.getAccessToken().isBlank()) {
			throw new IOException("il token endpoint del " + config + " non ha restituito access_token");
		}

		long expiresIn = tokenResponse.getExpiresIn() == null || tokenResponse.getExpiresIn() <= 0
				? EXPIRES_IN_DEFAULT_SECONDI
				: tokenResponse.getExpiresIn();

		if(tokenResponse.getExpiresIn() == null || tokenResponse.getExpiresIn() <= 0) {
			logger.warn("il token endpoint del {} non ha restituito expires_in: il token viene conservato per {} secondi",
					config, EXPIRES_IN_DEFAULT_SECONDI);
		}

		long validitaMillis = (long) (expiresIn * config.getRefreshMargin() * 1000d);
		long scadenza = System.currentTimeMillis() + validitaMillis;

		this.negoziazioni.incrementAndGet();

		logger.info("token client credentials negoziato per il {}: valido {} secondi, rinegoziazione dopo {} secondi",
				config, expiresIn, validitaMillis / 1000);

		String tokenType = tokenResponse.getTokenType() == null || tokenResponse.getTokenType().isBlank()
				? TOKEN_TYPE_DEFAULT
				: tokenResponse.getTokenType().trim();

		return new CachedToken(tokenResponse.getAccessToken(), tokenType, scadenza);
	}

	private TokenResponse deserializza(ClientCredentialsConfig config, String content) throws IOException {
		try {
			return this.gson.fromJson(content, TokenResponse.class);
		} catch(JsonSyntaxException e) {
			throw new IOException("risposta del token endpoint del " + config + " non interpretabile come json", e);
		}
	}

	private static String leggiBody(Response response) throws IOException {
		ResponseBody body = response.body();
		return body == null ? "" : body.string();
	}

	/**
	 * Estrae error ed error_description senza riversare nei log l'intero corpo della risposta.
	 */
	private String descriviErrore(String content) {
		if(content == null || content.isBlank()) {
			return "nessun contenuto";
		}

		try {
			TokenResponse errore = this.gson.fromJson(content, TokenResponse.class);

			if(errore != null && errore.getError() != null) {
				return errore.getErrorDescription() == null
						? errore.getError()
						: errore.getError() + " (" + errore.getErrorDescription() + ")";
			}
		} catch(JsonSyntaxException e) {
			logger.debug("risposta di errore del token endpoint non interpretabile come json", e);
		}

		return content.length() > 200 ? content.substring(0, 200) + "..." : content;
	}

	/**
	 * Esito negativo di una negoziazione, conservato per il tempo necessario a non accodare le
	 * richieste successive sullo stesso profilo.
	 */
	private static class Fallimento {

		private final String messaggio;
		private final long scadenzaMillis;

		Fallimento(String messaggio) {
			this.messaggio = messaggio;
			this.scadenzaMillis = System.currentTimeMillis() + FALLIMENTO_RECENTE_MILLIS;
		}

		boolean scaduto() {
			return System.currentTimeMillis() >= this.scadenzaMillis;
		}
	}

	private static class CachedToken {

		private final String accessToken;
		private final String tokenType;
		private final long scadenzaMillis;

		CachedToken(String accessToken, String tokenType, long scadenzaMillis) {
			this.accessToken = accessToken;
			this.tokenType = tokenType;
			this.scadenzaMillis = scadenzaMillis;
		}

		boolean scaduto() {
			return System.currentTimeMillis() >= this.scadenzaMillis;
		}
	}
}
