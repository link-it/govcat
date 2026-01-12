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
import org.govway.catalogo.authorization.OrganizzazioneAuthorization;
import org.govway.catalogo.core.dao.specifications.OrganizzazioneSpecification;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.govway.catalogo.core.services.OrganizzazioneService;
import org.govway.catalogo.core.services.SoggettoService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.api.OrganizzazioniApi;
import org.govway.catalogo.servlets.model.ItemOrganizzazione;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.OrganizzazioneCreate;
import org.govway.catalogo.servlets.model.OrganizzazioneUpdate;
import org.govway.catalogo.servlets.model.PageMetadata;
import org.govway.catalogo.servlets.model.PagedModelItemOrganizzazione;
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
					throw new BadRequestException(ErrorCode.ORG_404, Map.of("nome", entity.getNome()));
				}

				SoggettoEntity sd = null;
				if(entity.getSoggettoDefault()!=null) {
					sd = entity.getSoggettoDefault();

					if(!sd.getDomini().isEmpty()) {
						throw new BadRequestException(ErrorCode.SOG_404, Map.of("nome", sd.getNome(), "numDomini", String.valueOf(sd.getDomini().size())));
					}

					entity.setAderente(false); //altrimenti no nla fa aggiornare senza il soggetto defult
					entity.setSoggettoDefault(null);
					this.service.save(entity);

					this.soggettoService.delete(sd);
				}
				
				int size = sd == null ? 0: 1;
				
				if(entity.getSoggetti().size() > size) {
					throw new BadRequestException(ErrorCode.ORG_404, Map.of("nome", entity.getNome()));
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
					throw new ConflictException(ErrorCode.SOG_409, Map.of("nome", customCamelCaseName, "orgNome", soggetto.get().getOrganizzazione().getNome()));
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
}
