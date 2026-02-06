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
import org.govway.catalogo.assembler.CategoriaDettaglioAssembler;
import org.govway.catalogo.assembler.CategoriaServizioItemAssembler;
import org.govway.catalogo.assembler.ServizioItemAssembler;
import org.govway.catalogo.assembler.TassonomiaDettaglioAssembler;
import org.govway.catalogo.assembler.TassonomiaItemAssembler;
import org.govway.catalogo.core.dao.specifications.CategoriaSpecification;
import org.govway.catalogo.core.dao.specifications.ServizioSpecification;
import org.govway.catalogo.core.dao.specifications.TassonomiaSpecification;
import org.govway.catalogo.core.orm.entity.CategoriaEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.TassonomiaEntity;
import org.govway.catalogo.core.services.ServizioService;
import org.govway.catalogo.core.services.TassonomiaService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.api.TassonomieApi;
import org.govway.catalogo.servlets.model.Categoria;
import org.govway.catalogo.servlets.model.CategoriaCreate;
import org.govway.catalogo.servlets.model.CategoriaUpdate;
import org.govway.catalogo.servlets.model.ItemCategoriaServizio;
import org.govway.catalogo.servlets.model.ItemServizio;
import org.govway.catalogo.servlets.model.ItemTassonomia;
import org.govway.catalogo.servlets.model.ListItemCategoria;
import org.govway.catalogo.servlets.model.PageMetadata;
import org.govway.catalogo.servlets.model.PagedModelItemServizio;
import org.govway.catalogo.servlets.model.PagedModelItemTassonomia;
import org.govway.catalogo.servlets.model.Tassonomia;
import org.govway.catalogo.servlets.model.TassonomiaCreate;
import org.govway.catalogo.servlets.model.TassonomiaUpdate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.IanaLinkRelations;
import org.springframework.hateoas.Link;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@ApiV1Controller
public class TassonomieController implements TassonomieApi {

	private Logger logger = LoggerFactory.getLogger(TassonomieController.class);

	@Autowired
	private TassonomiaService service;

	@Autowired
	private ServizioService servizioService;

	@Autowired
	private PagedResourcesAssembler<TassonomiaEntity> pagedResourceAssembler;

	@Autowired
	private PagedResourcesAssembler<ServizioEntity> servizioPagedResourceAssembler;

	@Autowired
	private ServizioItemAssembler itemServizioAssembler;

	@Autowired
	private TassonomiaItemAssembler itemAssembler;

	@Autowired
	private TassonomiaDettaglioAssembler dettaglioAssembler;

	@Autowired
	private PagedResourcesAssembler<CategoriaEntity> categoriaPagedResourceAssembler;

	@Autowired
	private CategoriaServizioItemAssembler categoriaServizioItemAssembler;

	@Autowired
	private CategoriaDettaglioAssembler categoriaDettaglioAssembler;

	@Override
	public ResponseEntity<Tassonomia> createTassonomia(TassonomiaCreate tassonomiaCreate) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			//TODO: aggiungere autorizzazione AMMINISTRATORE
			this.logger.debug("Autorizzazione completata con successo");     

