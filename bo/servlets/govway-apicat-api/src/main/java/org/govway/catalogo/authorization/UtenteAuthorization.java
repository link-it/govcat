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

import java.util.Map;
import java.util.UUID;

import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.RuoloOrganizzazione;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.servlets.model.ConfigurazioneNotifiche;
import org.govway.catalogo.servlets.model.RuoloUtenteEnum;
import org.govway.catalogo.servlets.model.UtenteCreate;
import org.govway.catalogo.servlets.model.UtenteOrganizzazioneCreate;
import org.govway.catalogo.servlets.model.UtenteUpdate;

public class UtenteAuthorization extends DefaultAuthorization<UtenteCreate,UtenteUpdate,UtenteEntity> {

	public UtenteAuthorization() {
		super(EntitaEnum.UTENTE);
	}

	@Override
	public void authorizeCreate(UtenteCreate utenteCreate) {
		try {
			// Path standard: gestore/coordinatore via configurazione amministrazione.utenti.scrittura
			super.authorizeCreate(utenteCreate);
			return;
		} catch (NotAuthorizedException e) {
			// Path alternativo: AMMINISTRATORE_ORGANIZZAZIONE dell'organizzazione di sessione,
			// con vincoli sui campi del nuovo utente.
			if (this.coreAuthorization.getUtenteSessione() == null) {
				throw e;
			}
			validaCreateComeAmmOrg(utenteCreate);
		}
	}

	/**
	 * Verifica che l'utente in sessione sia AMMINISTRATORE_ORGANIZZAZIONE sull'organizzazione
	 * di sessione e che il payload UtenteCreate rispetti i vincoli applicabili in tal caso:
	 * - ruolo globale, se presente, deve essere utente_organizzazione (no gestore/coordinatore)
	 * - organizzazioni deve contenere esattamente l'organizzazione di sessione (singola)
	 */
	private void validaCreateComeAmmOrg(UtenteCreate utenteCreate) {
		// Verifica che l'utente in sessione abbia ruolo AMM_ORG sull'organizzazione di sessione
		if (!this.coreAuthorization.hasRuoloInOrganizzazioneSessione(
				RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE)) {
			throw new NotAuthorizedException(ErrorCode.AUT_403);
		}

		OrganizzazioneEntity orgSessione = this.coreAuthorization.getOrganizzazioneSessione();

		// Vincolo: ruolo globale del nuovo utente non può essere gestore o coordinatore
		if (utenteCreate.getRuolo() != null
				&& utenteCreate.getRuolo() != RuoloUtenteEnum.UTENTE_ORGANIZZAZIONE) {
			throw new NotAuthorizedException(ErrorCode.AUT_403_AMM_ORG_INVALID_ROLE,
					Map.of("ruolo", utenteCreate.getRuolo().getValue()));
		}

		// Vincolo: deve essere indicata esattamente una organizzazione, e deve coincidere
		// con l'organizzazione di sessione.
		if (utenteCreate.getOrganizzazioni() == null || utenteCreate.getOrganizzazioni().size() != 1) {
			throw new NotAuthorizedException(ErrorCode.AUT_403_AMM_ORG_INVALID_ORGS);
		}
		UtenteOrganizzazioneCreate uoc = utenteCreate.getOrganizzazioni().get(0);
		UUID idOrgIndicata = uoc.getIdOrganizzazione();
		if (idOrgIndicata == null
				|| !idOrgIndicata.toString().equals(orgSessione.getIdOrganizzazione())) {
			throw new NotAuthorizedException(ErrorCode.AUT_403_AMM_ORG_INVALID_ORGS);
		}
	}

	public void authorizeUpdate(UtenteEntity entity) {

		UtenteEntity utente = this.coreAuthorization.getUtenteSessione();

		if(!utente.getId().equals(entity.getId())) {
			super.authorizeWrite(EntitaEnum.UTENTE);
		}

	}

	public void authorizeGetNotifiche(UtenteEntity entity) {

		UtenteEntity utente = this.coreAuthorization.getUtenteSessione();

		if(!this.coreAuthorization.isAdmin(utente)) {
			if(!utente.getId().equals(entity.getId())) {
				throw new NotAuthorizedException(ErrorCode.AUT_403);
			}
		}
	}

	public void authorizeUpdate(ConfigurazioneNotifiche update, UtenteEntity entity) {
		this.authorizeGetNotifiche(entity);
	}

}