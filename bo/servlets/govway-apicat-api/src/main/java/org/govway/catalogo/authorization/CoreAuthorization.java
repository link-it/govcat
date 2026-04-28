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
package org.govway.catalogo.authorization;

import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.OrganizationContext;
import org.govway.catalogo.RequestUtils;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.RuoloOrganizzazione;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity.Ruolo;
import org.govway.catalogo.core.services.OrganizzazioneService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.servlets.model.Configurazione;
import org.springframework.beans.factory.annotation.Autowired;

public class CoreAuthorization {

	@Autowired
	private RequestUtils requestUtils;

	@Autowired
	protected Configurazione configurazione;

	@Autowired
	private OrganizationContext organizationContext;

	@Autowired
	private UtenteService utenteService;

	@Autowired
	private OrganizzazioneService organizzazioneService;
	
	public UtenteEntity getUtenteSessione() {
		boolean consentiAnonimo = this.configurazione.getUtente().isConsentiAccessoAnonimo();
		return getUtenteSessione(consentiAnonimo);
	}

	private UtenteEntity getUtenteSessione(boolean consentiUtenteAnonimo) {
		InfoProfilo utente = this.requestUtils.getPrincipal(!consentiUtenteAnonimo);
		if(!consentiUtenteAnonimo) {
			if(utente == null)
				throw new NotAuthorizedException(ErrorCode.AUT_403);
			if(utente.utente == null)
				throw new NotAuthorizedException(ErrorCode.AUT_403);
			return utente.utente;
		} else {
			if(utente != null) {
				return utente.utente;
			} else {
				return null;
			}
		}
	}

	public boolean isAdmin() {
		return isAdmin(getUtenteSessione());
	}
	
	public boolean isCoordinatore() {
		return isCoordinatore(getUtenteSessione());
	}

	public boolean isAdmin(UtenteEntity utente) {
		return utente != null && Ruolo.AMMINISTRATORE.equals(utente.getRuolo());
	}
	
	public boolean isCoordinatore(UtenteEntity utente) {
		return utente != null && Ruolo.COORDINATORE.equals(utente.getRuolo());
	}
	
	public void requireAdmin() {
		if(!isAdmin()) {
			throw new NotAuthorizedException(ErrorCode.AUT_403);
		}
	}

	public void requireLogged() {
		if(isAnounymous()) {
			throw new NotAuthorizedException(ErrorCode.AUT_403);
		}
	}

	public void requireReferenteTecnico() {
		if(!isAdmin() && !isRuoloOrganizzazione() && !isReferenteTecnico()) {
			throw new NotAuthorizedException(ErrorCode.AUT_403);
		}
	}

	private boolean isReferenteTecnico() {
		InfoProfilo principal = this.requestUtils.getPrincipal(false);
		if(principal == null || principal.utente == null) {
			return false;
		}

		return principal.utente.isReferenteTecnico();
	}

	/**
	 * Verifica se l'utente ha un ruolo per-organizzazione valido.
	 * Usa il contesto organizzazione di sessione se disponibile (verifica ruolo non-null
	 * nell'organizzazione attiva). Se non c'è contesto di sessione, ricade sul ruolo
	 * globale dell'utente per retrocompatibilità.
	 */
	private boolean isRuoloOrganizzazione() {
		InfoProfilo principal = this.requestUtils.getPrincipal(false);
		if(principal == null || principal.utente == null) {
			return false;
		}

		// Se c'è un contesto organizzazione attivo, verifica il ruolo in quella organizzazione.
		// Ruolo null = nessun ruolo = sola lettura, non sufficiente.
		if (this.organizationContext != null && this.organizationContext.hasOrganizzazione()) {
			return this.organizationContext.getRuoloOrganizzazione() != null;
		}

		// Fallback: nessun contesto di sessione, verifica il ruolo globale.
		return principal.utente.getRuolo() != null && principal.utente.getRuolo().equals(Ruolo.RUOLO_ORGANIZZAZIONE);
	}

	public boolean isAnounymous() {
		InfoProfilo principal = this.requestUtils.getPrincipal(false);
		return principal == null || principal.utente == null;
	}

	public boolean isWhiteListed() {
		return this.requestUtils.isWhiteListed();
	}

	/**
	 * @return il contesto organizzazione della richiesta corrente, può essere vuoto
	 */
	public OrganizationContext getOrganizationContext() {
		return this.organizationContext;
	}

	/**
	 * Carica al volo l'entità organizzazione di sessione dal database.
	 * Il bean OrganizationContext mantiene solo l'identificativo per evitare problemi di
	 * lazy initialization su entità detached. La query è risolta nella transazione attiva
	 * del controller chiamante.
	 *
	 * @return l'organizzazione attiva di sessione, o null se non impostata
	 */
	public OrganizzazioneEntity getOrganizzazioneSessione() {
		if (this.organizationContext != null && this.organizationContext.hasOrganizzazione()) {
			return this.organizzazioneService.findById(this.organizationContext.getIdOrganizzazione())
					.orElse(null);
		}
		return null;
	}

	/**
	 * @return il ruolo dell'utente nell'organizzazione di sessione, o null se non impostata
	 */
	public RuoloOrganizzazione getRuoloOrganizzazioneSessione() {
		if (this.organizationContext != null && this.organizationContext.hasOrganizzazione()) {
			return this.organizationContext.getRuoloOrganizzazione();
		}
		return null;
	}

	/**
	 * Verifica se l'utente ha uno dei ruoli specificati nell'organizzazione di sessione.
	 * Restituisce false se non c'è un contesto organizzazione attivo oppure se il ruolo è null.
	 */
	public boolean hasRuoloInOrganizzazioneSessione(RuoloOrganizzazione... ruoli) {
		RuoloOrganizzazione ruoloUtente = getRuoloOrganizzazioneSessione();
		if (ruoloUtente == null) {
			return false;
		}
		for (RuoloOrganizzazione r : ruoli) {
			if (ruoloUtente == r) {
				return true;
			}
		}
		return false;
	}

	/**
	 * @return true se l'organizzazione di sessione ha il flag referente attivo
	 */
	public boolean isOrganizzazioneSessioneReferente() {
		OrganizzazioneEntity org = getOrganizzazioneSessione();
		return org != null && org.isReferente();
	}

	/**
	 * @return true se l'organizzazione di sessione ha il flag aderente attivo
	 */
	public boolean isOrganizzazioneSessioneAderente() {
		OrganizzazioneEntity org = getOrganizzazioneSessione();
		return org != null && org.isAderente();
	}

	/**
	 * Verifica se l'utente indicato ha uno dei ruoli specificati su una specifica organizzazione.
	 * A differenza di hasRuoloInOrganizzazioneSessione, non usa il contesto di sessione ma
	 * effettua una query diretta sulle associazioni dell'utente.
	 */
	public boolean hasRuoloInOrganizzazione(UtenteEntity utente, OrganizzazioneEntity organizzazione, RuoloOrganizzazione... ruoli) {
		return this.utenteService.hasRuoloInOrganizzazione(utente, organizzazione, ruoli);
	}

}