			return this.service.runTransaction( () -> {

				TassonomiaEntity entity = this.dettaglioAssembler.toEntity(tassonomiaCreate);

				if(this.service.existsByNome(entity.getNome())) {
					throw new ConflictException(ErrorCode.TAX_409, Map.of("nome", entity.getNome()));
				}

				this.service.save(entity);
				Tassonomia model = this.dettaglioAssembler.toModel(entity);

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
	public ResponseEntity<Categoria> createTassonomiaCategoria(UUID idTassonomia, CategoriaCreate categoriaCreate) {
		try {
			this.logger.info("Invocazione in corso ...");   
			//TODO: aggiungere autorizzazione AMMINISTRATORE
			this.logger.debug("Autorizzazione completata con successo");     

			return this.service.runTransaction( () -> {

				TassonomiaEntity tassonomia = this.service.find(idTassonomia)
						.orElseThrow(() -> new NotFoundException(ErrorCode.TAX_404, Map.of("idTassonomia", idTassonomia.toString())));


				CategoriaEntity entity = this.categoriaDettaglioAssembler.toEntity(categoriaCreate, tassonomia);

				if(this.service.existsCategoriaByNome(idTassonomia, entity.getNome())) {
					throw new ConflictException(ErrorCode.CAT_409, Map.of("nome", entity.getNome(), "tassonomia", tassonomia.getNome()));
				}

				this.service.save(entity);
				Categoria model = this.categoriaDettaglioAssembler.toModel(entity);

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
	public ResponseEntity<Void> deleteCategoria(UUID idTassonomia, UUID idCategoria) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ..."); 
				//TODO: aggiungere autorizzazione AMMINISTRATORE
				this.logger.debug("Autorizzazione completata con successo");     

				CategoriaEntity entity = this.service.findCategoria(idCategoria)
						.orElseThrow(() -> new NotFoundException(ErrorCode.CAT_404, Map.of("idCategoria", idCategoria.toString())));

				if(!entity.getTassonomia().getIdTassonomia().equals(idTassonomia.toString())) {
					throw new NotFoundException(ErrorCode.CAT_404);
				}

				if(!entity.getFigli().isEmpty()) {
					throw new BadRequestException(ErrorCode.CAT_404, Map.of("nome", entity.getNome()));
				}
				
				if(!entity.getServizi().isEmpty()) {
					throw new BadRequestException(ErrorCode.CAT_404, Map.of("nome", entity.getNome()));
				}
				
				if(entity.getTassonomia().isVisibile() && entity.getTassonomia().getCategorie().size() == 1) {
					throw new BadRequestException(ErrorCode.CAT_404, Map.of("nome", entity.getNome()));
				}
				
				this.service.delete(entity);
				this.logger.info("Invocazione completata con successo");
				return ResponseEntity.noContent().build();
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
	public ResponseEntity<Void> deleteTassonomia(UUID idTassonomia) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");   
				//TODO: aggiungere autorizzazione AMMINISTRATORE
				this.logger.debug("Autorizzazione completata con successo");     

				TassonomiaEntity entity = this.service.find(idTassonomia)
						.orElseThrow(() -> new NotFoundException(ErrorCode.TAX_404, Map.of("idTassonomia", idTassonomia.toString())));

				if(!entity.getCategorie().isEmpty()) {
					throw new BadRequestException(ErrorCode.TAX_404, Map.of("nome", entity.getNome()));
				}
				
				this.service.delete(entity);
				this.logger.info("Invocazione completata con successo");
				return ResponseEntity.noContent().build();
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
	public ResponseEntity<Categoria> getCategoria(UUID idTassonomia, UUID idCategoria) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");   
				//TODO: aggiungere autorizzazione
				this.logger.debug("Autorizzazione completata con successo");     

				CategoriaEntity entity = this.service.findCategoria(idCategoria)
						.orElseThrow(() -> new NotFoundException(ErrorCode.CAT_404, Map.of("idCategoria", idCategoria.toString())));

				if(!entity.getTassonomia().getIdTassonomia().equals(idTassonomia.toString())) {
					throw new NotFoundException(ErrorCode.CAT_404);
				}

				Categoria model = this.categoriaDettaglioAssembler.toModel(entity);

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
	public ResponseEntity<Tassonomia> getTassonomia(UUID idTassonomia) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");  
				//TODO: aggiungere autorizzazione
				this.logger.debug("Autorizzazione completata con successo");     

				TassonomiaEntity entity = this.service.find(idTassonomia)
						.orElseThrow(() -> new NotFoundException(ErrorCode.TAX_404, Map.of("idTassonomia", idTassonomia.toString())));

				Tassonomia model = this.dettaglioAssembler.toModel(entity);

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
	public ResponseEntity<PagedModelItemTassonomia> listTassonomie(UUID idTassonomia, String q, Integer page,
			Integer size, List<String> sort) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ..."); 
				//TODO: aggiungere autorizzazione
				this.logger.debug("Autorizzazione completata con successo");     

				TassonomiaSpecification spec = new TassonomiaSpecification();
				spec.setIdTassonomia(Optional.ofNullable(idTassonomia));
				spec.setQ(Optional.ofNullable(q));
				
				CustomPageRequest pageable = new CustomPageRequest(page, size, sort, Arrays.asList("nome"));

				Page<TassonomiaEntity> findAll = service.findAll(spec, pageable);
				
				Link link = Link.of(ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString(), IanaLinkRelations.SELF);


				PagedModel<ItemTassonomia> lst = pagedResourceAssembler.toModel(findAll, this.itemAssembler, link);

				PagedModelItemTassonomia list = new PagedModelItemTassonomia();
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
	public ResponseEntity<ListItemCategoria> listCategorie(UUID idTassonomia, String q) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ..."); 
				//TODO: aggiungere autorizzazione
				this.logger.debug("Autorizzazione completata con successo");     

				CategoriaSpecification spec = new CategoriaSpecification();
				spec.setQ(Optional.ofNullable(q));
				spec.setRadice(Optional.of(true));
				if(idTassonomia!=null) {
					spec.setIdTassonomia(Optional.of(idTassonomia));
				}
					
				Page<CategoriaEntity> findAll = service.findAllCategorie(spec, Pageable.unpaged());
				
				Link link = Link.of(ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString(), IanaLinkRelations.SELF);


				PagedModel<ItemCategoriaServizio> lst = categoriaPagedResourceAssembler.toModel(findAll, this.categoriaServizioItemAssembler, link);

				ListItemCategoria list = new ListItemCategoria();
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
			throw new InternalException(ErrorCode.SYS_500);
		}
	}

	@Override
	public ResponseEntity<Categoria> updateCategoria(UUID idTassonomia, UUID idCategoria,
			CategoriaUpdate categoriaUpdate) {
		try {
			this.logger.info("Invocazione in corso ...");  
			//TODO: aggiungere autorizzazione AMMINISTRATORE
			this.logger.debug("Autorizzazione completata con successo");     

			return this.service.runTransaction( () -> {

				CategoriaEntity entity = this.service.findCategoria(idCategoria)
						.orElseThrow(() -> new NotFoundException(ErrorCode.CAT_404, Map.of("idCategoria", idCategoria.toString())));


				if(!entity.getTassonomia().getIdTassonomia().equals(idTassonomia.toString())) {
					throw new NotFoundException(ErrorCode.CAT_404);
				}

				entity = this.categoriaDettaglioAssembler.toEntity(categoriaUpdate, entity);

				this.service.save(entity);

				Categoria model = this.categoriaDettaglioAssembler.toModel(entity);

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
	public ResponseEntity<Tassonomia> updateTassonomia(UUID idTassonomia, TassonomiaUpdate tassonomiaUpdate) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			//TODO: aggiungere autorizzazione AMMINISTRATORE
			this.logger.debug("Autorizzazione completata con successo");     

			return this.service.runTransaction( () -> {

				TassonomiaEntity entity = this.service.find(idTassonomia)
						.orElseThrow(() -> new NotFoundException(ErrorCode.TAX_404, Map.of("idTassonomia", idTassonomia.toString())));

				entity = this.dettaglioAssembler.toEntity(tassonomiaUpdate, entity);

				this.service.save(entity);
				Tassonomia model = this.dettaglioAssembler.toModel(entity);

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
	public ResponseEntity<PagedModelItemServizio> getServiziCategoria(UUID idTassonomia, UUID idCategoria) {
		try {
			this.logger.info("Invocazione in corso ..."); 
			//TODO: aggiungere autorizzazione AMMINISTRATORE
			this.logger.debug("Autorizzazione completata con successo");     
			return this.service.runTransaction( () -> {

				CategoriaEntity entity = this.service.findCategoria(idCategoria)
						.orElseThrow(() -> new NotFoundException(ErrorCode.CAT_404, Map.of("idCategoria", idCategoria.toString())));


				if(!entity.getTassonomia().getIdTassonomia().equals(idTassonomia.toString())) {
					throw new NotFoundException(ErrorCode.CAT_404);
				}


				ServizioSpecification specification = new ServizioSpecification();
				specification.setCategorie(Arrays.asList(UUID.fromString(entity.getIdCategoria())));
				Page<ServizioEntity> findAll = this.servizioService.findAll(
						specification,
						Pageable.unpaged()
						);

				Link link = Link.of(ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString(), IanaLinkRelations.SELF);

				PagedModel<ItemServizio> lst = servizioPagedResourceAssembler.toModel(findAll, this.itemServizioAssembler, link);

				PagedModelItemServizio list = new PagedModelItemServizio();
				list.setContent(lst.getContent().stream().collect(Collectors.toList()));
				list.add(lst.getLinks());
				list.setPage(new PageMetadata().size((long)findAll.getSize()).number((long)findAll.getNumber()).totalElements(findAll.getTotalElements()).totalPages((long)findAll.getTotalPages()));

				this.logger.info("Invocazione completata con successo");
				return ResponseEntity.ok(list);

			});
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500);
		}

	}
}
