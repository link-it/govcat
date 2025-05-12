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
import org.govway.catalogo.assembler.DominioDettaglioAssembler;
import org.govway.catalogo.assembler.DominioItemAssembler;
import org.govway.catalogo.assembler.ReferenteDominioAssembler;
import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.authorization.DominioAuthorization;
import org.govway.catalogo.core.dao.specifications.DominioSpecification;
import org.govway.catalogo.core.dao.specifications.ReferenteDominioSpecification;
import org.govway.catalogo.core.orm.entity.DominioEntity;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.ReferenteDominioEntity;
import org.govway.catalogo.core.orm.entity.TIPO_REFERENTE;
import org.govway.catalogo.core.services.DominioService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.api.DominiApi;
import org.govway.catalogo.servlets.model.Dominio;
import org.govway.catalogo.servlets.model.DominioCreate;
import org.govway.catalogo.servlets.model.DominioUpdate;
import org.govway.catalogo.servlets.model.ItemDominio;
import org.govway.catalogo.servlets.model.PageMetadata;
import org.govway.catalogo.servlets.model.PagedModelItemDominio;
import org.govway.catalogo.servlets.model.PagedModelReferente;
import org.govway.catalogo.servlets.model.Referente;
import org.govway.catalogo.servlets.model.ReferenteCreate;
import org.govway.catalogo.servlets.model.TipoReferenteEnum;
import org.govway.catalogo.servlets.model.VisibilitaDominioEnum;
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
public class DominiController implements DominiApi {

	@Autowired
	private DominioService service;

	@Autowired
	private PagedResourcesAssembler<DominioEntity> pagedResourceAssembler;

    @Autowired
    private DominioDettaglioAssembler dettaglioAssembler;
   
    @Autowired
    private DominioItemAssembler itemAssembler;   

	@Autowired
	private CoreAuthorization coreAuthorization;   

	@Autowired
	private ReferenteDominioAssembler referenteAssembler;

	@Autowired
	private DominioAuthorization authorization;   


	private Logger logger = LoggerFactory.getLogger(DominiController.class);

