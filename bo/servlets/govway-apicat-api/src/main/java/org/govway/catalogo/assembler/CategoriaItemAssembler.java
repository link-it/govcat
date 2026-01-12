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

import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.core.orm.entity.CategoriaEntity;
import org.govway.catalogo.servlets.model.ItemCategoria;
import org.springframework.beans.BeanUtils;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class CategoriaItemAssembler extends RepresentationModelAssemblerSupport<CategoriaEntity, ItemCategoria> {

	public CategoriaItemAssembler() {
		super(OrganizzazioniController.class, ItemCategoria.class);
	}

	@Override
	public ItemCategoria toModel(CategoriaEntity entity) {
		
		ItemCategoria dettaglio = instantiateModel(entity);
		

		BeanUtils.copyProperties(entity, dettaglio);

		dettaglio.setIdCategoria(UUID.fromString(entity.getIdCategoria()));
		dettaglio.setIdTassonomia(UUID.fromString(entity.getTassonomia().getIdTassonomia()));
		
		if(entity.getCategoriaPadre()!=null) {
			dettaglio.setIdTassonomia(UUID.fromString(entity.getCategoriaPadre().getIdCategoria()));
		}

		if(entity.getFigli()!=null && !entity.getFigli().isEmpty()) {
			List<ItemCategoria> figli = new ArrayList<>();
			for(CategoriaEntity figlio: entity.getFigli()) {
				figli.add(toModel(figlio));
			}
			dettaglio.setFigli(figli);
		}

		return dettaglio;
	}

}
