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
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Profili di autenticazione dichiarati nelle properties e risoluzione dei riferimenti.
 *
 * Un profilo raccoglie i parametri del flusso client credentials sotto un nome:
 *
 * <pre>
 * outbound.auth.govway-collaudo.token-endpoint=https://sso.ente.it/realms/govway/protocol/openid-connect/token
 * outbound.auth.govway-collaudo.client-id=govcat
 * outbound.auth.govway-collaudo.client-secret=...
 * </pre>
 *
 * Le integrazioni lo referenziano per nome, cosi' il segreto resta in un solo punto anche quando
 * piu' integrazioni parlano con lo stesso sistema:
 *
 * <pre>
 * monitor.collaudo.authn.ref=govway-collaudo
 * statistiche.collaudo.authn.ref=govway-collaudo
 * </pre>
 *
 * Il nome del profilo non puo' contenere punti. Le chiavi ammesse sono quelle di
 * {@link OutboundAuthKeys} e si confrontano ignorando maiuscole, trattini e underscore.
 */
public class OutboundAuthRegistry {

	private static final Logger logger = LoggerFactory.getLogger(OutboundAuthRegistry.class);

	private final Map<String, ClientCredentialsConfig> profili;
	private final Map<String, OutboundAuthMode> modi;
	private final ClientCredentialsTokenStore tokenStore;

	/**
	 * @param properties properties in cui cercare i profili, eventualmente nulle
	 * @param prefix prefisso delle chiavi dei profili, stringa vuota se le properties sono gia'
	 *        limitate al prefisso (come avviene con ConfigurationProperties nel modulo api)
	 * @param tokenStore cache condivisa dei token
	 * @throws IOException se un profilo e' incompleto o contiene valori non validi
	 */
	public OutboundAuthRegistry(Properties properties, String prefix, ClientCredentialsTokenStore tokenStore)
			throws IOException {
		this.tokenStore = tokenStore;
		this.modi = new HashMap<>();
		this.profili = new HashMap<>();

		Map<String, Map<String, String>> raccolte = raccogli(properties, prefix == null ? "" : prefix);

		for(Map.Entry<String, Map<String, String>> entry: raccolte.entrySet()) {
			String nome = entry.getKey();
			Map<String, String> valori = entry.getValue();

			OutboundAuthMode mode = valori.containsKey(OutboundAuthKeys.MODE)
					? OutboundAuthMode.parse(valori.get(OutboundAuthKeys.MODE))
					: OutboundAuthMode.OAUTH_CLIENT_CREDENTIALS;

			this.modi.put(nome, mode);

			if(mode != OutboundAuthMode.OAUTH_CLIENT_CREDENTIALS) {
				logger.info("profilo di autenticazione '{}' disattivato (mode={}): le integrazioni che lo"
						+ " referenziano usano le credenziali configurate sull'integrazione", nome, mode);
				continue;
			}

			ClientCredentialsConfig config = new ClientCredentialsConfig(
					nome,
					valori.get(OutboundAuthKeys.TOKEN_ENDPOINT),
					valori.get(OutboundAuthKeys.CLIENT_ID),
					valori.get(OutboundAuthKeys.CLIENT_SECRET),
					valori.get(OutboundAuthKeys.SCOPE),
					valori.get(OutboundAuthKeys.AUDIENCE),
					ClientAuthMethod.parse(valori.get(OutboundAuthKeys.CLIENT_AUTH)),
					refreshMargin(nome, valori.get(OutboundAuthKeys.REFRESH_MARGIN)));

			this.profili.put(nome, config);
			logger.info("profilo di autenticazione client credentials configurato: {}", config);
		}
	}

