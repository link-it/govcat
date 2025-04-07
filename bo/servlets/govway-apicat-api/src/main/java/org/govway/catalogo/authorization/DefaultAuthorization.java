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
		}
		
		switch(entita) {
		case CLASSE_UTENTE: authorizeRead(this.configurazione.getAmministrazione().getGenerale(), this.configurazione.getAmministrazione().getClassiUtente());
		case CLIENT: authorizeRead(this.configurazione.getAmministrazione().getGenerale(), this.configurazione.getAmministrazione().getClient());
		case DOMINIO: authorizeRead(this.configurazione.getAmministrazione().getGenerale(), this.configurazione.getAmministrazione().getDomini());
		case GRUPPO: authorizeRead(this.configurazione.getAmministrazione().getGenerale(), this.configurazione.getAmministrazione().getGruppi());
		case ORGANIZZAZIONE: authorizeRead(this.configurazione.getAmministrazione().getGenerale(), this.configurazione.getAmministrazione().getOrganizzazioni());
		case SOGGETTO: authorizeRead(this.configurazione.getAmministrazione().getGenerale(), this.configurazione.getAmministrazione().getSoggetti());
		case UTENTE: authorizeRead(this.configurazione.getAmministrazione().getGenerale(), this.configurazione.getAmministrazione().getUtenti());
		}
		
		coreAuthorization.requireAdmin();
		
	}
	
	private void authorize(boolean read,
			AccessoAmministrazioneItem specifico) {

		if(specifico == null) {
			coreAuthorization.requireAdmin();
		}
		
		if(read) {
			authorizeContains(specifico.getLettura(), this.coreAuthorization.getUtenteSessione().getRuolo());
		} else {
			authorizeContains(specifico.getScrittura(), this.coreAuthorization.getUtenteSessione().getRuolo());
		}
	}
	
	private void authorizeContains(List<RuoloUtenteEnum> scrittura, Ruolo ruolo) {
		//TODO lamantia check che scrittura contenga il ruolo, attenzione alla conversione tra tipi
		coreAuthorization.requireAdmin();
	}

	private void authorizeRead(AccessoAmministrazioneItem generale,
			AccessoAmministrazioneItem specifico) {
		authorize(true, Optional.ofNullable(generale).orElse(specifico));
	}

	private void authorizeWrite(AccessoAmministrazioneItem generale,
			AccessoAmministrazioneItem specifico) {
		authorize(false, Optional.ofNullable(generale).orElse(specifico));
	}

	protected boolean authorizeWrite(EntitaEnum entita) {
		if(this.configurazione.getAmministrazione() == null)
			return coreAuthorization.isAdmin();
		
		switch(entita) {
		case CLASSE_UTENTE: authorizeWrite(this.configurazione.getAmministrazione().getGenerale(), this.configurazione.getAmministrazione().getClassiUtente());
		case CLIENT: authorizeWrite(this.configurazione.getAmministrazione().getGenerale(), this.configurazione.getAmministrazione().getClient());
		case DOMINIO: authorizeWrite(this.configurazione.getAmministrazione().getGenerale(), this.configurazione.getAmministrazione().getDomini());
		case GRUPPO: authorizeWrite(this.configurazione.getAmministrazione().getGenerale(), this.configurazione.getAmministrazione().getGruppi());
		case ORGANIZZAZIONE: authorizeWrite(this.configurazione.getAmministrazione().getGenerale(), this.configurazione.getAmministrazione().getOrganizzazioni());
		case SOGGETTO: authorizeWrite(this.configurazione.getAmministrazione().getGenerale(), this.configurazione.getAmministrazione().getSoggetti());
		case UTENTE: authorizeWrite(this.configurazione.getAmministrazione().getGenerale(), this.configurazione.getAmministrazione().getUtenti());
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
