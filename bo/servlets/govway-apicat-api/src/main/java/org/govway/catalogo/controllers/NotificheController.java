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
import org.govway.catalogo.assembler.NotificaDettaglioAssembler;
import org.govway.catalogo.assembler.NotificaEngineAssembler;
import org.govway.catalogo.assembler.NotificaItemAssembler;
import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.core.dao.specifications.NotificaSpecification;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.NotificaEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.services.AdesioneService;
import org.govway.catalogo.core.services.NotificaService;
import org.govway.catalogo.core.services.ServizioService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.api.NotificheApi;
import org.govway.catalogo.servlets.model.CountNotifica;
import org.govway.catalogo.servlets.model.ItemNotifica;
import org.govway.catalogo.servlets.model.Notifica;
import org.govway.catalogo.servlets.model.PageMetadata;
import org.govway.catalogo.servlets.model.PagedModelItemNotifica;
import org.govway.catalogo.servlets.model.StatoNotifica;
import org.govway.catalogo.servlets.model.TipoEntitaNotifica;
import org.govway.catalogo.servlets.model.TipoNotificaEnum;
import org.govway.catalogo.servlets.model.UpdateNotifica;
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
public class NotificheController implements NotificheApi {

	@Autowired
	private NotificaService service;

	@Autowired
	private UtenteService utenteService;

	@Autowired
	private ServizioService servizioService;

	@Autowired
	private AdesioneService adesioneService;

	@Autowired
	private PagedResourcesAssembler<NotificaEntity> pagedResourceAssembler;

    @Autowired
    private NotificaItemAssembler itemAssembler;   

    @Autowired
    private NotificaDettaglioAssembler dettaglioAssembler;   

	@Autowired
	private NotificaEngineAssembler engineAssembler;
	
	@Autowired
	private CoreAuthorization coreAuthorization;   
	
	private Logger logger = LoggerFactory.getLogger(NotificheController.class);

	@Override
	public ResponseEntity<CountNotifica> countNotifiche(String q, TipoNotificaEnum tipoNotifica,
			List<StatoNotifica> statoNotifica, TipoEntitaNotifica tipoEntitaNotifica,
			UUID idEntitaNotifica, UUID idMittente, UUID idServizio,
			UUID idAdesione) {

		try {
			this.logger.info("Invocazione in corso ...");     

			return this.service.runTransaction( () -> {

				NotificaSpecification specification = getSpecification(q, tipoNotifica, statoNotifica,
						tipoEntitaNotifica, idEntitaNotifica, idMittente, idServizio, idAdesione);
				
				long cnt = this.service.count(specification);

				CountNotifica count = new CountNotifica();
				count.setCount(cnt);

				this.logger.info("Invocazione completata con successo");
				return ResponseEntity.ok(count);

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

	@Override
	public ResponseEntity<PagedModelItemNotifica> listNotifiche(String q, TipoNotificaEnum tipoNotifica,
			List<StatoNotifica> statoNotifica, TipoEntitaNotifica tipoEntitaNotifica,
			UUID idEntitaNotifica, UUID idMittente, UUID idServizio,
			UUID idAdesione, Integer page, Integer size, List<String> sort) {
		try {
			this.logger.info("Invocazione in corso ...");     

			return this.service.runTransaction( () -> {

				NotificaSpecification specification = getSpecification(q, tipoNotifica, statoNotifica,
						tipoEntitaNotifica, idEntitaNotifica, idMittente, idServizio, idAdesione);
				
				CustomPageRequest pageable = new CustomPageRequest(page, size, sort, Arrays.asList("data,desc"));

				Page<NotificaEntity> findAll = this.service.findAll(
						specification,
						pageable
						);

				Link link = Link.of(ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString(), IanaLinkRelations.SELF);


				PagedModel<ItemNotifica> lst = pagedResourceAssembler.toModel(findAll, this.itemAssembler, link);

				PagedModelItemNotifica list = new PagedModelItemNotifica();
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

	private NotificaSpecification getSpecification(String q, TipoNotificaEnum tipoNotifica, List<StatoNotifica> statoNotifica,
			TipoEntitaNotifica tipoEntitaNotifica, UUID idEntitaNotifica, UUID idMittente, UUID idServizio, UUID idAdesione) {

		UtenteEntity mittente = null;
		if(idMittente != null) {
			mittente = this.utenteService.find(idMittente).orElseThrow(() -> new NotFoundException(ErrorCode.UT_404, Map.of("idUtente", idMittente.toString())));			
		}
		
		ServizioEntity servizio = null;
		if(idServizio != null) {
			servizio= this.servizioService.find(idServizio).orElseThrow(() -> new NotFoundException(ErrorCode.SRV_409, Map.of("idServizio", idServizio.toString())));
		}
		
		AdesioneEntity adesione = null;
		if(idAdesione != null) {
			adesione  = this.adesioneService.findByIdAdesione(idAdesione.toString()).orElseThrow(() -> new NotFoundException(ErrorCode.ADE_404, Map.of("idAdesione", idAdesione.toString())));
		}
		
		NotificaSpecification specification = new NotificaSpecification();
		specification.setQ(Optional.ofNullable(q));
		specification.setIdEntita(Optional.ofNullable(idEntitaNotifica));
		specification.setMittente(Optional.ofNullable(mittente));
		specification.setServizio(Optional.ofNullable(servizio));
		specification.setAdesione(Optional.ofNullable(adesione));
		if(statoNotifica!=null) {
			specification.setStati(statoNotifica.stream().map(s -> this.engineAssembler.getStato(s)).collect(Collectors.toList()));
		}
		specification.setTipoEntita(Optional.ofNullable(this.engineAssembler.getTipoEntita(tipoEntitaNotifica)));
		specification.setTipo(Optional.ofNullable(this.engineAssembler.getTipo(tipoNotifica)));
		specification.setDestinatario(Optional.of(this.coreAuthorization.getUtenteSessione()));
		// Esclude le notifiche di tipo email dalla lista visualizzata nella webapp
		specification.setEscludiEmail(true);
		return specification;
	}

	@Override
	public ResponseEntity<Notifica> updateNotifica(UUID idNotifica, UpdateNotifica updateNotifica) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     
				NotificaEntity entity = this.service.find(idNotifica)
						.orElseThrow(() -> new NotFoundException(ErrorCode.NTF_404, Map.of("idNotifica", idNotifica.toString())));

				if(!this.coreAuthorization.isAdmin()) {
					if(!this.coreAuthorization.getUtenteSessione().getId().equals(entity.getDestinatario().getId())) {
						throw new NotAuthorizedException(ErrorCode.AUT_403_ORG_MISSING);
					}
				}
				
				this.logger.debug("Autorizzazione completata con successo");     

	
				this.dettaglioAssembler.toEntity(updateNotifica, entity);
	
				this.service.save(entity);
				Notifica model = this.dettaglioAssembler.toModel(entity);

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
	public ResponseEntity<Notifica> getNotifica(UUID idNotifica) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     
				this.logger.debug("Autorizzazione completata con successo");     

				NotificaEntity entity = this.service.find(idNotifica)
						.orElseThrow(() -> new NotFoundException(ErrorCode.NTF_404, Map.of("idNotifica", idNotifica.toString())));

				Notifica model = this.dettaglioAssembler.toModel(entity);

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
