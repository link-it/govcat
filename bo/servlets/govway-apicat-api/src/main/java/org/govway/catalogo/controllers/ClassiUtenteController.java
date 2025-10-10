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
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.govway.catalogo.ApiV1Controller;
import org.govway.catalogo.assembler.ClasseUtenteDettaglioAssembler;
import org.govway.catalogo.assembler.ClasseUtenteItemAssembler;
import org.govway.catalogo.authorization.ClasseUtenteAuthorization;
import org.govway.catalogo.core.dao.specifications.ClasseUtenteSpecification;
import org.govway.catalogo.core.orm.entity.ClasseUtenteEntity;
import org.govway.catalogo.core.services.ClasseUtenteService;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.api.ClassiUtenteApi;
import org.govway.catalogo.servlets.model.ClasseUtente;
import org.govway.catalogo.servlets.model.ClasseUtenteCreate;
import org.govway.catalogo.servlets.model.ClasseUtenteUpdate;
import org.govway.catalogo.servlets.model.ItemClasseUtente;
import org.govway.catalogo.servlets.model.PageMetadata;
import org.govway.catalogo.servlets.model.PagedModelItemClasseUtente;
import org.govway.catalogo.servlets.model.PagedModelReferenteClasseUtente;
import org.govway.catalogo.servlets.model.ReferenteClasseUtente;
import org.govway.catalogo.servlets.model.ReferenteClasseUtenteCreate;
import org.govway.catalogo.servlets.model.TipoReferenteClasseUtenteEnum;
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
public class ClassiUtenteController implements ClassiUtenteApi {

	@Autowired
	private ClasseUtenteService service;

	@Autowired
	private PagedResourcesAssembler<ClasseUtenteEntity> pagedResourceAssembler;

	@Autowired
	private ClasseUtenteDettaglioAssembler dettaglioAssembler;

	@Autowired
	private ClasseUtenteItemAssembler itemAssembler;   

	@Autowired
	private ClasseUtenteAuthorization authorization;   

	private Logger logger = LoggerFactory.getLogger(ClassiUtenteController.class);

