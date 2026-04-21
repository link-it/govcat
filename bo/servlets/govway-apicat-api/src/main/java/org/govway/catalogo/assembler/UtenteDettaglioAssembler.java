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

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.apache.commons.io.IOUtils;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.core.orm.entity.ClasseUtenteEntity;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.RuoloOrganizzazione;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity.Stato;
import org.govway.catalogo.core.orm.entity.UtenteOrganizzazioneEntity;
import org.govway.catalogo.core.services.ClasseUtenteService;
import org.govway.catalogo.core.services.OrganizzazioneService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.model.ConfigurazioneNotifiche;
import org.govway.catalogo.servlets.model.ProfiloUpdate;
import org.govway.catalogo.servlets.model.RuoloOrganizzazioneEnum;
import org.govway.catalogo.servlets.model.Utente;
import org.govway.catalogo.servlets.model.UtenteCreate;
import org.govway.catalogo.servlets.model.UtenteOrganizzazione;
import org.govway.catalogo.servlets.model.UtenteOrganizzazioneCreate;
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

	@Autowired
	private UtenteService utenteService;

	public UtenteDettaglioAssembler() {
		super(OrganizzazioniController.class, Utente.class);
	}

	@Override
	public Utente toModel(UtenteEntity entity) {
		
		Utente dettaglio = instantiateModel(entity);

		BeanUtils.copyProperties(entity, dettaglio);


		dettaglio.setIdUtente(UUID.fromString(entity.getIdUtente()));
		dettaglio.setPrincipal(entity.getPrincipal());
		dettaglio.setStato(utenteEngineAssembler.toStatoUtenteEnum(entity.getStato()));

		dettaglio.setReferenteTecnico(entity.isReferenteTecnico());

		if(entity.getOrganizzazione()!=null) {
			dettaglio.setOrganizzazione(organizzazioneItemAssembler.toModel(entity.getOrganizzazione()));
		}

		if(entity.getOrganizzazionePending()!=null) {
			dettaglio.setOrganizzazionePending(organizzazioneItemAssembler.toModel(entity.getOrganizzazionePending()));
		}

		if(entity.getRuolo()!=null) {
			dettaglio.setRuolo(utenteEngineAssembler.toRuolo(entity.getRuolo()));
		}

		// Popola la lista di associazioni utente-organizzazione (multi-org).
		// Utilizza il repository per evitare LazyInitializationException quando l'entità è detached.
		List<UtenteOrganizzazioneEntity> associazioni = utenteService.findUtenteOrganizzazioniByUtente(entity);
		if (associazioni != null && !associazioni.isEmpty()) {
			List<UtenteOrganizzazione> orgs = associazioni.stream()
					.map(this::toUtenteOrganizzazione)
					.collect(Collectors.toList());
			dettaglio.setOrganizzazioni(orgs);
		}

		if (entity.getOrganizzazioneEsterna() != null) {
			dettaglio.setOrganizzazioneEsterna(entity.getOrganizzazioneEsterna());
		}

		if(entity.getClassi()!=null) {
			dettaglio.setClassiUtente(classeUtenteItemAssembler.toCollectionModel(entity.getClassi()).getContent().stream().collect(Collectors.toList()));
		}
		
		
		return dettaglio;
	}
	
	public UtenteEntity toEntity(UtenteUpdate src, UtenteEntity entity) {
		BeanUtils.copyProperties(src, entity);

		entity.setPrincipal(src.getPrincipal());

		// Gestione multi-organizzazione (con fallback retrocompatibile su id_organizzazione)
		applicaAssociazioniOrganizzazione(entity, src.getOrganizzazioni(), src.getIdOrganizzazione());

		if (src.getOrganizzazioneEsterna() != null) {
			entity.setOrganizzazioneEsterna(src.getOrganizzazioneEsterna());
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
				ClasseUtenteEntity cu = this.classeUtenteService.findByIdClasseUtente(idcu).orElseThrow(() -> new NotFoundException(ErrorCode.CLS_404, java.util.Map.of("idClasseUtente", idcu.toString())));
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

		entity.setIdUtente(UUID.randomUUID().toString());
		entity.setPrincipal(src.getPrincipal());

		// Default notifiche: solo COMUNICAZIONE (no CAMBIO_STATO), tutte le entità e ruoli (no EMAIL)
		entity.setTipiNotificheAbilitate("COMUNICAZIONE");
		entity.setTipiEntitaNotificheAbilitate("SERVIZIO,ADESIONE");
		entity.setRuoliNotificheAbilitate("SERVIZIO_REFERENTE_DOMINIO,SERVIZIO_REFERENTE_TECNICO_DOMINIO,SERVIZIO_REFERENTE_SERVIZIO,SERVIZIO_REFERENTE_TECNICO_SERVIZIO,SERVIZIO_RICHIEDENTE_SERVIZIO,ADESIONE_REFERENTE_DOMINIO,ADESIONE_REFERENTE_TECNICO_DOMINIO,ADESIONE_REFERENTE_SERVIZIO,ADESIONE_REFERENTE_TECNICO_SERVIZIO,ADESIONE_RICHIEDENTE_SERVIZIO,ADESIONE_REFERENTE_ADESIONE,ADESIONE_REFERENTE_TECNICO_ADESIONE,ADESIONE_RICHIEDENTE_ADESIONE,GESTORE,COORDINATORE");

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

		// Gestione multi-organizzazione (con fallback retrocompatibile su id_organizzazione)
		applicaAssociazioniOrganizzazione(entity, src.getOrganizzazioni(), src.getIdOrganizzazione());

		if (src.getOrganizzazioneEsterna() != null) {
			entity.setOrganizzazioneEsterna(src.getOrganizzazioneEsterna());
		}

		if(src.getClassiUtente()!=null) {
			for(UUID idcu: src.getClassiUtente()) {
				ClasseUtenteEntity cu = this.classeUtenteService.findByIdClasseUtente(idcu).orElseThrow(() -> new NotFoundException(ErrorCode.CLS_404, java.util.Map.of("idClasseUtente", idcu.toString())));
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
			throw new BadRequestException(ErrorCode.VAL_400_FORMAT);
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

	/**
	 * Converte un'associazione entity in modello API.
	 */
	public UtenteOrganizzazione toUtenteOrganizzazione(UtenteOrganizzazioneEntity assoc) {
		UtenteOrganizzazione model = new UtenteOrganizzazione();
		model.setOrganizzazione(organizzazioneItemAssembler.toModel(assoc.getOrganizzazione()));
		if (assoc.getRuoloOrganizzazione() != null) {
			model.setRuoloOrganizzazione(toRuoloOrganizzazioneEnum(assoc.getRuoloOrganizzazione()));
		}
		return model;
	}

	/**
	 * Mapping da enum interno RuoloOrganizzazione a enum API RuoloOrganizzazioneEnum.
	 */
	private RuoloOrganizzazioneEnum toRuoloOrganizzazioneEnum(RuoloOrganizzazione ruolo) {
		switch (ruolo) {
		case AMMINISTRATORE_ORGANIZZAZIONE:
			return RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE;
		case OPERATORE_API:
			return RuoloOrganizzazioneEnum.OPERATORE_API;
		default:
			return null;
		}
	}

	/**
	 * Mapping da enum API RuoloOrganizzazioneEnum a enum interno RuoloOrganizzazione.
	 */
	public RuoloOrganizzazione toRuoloOrganizzazione(RuoloOrganizzazioneEnum ruolo) {
		if (ruolo == null) {
			return null;
		}
		switch (ruolo) {
		case AMMINISTRATORE_ORGANIZZAZIONE:
			return RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE;
		case OPERATORE_API:
			return RuoloOrganizzazione.OPERATORE_API;
		default:
			return null;
		}
	}

	/**
	 * Applica le associazioni utente-organizzazione all'entità.
	 *
	 * Priorità:
	 *  1. Se {@code organizzazioniInput} è non null, viene usato come source of truth: rimuove
	 *     associazioni esistenti non presenti nell'input e aggiunge/aggiorna quelle nell'input.
	 *  2. Altrimenti, se {@code idOrganizzazioneLegacy} è presente (alias retrocompatibile),
	 *     viene creata/mantenuta una singola associazione con quell'organizzazione.
	 *     Il ruolo dell'associazione viene impostato a OPERATORE_API se l'utente ha ruolo globale
	 *     RUOLO_ORGANIZZAZIONE (coerentemente con lo script di migrazione), altrimenti null.
	 *  3. Se entrambi sono null, rimuove tutte le associazioni esistenti.
	 *
	 * In tutti i casi aggiorna anche la vecchia FK singola {@code entity.organizzazione} alla
	 * prima associazione (o null se nessuna), per mantenere la retrocompatibilità con il software
	 * precedente che legge ancora quel campo.
	 *
	 * TODO [MULTI-ORG] Rimuovere il fallback su idOrganizzazione (punto 2) quando il frontend
	 * sarà migrato al nuovo modello multi-organizzazione.
	 */
	private void applicaAssociazioniOrganizzazione(UtenteEntity entity,
			List<UtenteOrganizzazioneCreate> organizzazioniInput, UUID idOrganizzazioneLegacy) {

		Set<UtenteOrganizzazioneEntity> associazioni = entity.getUtenteOrganizzazioni();
		if (associazioni == null) {
			associazioni = new HashSet<>();
			entity.setUtenteOrganizzazioni(associazioni);
		}

		if (organizzazioniInput != null) {
			// Source of truth: sincronizza le associazioni con la lista passata.
			sincronizzaAssociazioni(entity, associazioni, organizzazioniInput);
		} else if (idOrganizzazioneLegacy != null) {
			// Fallback retrocompatibile: singola associazione da id_organizzazione.
			RuoloOrganizzazione ruoloDefault = (entity.getRuolo() == UtenteEntity.Ruolo.RUOLO_ORGANIZZAZIONE)
					? RuoloOrganizzazione.OPERATORE_API
					: null;
			UtenteOrganizzazioneCreate legacy = new UtenteOrganizzazioneCreate();
			legacy.setIdOrganizzazione(idOrganizzazioneLegacy);
			legacy.setRuoloOrganizzazione(ruoloDefault != null
					? toRuoloOrganizzazioneEnum(ruoloDefault)
					: null);
			sincronizzaAssociazioni(entity, associazioni, List.of(legacy));
		} else {
			// Nessun input: rimuovi tutte le associazioni.
			associazioni.clear();
		}

		// Aggiorna la vecchia FK singola per retrocompatibilità col software precedente.
		if (associazioni.isEmpty()) {
			entity.setOrganizzazione(null);
		} else {
			entity.setOrganizzazione(associazioni.iterator().next().getOrganizzazione());
		}
	}

	/**
	 * Sincronizza le associazioni esistenti con quelle desiderate:
	 * rimuove quelle non più presenti, aggiorna il ruolo di quelle presenti, aggiunge le nuove.
	 */
	private void sincronizzaAssociazioni(UtenteEntity entity,
			Set<UtenteOrganizzazioneEntity> associazioniEsistenti,
			List<UtenteOrganizzazioneCreate> desiderate) {

		// Mappa id_organizzazione (UUID) → ruolo desiderato
		java.util.Map<UUID, RuoloOrganizzazioneEnum> mapDesiderate = new java.util.HashMap<>();
		for (UtenteOrganizzazioneCreate uc : desiderate) {
			if (uc.getIdOrganizzazione() != null) {
				mapDesiderate.put(uc.getIdOrganizzazione(), uc.getRuoloOrganizzazione());
			}
		}

		// Rimuovi associazioni non più desiderate e aggiorna il ruolo di quelle ancora presenti
		Iterator<UtenteOrganizzazioneEntity> it = associazioniEsistenti.iterator();
		Set<UUID> presenti = new HashSet<>();
		while (it.hasNext()) {
			UtenteOrganizzazioneEntity a = it.next();
			UUID idOrg = UUID.fromString(a.getOrganizzazione().getIdOrganizzazione());
			if (mapDesiderate.containsKey(idOrg)) {
				a.setRuoloOrganizzazione(toRuoloOrganizzazione(mapDesiderate.get(idOrg)));
				presenti.add(idOrg);
			} else {
				it.remove();
			}
		}

		// Aggiungi le nuove associazioni
		for (java.util.Map.Entry<UUID, RuoloOrganizzazioneEnum> e : mapDesiderate.entrySet()) {
			if (presenti.contains(e.getKey())) {
				continue;
			}
			OrganizzazioneEntity org = organizzazioneService.find(e.getKey())
					.orElseThrow(() -> new NotFoundException(ErrorCode.ORG_404,
							Map.of("idOrganizzazione", e.getKey().toString())));
			UtenteOrganizzazioneEntity nuova = new UtenteOrganizzazioneEntity();
			nuova.setUtente(entity);
			nuova.setOrganizzazione(org);
			nuova.setRuoloOrganizzazione(toRuoloOrganizzazione(e.getValue()));
			associazioniEsistenti.add(nuova);
		}
	}

}
