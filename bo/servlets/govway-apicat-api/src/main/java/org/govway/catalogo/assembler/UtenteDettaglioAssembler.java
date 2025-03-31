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

import java.io.IOException;
import java.io.InputStream;
import java.time.ZoneOffset;
import java.util.Date;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.apache.commons.io.IOUtils;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.core.orm.entity.ClasseUtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity.Stato;
import org.govway.catalogo.core.services.ClasseUtenteService;
import org.govway.catalogo.core.services.OrganizzazioneService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.model.ConfigurazioneNotifiche;
import org.govway.catalogo.servlets.model.ProfiloUpdate;
import org.govway.catalogo.servlets.model.Utente;
import org.govway.catalogo.servlets.model.UtenteCreate;
import org.govway.catalogo.servlets.model.UtenteUpdate;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;

import io.swagger.v3.core.util.Json;

public class UtenteDettaglioAssembler extends RepresentationModelAssemblerSupport<UtenteEntity, Utente> {

	@Autowired
	private OrganizzazioneItemAssembler organizzazioneItemAssembler;

	@Autowired
	private UtenteEngineAssembler utenteEngineAssembler;

	@Autowired
	private ClasseUtenteItemAssembler classeUtenteItemAssembler;

	@Autowired
	private ClasseUtenteService classeUtenteService;

	@Autowired
	private NotificaEngineAssembler notificaEngineAssembler;

	@Autowired
	private OrganizzazioneService organizzazioneService;

	public UtenteDettaglioAssembler() {
		super(OrganizzazioniController.class, Utente.class);
	}

	@Override
	public Utente toModel(UtenteEntity entity) {
		
		Utente dettaglio = instantiateModel(entity);

		BeanUtils.copyProperties(entity, dettaglio);


		dettaglio.setPrincipal(entity.getPrincipal());
		dettaglio.setStato(utenteEngineAssembler.toStatoUtenteEnum(entity.getStato()));

		dettaglio.setReferenteTecnico(entity.isReferenteTecnico());
		
		dettaglio.setDataCreazione(entity.getDataCreazione().toInstant().atOffset(ZoneOffset.UTC));
		
		if(entity.getDataUltimaModifica()!=null) {
			dettaglio.setDataUltimoAggiornamento(entity.getDataUltimaModifica().toInstant().atOffset(ZoneOffset.UTC));
		}

		if(entity.getOrganizzazione()!=null) {
			dettaglio.setOrganizzazione(organizzazioneItemAssembler.toModel(entity.getOrganizzazione()));
		}
		
		if(entity.getRuolo()!=null) {
			dettaglio.setRuolo(utenteEngineAssembler.toRuolo(entity.getRuolo()));
		}

		if(entity.getClassi()!=null) {
			dettaglio.setClassiUtente(classeUtenteItemAssembler.toCollectionModel(entity.getClassi()).getContent().stream().collect(Collectors.toList()));
		}
		
		
		return dettaglio;
	}
	
	public UtenteEntity toEntity(UtenteUpdate src, UtenteEntity entity) {
		BeanUtils.copyProperties(src, entity);

		entity.setPrincipal(src.getPrincipal());
		if(src.getIdOrganizzazione() != null) {
			entity.setOrganizzazione(organizzazioneService.find(src.getIdOrganizzazione())
					.orElseThrow(() -> new NotFoundException("Organizzazione ["+src.getIdOrganizzazione()+"] non trovata")));
		} else {
			entity.setOrganizzazione(null);
		}
		
		if(src.isReferenteTecnico()!=null) {
			entity.setReferenteTecnico(src.isReferenteTecnico());
		}

		if(src.getRuolo()!=null) {
			entity.setRuolo(utenteEngineAssembler.toEntity(src.getRuolo()));
		} else {
			entity.setRuolo(null);
		}
		
		if(src.getStato() != null && !src.getStato().getValue().trim().isEmpty()) {
			entity.setStato(utenteEngineAssembler.toEntity(src.getStato()));
		} else {
			entity.setStato(Stato.DISABILITATO);
		}

		for(ClasseUtenteEntity c: entity.getClassi()) {
			c.getUtentiAssociati().remove(entity);
		}
		entity.getClassi().clear();

		if(src.getClassiUtente()!=null) {
			for(UUID idcu: src.getClassiUtente()) {
				ClasseUtenteEntity cu = this.classeUtenteService.findByIdClasseUtente(idcu).orElseThrow(() -> new NotFoundException("ClasseUtente con id ["+idcu+"] non trovata"));
				cu.getUtentiAssociati().add(entity);
				entity.getClassi().add(cu);
			}
		}

		return entity;
	}
	
