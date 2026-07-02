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

import org.govway.catalogo.core.orm.entity.RuoloOrganizzazione;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

/**
 * Bean request-scoped che contiene il contesto dell'organizzazione attiva
 * per la richiesta corrente. Il contesto è opzionale: utenti con ruolo
 * globale (gestore, coordinatore) possono operare senza organizzazione di sessione.
 *
 * Viene popolato dall'OrganizationContextInterceptor a partire dall'header
 * X-Organization-Context. Mantiene solo l'identificativo dell'organizzazione
 * per evitare problemi di lazy initialization su entità detached: l'entità
 * viene caricata al volo dai consumer (CoreAuthorization) dentro la loro
 * transazione di richiesta.
 */
@Component
@RequestScope
public class OrganizationContext {

	private Long idOrganizzazione;
	private RuoloOrganizzazione ruoloOrganizzazione;
	private boolean initialized;

	public Long getIdOrganizzazione() {
		return idOrganizzazione;
	}

	public void setIdOrganizzazione(Long idOrganizzazione) {
		this.idOrganizzazione = idOrganizzazione;
	}

	public RuoloOrganizzazione getRuoloOrganizzazione() {
		return ruoloOrganizzazione;
	}

	public void setRuoloOrganizzazione(RuoloOrganizzazione ruoloOrganizzazione) {
		this.ruoloOrganizzazione = ruoloOrganizzazione;
	}

	public boolean isInitialized() {
		return initialized;
	}

	public void setInitialized(boolean initialized) {
		this.initialized = initialized;
	}

	/**
	 * @return true se è presente un contesto organizzazione valido
	 */
	public boolean hasOrganizzazione() {
		return initialized && idOrganizzazione != null;
	}

}
