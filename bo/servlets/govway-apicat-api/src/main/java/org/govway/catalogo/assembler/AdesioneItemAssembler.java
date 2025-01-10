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

import java.time.ZoneOffset;
import java.util.UUID;

import org.govway.catalogo.controllers.AdesioniController;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.servlets.model.ItemAdesione;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class AdesioneItemAssembler extends RepresentationModelAssemblerSupport<AdesioneEntity, ItemAdesione> {

	@Autowired
	private SoggettoItemAssembler soggettoAssembler;
	
	@Autowired
	private ServizioItemAssembler servizioAssembler;
	
	@Autowired
	private UtenteItemAssembler utenteAssembler;
	
	public AdesioneItemAssembler() {
		super(AdesioniController.class, ItemAdesione.class);
	}

	@Override
	public ItemAdesione toModel(AdesioneEntity entity) {
		
		ItemAdesione dettaglio = instantiateModel(entity);
		

		BeanUtils.copyProperties(entity, dettaglio);

		dettaglio.setIdAdesione(UUID.fromString(entity.getIdAdesione()));
		dettaglio.setSoggetto(this.soggettoAssembler.toModel(entity.getSoggetto()));
		dettaglio.setServizio(this.servizioAssembler.toModel(entity.getServizio()));
		dettaglio.setUtenteRichiedente(this.utenteAssembler.toModel(entity.getRichiedente()));

		dettaglio.setDataCreazione(entity.getDataCreazione().toInstant().atOffset(ZoneOffset.UTC));

		if(entity.getDataUltimaModifica()!=null) {
			dettaglio.setDataUltimoAggiornamento(entity.getDataUltimaModifica().toInstant().atOffset(ZoneOffset.UTC));
		}

		return dettaglio;
	}

}
