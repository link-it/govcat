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

import org.govway.catalogo.controllers.ServiziController;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.servlets.model.ItemServizio;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class ServizioItemAssembler extends RepresentationModelAssemblerSupport<ServizioEntity, ItemServizio> {

	@Autowired
	private ServizioEngineAssembler engine;

	@Autowired
	private SoggettoItemAssembler soggettoItemAssembler;

	public ServizioItemAssembler() {
		super(ServiziController.class, ItemServizio.class);
	}

	@Override
	public ItemServizio toModel(ServizioEntity entity) {
		
		ItemServizio dettaglio = instantiateModel(entity);
		

		BeanUtils.copyProperties(entity, dettaglio);

		dettaglio.setIdServizio(UUID.fromString(entity.getIdServizio()));
		dettaglio.setDominio(engine.getDominio(entity));
		dettaglio.setTipo(engine.toTipo(entity.getTipo()));

		if(entity.getSoggettoInterno()!=null) {
			dettaglio.setSoggettoInterno(soggettoItemAssembler.toModel(entity.getSoggettoInterno()));
		}
		
		dettaglio.setVisibilita(engine.toVisibilita(entity.getVisibilita()));
		dettaglio.setImmagine(engine.getImmagine(entity));
		dettaglio.setAdesioneConsentita(entity.isAdesioneConsentita());
		dettaglio.setEliminabile(engine.isEliminabile(entity));

		return dettaglio;
	}

}
