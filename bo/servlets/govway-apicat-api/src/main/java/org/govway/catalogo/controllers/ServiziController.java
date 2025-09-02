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

import java.text.SimpleDateFormat;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import javax.persistence.EntityManager;

import org.govway.catalogo.ApiV1Controller;
import org.govway.catalogo.assembler.AllegatoServizioAssembler;
import org.govway.catalogo.assembler.CategoriaServizioItemAssembler;
import org.govway.catalogo.assembler.DocumentoAllegatoAssembler;
import org.govway.catalogo.assembler.GruppoItemAssembler;
import org.govway.catalogo.assembler.ItemMessaggioServizioAssembler;
import org.govway.catalogo.assembler.OrganizzazioneItemAssembler;
import org.govway.catalogo.assembler.ReferenteServizioAssembler;
import org.govway.catalogo.assembler.ServizioDettaglioAssembler;
import org.govway.catalogo.assembler.ServizioGruppoItemAssembler;
import org.govway.catalogo.assembler.ServizioItemAssembler;
import org.govway.catalogo.assembler.UtenteItemAssembler;
import org.govway.catalogo.authorization.AbstractServizioAuthorization;
import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.authorization.PackageAuthorization;
import org.govway.catalogo.authorization.ServizioAuthorization;
import org.govway.catalogo.controllers.csv.ServizioBuilder;
import org.govway.catalogo.core.business.utils.EServiceBuilder;
import org.govway.catalogo.core.business.utils.NotificheUtils;
import org.govway.catalogo.core.dao.specifications.AllegatoServizioSpecification;
import org.govway.catalogo.core.dao.specifications.MessaggioServizioSpecification;
import org.govway.catalogo.core.dao.specifications.OrganizzazioneSpecification;
import org.govway.catalogo.core.dao.specifications.PackageServizioSpecification;
import org.govway.catalogo.core.dao.specifications.ReferenteServizioSpecification;
import org.govway.catalogo.core.dao.specifications.ServizioGruppoSpecification;
import org.govway.catalogo.core.dao.specifications.ServizioSpecification;
import org.govway.catalogo.core.dao.specifications.ServizioSpecification.TipoMieiServizi;
import org.govway.catalogo.core.dao.specifications.ServizioSpecificationUtils;
import org.govway.catalogo.core.dao.specifications.TagSpecification;
import org.govway.catalogo.core.orm.entity.AllegatoServizioEntity;
import org.govway.catalogo.core.orm.entity.AllegatoServizioEntity.VISIBILITA;
import org.govway.catalogo.core.orm.entity.CategoriaEntity;
import org.govway.catalogo.core.orm.entity.ClasseUtenteEntity;
import org.govway.catalogo.core.orm.entity.DocumentoEntity;
import org.govway.catalogo.core.orm.entity.GruppoEntity;
import org.govway.catalogo.core.orm.entity.MessaggioServizioEntity;
import org.govway.catalogo.core.orm.entity.NotificaEntity;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.PackageServizioEntity;
import org.govway.catalogo.core.orm.entity.ReferenteDominioEntity;
import org.govway.catalogo.core.orm.entity.ReferenteServizioEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.ServizioGruppoEntity;
import org.govway.catalogo.core.orm.entity.ServizioGruppoEntity.TipoServizioGruppoEnum;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.govway.catalogo.core.orm.entity.StatoServizioEntity;
import org.govway.catalogo.core.orm.entity.TIPO_REFERENTE;
import org.govway.catalogo.core.orm.entity.TagEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.services.GruppoService;
import org.govway.catalogo.core.services.NotificaService;
import org.govway.catalogo.core.services.OrganizzazioneService;
import org.govway.catalogo.core.services.ServizioService;
import org.govway.catalogo.core.services.TagService;
import org.govway.catalogo.core.services.TassonomiaService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.exception.RichiestaNonValidaSemanticamenteException;
import org.govway.catalogo.servlets.api.ServiziApi;
import org.govway.catalogo.servlets.model.Allegato;
import org.govway.catalogo.servlets.model.AllegatoItemCreate;
import org.govway.catalogo.servlets.model.AllegatoMessaggio;
import org.govway.catalogo.servlets.model.AllegatoMessaggioCreate;
import org.govway.catalogo.servlets.model.AllegatoUpdate;
import org.govway.catalogo.servlets.model.CategorieCreate;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneCambioStato;
import org.govway.catalogo.servlets.model.ConfigurazioneClasseDato;
import org.govway.catalogo.servlets.model.ConfigurazioneRuolo;
import org.govway.catalogo.servlets.model.Grant;
import org.govway.catalogo.servlets.model.GrantType;
import org.govway.catalogo.servlets.model.ItemCategoriaServizio;
import org.govway.catalogo.servlets.model.ItemComunicazione;
import org.govway.catalogo.servlets.model.ItemGruppo;
import org.govway.catalogo.servlets.model.ItemMessaggio;
import org.govway.catalogo.servlets.model.ItemOrganizzazione;
import org.govway.catalogo.servlets.model.ItemServizio;
import org.govway.catalogo.servlets.model.ItemServizioGruppo;
import org.govway.catalogo.servlets.model.ListItemCategoria;
import org.govway.catalogo.servlets.model.ListItemGruppo;
import org.govway.catalogo.servlets.model.MessaggioCreate;
import org.govway.catalogo.servlets.model.MessaggioUpdate;
import org.govway.catalogo.servlets.model.PageMetadata;
import org.govway.catalogo.servlets.model.PagedModelAllegato;
import org.govway.catalogo.servlets.model.PagedModelComponente;
import org.govway.catalogo.servlets.model.PagedModelItemComunicazione;
import org.govway.catalogo.servlets.model.PagedModelItemMessaggio;
import org.govway.catalogo.servlets.model.PagedModelItemOrganizzazione;
import org.govway.catalogo.servlets.model.PagedModelItemServizio;
import org.govway.catalogo.servlets.model.PagedModelItemServizioGruppo;
import org.govway.catalogo.servlets.model.PagedModelReferente;
import org.govway.catalogo.servlets.model.Referente;
import org.govway.catalogo.servlets.model.ReferenteCreate;
import org.govway.catalogo.servlets.model.Ruolo;
import org.govway.catalogo.servlets.model.Servizio;
import org.govway.catalogo.servlets.model.ServizioCreate;
import org.govway.catalogo.servlets.model.ServizioUpdate;
import org.govway.catalogo.servlets.model.StatoUpdate;
import org.govway.catalogo.servlets.model.TipoComunicazione;
import org.govway.catalogo.servlets.model.TipoReferenteEnum;
import org.govway.catalogo.servlets.model.TipoServizio;
import org.govway.catalogo.servlets.model.TipologiaAllegatoEnum;
import org.govway.catalogo.servlets.model.VisibilitaAllegatoEnum;
import org.govway.catalogo.servlets.model.VisibilitaServizioEnum;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Order;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.CollectionModel;
import org.springframework.hateoas.IanaLinkRelations;
import org.springframework.hateoas.Link;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@ApiV1Controller
public class ServiziController implements ServiziApi {

	private Logger logger = LoggerFactory.getLogger(ServiziController.class);
	
	@Autowired
	private ServizioService service;

	@Autowired
	private GruppoService gruppoService;

	@Autowired
	private EServiceBuilder serviceBuilder;

	@Autowired
	private TagService tagService;

	@Autowired
	private PagedResourcesAssembler<ServizioEntity> pagedResourceAssembler;

	@Autowired
	private PagedResourcesAssembler<ServizioGruppoEntity> pagedResourceServizioGruppoAssembler;

	@Autowired
	private PagedResourcesAssembler<OrganizzazioneEntity> pagedResourceOrganizzazioneAssembler;

	@Autowired
	private PagedResourcesAssembler<MessaggioServizioEntity> messaggioPagedResourceAssembler;

	@Autowired
	private PagedResourcesAssembler<AllegatoServizioEntity> allegatoPagedResourceAssembler;

	@Autowired
	private UtenteItemAssembler itemUtenteAssembler;

	@Autowired
	private GruppoItemAssembler itemGruppoAssembler;

	@Autowired
	private OrganizzazioneItemAssembler itemOrganizzazioneAssembler;

	@Autowired
	private OrganizzazioneService organizzazioneService;

	@Autowired
	private ItemMessaggioServizioAssembler itemMessaggioAssembler;

	@Autowired
	private ReferenteServizioAssembler referenteAssembler;

	@Autowired
	private DocumentoAllegatoAssembler documentoAllegatoAssembler;

	@Autowired
	private CategoriaServizioItemAssembler categoriaServizioItemAssembler;

	@Autowired
	private ServizioDettaglioAssembler dettaglioAssembler;

