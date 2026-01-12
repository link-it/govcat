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

import java.time.ZoneOffset;
import java.util.Date;
import java.util.UUID;
import java.util.stream.Collectors;

import org.govway.catalogo.controllers.ServiziController;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.MessaggioAdesioneEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.servlets.model.AllegatoMessaggioCreate;
import org.govway.catalogo.servlets.model.ItemMessaggio;
import org.govway.catalogo.servlets.model.MessaggioCreate;
import org.govway.catalogo.servlets.model.MessaggioUpdate;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class ItemMessaggioAdesioneAssembler extends RepresentationModelAssemblerSupport<MessaggioAdesioneEntity, ItemMessaggio> {

	@Autowired
	private CoreEngineAssembler coreEngineAssembler;
	@Autowired
	private DocumentoAllegatoAssembler allegatoAssembler;

	public ItemMessaggioAdesioneAssembler() {
		super(ServiziController.class, ItemMessaggio.class);
	}

	@Override
	public ItemMessaggio toModel(MessaggioAdesioneEntity entity) {
		
		ItemMessaggio dettaglio = instantiateModel(entity);

		BeanUtils.copyProperties(entity, dettaglio);

		dettaglio.setIdMessaggio(UUID.fromString(entity.getUuid()));
		dettaglio.setData(entity.getData().toInstant().atOffset(ZoneOffset.UTC));
		
		dettaglio.setAllegati(allegatoAssembler.toCollectionModel(entity.getAllegati()).getContent().stream().collect(Collectors.toList()));
		return dettaglio;
	}
	
	public MessaggioAdesioneEntity toEntity(MessaggioCreate src, AdesioneEntity adesione) {
		MessaggioAdesioneEntity entity = new MessaggioAdesioneEntity();
		BeanUtils.copyProperties(src, entity);
		entity.setUuid(UUID.randomUUID().toString());
		entity.setData(new Date());
		UtenteEntity utenteSessione = coreEngineAssembler.getUtenteSessione();
		entity.setUtente(utenteSessione);
		entity.setAdesione(adesione);
		if(src.getAllegati()!=null) {
			for(AllegatoMessaggioCreate allegato: src.getAllegati()) {
				entity.getAllegati().add(allegatoAssembler.toEntity(allegato, utenteSessione));
			}
		}
		return entity;
	}

	public MessaggioAdesioneEntity toEntity(MessaggioUpdate src, MessaggioAdesioneEntity entity) {
		BeanUtils.copyProperties(src, entity);
		entity.setData(new Date());
		entity.setUtente(coreEngineAssembler.getUtenteSessione());
		return entity;
	}

}
