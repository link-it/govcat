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

import java.util.UUID;

import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.core.orm.entity.TassonomiaEntity;
import org.govway.catalogo.servlets.model.ItemTassonomia;
import org.springframework.beans.BeanUtils;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class TassonomiaItemAssembler extends RepresentationModelAssemblerSupport<TassonomiaEntity, ItemTassonomia> {

	public TassonomiaItemAssembler() {
		super(OrganizzazioniController.class, ItemTassonomia.class);
	}

	@Override
	public ItemTassonomia toModel(TassonomiaEntity entity) {
		
		ItemTassonomia dettaglio = instantiateModel(entity);
		BeanUtils.copyProperties(entity, dettaglio);
		dettaglio.setIdTassonomia(UUID.fromString(entity.getIdTassonomia()));
		
		return dettaglio;
	}

}
