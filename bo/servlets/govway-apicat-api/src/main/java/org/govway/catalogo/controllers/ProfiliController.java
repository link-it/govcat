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

import java.util.*;
import java.util.stream.Collectors;

import org.govway.catalogo.ApiV1Controller;
import org.govway.catalogo.RequestUtils;
import org.govway.catalogo.assembler.*;
import org.govway.catalogo.authorization.ProfiloAuthorization;
import org.govway.catalogo.core.dao.specifications.DominioProfiloSpecification;
import org.govway.catalogo.core.dao.specifications.ProfiloSpecification;
import org.govway.catalogo.core.dao.specifications.SoggettoProfiloSpecification;
import org.govway.catalogo.core.orm.entity.*;
import org.govway.catalogo.core.services.DominioService;
import org.govway.catalogo.core.services.ProfiloService;
import org.govway.catalogo.core.services.SoggettoService;
import org.govway.catalogo.exception.*;
import org.govway.catalogo.servlets.api.ProfiliApi;
import org.govway.catalogo.servlets.model.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.CollectionModel;
import org.springframework.hateoas.IanaLinkRelations;
import org.springframework.hateoas.Link;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@ApiV1Controller
public class ProfiliController implements ProfiliApi {

	@Autowired
	private ProfiloService service;

	@Autowired
	private DominioService dominioService;

	@Autowired
	private SoggettoService soggettoService;

	@Autowired
	private PagedResourcesAssembler<ProfiloEntity> pagedResourceAssembler;

	@Autowired
	private PagedResourcesAssembler<DominioEntity> dominioPagedResourceAssembler;

	@Autowired
	private PagedResourcesAssembler<SoggettoEntity> soggettoPagedResourceAssembler;

    @Autowired
    private ProfiloDettaglioAssembler dettaglioAssembler;

    @Autowired
    private ProfiloItemAssembler itemAssembler;

    @Autowired
    private ProfiloEngineAssembler engineAssembler;

	@Autowired
	private DominioDettaglioAssembler dominioDettaglioAssembler;

	@Autowired
	private SoggettoDettaglioAssembler soggettoDettaglioAssembler;

	@Autowired
	private DominioProfiloAssembler dominioProfiloAssembler;

	@Autowired
	private SoggettoProfiloAssembler soggettoProfiloAssembler;

    @Autowired
    private ProfiloAuthorization authorization;

	@Autowired
	private Configurazione configurazione;
	
	@Autowired
	private RequestUtils requestUtils;
	
	private final Logger logger = LoggerFactory.getLogger(ProfiliController.class);


