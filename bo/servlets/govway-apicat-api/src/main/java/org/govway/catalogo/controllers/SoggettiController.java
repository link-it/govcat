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

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.govway.catalogo.ApiV1Controller;
import org.govway.catalogo.assembler.SoggettoDettaglioAssembler;
import org.govway.catalogo.assembler.SoggettoItemAssembler;
import org.govway.catalogo.authorization.SoggettoAuthorization;
import org.govway.catalogo.core.dao.specifications.SoggettoSpecification;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.govway.catalogo.core.services.SoggettoService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.api.SoggettiApi;
import org.govway.catalogo.servlets.model.ItemSoggetto;
import org.govway.catalogo.servlets.model.PageMetadata;
import org.govway.catalogo.servlets.model.PagedModelItemSoggetto;
import org.govway.catalogo.servlets.model.Soggetto;
import org.govway.catalogo.servlets.model.SoggettoCreate;
import org.govway.catalogo.servlets.model.SoggettoUpdate;
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
public class SoggettiController implements SoggettiApi {

	@Autowired
	private SoggettoService service;

	@Autowired
	private PagedResourcesAssembler<SoggettoEntity> pagedResourceAssembler;

    @Autowired
    private SoggettoDettaglioAssembler dettaglioAssembler;
   
    @Autowired
    private SoggettoItemAssembler itemAssembler;   

    @Autowired
    private SoggettoAuthorization authorization;   

	private Logger logger = LoggerFactory.getLogger(SoggettiController.class);

	@Override
	public ResponseEntity<Soggetto> createSoggetto(SoggettoCreate soggettoCreate) {
		try {
			this.logger.info("Invocazione in corso ...");     
			this.authorization.authorizeCreate(soggettoCreate);
			this.logger.debug("Autorizzazione completata con successo");     

			return this.service.runTransaction( () -> {

				SoggettoEntity entity = this.dettaglioAssembler.toEntity(soggettoCreate);

				if(this.service.existsByNome(entity)) {
					throw new ConflictException(ErrorCode.ORG_006, Map.of("nome", soggettoCreate.getNome()));
				}
				
				this.service.save(entity);
				Soggetto model = this.dettaglioAssembler.toModel(entity);

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
			throw new InternalException(ErrorCode.SYS_001);
		}

		
	}

	@Override
	public ResponseEntity<Void> deleteSoggetto(UUID idSoggetto) {
		try {
			return this.service.runTransaction( () -> {
	
				this.logger.info("Invocazione in corso ...");     
				SoggettoEntity entity = this.service.find(idSoggetto)
						.orElseThrow(() -> new NotFoundException(ErrorCode.ORG_005, Map.of("idSoggetto", idSoggetto.toString())));
				this.authorization.authorizeDelete(entity);
				this.logger.debug("Autorizzazione completata con successo");     
	
				if(!entity.getDomini().isEmpty()) {
					throw new BadRequestException(ErrorCode.ORG_005, Map.of("nome", entity.getNome()));
				}
				
				if(entity.getOrganizzazione().getSoggettoDefault() != null && entity.getOrganizzazione().getSoggettoDefault().getId().equals(entity.getId())) {
					throw new BadRequestException(ErrorCode.ORG_005, Map.of("nome", entity.getNome()));
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
			throw new InternalException(ErrorCode.SYS_001);
		}
	}

	@Override
	public ResponseEntity<Soggetto> getSoggetto(UUID idSoggetto) {
		try {
			return this.service.runTransaction( () -> {
				this.logger.info("Invocazione in corso ...");     
				SoggettoEntity entity = this.service.find(idSoggetto)
						.orElseThrow(() -> new NotFoundException(ErrorCode.ORG_005, Map.of("idSoggetto", idSoggetto.toString())));
				this.authorization.authorizeGet(entity);
				this.logger.debug("Autorizzazione completata con successo");     
	
				Soggetto model = this.dettaglioAssembler.toModel(entity);
	
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
			throw new InternalException(ErrorCode.SYS_001);
		}
	}

	@Override
	public ResponseEntity<PagedModelItemSoggetto> listSoggetti(Boolean referente, Boolean aderente, String nome, UUID idOrganizazzione, UUID idSoggetto, String q, Integer page, Integer size, List<String> sort) {
		try {
			return this.service.runTransaction( () -> {
	
				this.logger.info("Invocazione in corso ...");     
				this.authorization.authorizeList();
				this.logger.debug("Autorizzazione completata con successo");     
	
				SoggettoSpecification spec = new SoggettoSpecification();
				spec.setIdSoggetto(Optional.ofNullable(idSoggetto));
				spec.setIdOrganizzazione(Optional.ofNullable(idOrganizazzione));
				spec.setQ(Optional.ofNullable(q));
				spec.setNome(Optional.ofNullable(nome));
				spec.setReferente(Optional.ofNullable(referente));
				spec.setAderente(Optional.ofNullable(aderente));
				
	
				CustomPageRequest pageable = new CustomPageRequest(page, size, sort, Arrays.asList("nome,desc"));

				Page<SoggettoEntity> findAll = this.service.findAll(spec, pageable);
	        
				Link link = Link.of(ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString(), IanaLinkRelations.SELF);
	
				PagedModel<ItemSoggetto> lst = pagedResourceAssembler.toModel(findAll, this.itemAssembler, link);
	
	
				PagedModelItemSoggetto list = new PagedModelItemSoggetto();
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
			throw new InternalException(ErrorCode.SYS_001);
		}

	}

	@Override
	public ResponseEntity<Soggetto> updateSoggetto(UUID idSoggetto, SoggettoUpdate soggettoUpdate) {
		try {
			return this.service.runTransaction( () -> {
				
				this.logger.info("Invocazione in corso ...");   
				
				SoggettoEntity entity = this.service.find(idSoggetto)
						.orElseThrow(() -> new NotFoundException(ErrorCode.ORG_005, Map.of("idSoggetto", idSoggetto.toString())));

				this.authorization.authorizeUpdate(soggettoUpdate, entity);

				if(!soggettoUpdate.getNome().equals(entity.getNome())) {
					if(this.service.existsByNome(soggettoUpdate.getNome())) {
						throw new ConflictException(ErrorCode.ORG_006, Map.of("nome", soggettoUpdate.getNome()));
					}
				}
				
				this.logger.debug("Autorizzazione completata con successo");     

	
				this.dettaglioAssembler.toEntity(soggettoUpdate, entity);
	
				this.service.save(entity);
				Soggetto model = this.dettaglioAssembler.toModel(entity);
	
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
			throw new InternalException(ErrorCode.SYS_001);
		}
	}

}
