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
package org.govway.catalogo.controllers;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.govway.catalogo.ApiV1Controller;
import org.govway.catalogo.assembler.OrganizzazioneDettaglioAssembler;
import org.govway.catalogo.assembler.OrganizzazioneItemAssembler;
import org.govway.catalogo.assembler.UtenteDettaglioAssembler;
import org.govway.catalogo.assembler.UtenteRestrictedAssembler;
import org.govway.catalogo.core.dao.specifications.UtenteSpecification;
import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.authorization.OrganizzazioneAuthorization;
import org.govway.catalogo.core.dao.specifications.OrganizzazioneSpecification;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.RuoloOrganizzazione;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteOrganizzazioneEntity;
import org.govway.catalogo.core.services.OrganizzazioneService;
import org.govway.catalogo.core.services.SoggettoService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.api.OrganizzazioniApi;
import org.govway.catalogo.servlets.model.ItemOrganizzazione;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.OrganizzazioneCreate;
import org.govway.catalogo.servlets.model.OrganizzazioneUpdate;
import org.govway.catalogo.servlets.model.PageMetadata;
import org.govway.catalogo.servlets.model.PagedModelItemOrganizzazione;
import org.govway.catalogo.servlets.model.ItemUtente;
import org.govway.catalogo.servlets.model.ItemUtenteOrganizzazione;
import org.govway.catalogo.servlets.model.PagedModelItemUtenteOrganizzazione;
import org.govway.catalogo.servlets.model.RuoloOrganizzazioneEnum;
import org.govway.catalogo.servlets.model.UtenteOrganizzazione;
import org.govway.catalogo.servlets.model.UtenteOrganizzazioneAdd;
import org.govway.catalogo.servlets.model.UtenteOrganizzazioneUpdate;
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

@ApiV1Controller
public class OrganizzazioniController implements OrganizzazioniApi {

	@Autowired
	private OrganizzazioneService service;

	@Autowired
	private SoggettoService soggettoService;

	@Autowired
	private PagedResourcesAssembler<OrganizzazioneEntity> pagedResourceAssembler;

	@Autowired
    private OrganizzazioneDettaglioAssembler dettaglioAssembler;
   
    @Autowired
    private OrganizzazioneItemAssembler itemAssembler;   

    @Autowired
	private OrganizzazioneAuthorization authorization;

    @Autowired
    private UtenteService utenteService;

    @Autowired
    private CoreAuthorization coreAuthorization;

    @Autowired
    private UtenteDettaglioAssembler utenteDettaglioAssembler;

    @Autowired
    private UtenteRestrictedAssembler utenteRestrictedAssembler;

    @Autowired
    private PagedResourcesAssembler<UtenteEntity> utentePagedResourceAssembler;

	private Logger logger = LoggerFactory.getLogger(OrganizzazioniController.class);

