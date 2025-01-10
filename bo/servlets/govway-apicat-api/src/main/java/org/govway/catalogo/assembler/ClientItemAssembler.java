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

import org.govway.catalogo.controllers.ClientController;
import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.servlets.model.ItemClient;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class ClientItemAssembler extends RepresentationModelAssemblerSupport<ClientEntity, ItemClient> {

	@Autowired
	private SoggettoItemAssembler soggettoItemAssembler;
	
	@Autowired
	private ClientEngineAssembler clientEngineAssembler;
	
	public ClientItemAssembler() {
		super(ClientController.class, ItemClient.class);
	}

	@Override
	public ItemClient toModel(ClientEntity entity) {
		
		ItemClient dettaglio = instantiateModel(entity);
		

		BeanUtils.copyProperties(entity, dettaglio);

		dettaglio.setIdClient(UUID.fromString(entity.getIdClient()));
		dettaglio.setSoggetto(soggettoItemAssembler.toModel(entity.getSoggetto()));
		dettaglio.setAmbiente(clientEngineAssembler.toAmbiente(entity.getAmbiente()));
		
		dettaglio.setDatiSpecifici(clientEngineAssembler.getEstensioni(entity));
		
		dettaglio.setStato(clientEngineAssembler.toStatoClient(entity.getStato()));
		
		return dettaglio;
	}

}
