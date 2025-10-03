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
package org.govway.catalogo.assembler;

import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.RequestUtils;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Autowired;

public class CoreEngineAssembler {

	@Autowired
	private RequestUtils requestUtils;
	
	public UtenteEntity getUtenteSessione() {
		InfoProfilo principal = this.requestUtils.getPrincipal();
//		UtenteEntity u = principal.utente;
		if(principal.utente == null) {
			throw new NotAuthorizedException(ErrorCode.ORG_007, java.util.Map.of("idUtente", principal.idUtente.toString()));
		}
		
		return principal.utente;
	}

}
