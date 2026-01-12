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

import java.util.UUID;

import org.govway.catalogo.controllers.AdesioniController;
import org.govway.catalogo.core.orm.entity.ClientAdesioneEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.servlets.model.ItemClientAdesione;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class ClientAdesioneItemAssembler extends RepresentationModelAssemblerSupport<ClientAdesioneEntity, ItemClientAdesione> {

	@Autowired
	private SoggettoItemAssembler soggettoItemAssembler;
	
	@Autowired
	private ClientEngineAssembler clientEngineAssembler;
	
	public ClientAdesioneItemAssembler() {
		super(AdesioniController.class, ItemClientAdesione.class);
	}

	@Override
	public ItemClientAdesione toModel(ClientAdesioneEntity entity) {
		
		ItemClientAdesione dettaglio = instantiateModel(entity);
		
		BeanUtils.copyProperties(entity, dettaglio);

		if(entity.getClient()!=null) {
			ClientEntity cEntity = entity.getClient();
			
			BeanUtils.copyProperties(cEntity, dettaglio);

			dettaglio.setIdClient(UUID.fromString(cEntity.getIdClient()));
			dettaglio.setSoggetto(soggettoItemAssembler.toModel(cEntity.getSoggetto()));
			dettaglio.setAmbiente(clientEngineAssembler.toAmbiente(cEntity.getAmbiente()));

			dettaglio.setStato(clientEngineAssembler.toStatoClient(cEntity.getStato()));		
			dettaglio.setDatiSpecifici(clientEngineAssembler.getEstensioni(cEntity));
		}
		
		return dettaglio;
	}

}