	@Override
	public ResponseEntity<Organizzazione> createOrganizzazione(OrganizzazioneCreate organizzazioneCreate) {
		try {
			return this.service.runTransaction( () -> {
				this.logger.info("Invocazione in corso ...");     
				this.authorization.authorizeCreate(organizzazioneCreate);
				this.logger.debug("Autorizzazione completata con successo");     

				OrganizzazioneEntity entity = this.dettaglioAssembler.toEntity(organizzazioneCreate);

				if(this.service.existsByNome(entity)) {
					throw new ConflictException(ErrorCode.ORG_409, Map.of("nome", organizzazioneCreate.getNome()));
				}

				String customCamelCaseName = this.service.customCamelCase(organizzazioneCreate.getNome(), true);
				if(this.soggettoService.existsByNome(customCamelCaseName)) {
					throw new ConflictException(ErrorCode.SOG_409, Map.of("nome", customCamelCaseName));
				}
				
				this.service.save(entity);
				Organizzazione model = this.dettaglioAssembler.toModel(entity);

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
			throw new InternalException(ErrorCode.SYS_500);
		}

		
	}

	@Override
	public ResponseEntity<Void> deleteOrganizzazione(UUID idOrganizzazione) {
		try {
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");     
				OrganizzazioneEntity entity = this.service.find(idOrganizzazione)
						.orElseThrow(() -> new NotFoundException(ErrorCode.ORG_404, Map.of("idOrganizzazione", idOrganizzazione.toString())));
	
				this.authorization.authorizeDelete(entity);
				
				this.logger.debug("Autorizzazione completata con successo");     
	
				if(entity.getUtenti().size() > 0) {
					throw new BadRequestException(ErrorCode.ORG_400_HAS_DEPENDENCIES, Map.of("nome", entity.getNome()));
				}

				SoggettoEntity sd = null;
				if(entity.getSoggettoDefault()!=null) {
					sd = entity.getSoggettoDefault();

					if(!sd.getDomini().isEmpty()) {
						throw new BadRequestException(ErrorCode.SOG_400_HAS_DOMAINS, Map.of("nome", sd.getNome(), "numDomini", String.valueOf(sd.getDomini().size())));
					}

					entity.setAderente(false); //altrimenti no nla fa aggiornare senza il soggetto defult
					entity.setSoggettoDefault(null);
					this.service.save(entity);

					this.soggettoService.delete(sd);
				}
				
				int size = sd == null ? 0: 1;
				
				if(entity.getSoggetti().size() > size) {
					throw new BadRequestException(ErrorCode.ORG_400_HAS_DEPENDENCIES, Map.of("nome", entity.getNome()));
				}

				this.service.delete(entity);
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
			throw new InternalException(ErrorCode.SYS_500);
		}
	}

	@Override
	public ResponseEntity<Organizzazione> getOrganizzazione(UUID idOrganizzazione) {
		try {
			return this.service.runTransaction( () -> {
				this.logger.info("Invocazione in corso ...");     
				OrganizzazioneEntity entity = this.service.find(idOrganizzazione)
						.orElseThrow(() -> new NotFoundException(ErrorCode.ORG_404, Map.of("idOrganizzazione", idOrganizzazione.toString())));
	
				this.authorization.authorizeGet(entity);
				this.logger.debug("Autorizzazione completata con successo");     
	
				Organizzazione model = this.dettaglioAssembler.toModel(entity);
	
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
			throw new InternalException(ErrorCode.SYS_500);
		}
	}

	@Override
	public ResponseEntity<PagedModelItemOrganizzazione> listOrganizzazioni(Boolean referente,
			Boolean aderente, Boolean esterna, Boolean soggettoAderente, String codice, 
			String codiceFiscale, String tipo,UUID idOrganizzazione,
			String nome, String q, Integer page, Integer size, List<String> sort) {
		try {
			return this.service.runTransaction( () -> {
				this.logger.info("Invocazione in corso ...");     
				this.authorization.authorizeList();
				this.logger.debug("Autorizzazione completata con successo");     
	
				OrganizzazioneSpecification spec = new OrganizzazioneSpecification();
				spec.setIdOrganizzazione(Optional.ofNullable(idOrganizzazione));
				spec.setNome(Optional.ofNullable(nome));
				spec.setQ(Optional.ofNullable(q));
				spec.setCodice(Optional.ofNullable(codice));
				spec.setCodiceFiscale(Optional.ofNullable(codiceFiscale));
				spec.setTipo(Optional.ofNullable(tipo));
				spec.setReferente(Optional.ofNullable(referente));
				spec.setAderente(Optional.ofNullable(aderente));
				spec.setEsterna(Optional.ofNullable(esterna));
				spec.setSoggettoAderente(Optional.ofNullable(soggettoAderente));
	
				CustomPageRequest pageable = new CustomPageRequest(page, size, sort, Arrays.asList("nome"));

				Page<OrganizzazioneEntity> findAll = this.service.findAll(spec, pageable);
	        
				Link link = Link.of(ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString(), IanaLinkRelations.SELF);

	
				PagedModel<ItemOrganizzazione> lst = pagedResourceAssembler.toModel(findAll, this.itemAssembler, link);
	
	
				PagedModelItemOrganizzazione list = new PagedModelItemOrganizzazione();
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
			throw new InternalException(ErrorCode.SYS_500);
		}

	}

	@Override
	public ResponseEntity<Organizzazione> updateOrganizzazione(UUID idOrganizzazione, OrganizzazioneUpdate organizzazioneUpdate) {
		try {
			
			
			return this.service.runTransaction( () -> {
				this.logger.info("Invocazione in corso ...");     
				OrganizzazioneEntity entity = this.service.find(idOrganizzazione)
						.orElseThrow(() -> new NotFoundException(ErrorCode.ORG_404, Map.of("idOrganizzazione", idOrganizzazione.toString())));
	
				this.authorization.authorizeUpdate(organizzazioneUpdate, entity);
				
				this.logger.debug("Autorizzazione completata con successo");     
				this.dettaglioAssembler.toEntity(organizzazioneUpdate, entity);

				String customCamelCaseName = this.service.customCamelCase(organizzazioneUpdate.getNome(), true);
				Optional<SoggettoEntity> soggetto = soggettoService.findByNome(customCamelCaseName);
				if(soggetto.isPresent() && !soggetto.get().getOrganizzazione().getIdOrganizzazione().equals(idOrganizzazione.toString())) {
					throw new ConflictException(ErrorCode.SOG_409_IN_ORG, Map.of("nome", customCamelCaseName, "orgNome", soggetto.get().getOrganizzazione().getNome()));
				}

				this.service.save(entity);
				Organizzazione model = this.dettaglioAssembler.toModel(entity);

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
			throw new InternalException(ErrorCode.SYS_500);
		}
	}

	/**
	 * Verifica autorizzazione per gestire le associazioni utente-organizzazione:
	 * consente l'operazione al gestore/coordinatore (tramite configurazione amministrazione.organizzazioni)
	 * oppure a un AMMINISTRATORE_ORGANIZZAZIONE dell'organizzazione target.
	 *
	 * @throws NotAuthorizedException se il chiamante non è autorizzato
	 */
	private void authorizeGestioneAssociazioni(OrganizzazioneEntity organizzazione) {
		UtenteEntity utenteSessione = this.coreAuthorization.getUtenteSessione();
		// Se è AMMINISTRATORE_ORGANIZZAZIONE dell'organizzazione target, consentito
		if (this.coreAuthorization.hasRuoloInOrganizzazione(utenteSessione, organizzazione,
				RuoloOrganizzazione.AMMINISTRATORE_ORGANIZZAZIONE)) {
			return;
		}
		// Altrimenti applica la logica standard di autorizzazione sulle organizzazioni
		// (gestore o coordinatore secondo configurazione amministrazione.organizzazioni)
		this.authorization.authorizeUpdate(null, organizzazione);
	}

	@Override
	public ResponseEntity<UtenteOrganizzazione> addUtenteOrganizzazione(UUID idOrganizzazione,
			UtenteOrganizzazioneAdd body) {
		try {
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");
				OrganizzazioneEntity org = this.service.find(idOrganizzazione)
						.orElseThrow(() -> new NotFoundException(ErrorCode.ORG_404,
								Map.of("idOrganizzazione", idOrganizzazione.toString())));

				authorizeGestioneAssociazioni(org);
				this.logger.debug("Autorizzazione completata con successo");

				UtenteEntity utente = this.utenteService.find(body.getIdUtente())
						.orElseThrow(() -> new NotFoundException(ErrorCode.UT_404,
								Map.of("idUtente", body.getIdUtente().toString())));

				if (this.service.findUtenteOrganizzazione(utente, org).isPresent()) {
					throw new ConflictException(ErrorCode.GEN_409,
							Map.of("nomeUtente", utente.getNome(),
									"cognomeUtente", utente.getCognome(),
									"nomeOrganizzazione", org.getNome()));
				}

				UtenteOrganizzazioneEntity assoc = new UtenteOrganizzazioneEntity();
				assoc.setUtente(utente);
				assoc.setOrganizzazione(org);
				assoc.setRuoloOrganizzazione(this.utenteDettaglioAssembler.toRuoloOrganizzazione(body.getRuoloOrganizzazione()));

				UtenteOrganizzazioneEntity saved = this.service.save(assoc);
				this.logger.info("Invocazione completata con successo");

				return ResponseEntity.ok(this.utenteDettaglioAssembler.toUtenteOrganizzazione(saved));
			});
		}
		catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		}
		catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(ErrorCode.SYS_500);
		}
	}

	@Override
	public ResponseEntity<UtenteOrganizzazione> updateRuoloUtenteOrganizzazione(UUID idOrganizzazione,
			UUID idUtente, UtenteOrganizzazioneUpdate body) {
		try {
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");
				OrganizzazioneEntity org = this.service.find(idOrganizzazione)
						.orElseThrow(() -> new NotFoundException(ErrorCode.ORG_404,
								Map.of("idOrganizzazione", idOrganizzazione.toString())));

				authorizeGestioneAssociazioni(org);
				this.logger.debug("Autorizzazione completata con successo");

				UtenteEntity utente = this.utenteService.find(idUtente)
						.orElseThrow(() -> new NotFoundException(ErrorCode.UT_404,
								Map.of("idUtente", idUtente.toString())));

				UtenteOrganizzazioneEntity assoc = this.service.findUtenteOrganizzazione(utente, org)
						.orElseThrow(() -> new NotFoundException(ErrorCode.GEN_404,
								Map.of("idUtente", idUtente.toString(),
										"idOrganizzazione", idOrganizzazione.toString())));

				assoc.setRuoloOrganizzazione(this.utenteDettaglioAssembler.toRuoloOrganizzazione(body.getRuoloOrganizzazione()));
				UtenteOrganizzazioneEntity saved = this.service.save(assoc);

				this.logger.info("Invocazione completata con successo");
				return ResponseEntity.ok(this.utenteDettaglioAssembler.toUtenteOrganizzazione(saved));
			});
		}
		catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		}
		catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(ErrorCode.SYS_500);
		}
	}

