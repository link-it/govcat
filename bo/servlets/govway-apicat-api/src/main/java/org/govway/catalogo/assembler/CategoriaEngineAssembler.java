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
package org.govway.catalogo.assembler;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.govway.catalogo.core.orm.entity.CategoriaEntity;
import org.govway.catalogo.servlets.model.PathCategoria;

public class CategoriaEngineAssembler {

	public List<PathCategoria> getPathCategoria(CategoriaEntity entity) {
		List<PathCategoria> lst = new ArrayList<>();
		
		lst.add(getPath(entity));
		
		if(entity.getCategoriaPadre()!=null) {
			lst.addAll(0, getPathCategoria(entity.getCategoriaPadre()));
		}
		
		return lst;
	}

	private PathCategoria getPath(CategoriaEntity entity) {
		PathCategoria p = new PathCategoria();
		
		p.setIdCategoria(UUID.fromString(entity.getIdCategoria()));
		p.setNome(entity.getNome());
		
		return p;
	}


}
