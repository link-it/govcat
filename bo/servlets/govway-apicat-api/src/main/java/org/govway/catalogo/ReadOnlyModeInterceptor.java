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
package org.govway.catalogo;

import java.util.List;
import java.util.regex.Pattern;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.govway.catalogo.servlets.model.Configurazione;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Interceptor che blocca le operazioni quando l'applicazione è configurata in modalità vetrina.
 *
 * La modalità può essere configurata tramite la property api.mode:
 * - full: tutte le operazioni sono permesse (default)
 * - vetrina: solo le operazioni nella whitelist sono permesse (configurate in generale.operazioni_lettura_consentite)
 *
 * Compatibile con Java 21 e Tomcat 11 (Jakarta EE 10+).
 */
@Component
public class ReadOnlyModeInterceptor implements HandlerInterceptor {

	private static final Logger log = LoggerFactory.getLogger(ReadOnlyModeInterceptor.class);

	@Autowired
	RequestUtils requestUtils;

	@Autowired
	Configurazione configurazione;

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
			throws Exception {


		InfoProfilo infoProfilo = this.requestUtils.getPrincipal();

		boolean accessoAutenticato = infoProfilo != null && infoProfilo.utente != null;
		String idUtente = accessoAutenticato ? infoProfilo.utente.getIdUtente() : "anonimo";

		String method = request.getMethod();
		String path = request.getRequestURI();

		// Rimuovi il context path se presente
		String contextPath = request.getContextPath() + "/api/v1";
		if (contextPath != null && !contextPath.isEmpty() && path.startsWith(contextPath)) {
			path = path.substring(contextPath.length());
		}

		log.info("Operazione {} {} invocata dall'utente {}", method, path, idUtente);

		if (!accessoAutenticato) {
			// Con accesso anonimo, verifica la whitelist "METHOD PATH"
			List<String> operazioniConsentite = configurazione.getGenerale().getWhitelistVetrina();

			if (operazioniConsentite != null && !operazioniConsentite.isEmpty()) {
				boolean isAllowed = false;
				for (String whitelistEntry : operazioniConsentite) {
					if (matchesOperationPattern(method, path, whitelistEntry)) {
						isAllowed = true;
						log.debug("Operazione {} {} consentita dalla whitelist: {}  (accesso anonimo)", method, path, whitelistEntry);
						break;
					}
				}

				if (!isAllowed) {
					log.warn("Operazione {} {} bloccata - non presente nella whitelist", method, path);
					response.setStatus(HttpServletResponse.SC_FORBIDDEN);
					response.setContentType("application/json");
					response.getWriter().write(
							String.format("{\"type\":\"about:blank\",\"title\":\"Forbidden\"," +
									"\"status\":403,\"detail\":\"Accesso negato. L'operazione %s %s non è disponibile in modalità anonima.\"}", method, path)
							);
					return false;
				}
			} else {
				// Se non c'è whitelist configurata, blocca tutto
				log.warn("Operazione {} {} bloccata - nessuna whitelist configurata (accesso anonimo)", method, path);
				response.setStatus(HttpServletResponse.SC_FORBIDDEN);
				response.setContentType("application/json");
				response.getWriter().write(
						String.format("{\"type\":\"about:blank\",\"title\":\"Forbidden\"," +
								"\"status\":403,\"detail\":\"Accesso negato. L'operazione %s %s non è disponibile in modalità vetrina.\"}", method, path)
						);
				return false;
			}
		}

		// In modalità full, tutte le operazioni sono permesse
		return true;
	}

	/**
	 * Verifica se un'operazione (METHOD + PATH) corrisponde a una entry della whitelist.
	 * Il formato della whitelist entry è "METHOD PATH" (es. "GET /servizi", "POST /adesioni").
	 *
	 * @param method Metodo HTTP della richiesta (es. GET, POST)
	 * @param path Path della richiesta (es. /servizi/123)
	 * @param whitelistEntry Entry della whitelist nel formato "METHOD PATH" (es. "GET /servizi/**")
	 * @return true se l'operazione corrisponde alla entry
	 */
	private boolean matchesOperationPattern(String method, String path, String whitelistEntry) {
		if (whitelistEntry == null || whitelistEntry.trim().isEmpty()) {
			return false;
		}

		// Split dell'entry in METHOD e PATH pattern
		String[] parts = whitelistEntry.trim().split("\\s+", 2);
		if (parts.length != 2) {
			log.warn("Entry whitelist malformata (deve essere 'METHOD PATH'): {}", whitelistEntry);
			return false;
		}

		String allowedMethod = parts[0];
		String pathPattern = parts[1];

		// Verifica che il metodo corrisponda (case insensitive)
		if (!method.equalsIgnoreCase(allowedMethod)) {
			return false;
		}

		// Verifica che il path corrisponda al pattern
		return matchesPattern(path, pathPattern);
	}

	/**
	 * Verifica se un path corrisponde a un pattern con wildcard.
	 * Supporta:
	 * - * : corrisponde a un singolo segmento di path (non attraversa /)
	 * - ** : corrisponde a qualsiasi numero di segmenti (attraversa /)
	 *
	 * @param path Path da verificare (es. /servizi/123/grant)
	 * @param pattern Pattern con wildcard (es. /servizi/*&#47;grant o /servizi/**)
	 * @return true se il path corrisponde al pattern
	 */
	private boolean matchesPattern(String path, String pattern) {
		// Escape dei caratteri speciali regex nel pattern (tranne * che gestiamo noi)
		String regex = pattern
				.replace(".", "\\.")
				.replace("+", "\\+")
				.replace("?", "\\?")
				.replace("(", "\\(")
				.replace(")", "\\)")
				.replace("[", "\\[")
				.replace("]", "\\]")
				.replace("{", "\\{")
				.replace("}", "\\}")
				.replace("^", "\\^")
				.replace("$", "\\$")
				.replace("|", "\\|");

		// Sostituisci ** con un placeholder temporaneo per evitare conflitti con *
		regex = regex.replace("**", "___DOUBLE_STAR___");

		// Sostituisci * con [^/]+ (uno o più caratteri che non sono /)
		regex = regex.replace("*", "[^/]+");

		// Sostituisci il placeholder ** con .* (qualsiasi carattere incluso /)
		regex = regex.replace("___DOUBLE_STAR___", ".*");

		// Aggiungi anchor per match esatto
		regex = "^" + regex + "$";

		return Pattern.matches(regex, path);
	}
}
