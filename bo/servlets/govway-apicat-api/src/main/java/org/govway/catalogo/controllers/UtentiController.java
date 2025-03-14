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
package org.govway.catalogo.controllers;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.govway.catalogo.ApiV1Controller;
import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.RequestUtils;
import org.govway.catalogo.assembler.ProfiloAssembler;
import org.govway.catalogo.assembler.UtenteDettaglioAssembler;
import org.govway.catalogo.assembler.UtenteEngineAssembler;
import org.govway.catalogo.assembler.UtenteItemAssembler;
import org.govway.catalogo.authorization.UtenteAuthorization;
import org.govway.catalogo.core.dao.specifications.UtenteSpecification;
import org.govway.catalogo.core.orm.entity.ClasseUtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity.Stato;
import org.govway.catalogo.core.services.ClasseUtenteService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.api.UtentiApi;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneNotifiche;
import org.govway.catalogo.servlets.model.ItemUtente;
import org.govway.catalogo.servlets.model.PageMetadata;
import org.govway.catalogo.servlets.model.PagedModelItemUtente;
import org.govway.catalogo.servlets.model.Profilo;
import org.govway.catalogo.servlets.model.ProfiloUpdate;
import org.govway.catalogo.servlets.model.RuoloUtenteEnumSearch;
import org.govway.catalogo.servlets.model.StatoProfiloEnum;
import org.govway.catalogo.servlets.model.StatoUtenteEnum;
import org.govway.catalogo.servlets.model.Utente;
import org.govway.catalogo.servlets.model.UtenteCreate;
import org.govway.catalogo.servlets.model.UtenteUpdate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.IanaLinkRelations;
import org.springframework.hateoas.Link;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.fasterxml.jackson.databind.JsonNode;

@ApiV1Controller
public class UtentiController implements UtentiApi {

	@Autowired
	private UtenteService service;

	@Autowired
	private ClasseUtenteService classeUtenteService;

	@Autowired
	private PagedResourcesAssembler<UtenteEntity> pagedResourceAssembler;

    @Autowired
    private UtenteDettaglioAssembler dettaglioAssembler;
   
    @Autowired
    private UtenteItemAssembler itemAssembler;   

    @Autowired
    private UtenteEngineAssembler engineAssembler;   

    @Autowired
    private UtenteAuthorization authorization;   

    @Autowired
    private ProfiloAssembler profiloAssembler;   

	@Autowired
	private Configurazione configurazione;
	
	@Autowired
	private RequestUtils requestUtils;
	
	private Logger logger = LoggerFactory.getLogger(UtentiController.class);

	@Override
	public ResponseEntity<Utente> createUtente(UtenteCreate utenteCreate) {
		try {
			this.logger.info("Invocazione in corso ...");     
			this.authorization.authorizeCreate(utenteCreate);
			this.logger.debug("Autorizzazione completata con successo");     

			return this.service.runTransaction( () -> {

				if(this.service.existsByPrincipal(utenteCreate.getPrincipal())) {
					throw new ConflictException("Utente ["+utenteCreate.getPrincipal()+"] esiste gia");
				}
				
				UtenteEntity entity = this.dettaglioAssembler.toEntity(utenteCreate);

				this.service.save(entity);
				Utente model = this.dettaglioAssembler.toModel(entity);

				this.logger.info("Invocazione completata con successo");

				return ResponseEntity.ok(model);
			});
     
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}

		
	}

