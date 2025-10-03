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

import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

import javax.persistence.EntityManager;

import org.govway.catalogo.ApiV1Controller;
import org.govway.catalogo.assembler.AdesioneDettaglioAssembler;
import org.govway.catalogo.assembler.AdesioneItemAssembler;
import org.govway.catalogo.assembler.ClientAdesioneItemAssembler;
import org.govway.catalogo.assembler.DocumentoAllegatoAssembler;
import org.govway.catalogo.assembler.ErogazioneItemAssembler;
import org.govway.catalogo.assembler.ItemMessaggioAdesioneAssembler;
import org.govway.catalogo.assembler.ReferenteAdesioneAssembler;
import org.govway.catalogo.assembler.UtenteItemAssembler;
import org.govway.catalogo.authorization.AdesioneAuthorization;
import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.core.business.utils.NotificheUtils;
import org.govway.catalogo.core.business.utils.SchedaAdesioneBuilder;
import org.govway.catalogo.core.dao.specifications.AdesioneSpecification;
import org.govway.catalogo.core.dao.specifications.MessaggioAdesioneSpecification;
import org.govway.catalogo.core.dao.specifications.ReferenteAdesioneSpecification;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.AdesioneEntity.STATO_CONFIGURAZIONE;
import org.govway.catalogo.core.orm.entity.AmbienteEnum;
import org.govway.catalogo.core.orm.entity.ClientAdesioneEntity;
import org.govway.catalogo.core.orm.entity.DocumentoEntity;
import org.govway.catalogo.core.orm.entity.ErogazioneEntity;
import org.govway.catalogo.core.orm.entity.EstensioneAdesioneEntity;
import org.govway.catalogo.core.orm.entity.EstensioneClientEntity;
import org.govway.catalogo.core.orm.entity.MessaggioAdesioneEntity;
import org.govway.catalogo.core.orm.entity.NotificaEntity;
import org.govway.catalogo.core.orm.entity.ReferenteAdesioneEntity;
import org.govway.catalogo.core.orm.entity.StatoAdesioneEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.services.AdesioneService;
import org.govway.catalogo.core.services.NotificaService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.exception.UpdateEntitaComplessaNonValidaSemanticamenteException;
import org.govway.catalogo.servlets.api.AdesioniApi;
import org.govway.catalogo.servlets.model.Adesione;
import org.govway.catalogo.servlets.model.AdesioneClientUpdate;
import org.govway.catalogo.servlets.model.AdesioneCreate;
import org.govway.catalogo.servlets.model.AdesioneErogazioneUpdate;
import org.govway.catalogo.servlets.model.AdesioneUpdate;
import org.govway.catalogo.servlets.model.AdesioniCambioStatoResponse;
import org.govway.catalogo.servlets.model.AllegatoMessaggio;
import org.govway.catalogo.servlets.model.AllegatoMessaggioCreate;
import org.govway.catalogo.servlets.model.CheckDati;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneAutomatica;
import org.govway.catalogo.servlets.model.ConfigurazioneClasseDato;
import org.govway.catalogo.servlets.model.DatiCustomAdesioneUpdate;
import org.govway.catalogo.servlets.model.ErroreCambioStatoResponse;
import org.govway.catalogo.servlets.model.Grant;
import org.govway.catalogo.servlets.model.ItemAdesione;
import org.govway.catalogo.servlets.model.ItemComunicazione;
import org.govway.catalogo.servlets.model.ItemErogazioneAdesione;
import org.govway.catalogo.servlets.model.ItemMessaggio;
import org.govway.catalogo.servlets.model.MessaggioCreate;
import org.govway.catalogo.servlets.model.MessaggioUpdate;
import org.govway.catalogo.servlets.model.OkKoEnum;
import org.govway.catalogo.servlets.model.PageMetadata;
import org.govway.catalogo.servlets.model.PagedModelItemAdesione;
import org.govway.catalogo.servlets.model.PagedModelItemClientAdesione;
import org.govway.catalogo.servlets.model.PagedModelItemComunicazione;
import org.govway.catalogo.servlets.model.PagedModelItemConfigurazioneAdesione;
import org.govway.catalogo.servlets.model.PagedModelItemErogazioneAdesione;
import org.govway.catalogo.servlets.model.PagedModelItemMessaggio;
import org.govway.catalogo.servlets.model.PagedModelReferente;
import org.govway.catalogo.servlets.model.Referente;
import org.govway.catalogo.servlets.model.ReferenteCreate;
import org.govway.catalogo.servlets.model.Ruolo;
import org.govway.catalogo.servlets.model.StatoConfigurazioneAutomaticaEnum;
import org.govway.catalogo.servlets.model.StatoUpdate;
import org.govway.catalogo.servlets.model.TipoComunicazione;
import org.govway.catalogo.servlets.model.TipoReferenteEnum;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.CollectionModel;
import org.springframework.hateoas.IanaLinkRelations;
import org.springframework.hateoas.Link;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@ApiV1Controller
public class AdesioniController implements AdesioniApi {

	private Logger logger = LoggerFactory.getLogger(AdesioniController.class);

	@Autowired
	private PagedResourcesAssembler<MessaggioAdesioneEntity> messaggioPagedResourceAssembler;

	@Autowired
	private PagedResourcesAssembler<AdesioneEntity> pagedResourceAssembler;

	@Autowired
	private Configurazione configurazione;

	@Autowired
	private AdesioneService service;

	@Autowired
	private SchedaAdesioneBuilder adesioneBuilder;

	@Autowired
	private ItemMessaggioAdesioneAssembler itemMessaggioAssembler;

	@Autowired
	private ReferenteAdesioneAssembler referenteAssembler;

	@Autowired
	private DocumentoAllegatoAssembler documentoAllegatoAssembler;

	@Autowired
	private AdesioneDettaglioAssembler dettaglioAssembler;

	@Autowired
	private AdesioneItemAssembler itemAssembler;

	@Autowired
	private ClientAdesioneItemAssembler clientAdesioneItemAssembler;

	@Autowired
    private ErogazioneItemAssembler erogazioneItemAssembler;   

	@Autowired
	private UtenteItemAssembler itemUtenteAssembler;

	@Autowired
	private AdesioneAuthorization authorization;   

	@Autowired
	private CoreAuthorization coreAuthorization;   

	@Autowired
	private NotificheUtils notificheUtils;   

	@Autowired
	private NotificaService notificaService;   

	@Autowired
	private EntityManager entityManager;   

