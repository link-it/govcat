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

import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.servlets.model.ConfigurazioneNotifiche;
import org.govway.catalogo.servlets.model.UtenteCreate;
import org.govway.catalogo.servlets.model.UtenteUpdate;

public class UtenteAuthorization extends DefaultAuthorization<UtenteCreate,UtenteUpdate,UtenteEntity> {
	/*
	@Override
	public void authorizeUpdate(UtenteUpdate update, UtenteEntity entity) {
		
		UtenteEntity utente = this.coreAuthorization.getUtenteSessione();
		
		if(!this.coreAuthorization.isAdmin(utente)) {
			if(!utente.getId().equals(entity.getId())) {
				throw new NotAuthorizedException("Un utente può essere modificato da sé stesso o da un amministratore");
			}
		}
	}
	*/
	public void authorizeUpdate(UtenteEntity entity) {
		
		UtenteEntity utente = this.coreAuthorization.getUtenteSessione();
		
		if(!this.coreAuthorization.isAdmin(utente)) {
			if(!utente.getId().equals(entity.getId())) {
				throw new NotAuthorizedException("Un utente può essere modificato da sé stesso o da un amministratore");
			}
		}
	}
	
	public void authorizeGetNotifiche(UtenteEntity entity) {
		
		UtenteEntity utente = this.coreAuthorization.getUtenteSessione();
		
		if(!this.coreAuthorization.isAdmin(utente)) {
			if(!utente.getId().equals(entity.getId())) {
				throw new NotAuthorizedException("Un utente può essere modificato da sé stesso o da un amministratore");
			}
		}
	}
	
	public void authorizeUpdate(ConfigurazioneNotifiche update, UtenteEntity entity) {
		this.authorizeGetNotifiche(entity);
	}
	
	@Override
	public void authorizeCreate(UtenteCreate create) {
		authorizeWrite(EntitaEnum.UTENTE);
	}

	@Override
	public void authorizeUpdate(UtenteUpdate update, UtenteEntity entity) {
		authorizeWrite(EntitaEnum.UTENTE);
	}

	@Override
	public void authorizeDelete(UtenteEntity entity) {
		authorizeWrite(EntitaEnum.UTENTE);
	}
}