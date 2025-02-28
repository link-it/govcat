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
package org.govway.catalogo.authorization;

import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.RequestUtils;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity.Ruolo;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.servlets.model.Configurazione;
import org.springframework.beans.factory.annotation.Autowired;

public class CoreAuthorization {

	@Autowired
	private RequestUtils requestUtils;
	
	@Autowired
	protected Configurazione configurazione;
	
	public UtenteEntity getUtenteSessione() {
		return getUtenteSessione(this.configurazione.getUtente().isConsentiAccessoAnonimo());
	}

	private UtenteEntity getUtenteSessione(boolean consentiUtenteAnonimo) {
		InfoProfilo utente = this.requestUtils.getPrincipal(!consentiUtenteAnonimo);
		if(!consentiUtenteAnonimo) {
			if(utente == null)
				throw new NotAuthorizedException("Utente non specificato");
			if(utente.utente == null)
				throw new NotAuthorizedException("Utente non specificato");
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

	public boolean isAdmin(UtenteEntity utente) {
		return utente != null && Ruolo.AMMINISTRATORE.equals(utente.getRuolo());
	}
	
	public void requireAdmin() {
		if(!isAdmin()) {
			throw new NotAuthorizedException("Required: Ruolo " + Ruolo.AMMINISTRATORE);
		}
	}

	public void requireLogged() {
		if(isAnounymous()) {
			throw new NotAuthorizedException("Required: Utente autenticato");
		}
	}

	public void requireReferenteTecnico() {
		if(!isAdmin() && !isReferenteServizio() && !isReferenteTecnico()) {
			throw new NotAuthorizedException("Required: Utente referente tecnico");
		}
	}

	private boolean isReferenteTecnico() {
		InfoProfilo principal = this.requestUtils.getPrincipal(false);
		if(principal == null || principal.utente == null) {
			return false;
		}
		
		return principal.utente.isReferenteTecnico();
	}

	private boolean isReferenteServizio() {
		InfoProfilo principal = this.requestUtils.getPrincipal(false);
		if(principal == null || principal.utente == null) {
			return false;
		}
		
		return principal.utente.getRuolo() != null && principal.utente.getRuolo().equals(Ruolo.REFERENTE_SERVIZIO);
	}

	public boolean isAnounymous() {
		InfoProfilo principal = this.requestUtils.getPrincipal(false);
		return principal == null || principal.utente == null;
	}

	public boolean isWhiteListed() {
		return this.requestUtils.isWhiteListed();
	}

}