	@Override
	public ResponseEntity<Dominio> createDominio(DominioCreate dominioCreate) {
		try {
			this.logger.info("Invocazione in corso ...");     
			this.authorization.authorizeCreate(dominioCreate);
			this.logger.debug("Autorizzazione completata con successo");     

			return this.service.runTransaction( () -> {

				DominioEntity entity = this.dettaglioAssembler.toEntity(dominioCreate);

				if(this.service.existsByNome(entity)) {
					throw new ConflictException("Dominio ["+dominioCreate.getNome()+"] esiste gia");
				}
				
				this.service.save(entity);
				Dominio model = this.dettaglioAssembler.toModel(entity);

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
	public ResponseEntity<Void> deleteDominio(UUID idDominio) {
		try {
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");     
				DominioEntity dominio = this.service.find(idDominio)
						.orElseThrow(() -> new NotFoundException("Dominio ["+idDominio+"] non trovato"));
	
				this.authorization.authorizeDelete(dominio);
				this.logger.debug("Autorizzazione completata con successo");     
	
				if(dominio.getServizi().size() > 0) {
					throw new BadRequestException("Dominio ["+dominio.getNome()+"] non eliminabile perché riferito da ["+dominio.getServizi().size()+"] servizi");
				}
				
				this.service.delete(dominio);
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
	public ResponseEntity<Dominio> getDominio(UUID idDominio) {
		try {
				
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");     
				DominioEntity entity = this.service.find(idDominio)
						.orElseThrow(() -> new NotFoundException("Dominio ["+idDominio+"] non trovato"));

				this.authorization.authorizeGet(entity);
				this.logger.debug("Autorizzazione completata con successo");     

				Dominio model = this.dettaglioAssembler.toModel(entity);

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

	public ResponseEntity<PagedModelItemDominio> listDomini(UUID idDominio, String nome, UUID idSoggetto, VisibilitaDominioEnum visibilita, Boolean deprecato, Boolean esterno, String q, Integer page, Integer size, List<String> sort) {
		try {
			
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");     
				this.authorization.authorizeList();
				this.logger.debug("Autorizzazione completata con successo");     
	
				DominioSpecification spec = new DominioSpecification();
				spec.setQ(Optional.ofNullable(q));
				
				spec.setVisibilita(Optional.ofNullable(visibilita).map(v -> this.dettaglioAssembler.toVisibilita(v)));
				spec.setDeprecato(Optional.ofNullable(deprecato));
				spec.setEsterno(Optional.ofNullable(esterno));
				spec.setIdDominio(Optional.ofNullable(idDominio));
				spec.setIdSoggetto(Optional.ofNullable(idSoggetto));
				spec.setNome(Optional.ofNullable(nome));

				CustomPageRequest pageable = new CustomPageRequest(page, size, sort, Arrays.asList("nome"));
				
				Page<DominioEntity> findAll = this.service.findAll(spec, pageable);
	        
				Link link = Link.of(ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString(), IanaLinkRelations.SELF);
				
				PagedModel<ItemDominio> lst = pagedResourceAssembler.toModel(findAll, this.itemAssembler, link);
				
				PagedModelItemDominio list = new PagedModelItemDominio();
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
	public ResponseEntity<Dominio> updateDominio(UUID idDominio, DominioUpdate dominioUpdate) {
		try {
			return this.service.runTransaction( () -> {
				this.logger.info("Invocazione in corso ...");     
				DominioEntity entity = this.service.find(idDominio)
						.orElseThrow(() -> new NotFoundException("Dominio ["+idDominio+"] non trovato"));
	
				this.authorization.authorizeUpdate(dominioUpdate,entity);
				this.logger.debug("Autorizzazione completata con successo");     

				this.dettaglioAssembler.toEntity(dominioUpdate, entity);
	
				this.checkReferenti(entity);

				this.service.save(entity);
				Dominio model = this.dettaglioAssembler.toModel(entity);

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
	public ResponseEntity<Referente> createReferenteDominio(UUID idDominio, ReferenteCreate referente) {
		try {

			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ..."); 
				DominioEntity entity = this.service.find(idDominio)
						.orElseThrow(() -> new NotFoundException("Dominio ["+idDominio+"] non trovato"));

				this.authorization.authorizeReferenteScrittura(entity);
				this.logger.debug("Autorizzazione completata con successo");     

				ReferenteDominioEntity referenteEntity = referenteAssembler.toEntity(referente, entity);

				checkReferente(referenteEntity);

				this.service.save(referenteEntity);

				Referente model = this.referenteAssembler.toModel(referenteEntity);
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
	
	private void checkReferenti(DominioEntity servizioEntity) {

		OrganizzazioneEntity organizzazione = servizioEntity.getSoggettoReferente().getOrganizzazione();
		if(organizzazione.isEsterna()) {
			return;
		}
		
		
		for(ReferenteDominioEntity referenteEntity: servizioEntity.getReferenti()) {
			boolean admin = this.coreAuthorization.isAdmin(referenteEntity.getReferente());
			
			if(!admin) {
				if(referenteEntity.getTipo().equals(TIPO_REFERENTE.REFERENTE) && !organizzazione.equals(referenteEntity.getReferente().getOrganizzazione())) {
					if(referenteEntity.getReferente().getOrganizzazione()!=null) {
						throw new NotAuthorizedException("Organizzazione ["+organizzazione.getNome()+"] interna, ma utente ["+referenteEntity.getReferente().getIdUtente()+"] associato all'organizzazione ["+referenteEntity.getReferente().getOrganizzazione().getNome()+"]");
					} else {
						throw new NotAuthorizedException("Organizzazione ["+organizzazione.getNome()+"] interna, ma utente ["+referenteEntity.getReferente().getIdUtente()+"] non associato ad alcuna organizzazione");
					}
				}
			}

		}
	}
	

	private void checkReferente(ReferenteDominioEntity referenteEntity) {
		if(referenteEntity.getTipo().equals(TIPO_REFERENTE.REFERENTE_TECNICO)) {
			return;
		}
		
		OrganizzazioneEntity organizzazione = referenteEntity.getDominio().getSoggettoReferente().getOrganizzazione();
		if(organizzazione.isEsterna()) {
			return;
		}

		if(!organizzazione.equals(referenteEntity.getReferente().getOrganizzazione())) {
			if(referenteEntity.getReferente().getOrganizzazione()!=null) {
				throw new NotAuthorizedException("Organizzazione ["+organizzazione.getNome()+"] interna, ma utente ["+referenteEntity.getReferente().getIdUtente()+"] associato all'organizzazione ["+referenteEntity.getReferente().getOrganizzazione().getNome()+"]");
			} else {
				throw new NotAuthorizedException("Organizzazione ["+organizzazione.getNome()+"] interna, ma utente ["+referenteEntity.getReferente().getIdUtente()+"] non associato ad alcuna organizzazione");
			}
		}
	}



	@Override
	public ResponseEntity<Void> deleteReferenteDominio(UUID idDominio, UUID idUtente, TipoReferenteEnum tipoReferente) {
		try {
			return this.service.runTransaction( () -> {
	
				this.logger.info("Invocazione in corso ...");     
	
				List<ReferenteDominioEntity> entityLst = this.service.getReferenteDominio(idDominio, idUtente, this.referenteAssembler.toTipoReferente(tipoReferente));
				
				this.authorization.authorizeReferenteScrittura(entityLst.get(0).getDominio());
	
				this.logger.debug("Autorizzazione completata con successo");     
	
				for(ReferenteDominioEntity entity: entityLst) {
					this.service.deleteReferenteDominio(entity);
				}

				this.logger.debug("Invocazione completata con successo");     
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
	public ResponseEntity<PagedModelReferente> listReferentiDominio(UUID idDominio, String q,
			TipoReferenteEnum tipoReferente, Integer page, Integer size, List<String> sort) {
		try {
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");     
				DominioEntity entity = this.service.find(idDominio)
						.orElseThrow(() -> new NotFoundException("Dominio ["+idDominio+"] non trovato"));
	
				this.authorization.authorizeReferenteLettura(entity);
				this.logger.debug("Autorizzazione completata con successo");     
	
				ReferenteDominioSpecification spec = new ReferenteDominioSpecification();
				spec.setQ(Optional.ofNullable(q));
				spec.setIdDominio(Optional.of(idDominio.toString()));

				if(tipoReferente!= null) {
					spec.setTipoReferente(Optional.of(this.referenteAssembler.toTipoReferente(tipoReferente)));
				}
				
				CustomPageRequest pageable = new CustomPageRequest(page, size, sort, Arrays.asList("id,desc"));

				Page<ReferenteDominioEntity> findAll = this.service.findAllReferentiDominio(spec, pageable);
	
				CollectionModel<Referente> lst = this.referenteAssembler.toCollectionModel(findAll.getContent());
	
				PagedModelReferente list = new PagedModelReferente();
				list.setContent(lst.getContent().stream().collect(Collectors.toList()));
				Link link = Link.of(ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString(), IanaLinkRelations.SELF);

				list.add(link);
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

}
