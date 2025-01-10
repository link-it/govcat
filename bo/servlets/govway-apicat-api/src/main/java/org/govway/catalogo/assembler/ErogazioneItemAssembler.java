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

import org.govway.catalogo.core.orm.entity.ErogazioneEntity;
import org.govway.catalogo.servlets.model.ItemErogazioneAdesione;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class ErogazioneItemAssembler extends RepresentationModelAssemblerSupport<ErogazioneEntity, ItemErogazioneAdesione> {

	@Autowired
	private ApiItemAssembler apiItemAssembler;
	
	public ErogazioneItemAssembler() {
		super(ErogazioneItemAssembler.class, ItemErogazioneAdesione.class);
	}

	@Override
	public ItemErogazioneAdesione toModel(ErogazioneEntity entity) {
		
		ItemErogazioneAdesione dettaglio = instantiateModel(entity);

		BeanUtils.copyProperties(entity, dettaglio);
		dettaglio.setIdErogazione(UUID.fromString(entity.getApi().getIdApi()));
		dettaglio.setApi(apiItemAssembler.toModel(entity.getApi()));
		
		return dettaglio;
	}

}
