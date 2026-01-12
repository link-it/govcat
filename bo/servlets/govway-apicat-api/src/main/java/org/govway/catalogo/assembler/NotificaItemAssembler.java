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
import java.util.UUID;

import org.govway.catalogo.controllers.NotificheController;
import org.govway.catalogo.core.orm.entity.NotificaEntity;
import org.govway.catalogo.servlets.model.ItemNotifica;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class NotificaItemAssembler extends RepresentationModelAssemblerSupport<NotificaEntity, ItemNotifica> {

	@Autowired
	private UtenteItemAssembler utenteItemAssembler;
	
	@Autowired
	private NotificaEngineAssembler engineAssembler;
	
	public NotificaItemAssembler() {
		super(NotificheController.class, ItemNotifica.class);
	}

	@Override
	public ItemNotifica toModel(NotificaEntity entity) {
		
		ItemNotifica dettaglio = instantiateModel(entity);
		

		BeanUtils.copyProperties(entity, dettaglio);

		dettaglio.setIdNotifica(UUID.fromString(entity.getIdNotifica()));
		dettaglio.setData(entity.getData().toInstant().atOffset(ZoneOffset.UTC));
		dettaglio.setEntita(this.engineAssembler.getEntita(entity));
		dettaglio.setTipo(this.engineAssembler.getTipoNotifica(entity));
		dettaglio.setStato(this.engineAssembler.getStatoNotifica(entity.getStato()));
		dettaglio.setRuoli(this.engineAssembler.getRuoliNotifica(entity.getRuoli()));
		dettaglio.setMittente(this.utenteItemAssembler.toModel(entity.getMittente()));
		
		return dettaglio;
	}
}
