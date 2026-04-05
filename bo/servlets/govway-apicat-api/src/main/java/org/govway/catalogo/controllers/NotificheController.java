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

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
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
import org.govway.catalogo.core.orm.entity.NotificaEntity.STATO;
import org.govway.catalogo.core.orm.entity.NotificaEntity.TIPO;
import org.govway.catalogo.core.orm.entity.ReferenteAdesioneEntity;
import org.govway.catalogo.core.orm.entity.ReferenteDominioEntity;
import org.govway.catalogo.core.orm.entity.ReferenteServizioEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.TIPO_REFERENTE;
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
import org.govway.catalogo.servlets.model.RuoloReferenteEnum;
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
			UUID idAdesione, Boolean dashboard) {

		try {
			this.logger.info("Invocazione in corso ...");

			return this.service.runTransaction( () -> {

				NotificaSpecification specification = getSpecification(q, tipoNotifica, statoNotifica,
						tipoEntitaNotifica, idEntitaNotifica, idMittente, idServizio, idAdesione, dashboard);

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
			UUID idAdesione, Boolean dashboard, Integer page, Integer size, List<String> sort) {
		try {
			this.logger.info("Invocazione in corso ...");

			return this.service.runTransaction( () -> {

				NotificaSpecification specification = getSpecification(q, tipoNotifica, statoNotifica,
						tipoEntitaNotifica, idEntitaNotifica, idMittente, idServizio, idAdesione, dashboard);

				CustomPageRequest pageable = new CustomPageRequest(page, size, sort, Arrays.asList("data,desc"));

				Page<NotificaEntity> findAll = this.service.findAll(
						specification,
						pageable
						);

				Link link = Link.of(ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString(), IanaLinkRelations.SELF);


				PagedModel<ItemNotifica> lst = pagedResourceAssembler.toModel(findAll, this.itemAssembler, link);

				PagedModelItemNotifica list = new PagedModelItemNotifica();
				list.setContent(lst.getContent().stream().collect(Collectors.toList()));

				// Popola ruoliReferente per ogni notifica
				UtenteEntity utente = this.coreAuthorization.getUtenteSessione();

				// Precarica le relazioni referente per l'utente
				List<ReferenteDominioEntity> refDomini = this.adesioneService.findReferentiDominioByUtente(utente);
				List<ReferenteServizioEntity> refServizi = this.adesioneService.findReferentiServizioByUtente(utente);
				List<ReferenteAdesioneEntity> refAdesioni = this.adesioneService.findReferentiAdesioneByUtente(utente);

				Set<Long> dominiReferente = new HashSet<>();
				Set<Long> dominiReferenteTecnico = new HashSet<>();
				for (ReferenteDominioEntity ref : refDomini) {
					if (ref.getTipo() == TIPO_REFERENTE.REFERENTE) {
						dominiReferente.add(ref.getDominio().getId());
					} else if (ref.getTipo() == TIPO_REFERENTE.REFERENTE_TECNICO) {
						dominiReferenteTecnico.add(ref.getDominio().getId());
					}
				}

				Set<Long> serviziReferente = new HashSet<>();
				Set<Long> serviziReferenteTecnico = new HashSet<>();
				for (ReferenteServizioEntity ref : refServizi) {
					if (ref.getTipo() == TIPO_REFERENTE.REFERENTE) {
						serviziReferente.add(ref.getServizio().getId());
					} else if (ref.getTipo() == TIPO_REFERENTE.REFERENTE_TECNICO) {
						serviziReferenteTecnico.add(ref.getServizio().getId());
					}
				}

				// Richiedente servizio: stored on ServizioEntity, not as TIPO_REFERENTE
				Set<Long> serviziRichiedente = this.servizioService.findAllByRichiedente(utente).stream()
						.map(ServizioEntity::getId)
						.collect(Collectors.toSet());

				Set<Long> adesioniReferente = new HashSet<>();
				Set<Long> adesioniReferenteTecnico = new HashSet<>();
				for (ReferenteAdesioneEntity ref : refAdesioni) {
					if (ref.getTipo() == TIPO_REFERENTE.REFERENTE) {
						adesioniReferente.add(ref.getAdesione().getId());
					} else if (ref.getTipo() == TIPO_REFERENTE.REFERENTE_TECNICO) {
						adesioniReferenteTecnico.add(ref.getAdesione().getId());
					}
				}

				// Richiedente adesione: stored on AdesioneEntity, not as TIPO_REFERENTE
				Set<Long> adesioniRichiedente = this.adesioneService.findAllByRichiedente(utente).stream()
						.map(AdesioneEntity::getId)
						.collect(Collectors.toSet());

				// Crea una mappa per accedere rapidamente alle entity NotificaEntity
				Map<UUID, NotificaEntity> notificaEntityMap = findAll.getContent().stream()
						.collect(Collectors.toMap(n -> UUID.fromString(n.getIdNotifica()), n -> n));

				// Popola ruoliReferente per ogni ItemNotifica
				for (ItemNotifica item : list.getContent()) {
					NotificaEntity notifica = notificaEntityMap.get(item.getIdNotifica());
					if (notifica != null) {
						List<RuoloReferenteEnum> ruoli = calcolaRuoliReferenteNotifica(notifica,
								dominiReferente, dominiReferenteTecnico,
								serviziReferente, serviziReferenteTecnico, serviziRichiedente,
								adesioniReferente, adesioniReferenteTecnico, adesioniRichiedente);
						item.setRuoliReferente(ruoli);
					}
				}

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
			TipoEntitaNotifica tipoEntitaNotifica, UUID idEntitaNotifica, UUID idMittente, UUID idServizio, UUID idAdesione, Boolean dashboard) {

		UtenteEntity mittente = null;
		if(idMittente != null) {
			mittente = this.utenteService.find(idMittente).orElseThrow(() -> new NotFoundException(ErrorCode.UT_404, Map.of("idUtente", idMittente.toString())));
		}

		ServizioEntity servizio = null;
		if(idServizio != null) {
			servizio= this.servizioService.find(idServizio).orElseThrow(() -> new NotFoundException(ErrorCode.SRV_404, Map.of("idServizio", idServizio.toString())));
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

		// Se dashboard=true, prende tutte le notifiche (di tutti i tipi) con stato NUOVA o LETTA (esclude ARCHIVIATA)
		if (dashboard != null && dashboard) {
			specification.setStati(Arrays.asList(STATO.NUOVA, STATO.LETTA));
		} else {
			if(statoNotifica != null) {
				specification.setStati(statoNotifica.stream().map(s -> this.engineAssembler.getStato(s)).collect(Collectors.toList()));
			}
			specification.setTipo(Optional.ofNullable(this.engineAssembler.getTipo(tipoNotifica)));
		}

		specification.setTipoEntita(Optional.ofNullable(this.engineAssembler.getTipoEntita(tipoEntitaNotifica)));
		specification.setDestinatario(Optional.of(this.coreAuthorization.getUtenteSessione()));
		// Esclude le notifiche di tipo email dalla lista visualizzata nella webapp
		specification.setEscludiEmail(true);
		return specification;
	}

	private List<RuoloReferenteEnum> calcolaRuoliReferenteNotifica(NotificaEntity notifica,
			Set<Long> dominiReferente, Set<Long> dominiReferenteTecnico,
			Set<Long> serviziReferente, Set<Long> serviziReferenteTecnico, Set<Long> serviziRichiedente,
			Set<Long> adesioniReferente, Set<Long> adesioniReferenteTecnico, Set<Long> adesioniRichiedente) {
		List<RuoloReferenteEnum> ruoli = new ArrayList<>();

		// Verifica se la notifica è relativa a un servizio
		if (notifica.getServizio() != null) {
			ServizioEntity servizio = notifica.getServizio();

			// Check referente dominio
			if (servizio.getDominio() != null && dominiReferente.contains(servizio.getDominio().getId())) {
				ruoli.add(RuoloReferenteEnum.REFERENTE_DOMINIO);
			}
			// Check referente tecnico dominio
			if (servizio.getDominio() != null && dominiReferenteTecnico.contains(servizio.getDominio().getId())) {
				ruoli.add(RuoloReferenteEnum.REFERENTE_TECNICO_DOMINIO);
			}
			// Check referente servizio
			if (serviziReferente.contains(servizio.getId())) {
				ruoli.add(RuoloReferenteEnum.REFERENTE_SERVIZIO);
			}
			// Check referente tecnico servizio
			if (serviziReferenteTecnico.contains(servizio.getId())) {
				ruoli.add(RuoloReferenteEnum.REFERENTE_TECNICO_SERVIZIO);
			}
			// Check richiedente servizio
			if (serviziRichiedente.contains(servizio.getId())) {
				ruoli.add(RuoloReferenteEnum.RICHIEDENTE_SERVIZIO);
			}
		}

		// Verifica se la notifica è relativa a un'adesione
		if (notifica.getAdesione() != null) {
			AdesioneEntity adesione = notifica.getAdesione();

			// Check referente dominio del servizio dell'adesione
			if (adesione.getServizio() != null && adesione.getServizio().getDominio() != null
					&& dominiReferente.contains(adesione.getServizio().getDominio().getId())) {
				ruoli.add(RuoloReferenteEnum.REFERENTE_DOMINIO);
			}
			// Check referente tecnico dominio del servizio dell'adesione
			if (adesione.getServizio() != null && adesione.getServizio().getDominio() != null
					&& dominiReferenteTecnico.contains(adesione.getServizio().getDominio().getId())) {
				ruoli.add(RuoloReferenteEnum.REFERENTE_TECNICO_DOMINIO);
			}
			// Check referente servizio dell'adesione
			if (adesione.getServizio() != null && serviziReferente.contains(adesione.getServizio().getId())) {
				ruoli.add(RuoloReferenteEnum.REFERENTE_SERVIZIO);
			}
			// Check referente tecnico servizio dell'adesione
			if (adesione.getServizio() != null && serviziReferenteTecnico.contains(adesione.getServizio().getId())) {
				ruoli.add(RuoloReferenteEnum.REFERENTE_TECNICO_SERVIZIO);
			}
			// Check referente adesione
			if (adesioniReferente.contains(adesione.getId())) {
				ruoli.add(RuoloReferenteEnum.REFERENTE_ADESIONE);
			}
			// Check referente tecnico adesione
			if (adesioniReferenteTecnico.contains(adesione.getId())) {
				ruoli.add(RuoloReferenteEnum.REFERENTE_TECNICO_ADESIONE);
			}
			// Check richiedente adesione
			if (adesioniRichiedente.contains(adesione.getId())) {
				ruoli.add(RuoloReferenteEnum.RICHIEDENTE_ADESIONE);
			}
		}

		return ruoli;
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
						throw new NotAuthorizedException(ErrorCode.AUT_403);
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
