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

import org.govway.catalogo.core.orm.entity.DominioEntity;
import org.govway.catalogo.servlets.model.DominioCreate;
import org.govway.catalogo.servlets.model.DominioUpdate;

public class DominioAuthorization extends DefaultAuthorization<DominioCreate,DominioUpdate,DominioEntity> {

	@Override
	public void authorizeCreate(DominioCreate create) {
		authorizeWrite(EntitaEnum.DOMINIO);
	}
	
	@Override
	public void authorizeUpdate(DominioUpdate update, DominioEntity entity) {
		authorizeWrite(EntitaEnum.DOMINIO);
	}
	
	@Override
	public void authorizeDelete(DominioEntity entity) {
		authorizeWrite(EntitaEnum.DOMINIO);
	}
}