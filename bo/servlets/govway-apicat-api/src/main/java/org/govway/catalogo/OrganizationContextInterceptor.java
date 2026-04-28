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
package org.govway.catalogo;

import java.util.List;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteOrganizzazioneEntity;
import org.govway.catalogo.core.services.UtenteService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Interceptor che risolve il contesto organizzazione per la richiesta corrente
 * a partire dall'header HTTP X-Organization-Context.
 *
 * Il contesto è opzionale: utenti con ruolo globale (gestore, coordinatore)
 * possono operare senza organizzazione di sessione.
 */
@Component
public class OrganizationContextInterceptor implements HandlerInterceptor {

	public static final String HEADER_NAME = "X-Organization-Context";

	private static final Logger log = LoggerFactory.getLogger(OrganizationContextInterceptor.class);

	@Autowired
	private RequestUtils requestUtils;

	@Autowired
	private OrganizationContext organizationContext;

	@Autowired
	private UtenteService utenteService;

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
			throws Exception {

		InfoProfilo infoProfilo = this.requestUtils.getPrincipal(false);

		// Utente anonimo o non autenticato: contesto vuoto
		if (infoProfilo == null || infoProfilo.utente == null) {
			organizationContext.setInitialized(true);
			return true;
		}

		UtenteEntity utente = infoProfilo.utente;
		// Carica le associazioni tramite repository per evitare LazyInitializationException:
		// l'interceptor è eseguito prima dell'apertura della transazione del controller e
		// l'entità utente è detached dalla session Hibernate.
		List<UtenteOrganizzazioneEntity> associazioni = this.utenteService.findUtenteOrganizzazioniByUtente(utente);
		String headerValue = request.getHeader(HEADER_NAME);

		if (headerValue != null && !headerValue.isBlank()) {
			// Header presente: cercare l'organizzazione tra le associazioni dell'utente
			return resolveFromHeader(headerValue, utente, associazioni, response);
		}

		// Header assente: auto-detect se l'utente ha esattamente 1 organizzazione
		if (associazioni != null && associazioni.size() == 1) {
			UtenteOrganizzazioneEntity unica = associazioni.iterator().next();
			organizationContext.setIdOrganizzazione(unica.getOrganizzazione().getId());
			organizationContext.setRuoloOrganizzazione(unica.getRuoloOrganizzazione());
			organizationContext.setInitialized(true);
			log.debug("Contesto organizzazione auto-impostato per utente {} (id_org={})",
					utente.getIdUtente(), unica.getOrganizzazione().getId());
			return true;
		}

		// Header assente, utente con 0 o N organizzazioni: contesto vuoto (valido per gestore/coordinatore)
		organizationContext.setInitialized(true);
		return true;
	}

	private boolean resolveFromHeader(String headerValue, UtenteEntity utente,
			List<UtenteOrganizzazioneEntity> associazioni, HttpServletResponse response) throws Exception {

		if (associazioni == null || associazioni.isEmpty()) {
			log.warn("Header {} presente ma l'utente {} non ha organizzazioni associate",
					HEADER_NAME, utente.getIdUtente());
			sendError(response, HttpServletResponse.SC_BAD_REQUEST,
					"L'utente non ha organizzazioni associate.");
			return false;
		}

		// Cercare tra le associazioni dell'utente
		for (UtenteOrganizzazioneEntity assoc : associazioni) {
			String idOrg = assoc.getOrganizzazione().getIdOrganizzazione();
			if (headerValue.equals(idOrg)) {
				organizationContext.setIdOrganizzazione(assoc.getOrganizzazione().getId());
				organizationContext.setRuoloOrganizzazione(assoc.getRuoloOrganizzazione());
				organizationContext.setInitialized(true);
				log.debug("Contesto organizzazione impostato da header per utente {} (id_org={})",
						utente.getIdUtente(), assoc.getOrganizzazione().getId());
				return true;
			}
		}

		log.warn("Header {} con valore '{}' non corrisponde a nessuna organizzazione dell'utente {}",
				HEADER_NAME, headerValue, utente.getIdUtente());
		sendError(response, HttpServletResponse.SC_BAD_REQUEST,
				"L'organizzazione specificata non è associata all'utente.");
		return false;
	}

	private void sendError(HttpServletResponse response, int status, String detail) throws Exception {
		response.setStatus(status);
		response.setContentType("application/json");
		response.getWriter().write(
				String.format("{\"type\":\"about:blank\",\"title\":\"Bad Request\"," +
						"\"status\":%d,\"detail\":\"%s\"}", status, detail));
	}

}
