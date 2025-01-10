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

import org.govway.catalogo.controllers.SoggettiController;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.govway.catalogo.servlets.model.ItemSoggetto;
import org.govway.catalogo.servlets.model.ItemSoggettoLimited;
import org.govway.catalogo.servlets.model.TipoSoggettoGateway;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class SoggettoItemAssembler extends RepresentationModelAssemblerSupport<SoggettoEntity, ItemSoggetto> {

	@Autowired
	private OrganizzazioneItemAssembler organizzazioneItemAssembler;

	public SoggettoItemAssembler() {
		super(SoggettiController.class, ItemSoggetto.class);
	}

	@Override
	public ItemSoggetto toModel(SoggettoEntity entity) {
		
		ItemSoggetto dettaglio = instantiateModel(entity);
		

		BeanUtils.copyProperties(entity, dettaglio);

		if(entity.getTipoGateway() != null) {
			dettaglio.setTipoGateway(toTipoGateway(entity.getTipoGateway()));
		}

		dettaglio.setIdSoggetto(UUID.fromString(entity.getIdSoggetto()));
		dettaglio.setOrganizzazione(organizzazioneItemAssembler.toModel(entity.getOrganizzazione()));

		return dettaglio;
	}

	public ItemSoggettoLimited toLimitedModel(SoggettoEntity entity) {
		
		ItemSoggettoLimited dettaglio = new ItemSoggettoLimited();
		

		BeanUtils.copyProperties(entity, dettaglio);

		if(entity.getTipoGateway() != null) {
			dettaglio.setTipoGateway(toTipoGateway(entity.getTipoGateway()));
		}

		dettaglio.setIdSoggetto(UUID.fromString(entity.getIdSoggetto()));

		return dettaglio;
	}

	private TipoSoggettoGateway toTipoGateway(String tipoGateway) {
		return TipoSoggettoGateway.fromValue(tipoGateway);
	}
}
