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

import org.govway.catalogo.controllers.NotificheController;
import org.govway.catalogo.core.orm.entity.NotificaEntity;
import org.govway.catalogo.servlets.model.Notifica;
import org.govway.catalogo.servlets.model.UpdateNotifica;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class NotificaDettaglioAssembler extends RepresentationModelAssemblerSupport<NotificaEntity, Notifica> {

	@Autowired
	private UtenteItemAssembler utenteItemAssembler;

	@Autowired
	private NotificaEngineAssembler engineAssembler;
	
	public NotificaDettaglioAssembler() {
		super(NotificheController.class, Notifica.class);
	}


	@Override
	public Notifica toModel(NotificaEntity entity) {
		
		Notifica dettaglio = instantiateModel(entity);
		

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

	public void toEntity(UpdateNotifica updateNotifica, NotificaEntity entity) {
		entity.setStato(this.engineAssembler.getStato(updateNotifica.getStato()));
	}

}