	public UtenteEntity toEntity(ProfiloUpdate src, UtenteEntity entity) {
		BeanUtils.copyProperties(src, entity);

		return entity;
	}
	
	
	public UtenteEntity toEntity(UtenteCreate src) {
		UtenteEntity entity = new UtenteEntity();
		BeanUtils.copyProperties(src, entity);
		
		entity.setIdUtente(UUID.randomUUID());
		entity.setPrincipal(src.getPrincipal());
		
		entity.setDataCreazione(new Date());
		
		if(src.getIdOrganizzazione() != null) {
			entity.setOrganizzazione(organizzazioneService.find(src.getIdOrganizzazione())
					.orElseThrow(() -> new NotFoundException("Organizzazione ["+src.getIdOrganizzazione()+"] non trovata")));
		}
		
		if(src.isReferenteTecnico()!=null) {
			entity.setReferenteTecnico(src.isReferenteTecnico());
		}

		if(src.getRuolo()!=null) {
			entity.setRuolo(utenteEngineAssembler.toEntity(src.getRuolo()));
		}
		
		if(src.getStato() != null && !src.getStato().getValue().trim().isEmpty()) {
			entity.setStato(utenteEngineAssembler.toEntity(src.getStato()));
		} else {
			entity.setStato(Stato.DISABILITATO);
		}
		
		if(src.getClassiUtente()!=null) {
			for(UUID idcu: src.getClassiUtente()) {
				ClasseUtenteEntity cu = this.classeUtenteService.findByIdClasseUtente(idcu).orElseThrow(() -> new NotFoundException("ClasseUtente con id ["+idcu+"] non trovata"));
				cu.getUtentiAssociati().add(entity);
				entity.getClassi().add(cu);
			}
		}

		return entity;
	}

	public void toEntitySettings(Object body, UtenteEntity entity) {
		entity.setMetadati(toMetadati(body));
	}
	
	public JsonNode toSettings(UtenteEntity entity) {
		if(entity.getMetadati()!=null) {
			return getJsonNode(entity.getMetadati());
		} else {
			return Json.mapper().createObjectNode();
		}
	}
	
	private JsonNode getJsonNode(byte[] content) {
		JsonNode tree;
		try {
			tree = Json.mapper().readTree(new String(content));
			return tree;
		} catch (JsonProcessingException e) {
			return Json.mapper().createObjectNode();
		}
	}
	
	private byte[] toMetadati(Object node) {
		if (node == null) {
			return null;
		}
		else if(node instanceof InputStream) {
			try {
				return IOUtils.toByteArray((InputStream) node);
			} catch (IOException e) {
				return null;
			}
		} else if(node instanceof Map) {
			Map<?,?> mapNode = ((Map<?,?>)node);
			
			try {
				return Json.mapper().writeValueAsBytes(mapNode);
			} catch (JsonProcessingException e) {
				return null;
			}
		} else {
			throw new BadRequestException("Tipo non supportato per il campo metadati:  " + node.getClass());
		}

	}

	public ConfigurazioneNotifiche toConfigurazioneNotificheModel(UtenteEntity entity) {
		ConfigurazioneNotifiche c = new ConfigurazioneNotifiche();
		
		c.setEmettiPerEntita(this.notificaEngineAssembler.getTipiEntitaNotificheAbilitate(entity));
		c.setEmettiPerTipi(this.notificaEngineAssembler.getTipiNotificheAbilitate(entity));
		c.setEmettiPerRuoli(this.notificaEngineAssembler.getTagNotificheAbilitate(entity));
		
		return c;
	}

	public void toEntity(ConfigurazioneNotifiche configurazioneNotifiche, UtenteEntity entity) {
		entity.setTipiEntitaNotificheAbilitate(this.notificaEngineAssembler.getTipiEntitaNotificheAbilitate(configurazioneNotifiche.getEmettiPerEntita()));
		entity.setTipiNotificheAbilitate(this.notificaEngineAssembler.getTipiNotificheAbilitate(configurazioneNotifiche.getEmettiPerTipi()));
		entity.setRuoliNotificheAbilitate(this.notificaEngineAssembler.getTagNotificheAbilitate(configurazioneNotifiche.getEmettiPerRuoli()));

	}




}
