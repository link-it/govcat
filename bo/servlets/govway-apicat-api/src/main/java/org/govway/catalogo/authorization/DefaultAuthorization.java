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

	public enum EntitaEnum {GRUPPO, DOMINIO, CLIENT, SOGGETTO, ORGANIZZAZIONE, UTENTE, CLASSE_UTENTE, SERVIZIO, ADESIONE}

	private EntitaEnum entita;
	
	public DefaultAuthorization(EntitaEnum entita) {
		this.entita = entita;
	}
	
	protected void authorizeRead(EntitaEnum entita) {
		this.authorize(entita, true);
	}
	
	protected void authorize(EntitaEnum entita, boolean read) {
		if(this.configurazione.getAmministrazione() == null) {
			this.coreAuthorization.requireAdmin();
		} else {

			AccessoAmministrazioneItem generale = this.configurazione.getAmministrazione().getGenerale();
			AccessoAmministrazioneItem specifico = null;
			
			switch(entita) {
			case CLASSE_UTENTE: 
				specifico = this.configurazione.getAmministrazione().getClassiUtente();
				break;
			case CLIENT: 
				specifico = this.configurazione.getAmministrazione().getClient();
				break;
			case DOMINIO: 
				specifico = this.configurazione.getAmministrazione().getDomini();
				break;
			case GRUPPO: 
				specifico = this.configurazione.getAmministrazione().getGruppi();
				break;
			case ORGANIZZAZIONE: 
				specifico = this.configurazione.getAmministrazione().getOrganizzazioni();
				break;
			case SOGGETTO: 
				specifico = this.configurazione.getAmministrazione().getSoggetti();
				break;
			case UTENTE: 
				specifico = this.configurazione.getAmministrazione().getUtenti();
				break;
			case ADESIONE:
				this.coreAuthorization.requireAdmin();
				break;
			case SERVIZIO:
				this.coreAuthorization.requireAdmin();
				break;
			default:
				break;
			}
			
			this.authorize(read, Optional.ofNullable(specifico).orElse(generale));
		}
	}
	
	private void authorize(boolean read,
			AccessoAmministrazioneItem specifico) {

		if(specifico == null) {
			this.coreAuthorization.requireAdmin();
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
			this.coreAuthorization.requireAdmin();
		} else {
			RuoloUtenteEnum ruoloUtenteEnum = null;

			switch(ruolo) {
			case AMMINISTRATORE: ruoloUtenteEnum = RuoloUtenteEnum.GESTORE;
				break;
			case COORDINATORE: ruoloUtenteEnum = RuoloUtenteEnum.COORDINATORE;
				break;
			case REFERENTE_SERVIZIO: ruoloUtenteEnum = RuoloUtenteEnum.REFERENTE_SERVIZIO;
				break;
			default:
				break;}
			
			if (!scrittura.contains(ruoloUtenteEnum)) {
				this.coreAuthorization.requireAdmin();
			}
		}

	}


	protected void authorizeWrite(EntitaEnum entita) {
		this.authorize(entita, false);
	}
	
	@Override
	public void authorizeCreate(CREATE create) {
		this.authorizeWrite(this.entita);
	}

	@Override
	public void authorizeUpdate(UPDATE update, ENTITY entity) {
		this.authorizeWrite(this.entita);
	}

	@Override
	public void authorizeGet(ENTITY entity) {
		if(!this.configurazione.getUtente().isConsentiAccessoAnonimo()) {
			this.coreAuthorization.requireLogged();
		}
	}

	@Override
	public void authorizeReferenteLettura(ENTITY entity) {
		if(!this.configurazione.getUtente().isConsentiAccessoAnonimo()) {
			this.coreAuthorization.requireLogged();
		}
	}

	@Override
	public void authorizeReferenteScrittura(ENTITY entity) {
		this.authorizeWrite(this.entita);
	}

	@Override
	public void authorizeDelete(ENTITY entity) {
		this.authorizeWrite(this.entita);
	}

	@Override
	public void authorizeList() {
		if(!this.configurazione.getUtente().isConsentiAccessoAnonimo()) {
			this.coreAuthorization.requireLogged();
		}
	}

}