	@Override
	public ResponseEntity<Void> deleteUtente(UUID idUtente) {
		try {
			return this.service.runTransaction( () -> {
				this.logger.info("Invocazione in corso ...");     
				UtenteEntity utente = this.service.find(idUtente)
						.orElseThrow(() -> new NotFoundException("Utente ["+idUtente+"] non trovato"));
	
				this.authorization.authorizeDelete(utente);
				this.logger.debug("Autorizzazione completata con successo");     
	
				String check = this.service.checkReferente(utente);
				
				if(check != null) {
					throw new BadRequestException(check);
				}
				this.service.delete(utente);
				this.logger.info("Invocazione completata con successo");
	
				return ResponseEntity.ok().build();
			});
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Utente> getUtente(UUID idUtente) {
		try {
			
			return this.service.runTransaction( () -> {
	
				this.logger.info("Invocazione in corso ...");     
				UtenteEntity entity = this.service.find(idUtente)
						.orElseThrow(() -> new NotFoundException("Utente ["+idUtente+"] non trovata"));
	
				this.authorization.authorizeGet(entity);
				
				this.logger.debug("Autorizzazione completata con successo");     
	
				Utente model = this.dettaglioAssembler.toModel(entity);
	
				this.logger.info("Invocazione completata con successo");
	
				return ResponseEntity.ok(model);
			});
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<PagedModelItemUtente> listUtenti(StatoUtenteEnum stato, UUID idOrganizzazione,
			List<RuoloUtenteEnumSearch> ruolo, Boolean referenteTecnico, List<UUID> classiUtente, String email, String principal, UUID idUtente, String q, Integer page,
			Integer size, List<String> sort) {
		try {
			
			return this.service.runTransaction( () -> {
	
				this.logger.info("Invocazione in corso ...");     
	
				this.authorization.authorizeList();

				this.logger.debug("Autorizzazione completata con successo");     
	
				UtenteSpecification spec = new UtenteSpecification();
				spec.setQ(Optional.ofNullable(q));
				spec.setEmail(Optional.ofNullable(email));
				spec.setPrincipalLike(Optional.ofNullable(principal));
				spec.setIdUtente(Optional.ofNullable(idUtente));
				spec.setIdOrganizzazione(Optional.ofNullable(idOrganizzazione));
				spec.setReferenteTecnico(Optional.ofNullable(referenteTecnico));
				
				if(classiUtente!=null) {
					List<ClasseUtenteEntity> entities = new ArrayList<>();
					
					for(UUID classeUtente: classiUtente) {
						entities.add(this.classeUtenteService.findByIdClasseUtente(classeUtente)
								.orElseThrow(() -> new NotFoundException("Classe Utente ["+classeUtente+"] non trovata")));
					}
					spec.setIdClassiUtente(entities);
				}
				
				if(stato != null) {
					spec.setStato(Optional.of(this.engineAssembler.toEntity(stato)));
				}
				if(ruolo != null && !ruolo.isEmpty()) {
					spec.setRuoli(this.engineAssembler.toEntity(ruolo));
					if(ruolo.contains(RuoloUtenteEnumSearch.NESSUN_RUOLO)) {
						spec.setRuoloNull(Optional.of(true));
					}
				}

				CustomPageRequest pageable = new CustomPageRequest(page, size, sort,Arrays.asList("cognome", "nome"));
	
				Page<UtenteEntity> findAll = this.service.findAll(spec, pageable);
	        
				Link link = Link.of(ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString(), IanaLinkRelations.SELF);

	
				PagedModel<ItemUtente> lst = pagedResourceAssembler.toModel(findAll, this.itemAssembler, link);
	
	
				PagedModelItemUtente list = new PagedModelItemUtente();
				list.setContent(lst.getContent().stream().collect(Collectors.toList()));
				list.add(lst.getLinks());
				list.setPage(new PageMetadata().size((long)findAll.getSize()).number((long)findAll.getNumber()).totalElements(findAll.getTotalElements()).totalPages((long)findAll.getTotalPages()));
				
				this.logger.info("Invocazione completata con successo");
				return ResponseEntity.ok(list);
			});     
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}

	}

	@Override
	public ResponseEntity<Utente> updateUtente(UUID idUtente, UtenteUpdate utenteUpdate) {
		try {
			return this.service.runTransaction( () -> {
				
				this.logger.info("Invocazione in corso ...");     
				UtenteEntity entity = this.service.find(idUtente)
						.orElseThrow(() -> new NotFoundException("Utente ["+idUtente+"] non trovato"));

				this.authorization.authorizeUpdate(utenteUpdate, entity);
				this.logger.debug("Autorizzazione completata con successo");     

				this.dettaglioAssembler.toEntity(utenteUpdate, entity);
	
				this.service.save(entity);
				Utente model = this.dettaglioAssembler.toModel(entity);

				this.logger.info("Invocazione completata con successo");

				return ResponseEntity.ok(model);
			});

		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Utente> updateProfilo(ProfiloUpdate profiloUpdate) {
		try {
			return this.service.runTransaction( () -> {
				
				this.logger.info("Invocazione in corso ...");     
				InfoProfilo current = this.requestUtils.getPrincipal(false);

				if(current == null || current.utente == null) {
					throw new NotAuthorizedException("Impossibile eseguire l'update profilo, nessun utente in sessione");
				}
				
				UtenteEntity entity = current.utente;

				this.logger.debug("Autorizzazione completata con successo");     

				this.dettaglioAssembler.toEntity(profiloUpdate, entity);
	
				this.service.save(entity);
				Utente model = this.dettaglioAssembler.toModel(entity);

				this.logger.info("Invocazione completata con successo");

				return ResponseEntity.ok(model);
			});

		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Profilo> getProfilo() {
		try {
			return this.service.runTransaction(() -> {
				
			logger.info("PRE InfoProfilo");
				
			InfoProfilo current = this.requestUtils.getPrincipal(false);
			
			logger.info("POST InfoProfilo");
			
			if(current != null) {
				if(current.utente==null) {
					if(this.configurazione.getUtente().isAutoregistrazioneAbilitata()) {
						
						logger.info("PRE getUtente");
						
						UtenteEntity contact = this.requestUtils.getUtente();
						
						logger.info("POST getUtente");
						
						logger.info("PRE getBlankContactFields");
						
						List<String> fields = this.profiloAssembler.getBlankContactFields(contact);
						
						logger.info("POST getBlankContactFields");
						
						logger.info("PRE setStato");
						
						if(!this.configurazione.getUtente().isAutoabilitazioneAbilitata()) {
							contact.setStato(Stato.NON_CONFIGURATO);
						} else if(!fields.isEmpty()) {
							contact.setStato(Stato.NON_CONFIGURATO);
							this.logger.warn("Utente non configurato per campi nullable: " + fields);
						} else {
							contact.setStato(Stato.ABILITATO);
						}
						
						this.service.save(contact);
						logger.info("POST setStato");
						
						return ResponseEntity.ok(this.profiloAssembler.toModel(contact));
					} else {
						
						logger.info("PRE new Profilo");
						
						Profilo contact = new Profilo();
						contact.setStato(StatoProfiloEnum.SCONOSCIUTO);
						contact.setIdm(this.requestUtils.getIdm());
						
						logger.info("POST new Profilo");
						
						return ResponseEntity.ok(contact);
					}
				} else {
					
					logger.info("PRE assembler tomodel");
					
					Profilo convert = this.profiloAssembler.toModel(current.utente);
		
					logger.info("POST assembler tomodel");
					
					if(convert.getStato().equals(StatoProfiloEnum.ABILITATO)) {
						
						return ResponseEntity.ok(convert);
					} else {
						
						return ResponseEntity.badRequest().body(convert);
					}
				}
			} else {
				
				logger.info("PRE new Profilo");
				
				Profilo contact = new Profilo();
				contact.setStato(StatoProfiloEnum.SCONOSCIUTO);
				contact.setIdm(this.requestUtils.getIdm());
				
				logger.info("POST new Profilo");
				
				return ResponseEntity.ok(contact);
			}
			});
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Object> getUtenteSettings(UUID idUtente) {
		try {
			
			return this.service.runTransaction( () -> {
	
				this.logger.info("Invocazione in corso ...");     
				UtenteEntity entity = this.service.find(idUtente)
						.orElseThrow(() -> new NotFoundException("Utente ["+idUtente+"] non trovata"));
	
				this.authorization.authorizeGet(entity);
				
				this.logger.debug("Autorizzazione completata con successo");     
	
				JsonNode model = this.dettaglioAssembler.toSettings(entity);
	
				this.logger.info("Invocazione completata con successo");
	
				return ResponseEntity.ok(model);
			});
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Object> updateUtenteSettings(UUID idUtente, Object body) {
		try {
			return this.service.runTransaction( () -> {
				
				this.logger.info("Invocazione in corso ...");     
				UtenteEntity entity = this.service.find(idUtente)
						.orElseThrow(() -> new NotFoundException("Utente ["+idUtente+"] non trovato"));

				this.authorization.authorizeUpdate(entity);
				this.logger.debug("Autorizzazione completata con successo");     

				this.dettaglioAssembler.toEntitySettings(body, entity);
	
				this.service.save(entity);
				JsonNode model = this.dettaglioAssembler.toSettings(entity);

				this.logger.info("Invocazione completata con successo");

				return ResponseEntity.ok(model);
			});

		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<ConfigurazioneNotifiche> getUtenteSettingsNotifiche(UUID idUtente) {
		try {
			
			return this.service.runTransaction( () -> {
	
				this.logger.info("Invocazione in corso ...");     
				UtenteEntity entity = this.service.find(idUtente)
						.orElseThrow(() -> new NotFoundException("Utente ["+idUtente+"] non trovata"));
	
				this.authorization.authorizeGetNotifiche(entity);
				
				this.logger.debug("Autorizzazione completata con successo");     
	
				ConfigurazioneNotifiche model = this.dettaglioAssembler.toConfigurazioneNotificheModel(entity);
	
				this.logger.info("Invocazione completata con successo");
	
				return ResponseEntity.ok(model);
			});
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<ConfigurazioneNotifiche> updateUtenteSettingsNotifiche(UUID idUtente, ConfigurazioneNotifiche configurazioneNotifiche) {
		try {
			return this.service.runTransaction( () -> {
				
				this.logger.info("Invocazione in corso ...");     
				UtenteEntity entity = this.service.find(idUtente)
						.orElseThrow(() -> new NotFoundException("Utente ["+idUtente+"] non trovato"));

				this.authorization.authorizeUpdate(configurazioneNotifiche, entity);
				this.logger.debug("Autorizzazione completata con successo");     

				this.dettaglioAssembler.toEntity(configurazioneNotifiche, entity);
	
				this.service.save(entity);
				ConfigurazioneNotifiche model = this.dettaglioAssembler.toConfigurazioneNotificheModel(entity);

				this.logger.info("Invocazione completata con successo");

				return ResponseEntity.ok(model);
			});

		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}
}
