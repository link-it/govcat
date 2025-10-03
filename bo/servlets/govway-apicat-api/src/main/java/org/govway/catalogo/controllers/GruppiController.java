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

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.govway.catalogo.ApiV1Controller;
import org.govway.catalogo.assembler.GruppoDettaglioAssembler;
import org.govway.catalogo.assembler.GruppoItemAssembler;
import org.govway.catalogo.authorization.GruppoAuthorization;
import org.govway.catalogo.core.dao.specifications.GruppoSpecification;
import org.govway.catalogo.core.orm.entity.GruppoEntity;
import org.govway.catalogo.core.services.GruppoService;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.api.GruppiApi;
import org.govway.catalogo.servlets.model.Gruppo;
import org.govway.catalogo.servlets.model.GruppoCreate;
import org.govway.catalogo.servlets.model.GruppoUpdate;
import org.govway.catalogo.servlets.model.ItemGruppo;
import org.govway.catalogo.servlets.model.ListItemGruppo;
import org.govway.catalogo.servlets.model.TipoServizio;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.IanaLinkRelations;
import org.springframework.hateoas.Link;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@ApiV1Controller
public class GruppiController implements GruppiApi {

	@Autowired
	private GruppoService service;

	@Autowired
	private PagedResourcesAssembler<GruppoEntity> pagedResourceAssembler;

    @Autowired
    private GruppoDettaglioAssembler dettaglioAssembler;
   
    @Autowired
    private GruppoItemAssembler itemAssembler;   

    @Autowired
	private GruppoAuthorization authorization;   
    
	private Logger logger = LoggerFactory.getLogger(GruppiController.class);

	@Override
	public ResponseEntity<Gruppo> createGruppo(GruppoCreate gruppoCreate) {
		try {
			
			this.logger.info("Invocazione in corso ...");     
			this.authorization.authorizeCreate(gruppoCreate);
			this.logger.debug("Autorizzazione completata con successo"); 
			
			return this.service.runTransaction( () -> {    

				GruppoEntity entity = this.dettaglioAssembler.toEntity(gruppoCreate);

				if(this.service.existsByNome(entity)) {
					throw new ConflictException(ErrorCode.GRP_002, Map.of("nome", gruppoCreate.getNome()));
				}
				
				this.service.save(entity);
				Gruppo model = this.dettaglioAssembler.toModel(entity);

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
	public ResponseEntity<Void> deleteGruppo(UUID idGruppo) {
		try {
			
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");     
				GruppoEntity gruppo = this.service.find(idGruppo)
						.orElseThrow(() -> new NotFoundException(ErrorCode.GRP_001, Map.of("idGruppo", idGruppo.toString())));
	
				this.authorization.authorizeDelete(gruppo);
				this.logger.debug("Autorizzazione completata con successo");     
	
				this.service.delete(gruppo);
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
	public ResponseEntity<Gruppo> getGruppo(UUID idGruppo) {
		try {
			
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");
				
				GruppoEntity entity = this.service.find(idGruppo)
						.orElseThrow(() -> new NotFoundException(ErrorCode.GRP_001, Map.of("idGruppo", idGruppo.toString())));
	
				this.authorization.authorizeGet(entity);
				
				this.logger.debug("Autorizzazione completata con successo");     
	
				Gruppo model = this.dettaglioAssembler.toModel(entity);
	
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
	public ResponseEntity<ListItemGruppo> listGruppi(UUID idGruppoPadre, Boolean gruppoNull, UUID idGruppo, String nome, TipoServizio tipo, String q) {
		try {
			
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");     
				this.authorization.authorizeList();
				this.logger.debug("Autorizzazione completata con successo");     
	
				GruppoSpecification spec = new GruppoSpecification();
				spec.setQ(Optional.ofNullable(q));
				spec.setNome(Optional.ofNullable(nome));
				spec.setIdGruppo(Optional.ofNullable(idGruppo));
				spec.setIdGruppoPadre(Optional.ofNullable(idGruppoPadre));
				spec.setGruppoPadreNull(Optional.ofNullable(gruppoNull));
	
				if(tipo != null) {
					spec.setTipo(Optional.of(this.dettaglioAssembler.toTipo(tipo)));
				}

				Page<GruppoEntity> findAll = this.service.findAll(spec, Pageable.unpaged());
	        
				Link link = Link.of(ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString(), IanaLinkRelations.SELF);
	
				PagedModel<ItemGruppo> lst = pagedResourceAssembler.toModel(findAll, this.itemAssembler, link);
							
				ListItemGruppo list = new ListItemGruppo();
				list.setContent(lst.getContent().stream().collect(Collectors.toList()));
				list.add(lst.getLinks());

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
	public ResponseEntity<Gruppo> updateGruppo(UUID idGruppo, GruppoUpdate gruppoUpdate) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     
				GruppoEntity entity = this.service.find(idGruppo)
						.orElseThrow(() -> new NotFoundException(ErrorCode.GRP_001, Map.of("idGruppo", idGruppo.toString())));
				
				this.authorization.authorizeUpdate(gruppoUpdate, entity);
				
				this.logger.debug("Autorizzazione completata con successo");     

	
				this.dettaglioAssembler.toEntity(gruppoUpdate, entity);
	
				this.service.save(entity);
				Gruppo model = this.dettaglioAssembler.toModel(entity);

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
	public ResponseEntity<Resource> getImmagineGruppo(UUID idGruppo) {
		try {
			
			this.logger.info("Invocazione in corso ...");     
			this.logger.debug("Autorizzazione completata con successo");     

			return this.service.runTransaction( () -> {

				logger.info("PRE service.find(idGruppo)");
				
				GruppoEntity entity = this.service.find(idGruppo)
						.orElseThrow(() -> new NotFoundException(ErrorCode.GRP_001, Map.of("idGruppo", idGruppo.toString())));

				logger.info("POST service.find(idGruppo)");
				
				if(entity.getImmagine() == null) {
					throw new NotFoundException(ErrorCode.SRV_004, Map.of("idGruppo", idGruppo.toString()));
				}
				
				logger.info("PRE Resource resource = new ByteArrayResource(entity.getImmagine().getRawData())");
				
				Resource resource = new ByteArrayResource(entity.getImmagine().getRawData());
				
				logger.info("POST Resource resource = new ByteArrayResource(entity.getImmagine().getRawData())");
				
				this.logger.info("Invocazione completata con successo");
				
				return ResponseEntity.status(HttpStatus.OK)
						.header("Content-Type", entity.getImmagine().getTipo())
						.header("Content-Length", entity.getImmagine().getRawData().length + "")
						//						.header("Content-Disposition", "attachment; filename="+entity.getImmagine().getFilename())
						.body(resource);
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
