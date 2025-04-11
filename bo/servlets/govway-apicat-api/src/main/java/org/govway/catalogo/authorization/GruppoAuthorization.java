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

import org.govway.catalogo.core.orm.entity.GruppoEntity;
import org.govway.catalogo.servlets.model.GruppoCreate;
import org.govway.catalogo.servlets.model.GruppoUpdate;

public class GruppoAuthorization extends DefaultAuthorization<GruppoCreate,GruppoUpdate,GruppoEntity> {

	@Override
	public void authorizeGet(GruppoEntity entity) {
		if(!this.configurazione.getUtente().isConsentiAccessoAnonimo()) {
			this.coreAuthorization.requireLogged();
		}
	}

	@Override
	public void authorizeList() {
		if(!this.configurazione.getUtente().isConsentiAccessoAnonimo()) {
			this.coreAuthorization.requireLogged();
		}
	}

	@Override
	public void authorizeCreate(GruppoCreate create) {
		authorizeWrite(EntitaEnum.GRUPPO);
	}

	@Override
	public void authorizeUpdate(GruppoUpdate update, GruppoEntity entity) {
		authorizeWrite(EntitaEnum.GRUPPO);
	}

	@Override
	public void authorizeDelete(GruppoEntity entity) {
		authorizeWrite(EntitaEnum.GRUPPO);
	}
	
}