	/**
	 * Autenticazione da usare per una integrazione.
	 *
	 * @param ref nome del profilo referenziato, nullo o vuoto se l'integrazione non ne referenzia
	 *        alcuno
	 * @param username credenziale storica dell'integrazione, usata quando non c'e' un profilo
	 * @param password credenziale storica dell'integrazione, usata quando non c'e' un profilo
	 * @return il client credentials del profilo, altrimenti il basic storico, altrimenti nessuna
	 *         autenticazione
	 * @throws IOException se il profilo referenziato non e' configurato
	 */
	public OutboundAuthentication resolve(String ref, String username, String password) throws IOException {
		if(ref == null || ref.isBlank()) {
			return OutboundAuthentication.basic(username, password);
		}

		String nome = ref.trim();

		if(!this.modi.containsKey(nome)) {
			throw new IOException("profilo di autenticazione '" + nome + "' referenziato ma non configurato."
					+ " Profili disponibili: " + new TreeSet<>(this.modi.keySet()));
		}

		ClientCredentialsConfig config = this.profili.get(nome);

		if(config == null) {
			// profilo presente ma disattivato con mode=none: resta il comportamento storico
			return OutboundAuthentication.basic(username, password);
		}

		return OutboundAuthentication.clientCredentials(this.tokenStore, config);
	}

	/**
	 * @return nomi dei profili configurati
	 */
	public Set<String> getNomiProfili() {
		return new TreeSet<>(this.modi.keySet());
	}

	private static Double refreshMargin(String nome, String valore) throws IOException {
		if(valore == null || valore.isBlank()) {
			return null;
		}

		try {
			return Double.valueOf(valore.trim());
		} catch(NumberFormatException e) {
			throw new IOException("profilo di autenticazione '" + nome + "': "
					+ OutboundAuthKeys.REFRESH_MARGIN + " non e' un numero: '" + valore + "'", e);
		}
	}

	/**
	 * Raggruppa per nome di profilo le chiavi che seguono il prefisso, normalizzando i nomi delle
	 * chiavi ma non i nomi dei profili, che devono corrispondere al riferimento cosi' come scritto.
	 */
	private static Map<String, Map<String, String>> raccogli(Properties properties, String prefix) {
		Map<String, Map<String, String>> raccolte = new TreeMap<>();

		if(properties == null) {
			return raccolte;
		}

		for(String chiave: properties.stringPropertyNames()) {
			if(!chiave.startsWith(prefix) || chiave.length() <= prefix.length()) {
				continue;
			}

			String resto = chiave.substring(prefix.length());
			int separatore = resto.indexOf('.');

			if(separatore <= 0 || separatore == resto.length() - 1) {
				logger.warn("property '{}' ignorata: la forma attesa e' {}<profilo>.<chiave>", chiave, prefix);
				continue;
			}

			String nome = resto.substring(0, separatore);
			String nomeChiave = OutboundAuthKeys.normalizza(resto.substring(separatore + 1));

			String valore = properties.getProperty(chiave);

			if(valore == null || valore.isBlank()) {
				continue;
			}

			raccolte.computeIfAbsent(nome, n -> new HashMap<>()).put(canonica(nomeChiave, chiave), valore);
		}

		return raccolte;
	}

	/**
	 * Riporta una chiave normalizzata al nome canonico di {@link OutboundAuthKeys}, cosi' che
	 * token-endpoint, token_endpoint e tokenEndpoint indichino lo stesso parametro.
	 */
	private static String canonica(String nomeChiaveNormalizzato, String chiaveCompleta) {
		String[] ammesse = {
				OutboundAuthKeys.MODE,
				OutboundAuthKeys.TOKEN_ENDPOINT,
				OutboundAuthKeys.CLIENT_ID,
				OutboundAuthKeys.CLIENT_SECRET,
				OutboundAuthKeys.SCOPE,
				OutboundAuthKeys.AUDIENCE,
				OutboundAuthKeys.CLIENT_AUTH,
				OutboundAuthKeys.REFRESH_MARGIN
		};

		for(String ammessa: ammesse) {
			if(OutboundAuthKeys.normalizza(ammessa).equals(nomeChiaveNormalizzato)) {
				return ammessa;
			}
		}

		logger.warn("property '{}' ignorata: chiave di profilo non riconosciuta", chiaveCompleta);
		return nomeChiaveNormalizzato;
	}
}