	@Override
	public ResponseEntity<ClasseUtente> createClasseUtente(ClasseUtenteCreate classeUtenteCreate) {
		try {
			this.logger.info("Invocazione in corso ...");     

			this.authorization.authorizeCreate(classeUtenteCreate);
			this.logger.debug("Autorizzazione completata con successo");     

			return this.service.runTransaction( () -> {

				ClasseUtenteEntity entity = this.dettaglioAssembler.toEntity(classeUtenteCreate);

				if(this.service.exists(entity)) {
					throw new ConflictException(ErrorCode.CLS_404, java.util.Map.of("nome", classeUtenteCreate.getNome()));
				}

				this.service.save(entity);
				ClasseUtente model = this.dettaglioAssembler.toModel(entity);

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
	public ResponseEntity<Void> deleteClasseUtente(UUID idClasseUtente) {
		try {
			this.logger.info("Invocazione in corso ...");     
			ClasseUtenteEntity entity = this.service.findByIdClasseUtente(idClasseUtente)
					.orElseThrow(() -> new NotFoundException(ErrorCode.CLS_404));

			this.authorization.authorizeDelete(entity);
			this.logger.debug("Autorizzazione completata con successo");     

			this.service.delete(entity);
			this.logger.info("Invocazione completata con successo");

			return ResponseEntity.ok().build();

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
	public ResponseEntity<ClasseUtente> getClasseUtente(UUID idClasseUtente) {
		try {
			this.logger.info("Invocazione in corso ...");     
			ClasseUtenteEntity entity = this.service.findByIdClasseUtente(idClasseUtente)
					.orElseThrow(() -> new NotFoundException(ErrorCode.CLS_404));

			this.authorization.authorizeGet(entity);
			this.logger.debug("Autorizzazione completata con successo");     

			ClasseUtente model = this.dettaglioAssembler.toModel(entity);

			this.logger.info("Invocazione completata con successo");

			return ResponseEntity.ok(model);

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
	public ResponseEntity<PagedModelItemClasseUtente> listClassiUtente(
			TipoReferenteClasseUtenteEnum tipoReferente, UUID idClasseUtente, String q, 
			Integer page, Integer size, List<String> sort) {
		try {
			this.logger.info("Invocazione in corso ...");     
			this.authorization.authorizeList();
			this.logger.debug("Autorizzazione completata con successo");     

			ClasseUtenteSpecification spec = new ClasseUtenteSpecification();
			spec.setQ(Optional.ofNullable(q));
			spec.setIdClasseUtente(Optional.ofNullable(idClasseUtente));
			
			CustomPageRequest pageable = new CustomPageRequest(page, size, sort, Arrays.asList("nome"));

			Page<ClasseUtenteEntity> findAll = this.service.findAll(spec, pageable);

			Link link = Link.of(ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString(), IanaLinkRelations.SELF);
			
			PagedModel<ItemClasseUtente> lst = pagedResourceAssembler.toModel(findAll, this.itemAssembler, link);


			PagedModelItemClasseUtente list = new PagedModelItemClasseUtente();
			list.setContent(lst.getContent().stream().collect(Collectors.toList()));
			list.add(lst.getLinks());
			list.setPage(new PageMetadata().size((long)findAll.getSize()).number((long)findAll.getNumber()).totalElements(findAll.getTotalElements()).totalPages((long)findAll.getTotalPages()));

			this.logger.info("Invocazione completata con successo");
			return ResponseEntity.ok(list);

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
	public ResponseEntity<ClasseUtente> updateClasseUtente(UUID idClasseUtente, ClasseUtenteUpdate classeUtenteUpdate) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     
				ClasseUtenteEntity entity = this.service.findByIdClasseUtente(idClasseUtente)
						.orElseThrow(() -> new NotFoundException(ErrorCode.CLS_404));

				this.authorization.authorizeUpdate(classeUtenteUpdate,entity);
				this.logger.debug("Autorizzazione completata con successo");     

				this.dettaglioAssembler.toEntity(classeUtenteUpdate, entity);

				this.service.save(entity);
				ClasseUtente model = this.dettaglioAssembler.toModel(entity);

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
	public ResponseEntity<ReferenteClasseUtente> createReferenteClasseUtente(UUID idClasseUtente,
			ReferenteClasseUtenteCreate referenteClasseUtente) {
		//		try {
		//			this.logger.info("Invocazione in corso ...");     
		//			this.logger.debug("Autorizzazione completata con successo");     
		//
		//			return this.service.runTransaction( () -> {
		//
		//				ClasseUtenteEntity entity = this.service.findByIdClasseUtente(idClasseUtente)
		//						.orElseThrow(() -> new NotFoundException(ErrorCode.CLS_404));
		//	
		//				ReferenteClasseUtente referenteEntity = referenteAssembler.toEntity(referenteClasseUtente, entity);
		//				this.service.save(referenteEntity);
		//
		//				ReferenteClasseUtente model = this.referenteAssembler.toModel(referenteEntity);
		//				this.logger.info("Invocazione completata con successo");
		//				return ResponseEntity.ok(model);
		//			});
		//
		//		}
		//		catch(RuntimeException e) {
		//			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
		//			throw e;
		//		}
		//		catch(Throwable e) {
		//			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
		//			throw new InternalException(ErrorCode.SYS_500);
		//		}
		return null;
	}

	@Override
	public ResponseEntity<Void> deleteReferenteClasseUtente(UUID idClasseUtente, UUID idUtente,
			TipoReferenteClasseUtenteEnum tipoReferente) {
		//		try {
		//			this.logger.info("Invocazione in corso ...");     
		//
		//			this.logger.debug("Autorizzazione completata con successo");     
		//
		//			this.service.deleteReferenteClasseUtente(idClasseUtente, idUtente, this.referenteAssembler.toTipoReferente(tipoReferente));
		//			this.logger.debug("Invocazione completata con successo");     
		//			return ResponseEntity.ok().build();
		//
		//		}
		//		catch(RuntimeException e) {
		//			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
		//			throw e;
		//		}
		//		catch(Throwable e) {
		//			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
		//			throw new InternalException(ErrorCode.SYS_500);
		//		}
		return null;
	}

	@Override
	public ResponseEntity<PagedModelReferenteClasseUtente> listReferentiClasseUtente(UUID idClasseUtente, String q,
			TipoReferenteClasseUtenteEnum tipoReferente, Integer page, Integer size, List<String> sort) {
		//		try {
		//			this.logger.info("Invocazione in corso ...");     
		//
		//			this.logger.debug("Autorizzazione completata con successo");     
		//
		//			ReferenteClasseUtenteSpecification spec = new ReferenteClasseUtenteSpecification();
		//			spec.setQ(Optional.ofNullable(q));
		//			if(idClasseUtente!= null) {
		//				spec.setIdClasseUtente(Optional.of(idClasseUtente));
		//			}
		//			if(tipoReferente!= null) {
		//				spec.setTipoReferente(Optional.of(this.referenteAssembler.toTipoReferente(tipoReferente)));
		//			}
		//
		//
		//			PageRequest pageable = pageRequest.getSort().equals(Sort.unsorted()) ?
		//					PageRequest.of(pageRequest.getPageNumber(), pageRequest.getPageSize(), Sort.by(Order.desc("id"))) :
		//						PageRequest.of(pageRequest.getPageNumber(), pageRequest.getPageSize(), pageRequest.getSort());
		//
		//			Page<ReferenteClasseUtenteEntity> findAll = this.service.findAllReferentiClasseUtente(spec, pageable);
		//
		//			CollectionModel<ReferenteClasseUtente> lst = this.referenteAssembler.toCollectionModel(findAll.getContent());
		//
		//			PagedModelReferenteClasseUtente list = new PagedModelReferenteClasseUtente();
		//			list.setContent(lst.getContent().stream().collect(Collectors.toList()));
		//          Link link = Link.of(ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString(), IanaLinkRelations.SELF);
		//
		//			list.add(link);
		//			list.setPage(new PageMetadata().size((long)findAll.getSize()).number((long)findAll.getNumber()).totalElements(findAll.getTotalElements()).totalPages((long)findAll.getTotalPages()));
		//
		//			this.logger.info("Invocazione completata con successo");
		//			return ResponseEntity.ok(list);
		//
		//		}
		//		catch(RuntimeException e) {
		//			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
		//			throw e;
		//		}
		//		catch(Throwable e) {
		//			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
		//			throw new InternalException(ErrorCode.SYS_500);
		//		}
		return null;
	}

}
