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

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.govway.catalogo.controllers.ClientController;
import org.govway.catalogo.core.orm.entity.ClientAdesioneEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity.StatoEnum;
import org.govway.catalogo.core.orm.entity.EstensioneClientEntity;
import org.govway.catalogo.core.services.SoggettoService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.exception.UpdateEntitaComplessaNonValidaSemanticamenteException;
import org.govway.catalogo.servlets.model.AdesioneClientCreate;
import org.govway.catalogo.servlets.model.AuthTypeEnum;
import org.govway.catalogo.servlets.model.Campo;
import org.govway.catalogo.servlets.model.Client;
import org.govway.catalogo.servlets.model.ClientCreate;
import org.govway.catalogo.servlets.model.ClientUpdate;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneProfilo;
import org.govway.catalogo.servlets.model.EntitaComplessaError;
import org.govway.catalogo.servlets.model.StatoClientUpdate;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class ClientDettaglioAssembler extends RepresentationModelAssemblerSupport<ClientEntity, Client> {

	@Autowired
	private SoggettoService soggettoService;

	@Autowired
	private SoggettoItemAssembler soggettoItemAssembler;
	
	@Autowired
	private ClientEngineAssembler clientEngineAssembler;
	
	@Autowired
	private Configurazione configurazione;
	
	public ClientDettaglioAssembler() {
		super(ClientController.class, Client.class);
	}

	@Override
	public Client toModel(ClientEntity entity) {
		
		Client dettaglio = instantiateModel(entity);

		BeanUtils.copyProperties(entity, dettaglio);

		dettaglio.setIdClient(UUID.fromString(entity.getIdClient()));
		dettaglio.setSoggetto(soggettoItemAssembler.toModel(entity.getSoggetto()));
		dettaglio.setAmbiente(clientEngineAssembler.toAmbiente(entity.getAmbiente()));
		
		dettaglio.setDatiSpecifici(clientEngineAssembler.getEstensioni(entity));
		
		dettaglio.setStato(clientEngineAssembler.toStatoClient(entity.getStato()));

		boolean used = false;
		
		
		for(ClientAdesioneEntity a: entity.getAdesioni()) {
			if(this.configurazione.getAdesione().getStatiSchedaAdesione().contains(a.getAdesione().getStato())) {
				used = true;
			}
		}
		
		
		dettaglio.setUtilizzatoInAdesioniConfigurate(used);
		
		return dettaglio;
	}
	
	public ClientEntity toEntity(ClientUpdate src, ClientEntity entity) {
		BeanUtils.copyProperties(src, entity);
		
		if(src.getAmbiente()!=null) {
			entity.setAmbiente(clientEngineAssembler.toAmbiente(src.getAmbiente()));
		}
		
		if(src.getIdSoggetto()!=null) {
			entity.setSoggetto(soggettoService.find(src.getIdSoggetto()).orElseThrow(() -> new NotFoundException(ErrorCode.ORG_005)));
		}
		
		Set<EstensioneClientEntity> estensioni = clientEngineAssembler.getEstensioni(src, entity.getEstensioni());
		entity.getEstensioni().clear();
		entity.getEstensioni().addAll(estensioni);
		
		for(EstensioneClientEntity e: entity.getEstensioni()) {
			e.setClient(entity);
		}
		
		entity.setAuthType(clientEngineAssembler.getAuthType(src.getDatiSpecifici().getAuthType()));

		return entity;
	}
	
	public ClientEntity toEntity(StatoClientUpdate src, ClientEntity entity) {
		BeanUtils.copyProperties(src, entity);
		entity.setStato(clientEngineAssembler.toStatoClient(src.getStato()));
		
		validate(entity);
		
		return entity;
	}

	private void validate(ClientEntity entity) {
		if(entity.getStato().equals(StatoEnum.CONFIGURATO)) {
			List<String> lst = clientEngineAssembler.getErroriConfigurabile(entity);
			if(!lst.isEmpty()) {
				List<EntitaComplessaError> erroreLst = new ArrayList<>();
				EntitaComplessaError e = new EntitaComplessaError();
				e.setCampi(lst.stream()
						.map(element -> {
							Campo c = new Campo();
							c.setNomeCampo(element);
							c.setCustom(false);
							return c;
						}).collect(Collectors.toList()));
				erroreLst.add(e);
				throw new UpdateEntitaComplessaNonValidaSemanticamenteException(ErrorCode.VAL_012, erroreLst);
			}
		}
	}
	
	
	public ClientEntity toEntity(ClientCreate src) {
		ClientEntity entity = new ClientEntity();
		BeanUtils.copyProperties(src, entity);
		entity.setIdClient(UUID.randomUUID().toString());
		entity.setSoggetto(soggettoService.find(src.getIdSoggetto()).orElseThrow(() -> new NotFoundException(ErrorCode.ORG_005)));
		entity.setAmbiente(clientEngineAssembler.toAmbiente(src.getAmbiente()));
		
		entity.getEstensioni().addAll(clientEngineAssembler.getEstensioni(src));
		
		entity.setAuthType(clientEngineAssembler.getAuthType(src.getDatiSpecifici().getAuthType()));

		if(src.getStato()!=null) {
			entity.setStato(clientEngineAssembler.toStatoClient(src.getStato()));
		} else {
			entity.setStato(StatoEnum.NUOVO);
		}
		
		validate(entity);
		
		
		for(EstensioneClientEntity e: entity.getEstensioni()) {
			e.setClient(entity);
		}
		
		return entity;
	}

	public ClientEntity toEntity(AdesioneClientCreate src) {
		ClientEntity entity = new ClientEntity();
		BeanUtils.copyProperties(src, entity);
		entity.setIdClient(UUID.randomUUID().toString());
		entity.setSoggetto(soggettoService.find(src.getIdSoggetto()).orElseThrow(() -> new NotFoundException(ErrorCode.ORG_005)));
		entity.setAmbiente(clientEngineAssembler.toAmbiente(src.getAmbiente()));
		entity.getEstensioni().addAll(clientEngineAssembler.getEstensioni(src));
		entity.setStato(StatoEnum.NUOVO);
		entity.setAuthType(clientEngineAssembler.getAuthType(src.getDatiSpecifici().getAuthType()));
		for(EstensioneClientEntity e: entity.getEstensioni()) {
			e.setClient(entity);
		}
		
		return entity;
	}

	public void checkClientProfilo(ConfigurazioneProfilo cp, ClientEntity c) {
		AuthTypeEnum authTypeClient = clientEngineAssembler.getAuthType(c.getAuthType());
		if(!authTypeClient.equals(cp.getAuthType())) {
			throw new BadRequestException(ErrorCode.CLT_003);
		}
	}

}