	@Override
	public ResponseEntity<Void> removeUtenteOrganizzazione(UUID idOrganizzazione, UUID idUtente) {
		try {
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");
				OrganizzazioneEntity org = this.service.find(idOrganizzazione)
						.orElseThrow(() -> new NotFoundException(ErrorCode.ORG_404,
								Map.of("idOrganizzazione", idOrganizzazione.toString())));

				authorizeGestioneAssociazioni(org);
				this.logger.debug("Autorizzazione completata con successo");

				UtenteEntity utente = this.utenteService.find(idUtente)
						.orElseThrow(() -> new NotFoundException(ErrorCode.UT_404,
								Map.of("idUtente", idUtente.toString())));

				UtenteOrganizzazioneEntity assoc = this.service.findUtenteOrganizzazione(utente, org)
						.orElseThrow(() -> new NotFoundException(ErrorCode.GEN_404,
								Map.of("idUtente", idUtente.toString(),
										"idOrganizzazione", idOrganizzazione.toString())));

				this.service.delete(assoc);
				this.logger.info("Invocazione completata con successo");

				return ResponseEntity.noContent().build();
			});
		}
		catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		}
		catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(ErrorCode.SYS_500);
		}
	}

	@Override
	public ResponseEntity<PagedModelItemUtenteOrganizzazione> listUtentiOrganizzazione(UUID idOrganizzazione,
			Integer page, Integer size, List<String> sort) {
		try {
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");
				OrganizzazioneEntity org = this.service.find(idOrganizzazione)
						.orElseThrow(() -> new NotFoundException(ErrorCode.ORG_404,
								Map.of("idOrganizzazione", idOrganizzazione.toString())));

				authorizeGestioneAssociazioni(org);
				this.logger.debug("Autorizzazione completata con successo");

				// Query diretta sulla tabella utenti_organizzazioni filtrando per l'organizzazione
				// target. Il parametro q (ricerca) non è applicato in questa versione: per filtraggio
				// avanzato sugli utenti rimane disponibile GET /utenti?id_organizzazione=...
				CustomPageRequest pageable = new CustomPageRequest(page, size, sort,
						Arrays.asList("id"));
				Page<UtenteOrganizzazioneEntity> associazioni =
						this.service.findUtenteOrganizzazioniByOrganizzazione(org, pageable);

				List<ItemUtenteOrganizzazione> content = associazioni.getContent().stream().map(assoc -> {
					ItemUtente itemUtente = this.utenteRestrictedAssembler.toModel(assoc.getUtente());
					ItemUtenteOrganizzazione item = new ItemUtenteOrganizzazione();
					item.setUtente(itemUtente);
					if (assoc.getRuoloOrganizzazione() != null) {
						switch (assoc.getRuoloOrganizzazione()) {
						case AMMINISTRATORE_ORGANIZZAZIONE:
							item.setRuoloOrganizzazione(RuoloOrganizzazioneEnum.AMMINISTRATORE_ORGANIZZAZIONE);
							break;
						case OPERATORE_API:
							item.setRuoloOrganizzazione(RuoloOrganizzazioneEnum.OPERATORE_API);
							break;
						}
					}
					return item;
				}).collect(Collectors.toList());

				PagedModelItemUtenteOrganizzazione list = new PagedModelItemUtenteOrganizzazione();
				list.setContent(content);
				list.setPage(new PageMetadata()
						.size((long) associazioni.getSize())
						.number((long) associazioni.getNumber())
						.totalElements(associazioni.getTotalElements())
						.totalPages((long) associazioni.getTotalPages()));

				this.logger.info("Invocazione completata con successo");
				return ResponseEntity.ok(list);
			});
		}
		catch (RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		}
		catch (Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(ErrorCode.SYS_500);
		}
	}
}