	@Override
	public ResponseEntity<Profilo> createProfilo(ProfiloCreate profiloCreate) {
		try {
			this.logger.info("Invocazione in corso ...");
			this.authorization.authorizeCreate(profiloCreate);
			this.logger.debug("Autorizzazione completata con successo");

			return this.service.runTransaction( () -> {

				if(this.service.existsByCodiceInterno(profiloCreate.getCodiceInterno())) {
					throw new ConflictException("Profilo ["+profiloCreate.getCodiceInterno()+"] esiste già");
				}

				ProfiloEntity entity = this.dettaglioAssembler.toEntity(profiloCreate);

				this.service.save(entity);
				Profilo model = this.dettaglioAssembler.toModel(entity);

				this.logger.info("Invocazione completata con successo");

				return ResponseEntity.ok(model);
			});

		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Void> deleteProfilo(UUID idProfilo) {
		try {
			return this.service.runTransaction( () -> {
				this.logger.info("Invocazione in corso ...");
				ProfiloEntity profilo = this.service.find(idProfilo)
						.orElseThrow(() -> new NotFoundException("Profilo ["+idProfilo+"] non trovato"));

				this.authorization.authorizeDelete(profilo);
				this.logger.debug("Autorizzazione completata con successo");

				this.service.delete(profilo);
				this.logger.info("Invocazione completata con successo");

				return ResponseEntity.ok().build();
			});
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Profilo> getProfilo(UUID idProfilo) {
		try {

			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");
				ProfiloEntity entity = this.service.find(idProfilo)
						.orElseThrow(() -> new NotFoundException("Profilo ["+idProfilo+"] non trovato"));

				this.authorization.authorizeGet(entity);

				this.logger.debug("Autorizzazione completata con successo");

				Profilo model = this.dettaglioAssembler.toModel(entity);

				this.logger.info("Invocazione completata con successo");

				return ResponseEntity.ok(model);
			});
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<PagedModelItemProfilo> listProfili(String q, Integer page, Integer size, List<String> sort) {
		try {

			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");

				this.authorization.authorizeList();

				this.logger.debug("Autorizzazione completata con successo");

				ProfiloSpecification spec = new ProfiloSpecification();
				spec.setQ(Optional.ofNullable(q));

				CustomPageRequest pageable = new CustomPageRequest(page, size, sort, null);

				Page<ProfiloEntity> findAll = this.service.findAll(spec, pageable);

				Link link = Link.of(ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString(), IanaLinkRelations.SELF);


				PagedModel<ItemProfilo> lst = pagedResourceAssembler.toModel(findAll, this.itemAssembler, link);


				PagedModelItemProfilo list = new PagedModelItemProfilo();
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
	public ResponseEntity<Profilo> updateProfilo(UUID idProfilo, ProfiloUpdate profiloUpdate) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");
				ProfiloEntity entity = this.service.find(idProfilo)
						.orElseThrow(() -> new NotFoundException("Profilo ["+idProfilo+"] non trovato"));

				this.authorization.authorizeUpdate(profiloUpdate, entity);
				this.logger.debug("Autorizzazione completata con successo");

				this.dettaglioAssembler.toEntity(profiloUpdate, entity);

				this.service.save(entity);
				Profilo model = this.dettaglioAssembler.toModel(entity);

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
	public ResponseEntity<Dominio> addDominioProfilo(UUID idProfilo, UUID idDominio) {
		try {

			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");
				DominioEntity dominioEntity = this.dominioService.find(idDominio)
						.orElseThrow(() -> new NotFoundException("Dominio ["+idDominio+"] non trovato"));

				ProfiloEntity profiloEntity = this.service.find(idProfilo)
						.orElseThrow(() -> new NotFoundException("Profilo ["+idProfilo+"] non trovato"));

				this.authorization.authorizeCreateDominioAssociation();
				this.logger.debug("Autorizzazione completata con successo");

				DominioProfiloEntity dominioProfiloEntity = dettaglioAssembler.toEntity(profiloEntity, dominioEntity);

				this.service.save(dominioProfiloEntity);

				Dominio model = this.dominioDettaglioAssembler.toModel(dominioEntity);
				this.logger.info("Invocazione completata con successo");
				return ResponseEntity.ok(model);
			});

		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Soggetto> addSoggettoProfilo(UUID idProfilo, UUID idSoggetto) {
		try {

			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");
				SoggettoEntity soggettoEntity = this.soggettoService.find(idSoggetto)
						.orElseThrow(() -> new NotFoundException("Soggetto ["+idSoggetto+"] non trovato"));

				ProfiloEntity profiloEntity = this.service.find(idProfilo)
						.orElseThrow(() -> new NotFoundException("Profilo ["+idProfilo+"] non trovato"));

				this.authorization.authorizeCreateSoggettoAssociation();
				this.logger.debug("Autorizzazione completata con successo");

				SoggettoProfiloEntity soggettoProfiloEntity = dettaglioAssembler.toEntity(profiloEntity, soggettoEntity);

				this.service.save(soggettoProfiloEntity);

				Soggetto model = this.soggettoDettaglioAssembler.toModel(soggettoEntity);
				this.logger.info("Invocazione completata con successo");
				return ResponseEntity.ok(model);
			});

		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}


	@Override
	public ResponseEntity<Void> deleteDominioProfilo(UUID idProfilo, UUID idDominio) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");

				DominioProfiloEntity dominioProfiloEntity = this.service.findDominioProfilo(idProfilo, idDominio)
						.orElseThrow(() -> new NotFoundException("Associazione tra Profilo ["+idProfilo+"] e Dominio ["+idDominio+"] non trovata"));

				this.authorization.authorizeDeleteDominioAssociation();

				this.logger.debug("Autorizzazione completata con successo");

				this.service.delete(dominioProfiloEntity);

				this.logger.debug("Invocazione completata con successo");
				return ResponseEntity.ok().build();
			});
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Void> deleteSoggettoProfilo(UUID idProfilo, UUID idSoggetto) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");

				SoggettoProfiloEntity soggettoProfiloEntity = this.service.findSoggettoProfilo(idProfilo, idSoggetto)
						.orElseThrow(() -> new NotFoundException("Associazione tra Profilo ["+idProfilo+"] e Soggetto ["+idSoggetto+"] non trovata"));

				this.authorization.authorizeDeleteSoggettoAssociation();

				this.logger.debug("Autorizzazione completata con successo");

				this.service.delete(soggettoProfiloEntity);

				this.logger.debug("Invocazione completata con successo");
				return ResponseEntity.ok().build();
			});
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<PagedModelItemDominio> listDominiProfilo(UUID idProfilo,
			String q,Integer page,
			Integer size,List<String> sort) {
		try {

			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");

				this.authorization.authorizeList();

				this.logger.debug("Autorizzazione completata con successo");

				DominioProfiloSpecification spec = new DominioProfiloSpecification();
				spec.setQ(Optional.ofNullable(q));
				spec.setIdProfilo(Optional.ofNullable(idProfilo));

				CustomPageRequest pageable = new CustomPageRequest(page, size, sort, null);

				Page<DominioProfiloEntity> findAll = this.service.findAllDominiProfilo(spec, pageable);
				CollectionModel<ItemDominio> domini = this.dominioProfiloAssembler.toCollectionModel(findAll.getContent());


				Link link = Link.of(ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString(), IanaLinkRelations.SELF);


				PagedModelItemDominio list = new PagedModelItemDominio();
				list.setContent(new ArrayList<>(domini.getContent()));
				list.add(link);
				list.setPage(new PageMetadata().size((long)findAll.getSize()).number((long)findAll.getNumber()).totalElements(findAll.getTotalElements()).totalPages((long)findAll.getTotalPages()));

				this.logger.info("Invocazione completata con successo");
				return ResponseEntity.ok(list);
			});
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<PagedModelItemSoggetto> listSoggettiProfilo(UUID idProfilo,
			String q,Integer page,
			Integer size,List<String> sort) {
		try {

			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");

				this.authorization.authorizeList();

				this.logger.debug("Autorizzazione completata con successo");

				SoggettoProfiloSpecification spec = new SoggettoProfiloSpecification();
				spec.setQ(Optional.ofNullable(q));
				spec.setIdProfilo(Optional.ofNullable(idProfilo));

				CustomPageRequest pageable = new CustomPageRequest(page, size, sort, null);

				Page<SoggettoProfiloEntity> findAll = this.service.findAllSoggettiProfilo(spec, pageable);
				CollectionModel<ItemSoggetto> soggetti = this.soggettoProfiloAssembler.toCollectionModel(findAll.getContent());


				Link link = Link.of(ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString(), IanaLinkRelations.SELF);


				PagedModelItemSoggetto list = new PagedModelItemSoggetto();
				list.setContent(new ArrayList<>(soggetti.getContent()));
				list.add(link);
				list.setPage(new PageMetadata().size((long)findAll.getSize()).number((long)findAll.getNumber()).totalElements(findAll.getTotalElements()).totalPages((long)findAll.getTotalPages()));

				this.logger.info("Invocazione completata con successo");
				return ResponseEntity.ok(list);
			});
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " + e.getMessage(), e);
			throw new InternalException(e);
		}
	}

}