	@Override
	public ResponseEntity<Adesione> createAdesione(AdesioneCreate adesioneCreate) {
		try {
			return this.service.runTransaction( () -> {
				
				logger.info("PRE assembler toentity");
				
				this.logger.info("Invocazione in corso ...");     
				AdesioneEntity entity = this.dettaglioAssembler.toEntity(adesioneCreate);

				logger.info("POST assembler toentity");
				
				logger.info("PRE authorization");
				
				this.authorization.authorizeModifica(entity, Arrays.asList(ConfigurazioneClasseDato.IDENTIFICATIVO));
				
				logger.info("POST authorization");
				
				logger.info("PRE existsBySoggettoServizioNonArchiviato");
				
				if(this.service.existsBySoggettoServizioNonArchiviato(entity, configurazione.getAdesione().getWorkflow().getStatoArchiviato())) {
					if(!entity.getServizio().isMultiAdesione()) {
						throw new ConflictException(ErrorCode.ADE_002, java.util.Map.of("soggetto", entity.getSoggetto().getNome(), "servizio", entity.getServizio().getNome(), "versione", entity.getServizio().getVersione().toString()));
					}
				}
				
				logger.info("POST existsBySoggettoServizioNonArchiviato");
				
				this.logger.debug("Autorizzazione completata con successo");     

				logger.info("PRE save entity");
				
				this.service.save(entity);
				
				logger.info("POST save entity");
				
				logger.info("PRE lstNotifiche");
				
				List<NotificaEntity> lstNotifiche = this.notificheUtils.getNotificheCreazioneAdesione(entity);
				lstNotifiche.stream().forEach(n -> this.notificaService.save(n));

				logger.info("POST lstNotifiche");
				
				logger.info("PRE assembler tomodel");
				
				Adesione model = this.dettaglioAssembler.toModel(entity);
				this.logger.info("Invocazione completata con successo");
				
				logger.info("POST assembler tomodel");
				
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

	private AdesioneEntity findOne(UUID idAdesione) {
		
		UtenteEntity utente = this.coreAuthorization.getUtenteSessione();
		
		if(utente == null) {
			throw new NotFoundException(ErrorCode.ADE_001, java.util.Map.of("idAdesione", idAdesione.toString()));
		}
		AdesioneSpecification aspec = new AdesioneSpecification();
		
		if(!this.coreAuthorization.isAdmin()) {
			aspec.setUtente(Optional.of(utente));
		}

		aspec.setIdAdesioni(List.of(idAdesione));

		return this.service.findOne(aspec).orElseThrow(() -> new NotFoundException(ErrorCode.ADE_001));
		
	}
	
	@Override
	public ResponseEntity<AllegatoMessaggio> createAllegatoMessaggioAdesione(UUID idAdesione, UUID idMessaggio,
			AllegatoMessaggioCreate allegatoMessaggioCreate) {
		try {

			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     

				findOne(idAdesione);
				
				MessaggioAdesioneEntity entity = this.service.findMessaggioAdesione(idAdesione.toString(), idMessaggio.toString())
						.stream()
						.filter(m -> m.getUuid().equals(idMessaggio.toString())).findAny()
						.orElseThrow(() -> new NotFoundException(ErrorCode.NTF_001));

				this.logger.debug("Autorizzazione completata con successo");     

				DocumentoEntity allegato = documentoAllegatoAssembler.toEntity(allegatoMessaggioCreate, coreAuthorization.getUtenteSessione());
				entity.getAllegati().add(allegato);
				this.service.save(entity);
				AllegatoMessaggio model = this.documentoAllegatoAssembler.toModel(allegato);
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
	public ResponseEntity<ItemMessaggio> createMessaggioAdesione(UUID idAdesione, MessaggioCreate messaggioCreate) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     
				
				AdesioneEntity entity = findOne(idAdesione);

				MessaggioAdesioneEntity messaggio = this.itemMessaggioAssembler.toEntity(messaggioCreate, entity);

				this.logger.debug("Autorizzazione completata con successo");     

				this.service.save(messaggio);
				
				List<NotificaEntity> lstNotifiche = this.notificheUtils.getNotificheMessaggioAdesione(messaggio);
				lstNotifiche.stream().forEach(n -> this.notificaService.save(n));

				ItemMessaggio model = this.itemMessaggioAssembler.toModel(messaggio);
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
	public ResponseEntity<Referente> createReferenteAdesione(UUID idAdesione, ReferenteCreate referente, Boolean force) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     
				AdesioneEntity entity = findOne(idAdesione);
				
				Grant grant = this.dettaglioAssembler.toGrant(entity);

				if(!isForce(force, grant.getRuoli())) {
					this.authorization.authorizeModifica(entity, Arrays.asList(ConfigurazioneClasseDato.REFERENTI));
				}

				this.logger.debug("Autorizzazione completata con successo");     

				ReferenteAdesioneEntity referenteEntity = referenteAssembler.toEntity(referente, entity);
				
				this.service.save(referenteEntity);
				this.service.save(entity);
				
				this.logger.info("Invocazione completata con successo");
				return ResponseEntity.status(HttpStatus.CREATED).build();
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
	public ResponseEntity<Void> deleteAdesione(UUID idAdesione) {
		try {
			
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");     
				
				AdesioneEntity entity = findOne(idAdesione);
				
				this.authorization.authorizeDelete(entity);
				this.logger.debug("Autorizzazione completata con successo");     
	
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
	public ResponseEntity<Void> deleteAllegatoMessaggioAdesione(UUID idAdesione, UUID idMessaggio, UUID idAllegato) {
		try {

			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     
				findOne(idAdesione);
				this.logger.debug("Autorizzazione completata con successo");     
				MessaggioAdesioneEntity messaggio = this.service.findMessaggioAdesione(idAdesione.toString(), idMessaggio.toString())
						.stream()
						.filter(m -> m.getUuid().equals(idMessaggio.toString())).findAny()
						.orElseThrow(() -> new NotFoundException(ErrorCode.NTF_001));

				DocumentoEntity allegato = messaggio.getAllegati().stream().filter(m -> m.getUuid().equals(idAllegato.toString())).findAny()
						.orElseThrow(() -> new NotFoundException(ErrorCode.DOC_001));

				
				messaggio.getAllegati().remove(allegato);

				this.service.save(messaggio);
				this.logger.info("Invocazione completata con successo");
				return ResponseEntity.status(HttpStatus.OK).build();
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
	public ResponseEntity<Void> deleteReferenteAdesione(UUID idAdesione, UUID idUtente,
			TipoReferenteEnum tipoReferente, Boolean force) {
		try {
			return this.service.runTransaction( () -> {
	
				this.logger.info("Invocazione in corso ...");     
	

				AdesioneEntity entity = findOne(idAdesione);

				List<ReferenteAdesioneEntity> entityLst = this.service.getReferenteAdesione(idAdesione, idUtente, this.referenteAssembler.toTipoReferente(tipoReferente));
				
				this.logger.debug("Autorizzazione completata con successo");     
	
				for(ReferenteAdesioneEntity rentity: entityLst) {
					this.service.deleteReferenteAdesione(rentity);
				}
				
				Grant grant = this.dettaglioAssembler.toGrant(entity);

				if(!isForce(force, grant.getRuoli())) {
					this.authorization.authorizeModifica(entity, Arrays.asList(ConfigurazioneClasseDato.REFERENTI));
				}

				this.dettaglioAssembler.setUltimaModifica(entity);
				this.service.save(entity);
				
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
			throw new InternalException(ErrorCode.SYS_001);
		}
	}

	@Override
	public ResponseEntity<Resource> downloadAllegatoMessaggioAdesione(UUID idAdesione, UUID idMessaggio,
			UUID idAllegato) {
		try {
			this.logger.info("Invocazione in corso ...");     
			this.logger.debug("Autorizzazione completata con successo");     

			return this.service.runTransaction( () -> {

				findOne(idAdesione);

				MessaggioAdesioneEntity messaggio = this.service.findMessaggioAdesione(idAdesione.toString(), idMessaggio.toString())
						.stream()
						.filter(m -> m.getUuid().equals(idMessaggio.toString())).findAny()
						.orElseThrow(() -> new NotFoundException(ErrorCode.NTF_001));
				DocumentoEntity allegato = messaggio.getAllegati().stream().filter(m -> m.getUuid().equals(idAllegato.toString())).findAny()
						.orElseThrow(() -> new NotFoundException(ErrorCode.DOC_001));
				Resource resource = new ByteArrayResource(allegato.getRawData());
				this.logger.info("Invocazione completata con successo");
				return ResponseEntity.status(HttpStatus.OK)
						.header("Content-Disposition", "attachment; filename="+allegato.getFilename())
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

	@Override
	public ResponseEntity<Adesione> getAdesione(UUID idAdesione) {
		try {
			return this.service.runTransaction( () -> {

			this.logger.info("Invocazione in corso ...");    
			AdesioneEntity entity = findOne(idAdesione);

			this.logger.debug("Autorizzazione completata con successo");     

			Adesione model = this.dettaglioAssembler.toModel(entity);

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
	public ResponseEntity<Resource> exportAdesione(UUID idAdesione) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ..."); 
				AdesioneEntity entity = findOne(idAdesione);
				this.logger.debug("Autorizzazione completata con successo");     
				
				if(!this.configurazione.getAdesione().getStatiSchedaAdesione().contains(entity.getStato())) {
					throw new BadRequestException(ErrorCode.ADE_003, java.util.Map.of("stato", entity.getStato().toString()));
				}
				Resource resource;
				try {
					resource = new ByteArrayResource(this.adesioneBuilder.getSchedaAdesione(entity));
				} catch (Exception e) {
					this.logger.error("Errore nel recupero dell'eService: " + e.getMessage(), e);
					throw new InternalException(ErrorCode.SYS_001);
				}
				this.logger.info("Invocazione completata con successo");
				
				
				return ResponseEntity.status(HttpStatus.OK).header("Content-Disposition", "attachment; filename=adesione-"+entity.getIdAdesione()+".pdf").body(resource);
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
	public ResponseEntity<PagedModelItemErogazioneAdesione> listErogazioniCollaudoAdesione(UUID idAdesione) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ..."); 
				
				AdesioneEntity entity = findOne(idAdesione);

				this.logger.debug("Autorizzazione completata con successo");     

				List<ItemErogazioneAdesione> content = entity.getErogazioni()
						.stream().filter(a -> a.getAmbiente().equals(AmbienteEnum.COLLAUDO))
						.map(a -> erogazioneItemAssembler.toModel(a))
						.collect(Collectors.toList());

				PagedModelItemErogazioneAdesione list = new PagedModelItemErogazioneAdesione();
				list.setContent(content);
				
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
	public ResponseEntity<PagedModelItemErogazioneAdesione> listErogazioniProduzioneAdesione(UUID idAdesione) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ..."); 
				AdesioneEntity entity = findOne(idAdesione);

				this.logger.debug("Autorizzazione completata con successo");     

				List<ItemErogazioneAdesione> content = entity.getErogazioni()
						.stream().filter(a -> a.getAmbiente().equals(AmbienteEnum.PRODUZIONE))
						.map(a -> erogazioneItemAssembler.toModel(a))
						.collect(Collectors.toList());

				PagedModelItemErogazioneAdesione list = new PagedModelItemErogazioneAdesione();
				list.setContent(content);
				
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
	public ResponseEntity<PagedModelItemComunicazione> listComunicazioniAdesione(UUID idAdesione, Integer page,	Integer size, List<String> sort) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");  
				
				AdesioneEntity entity = findOne(idAdesione);

				this.logger.debug("Autorizzazione completata con successo");     

				PagedModelItemComunicazione list = new PagedModelItemComunicazione();
				List<ItemComunicazione> content = new ArrayList<>();
				
				for(StatoAdesioneEntity stato: entity.getStati()) {
					ItemComunicazione itemStato = new ItemComunicazione();
					itemStato.setUuid(UUID.fromString(stato.getUuid()));
					itemStato.setTipo(TipoComunicazione.CAMBIO_STATO);
					itemStato.setAutore(itemUtenteAssembler.toModel(stato.getUtente()));
					itemStato.setData(stato.getData().toInstant().atOffset(ZoneOffset.UTC));
					itemStato.setStato(stato.getStato());
					
					content.add(itemStato);
				}
				
				for(MessaggioAdesioneEntity messaggio: entity.getMessaggi()) {
					ItemComunicazione itemStato = new ItemComunicazione();
					itemStato.setUuid(UUID.fromString(messaggio.getUuid()));
					itemStato.setTipo(TipoComunicazione.MESSAGGIO);
					itemStato.setAutore(itemUtenteAssembler.toModel(messaggio.getUtente()));
					itemStato.setData(messaggio.getData().toInstant().atOffset(ZoneOffset.UTC));
					itemStato.setOggetto(messaggio.getOggetto());
					itemStato.setTesto(messaggio.getTesto());
					itemStato.setAllegati(documentoAllegatoAssembler.toCollectionModel(messaggio.getAllegati()).getContent().stream().collect(Collectors.toList()));
					
					content.add(itemStato);
				}
				
				Comparator<ItemComunicazione> c = new Comparator<ItemComunicazione>() {

					@Override
					public int compare(ItemComunicazione o1, ItemComunicazione o2) {
						return o1.getData().compareTo(o2.getData());
					}
				};
				
				
				list.setContent(content.stream().sorted(c).collect(Collectors.toList()));

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
	public ResponseEntity<PagedModelItemAdesione> listAdesioni(List<String> stato, UUID idSoggettoAderente, UUID idOrganizzazioneAderente, UUID idGruppo,
			UUID idDominio, UUID idServizio, String idLogico, UUID idAdesione, UUID idClient, UUID richiedente, Boolean inAttesa, StatoConfigurazioneAutomaticaEnum statoConfigurazioneAutomatica, String q,  Integer page,
			Integer size, List<String> sort) {

		try {
			this.logger.info("Invocazione in corso ...");     
			this.authorization.authorizeList();
			this.logger.debug("Autorizzazione completata con successo");     

			return this.service.runTransaction( () -> {

				AdesioneSpecification specification = new AdesioneSpecification();
				specification.setStatoConfigurazione(Optional.ofNullable(statoConfigurazioneAutomatica).map(s -> {
					switch(s) {
					case FALLITA: return STATO_CONFIGURAZIONE.FALLITA;
					case IN_CODA: return STATO_CONFIGURAZIONE.IN_CODA;
					case KO: return STATO_CONFIGURAZIONE.KO;
					case OK: return STATO_CONFIGURAZIONE.OK;
					case RETRY: return STATO_CONFIGURAZIONE.RETRY;
					}
					return null;
				}));
				specification.setQ(Optional.ofNullable(q));
				specification.setGruppo(Optional.ofNullable(idGruppo));
				specification.setDominio(Optional.ofNullable(idDominio));
				specification.setClient(Optional.ofNullable(idClient));
				Optional.ofNullable(idAdesione)
					.ifPresent(a -> {
						specification.setIdAdesioni(Arrays.asList(a));
						});
				specification.setIdLogico(Optional.ofNullable(idLogico));
				specification.setIdSoggetto(Optional.ofNullable(idSoggettoAderente));
				specification.setIdOrganizzazione(Optional.ofNullable(idOrganizzazioneAderente));
				specification.setIdRichiedente(Optional.ofNullable(richiedente));
				specification.setIdServizio(Optional.ofNullable(idServizio));
				
				boolean admin = this.coreAuthorization.isAdmin();

				if(!admin) {
					specification.setUtente(Optional.of(this.coreAuthorization.getUtenteSessione()));
				}
				
				specification.setStati(stato);

				CustomPageRequest pageable = new CustomPageRequest(page, size, sort, Arrays.asList("searchTerms"));

				Page<AdesioneEntity> findAll = this.service.findAll(
						specification,
						pageable
						);

				Link link = Link.of(ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString(), IanaLinkRelations.SELF);


				PagedModel<ItemAdesione> lst = pagedResourceAssembler.toModel(findAll, this.itemAssembler, link);

				PagedModelItemAdesione list = new PagedModelItemAdesione();
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
			throw new InternalException(ErrorCode.SYS_001);
		}

	}

	@Override
	public ResponseEntity<PagedModelItemClientAdesione> listClientCollaudoAdesione(UUID idAdesione) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");  
				
				AdesioneEntity entity = findOne(idAdesione);

				this.logger.debug("Autorizzazione completata con successo");     

				List<ClientAdesioneEntity> lst = entity.getClient().stream()
						.filter(c -> c.getAmbiente().equals(AmbienteEnum.COLLAUDO))
						.collect(Collectors.toList());
		        
				PagedModelItemClientAdesione list = new PagedModelItemClientAdesione();
				list.setContent(clientAdesioneItemAssembler.toCollectionModel(lst).getContent().stream().collect(Collectors.toList()));
				
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
	public ResponseEntity<PagedModelItemClientAdesione> listClientProduzioneAdesione(UUID idAdesione) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     
				AdesioneEntity entity = findOne(idAdesione);
				this.logger.debug("Autorizzazione completata con successo");     

				List<ClientAdesioneEntity> lst = entity.getClient().stream()
						.filter(c -> c.getAmbiente().equals(AmbienteEnum.PRODUZIONE))
						.collect(Collectors.toList());
		        
		        
				PagedModelItemClientAdesione list = new PagedModelItemClientAdesione();
				list.setContent(clientAdesioneItemAssembler.toCollectionModel(lst).getContent().stream().collect(Collectors.toList()));
				
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
	public ResponseEntity<PagedModelItemMessaggio> listMessaggiAdesione(UUID idAdesione, String q, Integer page,
			Integer size, List<String> sort) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ..."); 
				
				findOne(idAdesione);

				this.logger.debug("Autorizzazione completata con successo");     

				MessaggioAdesioneSpecification spec = new MessaggioAdesioneSpecification();
				spec.setQ(Optional.ofNullable(q));
				spec.setIdAdesione(Optional.of(idAdesione.toString()));
				
				
				CustomPageRequest pageable = new CustomPageRequest(page, size, sort, Arrays.asList("data,desc"));
				
				Page<MessaggioAdesioneEntity> findAll = service.findAllMessaggiAdesione(spec, pageable);
				
				Link link = Link.of(ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString(), IanaLinkRelations.SELF);


				PagedModel<ItemMessaggio> lst = messaggioPagedResourceAssembler.toModel(findAll, this.itemMessaggioAssembler, link);

				PagedModelItemMessaggio list = new PagedModelItemMessaggio();
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
	public ResponseEntity<PagedModelReferente> listReferentiAdesione(UUID idAdesione, String q,
			TipoReferenteEnum tipoReferente, Integer page,
			Integer size, List<String> sort) {
		try {
			
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");     
	
				findOne(idAdesione);

				this.logger.debug("Autorizzazione completata con successo");     
	
				ReferenteAdesioneSpecification spec = new ReferenteAdesioneSpecification();
				spec.setQ(Optional.ofNullable(q));
				if(idAdesione!= null) {
					spec.setIdAdesione(Optional.of(idAdesione.toString()));
				}
				if(tipoReferente!= null) {
					spec.setTipoReferente(Optional.of(this.referenteAssembler.toTipoReferente(tipoReferente)));
				}
	
				CustomPageRequest pageable = new CustomPageRequest(page, size, sort, Arrays.asList("id,desc"));
				
				Page<ReferenteAdesioneEntity> findAll = this.service.findAllReferentiAdesione(spec, pageable);
	
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
			throw new InternalException(ErrorCode.SYS_001);
		}
	}

	@Override
	public ResponseEntity<Adesione> updateAdesione(UUID idAdesione,
			AdesioneUpdate adesioneUpdate, Boolean force) {
		try {
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");  
				
				AdesioneEntity entity = findOne(idAdesione);

				this.logger.debug("Autorizzazione completata con successo");     

				List<ConfigurazioneClasseDato> lstClassiDato = new ArrayList<>();
				if(adesioneUpdate.getIdentificativo() != null) {
					lstClassiDato.add(ConfigurazioneClasseDato.IDENTIFICATIVO);
					this.dettaglioAssembler.toEntity(adesioneUpdate.getIdentificativo(), entity);
				}
				
//				if(adesioneUpdate.getCollaudo() != null) {
//					lstClassiDato.add(ConfigurazioneClasseDato.COLLAUDO);
////					if(!this.configurazione.getAdesione().getWorkflowProduzioneSenzaCollaudo().equals(WorkflowProduzioneSenzaCollaudoEnum.LINK_ALTRA_ADESIONE)) {
////						throw new BadRequestException("Workflow produzione senza collaudo: " + this.configurazione.getAdesione().getWorkflowProduzioneSenzaCollaudo() + " Expected: " +WorkflowProduzioneSenzaCollaudoEnum.LINK_ALTRA_ADESIONE);
////					}
//					this.dettaglioAssembler.toEntity(adesioneUpdate.getCollaudo(), entity);
//				}

				Grant grant = this.dettaglioAssembler.toGrant(entity);

				if(!isForce(force, grant.getRuoli())) {
					this.authorization.authorizeModifica(entity, lstClassiDato);
				}

				this.service.save(entity);
				Adesione model = this.dettaglioAssembler.toModel(entity);

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
	public ResponseEntity<Adesione> saveClientCollaudoAdesione(UUID idAdesione, String profilo,
			AdesioneClientUpdate adesioneClientUpdate, Boolean force) {
		try {
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");     
				AdesioneEntity entity = findOne(idAdesione);

				this.dettaglioAssembler.toEntity(adesioneClientUpdate, profilo, true, entity);
				
				Grant grant = this.dettaglioAssembler.toGrant(entity);

				if(!isForce(force, grant.getRuoli())) {
					this.authorization.authorizeModifica(entity, Arrays.asList(ConfigurazioneClasseDato.COLLAUDO));
				}
				
				this.logger.debug("Autorizzazione completata con successo");     

				this.service.save(entity);
				Adesione model = this.dettaglioAssembler.toModel(entity);

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
	public ResponseEntity<Adesione> saveClientProduzioneAdesione(UUID idAdesione, String profilo,
			AdesioneClientUpdate adesioneClientUpdate, Boolean force) {
		try {
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");     

				AdesioneEntity entity = findOne(idAdesione);

				this.dettaglioAssembler.toEntity(adesioneClientUpdate, profilo, false, entity);
				
				Grant grant = this.dettaglioAssembler.toGrant(entity);

				if(!isForce(force, grant.getRuoli())) {
					this.authorization.authorizeModifica(entity, Arrays.asList(ConfigurazioneClasseDato.PRODUZIONE));
				}
				
				this.logger.debug("Autorizzazione completata con successo");     

				this.service.save(entity);
				Adesione model = this.dettaglioAssembler.toModel(entity);

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
	public ResponseEntity<Adesione> saveErogazioneCollaudoAdesione(UUID idAdesione, UUID idErogazione,
			AdesioneErogazioneUpdate adesioneServerUpdate, Boolean force) {
		try {
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");     

				AdesioneEntity entity = findOne(idAdesione);

				this.dettaglioAssembler.toEntity(adesioneServerUpdate, idErogazione, true, entity);

				Grant grant = this.dettaglioAssembler.toGrant(entity);

				if(!isForce(force, grant.getRuoli())) {
					this.authorization.authorizeModifica(entity, Arrays.asList(ConfigurazioneClasseDato.COLLAUDO));
				}
				
				this.logger.debug("Autorizzazione completata con successo");     

				this.service.save(entity);
				Adesione model = this.dettaglioAssembler.toModel(entity);

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
	public ResponseEntity<Adesione> saveErogazioneProduzioneAdesione(UUID idAdesione, UUID idErogazione,
			AdesioneErogazioneUpdate adesioneServerUpdate, Boolean force) {
		try {
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");     

				AdesioneEntity entity = findOne(idAdesione);

				this.dettaglioAssembler.toEntity(adesioneServerUpdate, idErogazione, false, entity);

				Grant grant = this.dettaglioAssembler.toGrant(entity);

				if(!isForce(force, grant.getRuoli())) {
					this.authorization.authorizeModifica(entity, Arrays.asList(ConfigurazioneClasseDato.PRODUZIONE));
				}
				
				this.logger.debug("Autorizzazione completata con successo");     

				this.service.save(entity);
				Adesione model = this.dettaglioAssembler.toModel(entity);

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
	public ResponseEntity<Adesione> updateStatoAdesione(UUID idAdesione, StatoUpdate statoUpdate, Boolean checkOnly) {
		try {
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");    
				AdesioneEntity entity = findOne(idAdesione);

				this.logger.debug("Autorizzazione completata con successo");     

				String statoIniziale = entity.getStato();
				String statoFinale = statoUpdate.getStato();
				
				this.authorization.authorizeCambioStato(entity, statoUpdate.getStato());
				this.dettaglioAssembler.toEntity(statoUpdate, entity);
				this.authorization.authorizeUtenteCambioStato(entity, statoIniziale, statoFinale);


				if(!isCheckOnly(checkOnly)) {
					this.service.save(entity);
					List<NotificaEntity> lstNotifiche = this.notificheUtils.getNotificheCambioStatoAdesione(entity);
					lstNotifiche.stream().forEach(n -> this.notificaService.save(n));
				}


				Adesione model = this.dettaglioAssembler.toModel(entity);

				if(isCheckOnly(checkOnly)) {
					this.entityManager.detach(entity);
				}
				
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
	public ResponseEntity<Void> deleteMessaggioAdesione(UUID idAdesione, UUID idMessaggio) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     

				findOne(idAdesione);
				
				MessaggioAdesioneEntity entity = this.service.findMessaggioAdesione(idAdesione.toString(), idMessaggio.toString())
						.stream()
						.filter(m -> m.getUuid().equals(idMessaggio.toString())).findAny()
						.orElseThrow(() -> new NotFoundException(ErrorCode.NTF_001));

				this.logger.debug("Autorizzazione completata con successo");     

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
			throw new InternalException(ErrorCode.SYS_001);
		}
	}

	@Override
	public ResponseEntity<ItemMessaggio> updateMessaggioAdesione(UUID idAdesione, UUID idMessaggio,
			MessaggioUpdate messaggioUpdate) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     

				findOne(idAdesione);

				MessaggioAdesioneEntity entity = this.service.findMessaggioAdesione(idAdesione.toString(), idMessaggio.toString())
						.stream()
						.filter(m -> m.getUuid().equals(idMessaggio.toString())).findAny()
						.orElseThrow(() -> new NotFoundException(ErrorCode.NTF_001));

				this.logger.debug("Autorizzazione completata con successo");     

				this.itemMessaggioAssembler.toEntity(messaggioUpdate,entity);

				this.service.save(entity);
				ItemMessaggio model = this.itemMessaggioAssembler.toModel(entity);

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
	public ResponseEntity<Resource> downloadClientCProduzioneAdesione(UUID idAdesione, UUID idAllegato) {
		try {

			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     
				AdesioneEntity entity = findOne(idAdesione);

				this.logger.debug("Autorizzazione completata con successo");     
				DocumentoEntity allegato = null;
				
				for(ClientAdesioneEntity c: entity.getClient()) {
					if(c.getAmbiente().equals(AmbienteEnum.PRODUZIONE)) {
						for(EstensioneClientEntity e: c.getClient().getEstensioni()) {
							if(e.getDocumento()!=null && e.getDocumento().getUuid().equals(idAllegato.toString())) {
								allegato = e.getDocumento();
							}
						}
					}
				}
				
				if(allegato == null) {
					throw new NotFoundException(ErrorCode.DOC_001, java.util.Map.of("idAllegato", idAllegato.toString(), "idAdesione", idAdesione.toString()));
				}

				Resource resource = new ByteArrayResource(allegato.getRawData());
				this.logger.info("Invocazione completata con successo");
				return ResponseEntity.status(HttpStatus.OK)
						.header("Content-Disposition", "attachment; filename="+allegato.getFilename())
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

	@Override
	public ResponseEntity<Resource> downloadClientCollaudoAdesione(UUID idAdesione, UUID idAllegato) {
		try {

			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");   
				AdesioneEntity entity = findOne(idAdesione);

				this.logger.debug("Autorizzazione completata con successo");     
				DocumentoEntity allegato = null;
				
				for(ClientAdesioneEntity c: entity.getClient()) {
					if(c.getAmbiente().equals(AmbienteEnum.COLLAUDO)) {
						for(EstensioneClientEntity e: c.getClient().getEstensioni()) {
							if(e.getDocumento()!=null && e.getDocumento().getUuid().equals(idAllegato.toString())) {
								allegato = e.getDocumento();
							}
						}
					}
				}

				if(allegato == null) {
					throw new NotFoundException(ErrorCode.DOC_001, java.util.Map.of("idAllegato", idAllegato.toString(), "idAdesione", idAdesione.toString()));
				}

				Resource resource = new ByteArrayResource(allegato.getRawData());
				this.logger.info("Invocazione completata con successo");
				return ResponseEntity.status(HttpStatus.OK)
						.header("Content-Disposition", "attachment; filename="+allegato.getFilename())
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

	@Override
	public ResponseEntity<Adesione> deleteClientCollaudoAdesione(UUID idAdesione, String profilo, Boolean force) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     

				AdesioneEntity entity = findOne(idAdesione);

				Optional<ClientAdesioneEntity> oEntity = entity.getClient().stream()
						.filter(c -> c.getAmbiente().equals(AmbienteEnum.COLLAUDO) && c.getProfilo().equals(profilo))
						.findAny();

				if(oEntity.isPresent()) {
					entity.getClient().remove(oEntity.get());
					
					Grant grant = this.dettaglioAssembler.toGrant(entity);

					if(!isForce(force, grant.getRuoli())) {
						this.authorization.authorizeModifica(entity, Arrays.asList(ConfigurazioneClasseDato.COLLAUDO));
					}
					this.logger.debug("Autorizzazione completata con successo");     
				} else {
					throw new BadRequestException(ErrorCode.CLT_001, java.util.Map.of("profilo", profilo.toString(), "idAdesione", idAdesione.toString()));
				}

				Adesione model = this.dettaglioAssembler.toModel(entity);

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
	public ResponseEntity<Adesione> deleteClientProduzioneAdesione(UUID idAdesione, String profilo, Boolean force) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     
				AdesioneEntity entity = findOne(idAdesione);

				Optional<ClientAdesioneEntity> oEntity = entity.getClient().stream()
						.filter(c -> c.getAmbiente().equals(AmbienteEnum.PRODUZIONE) && c.getProfilo().equals(profilo))
						.findAny();

				if(oEntity.isPresent()) {
					entity.getClient().remove(oEntity.get());
					Grant grant = this.dettaglioAssembler.toGrant(entity);

					if(!isForce(force, grant.getRuoli())) {
						this.authorization.authorizeModifica(entity, Arrays.asList(ConfigurazioneClasseDato.PRODUZIONE));
					}
					this.logger.debug("Autorizzazione completata con successo");     
				} else {
					throw new BadRequestException(ErrorCode.CLT_001, java.util.Map.of("profilo", profilo.toString(), "idAdesione", idAdesione.toString()));
				}

				Adesione model = this.dettaglioAssembler.toModel(entity);

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
	public ResponseEntity<Adesione> deleteErogazioneCollaudoAdesione(UUID idAdesione, UUID idErogazione, Boolean force) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     
				AdesioneEntity entity = findOne(idAdesione);

				Optional<ErogazioneEntity> oEntity = entity.getErogazioni().stream()
						.filter(c -> c.getAmbiente().equals(AmbienteEnum.COLLAUDO) && c.getApi().getIdApi().equals(idErogazione.toString()))
						.findAny();

				if(oEntity.isPresent()) {
					entity.getErogazioni().remove(oEntity.get());
					Grant grant = this.dettaglioAssembler.toGrant(entity);

					if(!isForce(force, grant.getRuoli())) {
						this.authorization.authorizeModifica(entity, Arrays.asList(ConfigurazioneClasseDato.COLLAUDO));
					}
					this.logger.debug("Autorizzazione completata con successo");     
				} else {
					throw new BadRequestException(ErrorCode.API_003, java.util.Map.of("idErogazione", idErogazione.toString(), "idAdesione", idAdesione.toString()));
				}

				Adesione model = this.dettaglioAssembler.toModel(entity);

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
	public ResponseEntity<Adesione> deleteErogazioneProduzioneAdesione(UUID idAdesione, UUID idErogazione, Boolean force) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     
				AdesioneEntity entity = findOne(idAdesione);

				Optional<ErogazioneEntity> oEntity = entity.getErogazioni().stream()
						.filter(c -> c.getAmbiente().equals(AmbienteEnum.PRODUZIONE) && c.getApi().getIdApi().equals(idErogazione.toString()))
						.findAny();

				if(oEntity.isPresent()) {
					entity.getErogazioni().remove(oEntity.get());
					Grant grant = this.dettaglioAssembler.toGrant(entity);

					if(!isForce(force, grant.getRuoli())) {
						this.authorization.authorizeModifica(entity, Arrays.asList(ConfigurazioneClasseDato.PRODUZIONE));
					}
					this.logger.debug("Autorizzazione completata con successo");     
				} else {
					throw new BadRequestException(ErrorCode.API_003, java.util.Map.of("idErogazione", idErogazione.toString(), "idAdesione", idAdesione.toString()));
				}

				Adesione model = this.dettaglioAssembler.toModel(entity);

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
	public ResponseEntity<Grant> getGrantAdesione(UUID idAdesione) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");    
				
				AdesioneEntity entity = findOne(idAdesione);

				this.logger.debug("Autorizzazione completata con successo");     

				Grant grant = dettaglioAssembler.toGrant(entity);
				
				return ResponseEntity.ok(grant);
				
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
	public ResponseEntity<PagedModelItemConfigurazioneAdesione> listConfigurazioniCollaudoAdesione(UUID idAdesione) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");
				AdesioneEntity entity = findOne(idAdesione);

				this.logger.debug("Autorizzazione completata con successo");

				List<EstensioneAdesioneEntity> lst = entity.getEstensioni().stream()
						.filter(c -> c.getAmbiente().equals(AmbienteEnum.COLLAUDO))
						.collect(Collectors.toList());

				PagedModelItemConfigurazioneAdesione list = new PagedModelItemConfigurazioneAdesione();

				list.setContent(this.dettaglioAssembler.toConfigurazioni(lst));
				
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
	public ResponseEntity<PagedModelItemConfigurazioneAdesione> listConfigurazioniProduzioneAdesione(UUID idAdesione) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");
				AdesioneEntity entity = findOne(idAdesione);

				this.logger.debug("Autorizzazione completata con successo");

				List<EstensioneAdesioneEntity> lst = entity.getEstensioni().stream()
						.filter(c -> c.getAmbiente().equals(AmbienteEnum.PRODUZIONE))
						.collect(Collectors.toList());


				PagedModelItemConfigurazioneAdesione list = new PagedModelItemConfigurazioneAdesione();

				list.setContent(this.dettaglioAssembler.toConfigurazioni(lst));
				
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
	public ResponseEntity<Adesione> saveConfigurazioneCustomCollaudoAdesione(UUID idAdesione, DatiCustomAdesioneUpdate datiCustomUpdate, Boolean force) {
		try {
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");
				AdesioneEntity entity = findOne(idAdesione);

				this.dettaglioAssembler.toEntity(datiCustomUpdate, true, entity);
				
				Grant grant = this.dettaglioAssembler.toGrant(entity);

				if(!isForce(force, grant.getRuoli())) {
					this.authorization.authorizeModifica(entity, Arrays.asList(ConfigurazioneClasseDato.COLLAUDO));
				}
				this.logger.debug("Autorizzazione completata con successo");

				this.service.save(entity);
				Adesione model = this.dettaglioAssembler.toModel(entity);
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
	public ResponseEntity<Adesione> saveConfigurazioneCustomProduzioneAdesione(UUID idAdesione, DatiCustomAdesioneUpdate datiCustomUpdate, Boolean force) {
		try {
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");
				AdesioneEntity entity = findOne(idAdesione);

				this.dettaglioAssembler.toEntity(datiCustomUpdate, false, entity);
				Grant grant = this.dettaglioAssembler.toGrant(entity);

				if(!isForce(force, grant.getRuoli())) {
					this.authorization.authorizeModifica(entity, Arrays.asList(ConfigurazioneClasseDato.PRODUZIONE));
				}
				this.logger.debug("Autorizzazione completata con successo");

				this.service.save(entity);
				Adesione model = this.dettaglioAssembler.toModel(entity);
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

	private List<Ruolo> listRuoloForce = Arrays.asList(Ruolo.GESTORE);
	
	private boolean isForce(Boolean force, List<Ruolo> listRuoli) {
		

		boolean realForce = force != null && force;
		if(realForce) {
			if(!listRuoli.stream().anyMatch(r -> this.listRuoloForce.contains(r))) {
				throw new NotAuthorizedException(ErrorCode.AUTH_001, java.util.Map.of("ruoli", listRuoloForce.toString()));
			}
		}
		return realForce;
	}
	
	private boolean isCheckOnly(Boolean checkOnly) {
		return checkOnly != null && checkOnly;
	}

	// Metodo per registrare un errore
    private boolean registraErrore(List<String> errorIds, Map<String, List<String>> errorMessages, AdesioneEntity entity, String errorMessage) {
    	this.entityManager.detach(entity);
    	
    	String id = entity.getIdLogico() != null ? entity.getIdLogico() : entity.getSoggetto().getNome() + " / " + entity.getServizio().getNome() + " v" +entity.getServizio().getVersione();
    	boolean isNewError = false;
        // Se l'ID non è ancora stato registrato, lo aggiungo alla lista
        if (!errorIds.contains(id)) {
            errorIds.add(id);
            isNewError = true;
        }
        List <String> lista = errorMessages.computeIfAbsent(id, k -> new ArrayList<>());
        // Aggiungo il messaggio di errore associato all'ID
        if(!lista.contains(errorMessage)) {
        	lista.add(errorMessage);
        }
          
        return isNewError;
    }

    // Metodo per ottenere la lista di errori di un ID
    private List<String> getErrorMessages(Map<String, List<String>> errorMessages, String id) {
        return errorMessages.getOrDefault(id, new ArrayList<>());
    }
    
	@Override
	public ResponseEntity<AdesioniCambioStatoResponse> updateStatoAdesioni(StatoUpdate statoUpdate,
		List<String> stato, UUID idSoggetto, UUID idOrganizzazione, UUID idGruppoPadre,
		UUID idDominio, UUID idServizio, String idLogico,
		UUID idClient, UUID richiedente, Boolean inAttesa,
		List<UUID> id, String q,
		Integer page, Integer size, List<String> sort) {
		try {

			return this.service.runTransaction( () -> {

				AdesioniCambioStatoResponse response = new AdesioniCambioStatoResponse();
				AtomicLong numeroOk = new AtomicLong(0);
				//List<String> numeroKo = new ArrayList<>();
				//AtomicLong numeroKo = new AtomicLong(0);
				//long numeroKo = 0;
				List<ErroreCambioStatoResponse> errori = new ArrayList<ErroreCambioStatoResponse>();

				this.logger.info("Invocazione in corso ...");     
				this.coreAuthorization.requireAdmin();
				this.logger.debug("Autorizzazione completata con successo");     

				AdesioneSpecification specification = new AdesioneSpecification();
				specification.setQ(Optional.ofNullable(q));
				specification.setGruppo(Optional.ofNullable(idGruppoPadre));
				specification.setDominio(Optional.ofNullable(idDominio));
				specification.setClient(Optional.ofNullable(idClient));
				specification.setIdAdesioni(id);
				specification.setIdLogico(Optional.ofNullable(idLogico));
				specification.setIdSoggetto(Optional.ofNullable(idSoggetto));
				specification.setIdOrganizzazione(Optional.ofNullable(idOrganizzazione));
				specification.setIdServizio(Optional.ofNullable(idServizio));
				specification.setIdRichiedente(Optional.ofNullable(richiedente));
				//specification.setStati(stato);
				//specification.setUtente(null);

				boolean admin = this.coreAuthorization.isAdmin();

				if(!admin) {
					specification.setUtente(Optional.of(this.coreAuthorization.getUtenteSessione()));
				}

				specification.setStati(stato);

				CustomPageRequest pageable = new CustomPageRequest(page, size, sort, Arrays.asList("searchTerms"));

				Page<AdesioneEntity> findAll = this.service.findAll(specification, pageable);

				List<ConfigurazioneAutomatica> lista = configurazione.getAdesione().getConfigurazioneAutomatica();

				List<AdesioneEntity> listAdesioniNonStatoIniziale = new ArrayList<AdesioneEntity>();
				//il ciclo seguente verifica lo stato_iniziale definito nel file configurazione
				/*
					"configurazione_automatica": [
				    {
				        "stato_iniziale": "autorizzato_collaudo",
				        "stato_in_configurazione": "in_configurazione_collaudo",
				        "stato_finale": "pubblicato_collaudo"
				        },
				        {
				        "stato_iniziale": "autorizzato_produzione",
				        "stato_in_configurazione": "in_configurazione_produzione",
				        "stato_finale": "pubblicato_produzione"
				        }
				        ]
				 */
				Set<String> statiIniziali = lista.stream().map(confAutomatica -> confAutomatica.getStatoIniziale()).collect(Collectors.toSet());
				
				findAll.stream().forEach(v->{
					if(!statiIniziali.contains(v.getStato())) {
						listAdesioniNonStatoIniziale.add(v);
					} 
				});
				
				List<String> errorIds = new ArrayList<>();
				Map<String, List<String>> errorMessages = new HashMap<>();

				if(!listAdesioniNonStatoIniziale.isEmpty()) {
					listAdesioniNonStatoIniziale.stream().forEach(v->{
						//ErroreCambioStatoResponse errore = new ErroreCambioStatoResponse();
						//errore.setIdAdesione(v.getIdAdesione());
						//errore.setMessaggio("Elemento non in uno degli stati stato_iniziale definiti in configurazione");
						//errori.add(errore);
						this.registraErrore(errorIds, errorMessages, v,"Elemento non in uno degli stati stato_iniziale definiti in configurazione");
					});
					//throw new BadRequestException("Uno o piu' elementi non sono in uno degli stati stato_iniziale definiti in configurazione");
				}

				findAll.stream().forEach(v->{
					try {
						//Se non dovessero esserci errori che riguardano l'adesione allora procedo al cambio di stato
						if(this.getErrorMessages(errorMessages, v.getIdAdesione()).isEmpty()) {
							// nel caso in cui non dovesse esserci un errore riguardo l'adesione incremento il numero di ok
							// e procedo al cambio di stato
							//if(!this.checkErrore(v.getIdAdesione())) {
								//numeroOk.incrementAndGet();
							//}

							String statoIniziale = v.getStato();
							String statoFinale = statoUpdate.getStato();

							this.authorization.authorizeCambioStato(v, statoUpdate.getStato());
							this.dettaglioAssembler.toEntity(statoUpdate, v);
							this.authorization.authorizeUtenteCambioStato(v, statoIniziale, statoFinale);


							this.service.save(v);

							List<NotificaEntity> lstNotifiche = this.notificheUtils.getNotificheCambioStatoAdesione(v);
							lstNotifiche.stream().forEach(n -> this.notificaService.save(n));
							numeroOk.incrementAndGet();
						}
					} catch(UpdateEntitaComplessaNonValidaSemanticamenteException ex) {
						//ErroreCambioStatoResponse errore = new ErroreCambioStatoResponse();
						//errore.setIdAdesione(v.getIdAdesione());
						//errore.setMessaggio("Dati incompleti");
						//errori.add(errore);
						this.registraErrore(errorIds, errorMessages, v,"Dati incompleti");
					} catch(NotAuthorizedException ex) {
						//ErroreCambioStatoResponse errore = new ErroreCambioStatoResponse();
						//errore.setIdAdesione(v.getIdAdesione());
						//errore.setMessaggio("Utente non autorizzato");
						//errori.add(errore);
						this.registraErrore(errorIds, errorMessages, v,"Utente non autorizzato");
					}
				});
				response.setNumeroOk(numeroOk.get());
				//numeroKo = findAll.getSize()-numeroOk.get();
				long num = errorIds.size();
				response.setNumeroKo(num);

				if(!errorIds.isEmpty()) {
					for (String error : errorIds){
						ErroreCambioStatoResponse errore = new ErroreCambioStatoResponse();
						errore.setIdAdesione(error);
						errore.setMessaggi(this.getErrorMessages(errorMessages, error));
						errori.add(errore);
					}
				}
 
				response.setErrori(errori);

				this.logger.info("Invocazione completata con successo");
				return ResponseEntity.ok(response);

			});
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_001);
		}

	}
	
	@Override
	public ResponseEntity<Resource> downloadAllegatoAdesione(UUID idAdesione, UUID idAllegato) {
		try {
			this.logger.info("Invocazione in corso ...");     
			this.logger.debug("Autorizzazione completata con successo");     

			return this.service.runTransaction( () -> {

				AdesioneEntity entity = findOne(idAdesione);

				List<EstensioneAdesioneEntity> lst = entity.getEstensioni().stream()
						.filter(c -> c.getDocumento()!= null && c.getDocumento().getUuid().equals(idAllegato.toString()))
						.collect(Collectors.toList());

				if(lst.size() != 1) {
					throw new NotFoundException(ErrorCode.DOC_001, java.util.Map.of("idAllegato", idAllegato.toString(), "idAdesione", idAdesione.toString()));
				}

				DocumentoEntity allegato = lst.get(0).getDocumento();
				Resource resource = new ByteArrayResource(allegato.getRawData());
				this.logger.info("Invocazione completata con successo");
				return ResponseEntity.status(HttpStatus.OK)
						.header("Content-Disposition", "attachment; filename="+allegato.getFilename())
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

	@Override
	public ResponseEntity<CheckDati> checkDatiAdesione(UUID idAdesione, String statoFinale) {
		try {

			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     
				AdesioneEntity entity = findOne(idAdesione);
				this.logger.debug("Autorizzazione completata con successo");     

				CheckDati checkDatiGenerale = new CheckDati();
				try {
					this.authorization.checkCampiObbligatori(entity, statoFinale);
					checkDatiGenerale.setEsito(OkKoEnum.OK);
				} catch(UpdateEntitaComplessaNonValidaSemanticamenteException e) {
					checkDatiGenerale.setEsito(OkKoEnum.KO);
					checkDatiGenerale.setErrori(e.getErrori());
				}

				this.logger.info("Invocazione completata con successo");
				return ResponseEntity.ok(checkDatiGenerale);
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