	@Autowired
	private ServizioItemAssembler itemAssembler;   

	@Autowired
	private ServizioGruppoItemAssembler itemServizioGruppoAssembler;   

	@Autowired
	private AllegatoServizioAssembler allegatoAssembler;

	@Autowired
	private ServizioAuthorization servizioAuthorization;   

	@Autowired
	private PackageAuthorization packageAuthorization;   

	@Autowired
	private ServizioBuilder servizioBuilder;   

	@Autowired
	private CoreAuthorization coreAuthorization;   

	@Autowired
	private Configurazione configurazione;   

	@Autowired
	private NotificheUtils notificheUtils;   

	@Autowired
	private NotificaService notificaService;   

	@Autowired
	private TassonomiaService tassonomiaService;   

	@Autowired
	private EntityManager entityManager;   

	private AbstractServizioAuthorization getServizioAuthorization(ServizioEntity entity) {
		if(entity.is_package()) {
			return this.packageAuthorization;
		} else {
			return this.servizioAuthorization;
		}
	}
	
	@Override
	public ResponseEntity<List<Allegato>> createAllegatoServizio(UUID idServizio, List<AllegatoItemCreate> allegatoCreate) {
		try {

			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     

				ServizioEntity entity = this.findOne(idServizio);
				
				Set<ConfigurazioneClasseDato> confS = new HashSet<>();
				for(AllegatoItemCreate allegato: allegatoCreate) {
					confS.add(allegato.getTipologia().equals(TipologiaAllegatoEnum.GENERICO) ? ConfigurazioneClasseDato.GENERICO : ConfigurazioneClasseDato.SPECIFICA);
				}

				this.getServizioAuthorization(entity).authorizeModifica(entity, confS.stream().collect(Collectors.toList()));
				this.logger.debug("Autorizzazione completata con successo");     


				List<Allegato> allegatoLst = new ArrayList<>();

				Set<String> keys = new HashSet<>();

				for(AllegatoItemCreate allegato: allegatoCreate) {
					if(!this.configurazione.getServizio().getVisibilitaAllegatiConsentite().contains(allegato.getVisibilita())) {
						throw new BadRequestException("Visibilita ["+allegato.getVisibilita()+"] non consentita");
					}
					
					AllegatoServizioEntity allEntity = this.allegatoAssembler.toEntity(allegato, entity);
					String key = allEntity.getDocumento().getFilename()+ "_" + allEntity.getTipologia();
					String keyString = "Nome: " + allEntity.getDocumento().getFilename()+ " di tipo: " + allegato.getTipologia();
					
					if(keys.contains(key)) {
						throw new BadRequestException("Allegato ["+keyString+"] duplicato");
					}
					
					keys.add(key);
					
					if(entity.getAllegati().stream().anyMatch(a-> key.equals(a.getDocumento().getFilename()+ "_" + a.getTipologia()))) {
						throw new BadRequestException("Allegato ["+keyString+"] duplicato");
					}

					this.service.save(allEntity);
					allegatoLst.add(this.allegatoAssembler.toModel(allEntity));
				}

				this.logger.info("Invocazione completata con successo");

				return ResponseEntity.status(HttpStatus.OK)
						.body(allegatoLst);
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
	public ResponseEntity<Referente> createReferenteServizio(UUID idServizio, Boolean force, ReferenteCreate referente) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     

				ServizioEntity entity = this.findOne(idServizio);
				
				ReferenteServizioEntity referenteEntity = referenteAssembler.toEntity(referente, entity);
				
				checkReferente(referenteEntity);
				
				entity.getReferenti().add(referenteEntity);
				
				Grant grant = this.dettaglioAssembler.toGrant(entity);

				if(!isForce(force, grant.getRuoli())) {
					this.getServizioAuthorization(entity).authorizeModifica(entity, Arrays.asList(ConfigurazioneClasseDato.REFERENTI));
				}
				this.logger.debug("Autorizzazione completata con successo");     

				this.service.save(referenteEntity);
				this.service.save(entity);

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
	
	private List<Ruolo> listRuoloForce = Arrays.asList(Ruolo.GESTORE);
	
	private boolean isForce(Boolean force, List<Ruolo> listRuoli) {
		

		boolean realForce = force != null && force;
		if(realForce) {
			if(!listRuoli.stream().anyMatch(r -> this.listRuoloForce.contains(r))) {
				throw new NotAuthorizedException("L'utente deve avere uno dei ruoli ["+listRuoloForce+"] per eseguire la force");
			}
		}
		return realForce;
	}
	
	private void checkReferenti(ServizioEntity servizioEntity) {

		OrganizzazioneEntity organizzazione = servizioEntity.getDominio().getSoggettoReferente().getOrganizzazione();
		if(organizzazione.isEsterna()) {
			return;
		}
		
		for(ReferenteServizioEntity referenteEntity: servizioEntity.getReferenti()) {
			
			boolean admin = this.coreAuthorization.isAdmin(referenteEntity.getReferente());
			
			if(!admin) {
				if(referenteEntity.getTipo().equals(TIPO_REFERENTE.REFERENTE) && !organizzazione.equals(referenteEntity.getReferente().getOrganizzazione())) {
					if(referenteEntity.getReferente().getOrganizzazione()!=null) {
						throw new NotAuthorizedException("Organizzazione ["+organizzazione.getNome()+"] interna, ma utente ["+referenteEntity.getReferente().getNome()+" "+referenteEntity.getReferente().getCognome()+"] associato all'organizzazione ["+referenteEntity.getReferente().getOrganizzazione().getNome()+"]");
					} else {
						throw new NotAuthorizedException("Organizzazione ["+organizzazione.getNome()+"] interna, ma utente ["+referenteEntity.getReferente().getNome()+" "+referenteEntity.getReferente().getCognome()+"] non associato ad alcuna organizzazione");
					}
				}
				
			}
		}
	}
	
	private void checkReferente(ReferenteServizioEntity referenteEntity) {

		
		if(referenteEntity.getServizio().is_package()) {
			for(PackageServizioEntity componente: referenteEntity.getServizio().getComponenti()) {
				if(!componente.getServizio().getReferenti().stream().filter(r -> r.getReferente().equals(referenteEntity.getReferente())).findAny().isPresent()) {
					throw new NotAuthorizedException("Impossibile aggiungere l'utente ["+referenteEntity.getReferente().getNome()+" "+referenteEntity.getReferente().getCognome()+"] come referente del package ["+referenteEntity.getServizio().getNome()+" v"+referenteEntity.getServizio().getVersione()+"]. L'utente non è referente del servizio componente ["+componente.getServizio().getNome()+" v"+componente.getServizio().getVersione()+"]");					
				}
			}
		}
		
		OrganizzazioneEntity organizzazione = referenteEntity.getServizio().getDominio().getSoggettoReferente().getOrganizzazione();
		if(organizzazione.isEsterna()) {
			return;
		}
		
		if(referenteEntity.getTipo().equals(TIPO_REFERENTE.REFERENTE_TECNICO)) {
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
	public ResponseEntity<AllegatoMessaggio> createAllegatoMessaggioServizio(UUID idServizio, UUID idMessaggio,
			AllegatoMessaggioCreate allegatoCreate) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");   
				
				this.findOne(idServizio);
				MessaggioServizioEntity entity = this.service.findMessaggioServizio(idServizio, idMessaggio)
						.stream()
						.filter(m -> m.getUuid().equals(idMessaggio.toString())).findAny()
						.orElseThrow(() -> new NotFoundException("Messaggio ["+idMessaggio+"] non trovato per il servizio ["+idServizio+"]"));
				

				this.servizioAuthorization.authorizeModifica(entity.getServizio(), Arrays.asList(ConfigurazioneClasseDato.GENERICO));
				this.logger.debug("Autorizzazione completata con successo");     

				DocumentoEntity allegato = documentoAllegatoAssembler.toEntity(allegatoCreate, coreAuthorization.getUtenteSessione());
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
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<ItemMessaggio> createMessaggioServizio(UUID idServizio, MessaggioCreate messaggioCreate) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     

				ServizioEntity entity = this.service.find(idServizio)
						.orElseThrow(() -> new NotFoundException("Servizio ["+idServizio+"] non trovato"));


				this.servizioAuthorization.authorizeModifica(entity, Arrays.asList(ConfigurazioneClasseDato.GENERICO));

				this.logger.debug("Autorizzazione completata con successo");     

				MessaggioServizioEntity messaggio = this.itemMessaggioAssembler.toEntity(messaggioCreate, entity);

				this.service.save(messaggio);
				
				List<NotificaEntity> lstNotifiche = this.notificheUtils.getNotificheMessaggioServizio(messaggio);
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
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Servizio> createServizio(ServizioCreate servizioCreate) {
		try {

			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     
				ServizioEntity entity = this.dettaglioAssembler.toEntity(servizioCreate);
				this.getServizioAuthorization(entity).authorizeCreate(servizioCreate);
				this.getServizioAuthorization(entity).authorizeModifica(entity, Arrays.asList(ConfigurazioneClasseDato.IDENTIFICATIVO));
				this.checkReferenti(entity);
				this.logger.debug("Autorizzazione completata con successo");     

				if(this.service.existsByNomeVersioneNonArchiviato(entity, configurazione.getServizio().getWorkflow().getStatoArchiviato())) {
					throw new ConflictException("Servizio ["+servizioCreate.getNome()+" v"+servizioCreate.getVersione()+"] esiste gia");
				}

				this.service.save(entity);
				Servizio model = this.dettaglioAssembler.toModel(entity);

				List<NotificaEntity> lstNotifiche = this.notificheUtils.getNotificheCreazioneServizio(entity);
				lstNotifiche.stream().forEach(n -> this.notificaService.save(n));

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
	public ResponseEntity<Void> deleteAllegatoServizio(UUID idServizio, UUID idAllegato) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");   
				this.findOne(idServizio);
				
				AllegatoServizioEntity entity = this.service.findAllegatoServizio(idServizio, idAllegato)
						.orElseThrow(() -> new NotFoundException("Allegato ["+idAllegato+"] non trovato per il servizio ["+idServizio+"]"));

				this.servizioAuthorization.authorizeModifica(entity.getServizio(), Arrays.asList(ConfigurazioneClasseDato.GENERICO));

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
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Void> deleteAllegatoMessaggioServizio(UUID idServizio, UUID idMessaggio, UUID idAllegato) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");   
				
				this.findOne(idServizio);
				
				MessaggioServizioEntity messaggio = this.service.findMessaggioServizio(idServizio, idMessaggio)
						.stream()
						.filter(m -> m.getUuid().equals(idMessaggio.toString())).findAny()
						.orElseThrow(() -> new NotFoundException("Messaggio ["+idMessaggio+"] non trovato per il servizio ["+idServizio+"]"));
				DocumentoEntity allegato = messaggio.getAllegati().stream().filter(m -> m.getUuid().equals(idAllegato.toString())).findAny()
						.orElseThrow(() -> new NotFoundException("Allegato ["+idAllegato+"] non trovato"));

				this.logger.debug("Autorizzazione completata con successo");     

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
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Void> deleteReferenteServizio(UUID idServizio, UUID idUtente,
			TipoReferenteEnum tipoReferente, Boolean force) {
		try {
			return this.service.runTransaction( () -> {
	
				this.logger.info("Invocazione in corso ...");     
	
				ServizioEntity entity = this.findOne(idServizio);
				
				List<ReferenteServizioEntity> entityLst = this.service.getReferenteServizio(idServizio, idUtente, this.referenteAssembler.toTipoReferente(tipoReferente));
				
				this.logger.debug("Autorizzazione completata con successo");     
	
				for(ReferenteServizioEntity rentity: entityLst) {
					
					if(!rentity.getServizio().is_package()) {
						// si controlla che l'utente non sia referente di nessun package di cui il servizio è componente
						for(PackageServizioEntity s: rentity.getServizio().getPackages()) {
							if(!s.getServizio().getReferenti().stream().filter(r -> r.getReferente().equals(rentity.getReferente())).findAny().isPresent()) {
								throw new NotAuthorizedException("Impossibile rimuovere l'utente ["+rentity.getReferente().getNome()+" "+rentity.getReferente().getCognome()+"] da referente del servizio ["+entity.getNome()+" v"+entity.getVersione()+"]. "
										+ "L'utente è referente del servizio package ["+s.getServizio().getNome()+" v"+s.getServizio().getVersione()+"]");					
							}
						}
					}
					
					this.service.deleteReferenteServizio(rentity);
				}

				Grant grant = this.dettaglioAssembler.toGrant(entity);

				if(!isForce(force, grant.getRuoli())) {
					this.getServizioAuthorization(entity).authorizeModifica(entity, Arrays.asList(ConfigurazioneClasseDato.REFERENTI));
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
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Resource> downloadAllegatoMessaggioServizio(UUID idServizio, UUID idMessaggio, UUID idAllegato) {
		try {
			this.logger.info("Invocazione in corso ...");     
			this.logger.debug("Autorizzazione completata con successo");     

			return this.service.runTransaction( () -> {

				this.findOne(idServizio);
				
				MessaggioServizioEntity messaggio = this.service.findMessaggioServizio(idServizio, idMessaggio)
						.stream()
						.filter(m -> m.getUuid().equals(idMessaggio.toString())).findAny()
						.orElseThrow(() -> new NotFoundException("Messaggio ["+idMessaggio+"] non trovato per il servizio ["+idServizio+"]"));
				DocumentoEntity allegato = messaggio.getAllegati().stream().filter(m -> m.getUuid().equals(idAllegato.toString())).findAny()
						.orElseThrow(() -> new NotFoundException("Allegato ["+idAllegato+"] non trovato"));
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
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Resource> downloadAllegatoServizio(UUID idServizio, UUID idAllegato) {
		try {
			this.logger.info("Invocazione in corso ...");     
			this.logger.debug("Autorizzazione completata con successo");     

			return this.service.runTransaction( () -> {

				this.findOne(idServizio);
				
				AllegatoServizioEntity entity = this.service.findAllegatoServizio(idServizio, idAllegato)
						.orElseThrow(() -> new NotFoundException("Allegato ["+idAllegato+"] non trovato per il servizio ["+idServizio+"]"));

				Resource resource = new ByteArrayResource(entity.getDocumento().getRawData());
				this.logger.info("Invocazione completata con successo");
				return ResponseEntity.status(HttpStatus.OK)
						.header("Content-Disposition", "attachment; filename="+entity.getDocumento().getFilename())
						.body(resource);
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
	public ResponseEntity<Servizio> getServizio(UUID idServizio) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     
				ServizioEntity entity = this.findOne(idServizio);
				
				this.logger.debug("Autorizzazione completata con successo");     


				Servizio model = this.dettaglioAssembler.toModel(entity);

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
	public ResponseEntity<PagedModelItemComunicazione> listComunicazioniServizio(UUID idServizio, Integer page, Integer size, List<String> sort) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     
				ServizioEntity entity = this.findOne(idServizio);
				
				this.logger.debug("Autorizzazione completata con successo");     


				PagedModelItemComunicazione list = new PagedModelItemComunicazione();
				List<ItemComunicazione> content = new ArrayList<>();

				for(StatoServizioEntity stato: entity.getStati()) {
					ItemComunicazione itemStato = new ItemComunicazione();
					itemStato.setUuid(UUID.fromString(stato.getUuid()));
					itemStato.setTipo(TipoComunicazione.CAMBIO_STATO);
					itemStato.setAutore(itemUtenteAssembler.toModel(stato.getUtente()));
					itemStato.setData(stato.getData().toInstant().atOffset(ZoneOffset.UTC));
					itemStato.setStato(stato.getStato());

					content.add(itemStato);
				}

				for(MessaggioServizioEntity messaggio: entity.getMessaggi()) {
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
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<PagedModelItemMessaggio> listMessaggiServizio(UUID idServizio, String q, Integer page, Integer size, List<String> sort) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");  
				
				this.findOne(idServizio);
				
				this.logger.debug("Autorizzazione completata con successo");     

				MessaggioServizioSpecification spec = new MessaggioServizioSpecification();
				spec.setQ(Optional.ofNullable(q));
				spec.setIdServizio(Optional.of(idServizio));

				CustomPageRequest pageable = new CustomPageRequest(page, size, sort, Arrays.asList("data,desc"));

				Page<MessaggioServizioEntity> findAll = service.findAllMessaggiServizio(spec, pageable);

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
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<PagedModelReferente> listReferentiServizio(UUID idServizio, String q,
			TipoReferenteEnum tipoReferente, Integer page, Integer size, List<String> sort) {
		try {
			
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");     
	
				this.findOne(idServizio);
				
				this.logger.debug("Autorizzazione completata con successo");     
	
				ReferenteServizioSpecification spec = new ReferenteServizioSpecification();
				spec.setQ(Optional.ofNullable(q));
				spec.setIdServizio(Optional.of(idServizio.toString()));

				if(tipoReferente!= null) {
					spec.setTipoReferente(Optional.of(this.referenteAssembler.toTipoReferente(tipoReferente)));
				}
	
				CustomPageRequest pageable = new CustomPageRequest(page, size, sort, Arrays.asList("id,desc"));

				Page<ReferenteServizioEntity> findAll = this.service.findAllReferentiServizio(spec, pageable);
	
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
	

	@Override
	public ResponseEntity<List<String>> listTags(String q, Integer page, Integer size, List<String> sort) {
		try {
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");     

				this.logger.debug("Autorizzazione completata con successo");     

				TagSpecification tagFilter = new TagSpecification();
				tagFilter.setQ(Optional.ofNullable(q));

				CustomPageRequest pageable = new CustomPageRequest(page, size, sort, null);

				Page<TagEntity> tagList = this.tagService.findAll(tagFilter, pageable);

				List<String> resource = tagList.stream().map(t -> t.getTag()).collect(Collectors.toList());
				this.logger.info("Invocazione completata con successo");
				return ResponseEntity.ok(resource);
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
	public ResponseEntity<Servizio> updateServizio(UUID idServizio, Boolean force,
			ServizioUpdate servizioUpdate) {
		try {
			return this.service.runTransaction(() -> {
				
				this.logger.info("Invocazione in corso ..."); 
				ServizioEntity entity = this.findOne(idServizio);
				
				this.logger.debug("Autorizzazione completata con successo");     

				if(servizioUpdate.getIdentificativo()!= null) {
					boolean nomeCambiato = !entity.getNome().equals(servizioUpdate.getIdentificativo().getNome());
					boolean versioneCambiata = !entity.getVersione().equals(servizioUpdate.getIdentificativo().getVersione());
					
					if(nomeCambiato || versioneCambiata) {
						if(this.service.existsByNomeVersioneNonArchiviato(servizioUpdate.getIdentificativo().getNome(), servizioUpdate.getIdentificativo().getVersione(), configurazione.getServizio().getWorkflow().getStatoArchiviato())) {
							throw new ConflictException("Servizio ["+servizioUpdate.getIdentificativo().getNome()+"/"+servizioUpdate.getIdentificativo().getVersione()+"] esiste gia");
						}
						
					}
				}
				
				List<ConfigurazioneClasseDato> lstClassiDato = new ArrayList<>();
				if(servizioUpdate.getIdentificativo()!=null) {
					lstClassiDato.add(ConfigurazioneClasseDato.IDENTIFICATIVO);
					this.dettaglioAssembler.toEntity(servizioUpdate.getIdentificativo(), entity);
				}
				if(servizioUpdate.getDatiGenerici()!=null) {
					lstClassiDato.add(ConfigurazioneClasseDato.GENERICO);
					this.dettaglioAssembler.toEntity(servizioUpdate.getDatiGenerici(), entity);
				}

				Grant grant = this.dettaglioAssembler.toGrant(entity);

				if(!isForce(force, grant.getRuoli())) {
					this.getServizioAuthorization(entity).authorizeModifica(entity, lstClassiDato);
				}
				
				this.checkReferenti(entity);
				
				this.service.save(entity);
				Servizio model = this.dettaglioAssembler.toModel(entity);

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

	private boolean isCheckOnly(Boolean checkOnly) {
		return checkOnly != null && checkOnly;
	}

	@Override
	public ResponseEntity<Servizio> updateStatoServizio(UUID idServizio, StatoUpdate statoServizioUpdate, Boolean checkOnly) {
		try {
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");     
				
				ServizioEntity entity = this.findOne(idServizio);
				
				boolean wasArchiviato = entity.getStato().equals(configurazione.getServizio().getWorkflow().getStatoArchiviato());
				boolean isArchiviato = statoServizioUpdate.getStato().equals(configurazione.getServizio().getWorkflow().getStatoArchiviato());
				if(wasArchiviato && !isArchiviato) {
					if(this.service.existsByNomeVersioneNonArchiviato(entity, configurazione.getServizio().getWorkflow().getStatoArchiviato())) {
						throw new ConflictException("Servizio ["+entity.getNome()+"/"+entity.getVersione()+"] esiste gia");
					}
				}

				String statoIniziale = entity.getStato();
				String statoFinale = statoServizioUpdate.getStato();

				this.getServizioAuthorization(entity).authorizeCambioStato(entity, statoServizioUpdate.getStato());
				this.getServizioAuthorization(entity).authorizeUtenteCambioStato(entity, statoIniziale, statoFinale);
                this.dettaglioAssembler.toEntity(statoServizioUpdate, entity);



				this.logger.debug("Autorizzazione completata con successo");     
				
				if(!isCheckOnly(checkOnly)) {
					this.service.save(entity);
					
					List<NotificaEntity> lstNotifiche = this.notificheUtils.getNotificheCambioStatoServizio(entity);
					lstNotifiche.stream().forEach(n -> this.notificaService.save(n));
				}
				Servizio model = this.dettaglioAssembler.toModel(entity);

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
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Resource> exportServizio(UUID idServizio) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ..."); 
				
				ServizioEntity entity = this.findOne(idServizio);
				
				this.logger.debug("Autorizzazione completata con successo");     

				Resource resource;
				try {
					resource = new ByteArrayResource(this.serviceBuilder.getEService(entity));
				} catch (Exception e) {
					this.logger.error("Errore nel recupero dell'eService: " + e.getMessage(), e);
					throw new InternalException(e);
				}
				this.logger.info("Invocazione completata con successo");

				String date = new SimpleDateFormat("dd_MM_yyyy_HH_mm_ss").format(new Date());
				return ResponseEntity.status(HttpStatus.OK).header("Content-Disposition", "attachment; filename=eService-"+entity.getNome()+"-"+entity.getVersione()+"-"+date+".zip").body(resource);
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
	public ResponseEntity<PagedModelItemServizio> listServizi(String referente, UUID idDominio, UUID idGruppo, VisibilitaServizioEnum visibilita, UUID idApi,
			List<String> stato, List<String> categoria, List<String> tag, Boolean inAttesa, Boolean mieiServizi, Boolean adesioneConsentita,String nome, String versione, List<UUID> idServizi, Boolean _package, TipoServizio tipo, String q, Integer page, Integer size, List<String> sort) {
		try {
			this.logger.info("Invocazione in corso ...");     
			return this.service.runTransaction( () -> {
				this.servizioAuthorization.authorizeList();
				// Controllo se l'utente è anonimo
	            boolean anounymous = this.coreAuthorization.isAnounymous();
	            
				this.logger.debug("Autorizzazione completata con successo");     

				ServizioSpecification specification = new ServizioSpecification();
				specification.setStatiAderibili(this.configurazione.getServizio().getStatiAdesioneConsentita());
				specification.setDominio(Optional.ofNullable(idDominio));
				specification.setIdApi(Optional.ofNullable(idApi));
				specification.setIdServizi(idServizi);
				specification.set_package(Optional.ofNullable(_package));
				specification.setNome(Optional.ofNullable(nome));
				specification.setVersione(Optional.ofNullable(versione));


				specification.setGruppoList(getGruppi(idGruppo));
				
				if(categoria !=null) {
					List<UUID> categoriaLst = new ArrayList<>();
					for(String c: categoria) {
						categoriaLst.add(UUID.fromString(c));
					}
					specification.setCategorie(categoriaLst);
				}

				if(visibilita != null) {
					specification.setVisibilita(Optional.of(this.dettaglioAssembler.toVisibilita(visibilita, true)));
				}

				if(tipo != null) {
					specification.setTipo(Optional.of(this.dettaglioAssembler.toTipo(tipo)));
				}
				specification.setQ(Optional.ofNullable(q));

				specification.setTag(tag);

				specification.setStati(stato);
				
				specification.setAderibili(Optional.ofNullable(adesioneConsentita));
				specification.setUtenteAdmin(Optional.of(this.coreAuthorization.isAdmin()));
				
				boolean admin = this.coreAuthorization.isAdmin() || this.coreAuthorization.isCoordinatore();

				Specification<ServizioEntity> specInAttesa = null;

				if(!anounymous) {
					UtenteEntity utente = this.coreAuthorization.getUtenteSessione();
					Specification<ServizioEntity> specSR = ServizioSpecificationUtils.byReferenteServizio(utente);
					Specification<ServizioEntity> specGR = ServizioSpecificationUtils.byReferenteDominio(utente);
					Specification<ServizioEntity> specRich = ServizioSpecificationUtils.byRichiedente(utente);
					Specification<ServizioEntity> specSRInAttesa = specSR.and(ServizioSpecificationUtils.byStati(getStatiReferenteServizio()));
					Specification<ServizioEntity> specGRInAttesa = specGR.and(ServizioSpecificationUtils.byStati(getStatiReferenteDominio()));
					Specification<ServizioEntity> specRichInAttesa = specRich.and(ServizioSpecificationUtils.byStati(getStatiRichiedenteServizio()));
					specInAttesa = specSRInAttesa.or(specGRInAttesa).or(specRichInAttesa);
					boolean isWhiteListed = this.coreAuthorization.isWhiteListed();
					if(admin || isWhiteListed) {
						Specification<ServizioEntity> inAttesaAdmin = ServizioSpecificationUtils.byStati(getStatiAdmin());
						specInAttesa = specInAttesa.or(inAttesaAdmin);
					} else {
						specification.setUtente(Optional.of(utente));
					}

				} else {
					specification.setUtente(Optional.of(new UtenteEntity()));
				}

				Specification<ServizioEntity> realSpecification = null;
				if(inAttesa!= null && inAttesa) {
					if(!anounymous) {
						realSpecification = specification.and(specInAttesa);
					} else {
						throw new BadRequestException("Utente non registrato, impossibile recuperare servizi in attesa");
					}
				} else if(mieiServizi!= null && mieiServizi) {
					if(!anounymous) {
						if(admin) {
							realSpecification = specification;
						} else {
							specification.setTipoMieiServizi(TipoMieiServizi.MIEI_SERVIZI);
							realSpecification = specification;
						}

					} else {
						throw new BadRequestException("Utente non registrato, impossibile recuperare i miei servizi");
					}
				} else {
					realSpecification = specification;
				}

				CustomPageRequest pageable = new CustomPageRequest(page, size, sort, Arrays.asList("nome","versione"));

				Page<ServizioEntity> findAll = this.service.findAll(
						realSpecification,
						pageable
						);

				Link link = Link.of(ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString(), IanaLinkRelations.SELF);

				PagedModel<ItemServizio> lst = pagedResourceAssembler.toModel(findAll, this.itemAssembler, link);

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
			throw new InternalException(e);
		}

	}
	
	private List<UUID> getGruppi(UUID idGruppo) {
		if(idGruppo != null) {
			List<UUID> lst = new ArrayList<>();
			Optional<GruppoEntity> oGruppo = this.gruppoService.find(idGruppo);
			if(oGruppo.isPresent()) {
				addGruppi(oGruppo.get(), lst);
			} else {
				lst.add(idGruppo);
			}
			
			return lst;
		} else {
			return null;
		}
	}

	private void addGruppi(GruppoEntity gruppoEntity, List<UUID> lst) {
		lst.add(UUID.fromString(gruppoEntity.getIdGruppo()));
		
		for(GruppoEntity figlio: gruppoEntity.getFigli()) {
			addGruppi(figlio, lst);
		}
		
	}

	@Override
	public ResponseEntity<Resource> exportServizi(
			String referente, UUID idDominio,
			UUID idGruppo, VisibilitaServizioEnum visibilita, UUID idApi, List<String> stato,
			List<String> categoria, List<String> tag, Boolean inAttesa, Boolean mieiServizi,
			Boolean adesioneConsentita, String nome,
			String versione, List<UUID> idServizi,
			String q) {
		try {
			this.logger.info("Invocazione in corso ...");     
			this.servizioAuthorization.authorizeExport();
			this.logger.debug("Autorizzazione completata con successo");     
			return this.service.runTransaction( () -> {

				ServizioSpecification specification = new ServizioSpecification();
				specification.setStatiAderibili(this.configurazione.getServizio().getStatiAdesioneConsentita());
				specification.setGruppoList(getGruppi(idGruppo));
				specification.setDominio(Optional.ofNullable(idDominio));
				specification.setIdApi(Optional.ofNullable(idApi));
				specification.setIdServizi(idServizi);
				specification.setNome(Optional.ofNullable(nome));
				specification.setVersione(Optional.ofNullable(versione));
				
				if(categoria !=null) {
					List<UUID> categoriaLst = new ArrayList<>();
					for(String c: categoria) {
						categoriaLst.add(UUID.fromString(c));
					}
					specification.setCategorie(categoriaLst);
				}

				if(visibilita != null) {
					specification.setVisibilita(Optional.of(this.dettaglioAssembler.toVisibilita(visibilita, true)));
				}
				specification.setQ(Optional.ofNullable(q));

				specification.setTag(tag);

				specification.setStati(stato);
				
				specification.setAderibili(Optional.ofNullable(adesioneConsentita));
				

				boolean admin = this.coreAuthorization.isAdmin();
				boolean anounymous = this.coreAuthorization.isAnounymous();

				Specification<ServizioEntity> specInAttesa = null;

				if(!anounymous) {
					UtenteEntity utente = this.coreAuthorization.getUtenteSessione();
					Specification<ServizioEntity> specSR = ServizioSpecificationUtils.byReferenteServizio(utente);
					Specification<ServizioEntity> specGR = ServizioSpecificationUtils.byReferenteDominio(utente);
					Specification<ServizioEntity> specRich = ServizioSpecificationUtils.byRichiedente(utente);
					Specification<ServizioEntity> specSRInAttesa = specSR.and(ServizioSpecificationUtils.byStati(getStatiReferenteServizio()));
					Specification<ServizioEntity> specGRInAttesa = specGR.and(ServizioSpecificationUtils.byStati(getStatiReferenteDominio()));
					Specification<ServizioEntity> specRichInAttesa = specRich.and(ServizioSpecificationUtils.byStati(getStatiRichiedenteServizio()));
					specInAttesa = specSRInAttesa.or(specGRInAttesa).or(specRichInAttesa);
					boolean isWhiteListed = this.coreAuthorization.isWhiteListed();
					if(admin || isWhiteListed) {
						Specification<ServizioEntity> inAttesaAdmin = ServizioSpecificationUtils.byStati(getStatiAdmin());
						specInAttesa = specInAttesa.or(inAttesaAdmin);
					} else {
						specification.setUtente(Optional.of(utente));
					}

				} else {
					specification.setUtente(Optional.of(new UtenteEntity()));
				}

				Specification<ServizioEntity> realSpecification = null;
				if(inAttesa!= null && inAttesa) {
					if(!anounymous) {
						realSpecification = specification.and(specInAttesa);
					} else {
						throw new BadRequestException("Utente non registrato, impossibile recuperare servizi in attesa");
					}
				} else if(mieiServizi!= null && mieiServizi) {
					if(!anounymous) {
						if(admin) {
							realSpecification = specification;
						} else {
							specification.setTipoMieiServizi(TipoMieiServizi.MIEI_SERVIZI);
							realSpecification = specification;
						}

					} else {
						throw new BadRequestException("Utente non registrato, impossibile recuperare i miei servizi");
					}
				} else {
					realSpecification = specification;
				}

				List<ServizioEntity> findAll = this.service.findAll(
						realSpecification,
						Pageable.unpaged()
						).toList();
				
				byte[] csv = this.servizioBuilder.getCSVEsteso(findAll);

				Resource resource = new ByteArrayResource(csv);
				this.logger.info("Invocazione completata con successo");
				return ResponseEntity.status(HttpStatus.OK)
						.header("Content-Disposition", "attachment; filename=servizi.csv")
						.body(resource);
			});
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}
	}


	private List<String> getStatiAdmin() {
		return getStati(ConfigurazioneRuolo.GESTORE, Arrays.asList(ConfigurazioneRuolo.RICHIEDENTE, ConfigurazioneRuolo.REFERENTE, ConfigurazioneRuolo.REFERENTE_SUPERIORE));
	}

	private List<String> getStatiReferenteDominio() {
		return getStati(ConfigurazioneRuolo.REFERENTE_SUPERIORE, Arrays.asList(ConfigurazioneRuolo.RICHIEDENTE, ConfigurazioneRuolo.REFERENTE));
	}

	private List<String> getStatiReferenteServizio() {
		return getStati(ConfigurazioneRuolo.REFERENTE, Arrays.asList(ConfigurazioneRuolo.RICHIEDENTE));
	}

	private List<String> getStatiRichiedenteServizio() {
		return getStati(ConfigurazioneRuolo.RICHIEDENTE, new ArrayList<>());
	}

	private List<String> getStati(ConfigurazioneRuolo ruoloAttuale, List<ConfigurazioneRuolo> ruoliInferiori) {
		List<String> cambi = new ArrayList<>();
		for(ConfigurazioneCambioStato cambio: this.configurazione.getServizio().getWorkflow().getCambiStato()) {
			boolean ruoliInferioriPresent = false;
			boolean ruoloPresent = false;
			if(cambio.getStatoSuccessivo()!= null) {
				for(ConfigurazioneRuolo ruolo: cambio.getStatoSuccessivo().getRuoliAbilitati()) {
					if(ruolo.equals(ruoloAttuale)) {
						ruoloPresent = true;
					} else if(ruoliInferiori.contains(ruolo)) {
						ruoliInferioriPresent = true;
					}
				}
				
				if(ruoloPresent && !ruoliInferioriPresent) {
					cambi.add(cambio.getStatoAttuale());
				}
			}
		}
		return cambi;
	}

	@Override
	public ResponseEntity<Resource> getImmagineServizio(UUID idServizio) {
		try {

			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");  
				ServizioEntity entity = this.findOne(idServizio);
				this.logger.debug("Autorizzazione completata con successo");     

				if(entity.getImmagine() == null) {
					throw new NotFoundException("Imagine per il servizio ["+idServizio+"] non trovata");
				}
				Resource resource = new ByteArrayResource(entity.getImmagine().getRawData());
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
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Void> deleteMessaggioServizio(UUID idServizio, UUID idMessaggio) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     
				MessaggioServizioEntity entity = this.service.findMessaggioServizio(idServizio, idMessaggio)
						.stream()
						.filter(m -> m.getUuid().equals(idMessaggio.toString())).findAny()
						.orElseThrow(() -> new NotFoundException("Messaggio ["+idMessaggio+"] non trovato per il servizio ["+idServizio+"]"));

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
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<Allegato> updateAllegatoServizio(UUID idServizio, UUID idAllegato, AllegatoUpdate allegatoUpdate) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");
				
				this.findOne(idServizio);

				AllegatoServizioEntity entity = this.service.findAllegatoServizio(idServizio, idAllegato)
						.orElseThrow(() -> new NotFoundException("Allegato ["+idAllegato+"] non trovato per il servizio ["+idServizio+"]"));

				this.getServizioAuthorization(entity.getServizio()).authorizeModifica(entity.getServizio(), Arrays.asList(ConfigurazioneClasseDato.GENERICO));

				this.logger.debug("Autorizzazione completata con successo");     

				if(!this.configurazione.getServizio().getVisibilitaAllegatiConsentite().contains(allegatoUpdate.getVisibilita())) {
					throw new BadRequestException("Visibilita ["+allegatoUpdate.getVisibilita()+"] non consentita");
				}
				
				String key = allegatoUpdate.getFilename()+ "_" + this.allegatoAssembler.toTipologia(allegatoUpdate.getTipologia());
				String keyString = "Nome: " + allegatoUpdate.getFilename()+ " di tipo: " + allegatoUpdate.getTipologia();

				
				if(entity.getServizio().getAllegati().stream().anyMatch(a-> !idAllegato.toString().equals(a.getDocumento().getUuid()) && key.equals(a.getDocumento().getFilename()+ "_" + a.getTipologia()))) {
					throw new BadRequestException("Allegato ["+keyString+"] duplicato");
				}

				this.allegatoAssembler.toEntity(allegatoUpdate,entity);

				this.service.save(entity);
				Allegato model = this.allegatoAssembler.toModel(entity);

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
	public ResponseEntity<ItemMessaggio> updateMessaggioServizio(UUID idServizio, UUID idMessaggio,
			MessaggioUpdate messaggioUpdate) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ..."); 
				
				this.findOne(idServizio);

				MessaggioServizioEntity entity = this.service.findMessaggioServizio(idServizio, idMessaggio)
						.stream()
						.filter(m -> m.getUuid().equals(idMessaggio.toString())).findAny()
						.orElseThrow(() -> new NotFoundException("Messaggio ["+idMessaggio+"] non trovato per il servizio ["+idServizio+"]"));

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
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<PagedModelAllegato> listAllegatiServizio(UUID idServizio, String q, String filename,
			TipologiaAllegatoEnum tipologiaAllegato, VisibilitaAllegatoEnum visibilitaAllegato, 
			Integer page, Integer size, List<String> sort) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     

				ServizioEntity entity = this.findOne(idServizio);

				this.logger.debug("Autorizzazione completata con successo");     

				AllegatoServizioSpecification spec = new AllegatoServizioSpecification();
				spec.setQ(Optional.ofNullable(q));
				spec.setFilename(Optional.ofNullable(filename));
				spec.setIdServizio(Optional.of(idServizio));

				if(tipologiaAllegato != null) {
					spec.setTipologia(Optional.of(allegatoAssembler.toTipologia(tipologiaAllegato)));
				}

				List<VISIBILITA> lstVisibilita = this.getServizioAuthorization(entity).getVisibilitaAllegato(entity);
				
				if(visibilitaAllegato != null) {
					VISIBILITA visibilita = allegatoAssembler.toVisibilita(visibilitaAllegato);
					if(lstVisibilita == null || lstVisibilita.contains(visibilita)) {
						spec.setVisibilita(Arrays.asList(visibilita));
					} else {
						spec.setVisibilita(new ArrayList<>());
					}
				} else {
					spec.setVisibilita(lstVisibilita);
				}

				CustomPageRequest pageable = new CustomPageRequest(page, size, sort, Arrays.asList("documento.filename"));

				Page<AllegatoServizioEntity> findAll = service.findAllAllegatiServizio(spec, pageable);

				Link link = Link.of(ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString(), IanaLinkRelations.SELF);


				PagedModel<Allegato> lst = allegatoPagedResourceAssembler.toModel(findAll, this.allegatoAssembler, link);

				PagedModelAllegato list = new PagedModelAllegato();
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
	public ResponseEntity<Void> deleteServizio(UUID idServizio) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     
				ServizioEntity entity = this.findOne(idServizio);

				this.getServizioAuthorization(entity).authorizeDelete(entity);
				this.logger.debug("Autorizzazione completata con successo");     
				if (service.isEliminabile(entity)) {
				    service.delete(entity);
				} else {
				    throw new BadRequestException("Il servizio non è eliminabile");
				}
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
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<PagedModelItemServizioGruppo> listServiziGruppi(UUID idGruppoPadre, Boolean gruppoPadreNull, TipoServizio tipo, String q, 
			Integer page, Integer size, List<String> sort) {
		try {
			
			this.logger.info("Invocazione in corso ...");     
			this.servizioAuthorization.authorizeList();
			this.logger.debug("Autorizzazione completata con successo");     
			return this.service.runTransaction( () -> {

				this.logger.info("PRE init Specification");
				
				ServizioGruppoSpecification specification = new ServizioGruppoSpecification();
				specification.setGruppo(Optional.ofNullable(idGruppoPadre));
				specification.setGruppoPadreNull(Optional.ofNullable(gruppoPadreNull));
				specification.setQ(Optional.ofNullable(q));
				specification.setUtenteAdmin(Optional.of(this.coreAuthorization.isAdmin()));

				if(tipo != null) {
					specification.setTipoComponente(Optional.of(this.dettaglioAssembler.toTipo(tipo)));
				}

				this.logger.info("POST init Specification");

				this.logger.info("PRE isAdmin");
				boolean admin = this.coreAuthorization.isAdmin() || this.coreAuthorization.isCoordinatore();
				this.logger.info("POST isAdmin");
				this.logger.info("PRE isAnounymous");
				boolean anounymous = this.coreAuthorization.isAnounymous();
				this.logger.info("POST isAnounymous");

				if(!admin) {
					if(anounymous) {
						specification.setUtente(Optional.of(new UtenteEntity()));
					} else {
						this.logger.info("PRE getUtenteSessione");
						UtenteEntity utente = this.coreAuthorization.getUtenteSessione();
						this.logger.info("POST getUtenteSessione");
						specification.setUtente(Optional.of(utente));
					}
				}
				
//				PageRequest pageable = PageRequest.of(0, Integer.MAX_VALUE, (sort != null) ? Sort.by(sort.toArray(new String[]{})): Sort.by("nome","versione"));
				CustomPageRequest pageable = new CustomPageRequest(0, Integer.MAX_VALUE, sort, Arrays.asList("nome","versione"));

				this.logger.info("PRE findAllServiziGruppi");
				Page<ServizioGruppoEntity> findAll = this.service.findAllServiziGruppi(
						specification,
						pageable
						);

				this.logger.info("POST findAllServiziGruppi");

				Link link = Link.of(ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString(), IanaLinkRelations.SELF);


				this.logger.info("PRE filtered");
				List<ServizioGruppoEntity> filtered = findAll
														.stream()
														.filter(sg -> !isEmpty(sg))
														.collect(Collectors.toList());
				
				this.logger.info("POST filtered");
				this.logger.info("PRE assembler");
				PagedModel<ItemServizioGruppo> lst = pagedResourceServizioGruppoAssembler.toModel(new PageImpl<>(filtered, pageable, filtered.size()), this.itemServizioGruppoAssembler, link);

				this.logger.info("POST assembler");
				this.logger.info("PRE pagedmodel");
				PagedModelItemServizioGruppo list = new PagedModelItemServizioGruppo();
				list.setContent(lst.getContent().stream().collect(Collectors.toList()));
				list.add(lst.getLinks());
				list.setPage(new PageMetadata().size((long)findAll.getSize()).number((long)findAll.getNumber()).totalElements(findAll.getTotalElements()).totalPages((long)findAll.getTotalPages()));
				this.logger.info("POST pagedmodel");

				this.logger.info("Invocazione completata con successo");
				
				return ResponseEntity.ok(list);

			});
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}

	}

	private ServizioEntity findOne(UUID idServizio) {
		
		UtenteEntity utente = this.coreAuthorization.getUtenteSessione();
		
		ServizioSpecification aspec = new ServizioSpecification();
		aspec.setStatiAderibili(this.configurazione.getServizio().getStatiAdesioneConsentita());

		boolean admin = this.coreAuthorization.isAdmin() || this.coreAuthorization.isCoordinatore();

		if(!admin) {
			if(this.coreAuthorization.isAnounymous()) {
				aspec.setUtente(Optional.of(new UtenteEntity()));
			} else {
				aspec.setUtente(Optional.of(utente));
			}
		}

		aspec.setIdServizi(List.of(idServizio));

		return this.service.findOne(aspec).orElseThrow(() -> new NotFoundException("Servizio con id ["+idServizio+"] non trovato"));

	}
	

	/*
	private boolean isEmpty(ServizioGruppoEntity sg) {
		if(sg.getTipo().equals(TipoServizioGruppoEnum.SERVIZIO)) {
			return false;
		}
		Optional<GruppoEntity> gruppoEntity = this.gruppoService.find(UUID.fromString(sg.getIdEntita()));
		GruppoEntity gruppo = null;
		if(gruppoEntity.isPresent())
			gruppoEntity.get();

		return isEmpty(gruppo);	
	}
	 */
	
	private boolean isEmpty(ServizioGruppoEntity sg) {
	    if (sg.getTipo().equals(TipoServizioGruppoEnum.SERVIZIO)) {
	        return false;
	    }

	    Optional<GruppoEntity> gruppoEntity = this.gruppoService.find(UUID.fromString(sg.getIdEntita()));

	    if (gruppoEntity.isPresent()) {
	        return isEmpty(gruppoEntity.get());
	    }

	    return true;
	}

	
	private boolean isEmpty(GruppoEntity gruppo) {

		if(!gruppo.getServizi().isEmpty()) {
			UtenteEntity utenteSessione = this.coreAuthorization.getUtenteSessione();
			
			for(ServizioEntity servizio: gruppo.getServizi()) {
				if(isVisibile(servizio, utenteSessione)) {
					return false;
				}
			}
		}
		
		for(GruppoEntity figlio: gruppo.getFigli()) {
			if(!isEmpty(figlio)) {
				return false;
			}
		}
		
		return true;
	}

	private boolean isVisibile(ServizioEntity servizio, UtenteEntity utenteSessione) {
		
		if(this.coreAuthorization.isAdmin(utenteSessione)) {
			return true;
		}

		boolean contains = false;

		org.govway.catalogo.core.orm.entity.DominioEntity.VISIBILITA visibilita = servizio.getVisibilita() != null ? servizio.getVisibilita(): servizio.getDominio().getVisibilita();

		if(visibilita.equals(org.govway.catalogo.core.orm.entity.DominioEntity.VISIBILITA.PUBBLICO)) {
			List<String> statiAdesione = this.configurazione.getServizio().getStatiAdesioneConsentita();
			contains =  contains || statiAdesione.contains(servizio.getStato());
		}
		
		if(utenteSessione != null) {


			if(visibilita.equals(org.govway.catalogo.core.orm.entity.DominioEntity.VISIBILITA.PUBBLICO) || visibilita.equals(org.govway.catalogo.core.orm.entity.DominioEntity.VISIBILITA.PRIVATO) || visibilita.equals(org.govway.catalogo.core.orm.entity.DominioEntity.VISIBILITA.RISERVATO) ) {
				Set<UtenteEntity> utentiVisibili = new HashSet<>();
				utentiVisibili.add(servizio.getRichiedente());
				
				for(ReferenteServizioEntity referente: servizio.getReferenti()) {
					utentiVisibili.add(referente.getReferente());
				}
				for(ReferenteDominioEntity referente: servizio.getDominio().getReferenti()) {
					utentiVisibili.add(referente.getReferente());
				}
				
				contains =  contains || contains(utentiVisibili, utenteSessione);

				if(visibilita.equals(org.govway.catalogo.core.orm.entity.DominioEntity.VISIBILITA.RISERVATO)) {
					Set<ClasseUtenteEntity> classiUtentiVisibili = new HashSet<>();
					
					classiUtentiVisibili.addAll(servizio.getClassi());
					classiUtentiVisibili.addAll(servizio.getDominio().getClassi());
					
					contains =  contains || contains(classiUtentiVisibili, utenteSessione.getClassi());
				}

			} else {
				if(visibilita != null && visibilita == org.govway.catalogo.core.orm.entity.DominioEntity.VISIBILITA.PUBBLICO) {
					List<String> statiAdesione = this.configurazione.getServizio().getStatiAdesioneConsentita();
					contains =  contains || statiAdesione.contains(servizio.getStato());
				}
			}
		}
		
		return contains;
		
	}

	private boolean contains(Set<ClasseUtenteEntity> classiServizio, Set<ClasseUtenteEntity> classiUtente) {
		for(ClasseUtenteEntity classeServizio: classiServizio) {
			for(ClasseUtenteEntity classeUtente: classiUtente) {
				if(classeUtente.getId().equals(classeServizio.getId())) {
					return true;
				}
			}
		}
		
		return false;
	}

	private boolean contains(Set<UtenteEntity> utentiVisibili, UtenteEntity utenteSessione) {
		for(UtenteEntity utente: utentiVisibili) {
			if(utente.getId().equals(utenteSessione.getId())) {
				return true;
			}
		}
		
		return false;
	}

	@Override
	public ResponseEntity<PagedModelItemOrganizzazione> listOrganizzazioniAmmissibili(UUID idServizio, String q, Integer page,
	Integer size, List<String> sort) {
		try {
			return this.service.runTransaction( () -> {

				OrganizzazioneSpecification specification = new OrganizzazioneSpecification();
				specification.setAderente(Optional.of(true));
				specification.setQ(Optional.ofNullable(q));

				this.logger.info("Invocazione in corso ...");     
				ServizioEntity entity = this.findOne(idServizio);
				
				this.logger.debug("Autorizzazione completata con successo");     

				Page<OrganizzazioneEntity> findAllUnf = this.organizzazioneService.findAll(
						specification,
						Pageable.unpaged()
						);
				
				
				List<OrganizzazioneEntity> findAllFiltered = new ArrayList<>();
				
				if(!entity.isMultiAdesione()) {
					Set<Long> setSoggetti = entity.getAdesioni().stream().map(a -> a.getSoggetto().getId()).collect(Collectors.toSet());
					for(OrganizzazioneEntity o: findAllUnf) {
						boolean existsSoggetto = false;
						for(SoggettoEntity s: o.getSoggetti()) {
							if(!setSoggetti.contains(s.getId())) {
								existsSoggetto = true;
							}
						}
						
						if(existsSoggetto) {
							findAllFiltered.add(o);
						}
					}
				} else {
					findAllFiltered = findAllUnf.getContent();
				}
				
				Page<OrganizzazioneEntity> findAll = new PageImpl<>(findAllFiltered);

				Link link = Link.of(ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString(), IanaLinkRelations.SELF);


				PagedModel<ItemOrganizzazione> lst = pagedResourceOrganizzazioneAssembler.toModel(findAll, this.itemOrganizzazioneAssembler, link);

				PagedModelItemOrganizzazione list = new PagedModelItemOrganizzazione();
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
			throw new InternalException(e);
		}

	}

	@Override
	public ResponseEntity<ItemGruppo> addGruppoServizio(UUID idServizio, UUID idGruppo) {
		try {
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");     
				ServizioEntity entity = this.findOne(idServizio);

				this.logger.debug("Autorizzazione completata con successo");     

				GruppoEntity gentity = this.gruppoService.find(idGruppo)
						.orElseThrow(() -> new NotFoundException("Gruppo ["+idGruppo+"] non trovato"));

				boolean added = entity.getGruppi().add(gentity);
				if(!added) {
					throw new ConflictException("Gruppo ["+gentity.getNome()+"] gia associato al servizio ["+entity.getNome()+"/"+entity.getVersione()+"]");
				}
				
//				this.getServizioAuthorization(entity).authorizeModifica(entity, Arrays.asList(ConfigurazioneClasseDato.GENERICO));
				
				if(!entity.getTipo().equals(gentity.getTipo())) {
					throw new RichiestaNonValidaSemanticamenteException("Impossibile associare il Gruppo ["+gentity.getNome()+"] di Tipo ["+gentity.getTipo()+"] al Servizio ["+entity.getNome()+"/"+entity.getVersione()+"] di Tipo ["+entity.getTipo()+"]. I due tipi devono coincidere");
				}
				
				this.service.save(entity);
				ItemGruppo model = this.itemGruppoAssembler.toModel(gentity);

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
	public ResponseEntity<Void> deleteGruppoServizio(UUID idServizio, UUID idGruppo) {
		try {
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");
				ServizioEntity entity = this.findOne(idServizio);

				this.logger.debug("Autorizzazione completata con successo");     

				GruppoEntity gentity = this.gruppoService.find(idGruppo)
						.orElseThrow(() -> new NotFoundException("Servizio ["+idServizio+"] non trovato"));

				entity.getGruppi().remove(gentity);
//				this.getServizioAuthorization(entity).authorizeModifica(entity, Arrays.asList(ConfigurazioneClasseDato.GENERICO));

				this.service.save(entity);
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
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<ListItemGruppo> listGruppiServizio(UUID idServizio) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     
				ServizioEntity entity = this.findOne(idServizio);

				this.logger.debug("Autorizzazione completata con successo");     


				ListItemGruppo list = new ListItemGruppo();
				List<ItemGruppo> lstGruppi = new ArrayList<>();
				for(GruppoEntity g: entity.getGruppi()) {
					lstGruppi.add(this.itemGruppoAssembler.toModel(g));
				}
				list.setContent(lstGruppi);

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
	public ResponseEntity<Grant> getGrantServizio(UUID idServizio) {
		try {
			return this.service.runTransaction( () -> {

				if(this.coreAuthorization.isAnounymous()) {

					Grant grant = new Grant();

					grant.setRuoli(new ArrayList<>());

					grant.setIdentificativo(GrantType.	NESSUNO);
					grant.setReferenti(GrantType.NESSUNO);
					grant.setSpecifica(GrantType.NESSUNO);
					grant.setGenerico(GrantType.NESSUNO);
					grant.setCollaudo(GrantType.NESSUNO);
					grant.setProduzione(GrantType.NESSUNO);

					return ResponseEntity.ok(grant);
				}
				
				this.logger.info("Invocazione in corso ...");     
				ServizioEntity entity = this.findOne(idServizio);
				
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
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<ListItemCategoria> addCategorieServizio(UUID idServizio, CategorieCreate categorieCreate) {
		try {
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");     

				ServizioEntity entity = this.findOne(idServizio);

				this.logger.debug("Autorizzazione completata con successo");     

				List<CategoriaEntity> cLst = new ArrayList<>();
				
				for(UUID id: categorieCreate.getCategorie()) {
					CategoriaEntity centity = this.tassonomiaService.findCategoria(id)
							.orElseThrow(() -> new NotFoundException("Categoria ["+id+"] non trovata"));

					if(!centity.getFigli().isEmpty()) {
						throw new ConflictException("Impossibile associare la Categoria ["+centity.getNome()+"] al servizio ["+entity.getNome()+"/"+entity.getVersione()+"]. categoria non foglia");
					}
					
					boolean added = entity.getCategorie().add(centity);
					if(!added) {
						throw new ConflictException("Categoria ["+centity.getNome()+"] gia associato al servizio ["+entity.getNome()+"/"+entity.getVersione()+"]");
					}
					
					cLst.add(centity);					
				}
				
				this.getServizioAuthorization(entity).authorizeModifica(entity, Arrays.asList(ConfigurazioneClasseDato.SPECIFICA));
				
				this.service.save(entity);
				
				Link link = Link.of(ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString(), IanaLinkRelations.SELF);


				ListItemCategoria model = new ListItemCategoria();

				model.setContent(cLst.stream().map(e -> this.categoriaServizioItemAssembler.toModel(e)).collect(Collectors.toList()));
				model.add(link);
				
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
	public ResponseEntity<Void> deleteCategoriaServizio(UUID idServizio, UUID idCategoria) {
		try {
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");     
				ServizioEntity entity = this.findOne(idServizio);

				this.logger.debug("Autorizzazione completata con successo");     

				CategoriaEntity centity = this.tassonomiaService.findCategoria(idCategoria)
						.orElseThrow(() -> new NotFoundException("Categoria ["+idCategoria+"] non trovata"));

				entity.getCategorie().remove(centity);
				this.getServizioAuthorization(entity).authorizeModifica(entity, Arrays.asList(ConfigurazioneClasseDato.SPECIFICA));

				this.service.save(entity);
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
			throw new InternalException(e);
		}
	}

	@Override
	public ResponseEntity<ListItemCategoria> listCategorieServizio(UUID idServizio) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     
				ServizioEntity entity = this.findOne(idServizio);

				this.logger.debug("Autorizzazione completata con successo");     



				ListItemCategoria list = new ListItemCategoria();
				List<ItemCategoriaServizio> lstCategorie = new ArrayList<>();
				for(CategoriaEntity g: entity.getCategorie()) {
					lstCategorie.add(this.categoriaServizioItemAssembler.toModel(g));
				}

				Comparator<? super ItemCategoriaServizio> c = new Comparator<>() {

					@Override
					public int compare(ItemCategoriaServizio o1, ItemCategoriaServizio o2) {

						String p1 = o1.getPathCategoria().stream().map(e -> e.getNome()).collect(Collectors.joining());
						String p2 = o2.getPathCategoria().stream().map(e -> e.getNome()).collect(Collectors.joining());

						return p1.compareTo(p2);
					}
				};

				lstCategorie= lstCategorie.stream().sorted(c).collect(Collectors.toList());

				list.setContent(lstCategorie);

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
	public ResponseEntity<Servizio> associaComponentePackage(UUID idPackage, UUID idComponente) {
		try {
			return this.service.runTransaction( () -> {

					this.logger.info("Invocazione in corso ...");     
					this.findOne(idPackage);

					this.logger.debug("Autorizzazione completata con successo");     

					ServizioSpecification specification = new ServizioSpecification();
					specification.set_package(Optional.of(true));
					specification.setIdServizi(List.of(idPackage));
					
					ServizioEntity _package = this.service.findOne(specification)
							.orElseThrow(() -> new NotFoundException("Package ["+idPackage+"] non trovato"));

					ServizioEntity componente = this.findOne(idComponente);

					PackageServizioEntity pse = new PackageServizioEntity();
					pse.set_package(_package);
					pse.setServizio(componente);
					
					_package.getComponenti().add(pse);
					
					this.packageAuthorization.authorizeGet(_package);

					this.service.save(_package);
					
					Servizio model = this.dettaglioAssembler.toModel(_package);

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
	public ResponseEntity<Void> deleteComponentePackage(UUID idPackage, UUID idComponente) {
		try {
			return this.service.runTransaction( () -> {

					this.logger.info("Invocazione in corso ...");     
					
					this.findOne(idPackage);
					this.findOne(idComponente);
					this.logger.debug("Autorizzazione completata con successo");     

					PackageServizioSpecification specification = new PackageServizioSpecification();
					specification.setIdPackage(Optional.of(idPackage));
					specification.setIdComponente(Optional.of(idComponente));
					
					PackageServizioEntity componente = this.service.findOnePackageServizio(specification)
							.orElseThrow(() -> new NotFoundException("Servizio ["+idComponente+"] non associato al Package ["+idPackage+"]"));

					this.packageAuthorization.authorizeDelete(componente.get_package());
					
					this.service.delete(componente);
					
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
					throw new InternalException(e);
				}

	}

	@Override
	public ResponseEntity<PagedModelComponente> listComponentiPackage(UUID idPackage, Pageable pageRequest) {
		try {
			return this.service.runTransaction( () -> {

					this.logger.info("Invocazione in corso ...");     
					this.findOne(idPackage);
					this.logger.debug("Autorizzazione completata con successo");     

					ServizioSpecification specification = new ServizioSpecification();
					specification.setIdPackage(Optional.of(idPackage));
					
					PageRequest pageable = pageRequest.getSort().equals(Sort.unsorted()) ?
							PageRequest.of(pageRequest.getPageNumber(), pageRequest.getPageSize(), Sort.by(Order.asc("nome"), Order.asc("versione"))) :
								PageRequest.of(pageRequest.getPageNumber(), pageRequest.getPageSize(), pageRequest.getSort());

					Page<ServizioEntity> findAll = this.service.findAll(
							specification,
							pageable
							);

					this.packageAuthorization.authorizeList();


					Link link = Link.of(ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString(), IanaLinkRelations.SELF);


					PagedModel<ItemServizio> lst = pagedResourceAssembler.toModel(findAll, this.itemAssembler, link);

					PagedModelComponente list = new PagedModelComponente();

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

}
