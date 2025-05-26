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

import java.util.List;
import java.util.Optional;

import org.govway.catalogo.core.orm.entity.UtenteEntity.Ruolo;
import org.govway.catalogo.servlets.model.AccessoAmministrazioneItem;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.RuoloUtenteEnum;
import org.springframework.beans.factory.annotation.Autowired;

public abstract class DefaultAuthorization<CREATE,UPDATE,ENTITY> implements IAuthorization<CREATE,UPDATE,ENTITY> {

	@Autowired
	protected CoreAuthorization coreAuthorization;
	
	@Autowired
	protected Configurazione configurazione;

	public enum EntitaEnum {GRUPPO, DOMINIO, CLIENT, SOGGETTO, ORGANIZZAZIONE, UTENTE, CLASSE_UTENTE}

	protected void authorizeRead(EntitaEnum entita) {
		if(this.configurazione.getAmministrazione() == null) {
			coreAuthorization.requireAdmin();
		} else {
			switch(entita) {
			case CLASSE_UTENTE: 
				authorizeRead(this.configurazione.getAmministrazione().getGenerale(), this.configurazione.getAmministrazione().getClassiUtente());
				break;
			case CLIENT: 
				authorizeRead(this.configurazione.getAmministrazione().getGenerale(), this.configurazione.getAmministrazione().getClient());
				break;
			case DOMINIO: 
				authorizeRead(this.configurazione.getAmministrazione().getGenerale(), this.configurazione.getAmministrazione().getDomini());
				break;
			case GRUPPO: 
				authorizeRead(this.configurazione.getAmministrazione().getGenerale(), this.configurazione.getAmministrazione().getGruppi());
				break;
			case ORGANIZZAZIONE: 
				authorizeRead(this.configurazione.getAmministrazione().getGenerale(), this.configurazione.getAmministrazione().getOrganizzazioni());
				break;
			case SOGGETTO: 
				authorizeRead(this.configurazione.getAmministrazione().getGenerale(), this.configurazione.getAmministrazione().getSoggetti());
				break;
			case UTENTE: 
				authorizeRead(this.configurazione.getAmministrazione().getGenerale(), this.configurazione.getAmministrazione().getUtenti());
				break;
		}
		coreAuthorization.requireAdmin();
		}
	}
	
	private void authorize(boolean read,
			AccessoAmministrazioneItem specifico) {

		if(specifico == null) {
			coreAuthorization.requireAdmin();
		} else {
			if(read) {
				authorizeContains(specifico.getLettura(), this.coreAuthorization.getUtenteSessione().getRuolo());
			} else {
				authorizeContains(specifico.getScrittura(), this.coreAuthorization.getUtenteSessione().getRuolo());
			}
		}
		
	}
	
	private void authorizeContains(List<RuoloUtenteEnum> scrittura, Ruolo ruolo) {
		//check che scrittura contenga il ruolo, attenzione alla conversione tra tipi
		if (scrittura == null || ruolo == null) {
			coreAuthorization.requireAdmin();
		} else {
			RuoloUtenteEnum ruoloUtenteEnum;
			if(ruolo.name() == "AMMINISTRATORE")
				ruoloUtenteEnum = RuoloUtenteEnum.GESTORE;
			else
				ruoloUtenteEnum = RuoloUtenteEnum.valueOf(ruolo.name());
			if (!scrittura.contains(ruoloUtenteEnum)) {
				coreAuthorization.requireAdmin();
			}
		}

	}

	private void authorizeRead(AccessoAmministrazioneItem generale,
			AccessoAmministrazioneItem specifico) {
		authorize(true, Optional.ofNullable(specifico).orElse(generale));
	}

	private void authorizeWrite(AccessoAmministrazioneItem generale,
			AccessoAmministrazioneItem specifico) {
		authorize(false, Optional.ofNullable(specifico).orElse(generale));
	}

	protected boolean authorizeWrite(EntitaEnum entita) {
		if(this.configurazione.getAmministrazione() == null)
			return coreAuthorization.isAdmin();
		switch(entita) {
			case CLASSE_UTENTE: 
				authorizeWrite(this.configurazione.getAmministrazione().getGenerale(), this.configurazione.getAmministrazione().getClassiUtente());
				break;
			case CLIENT: 
				authorizeWrite(this.configurazione.getAmministrazione().getGenerale(), this.configurazione.getAmministrazione().getClient());
				break;
			case DOMINIO: 
				authorizeWrite(this.configurazione.getAmministrazione().getGenerale(), this.configurazione.getAmministrazione().getDomini());
				break;
			case GRUPPO: 
				authorizeWrite(this.configurazione.getAmministrazione().getGenerale(), this.configurazione.getAmministrazione().getGruppi());
				break;
			case ORGANIZZAZIONE: 
				authorizeWrite(this.configurazione.getAmministrazione().getGenerale(), this.configurazione.getAmministrazione().getOrganizzazioni());
				break;
			case SOGGETTO: 
				authorizeWrite(this.configurazione.getAmministrazione().getGenerale(), this.configurazione.getAmministrazione().getSoggetti());
				break;
			case UTENTE: 
				authorizeWrite(this.configurazione.getAmministrazione().getGenerale(), this.configurazione.getAmministrazione().getUtenti());
				break;
		}
		return coreAuthorization.isAdmin();	
	}
	
	@Override
	public void authorizeCreate(CREATE create) {
		this.coreAuthorization.requireAdmin();
	}

	@Override
	public void authorizeUpdate(UPDATE update, ENTITY entity) {
		this.coreAuthorization.requireAdmin();
	}

	@Override
	public void authorizeGet(ENTITY entity) {
		this.coreAuthorization.requireLogged();
	}

	@Override
	public void authorizeReferenteLettura(ENTITY entity) {
		this.coreAuthorization.requireLogged();
	}

	@Override
	public void authorizeReferenteScrittura(ENTITY entity) {
		this.coreAuthorization.requireAdmin();
	}

	@Override
	public void authorizeDelete(ENTITY entity) {
		this.coreAuthorization.requireAdmin();
	}

	@Override
	public void authorizeList() {
		this.coreAuthorization.requireLogged();
	}

}
