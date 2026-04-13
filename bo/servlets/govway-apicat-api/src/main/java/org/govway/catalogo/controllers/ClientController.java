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

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.govway.catalogo.ApiV1Controller;
import org.govway.catalogo.assembler.ClientDettaglioAssembler;
import org.govway.catalogo.assembler.ClientEngineAssembler;
import org.govway.catalogo.assembler.ClientItemAssembler;
import org.govway.catalogo.authorization.ClientAuthorization;
import org.govway.catalogo.core.dao.specifications.AdesioneSpecification;
import org.govway.catalogo.core.dao.specifications.ClientSpecification;
import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.core.orm.entity.EstensioneClientEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity.StatoEnum;
import org.govway.catalogo.core.services.AdesioneService;
import org.govway.catalogo.core.services.ClientService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.exception.RichiestaNonValidaSemanticamenteException;
import org.govway.catalogo.servlets.api.ClientApi;
import org.govway.catalogo.servlets.model.AmbienteEnum;
import org.govway.catalogo.servlets.model.AuthTypeEnum;
import org.govway.catalogo.servlets.model.Client;
import org.govway.catalogo.servlets.model.ClientCreate;
import org.govway.catalogo.servlets.model.ClientUpdate;
import org.govway.catalogo.servlets.model.ItemClient;
import org.govway.catalogo.servlets.model.PageMetadata;
import org.govway.catalogo.servlets.model.PagedModelItemClient;
import org.govway.catalogo.servlets.model.StatoClientEnum;
import org.govway.catalogo.servlets.model.StatoClientUpdate;
import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.services.CertificatoScadenzaService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.IanaLinkRelations;
import org.springframework.hateoas.Link;
import org.springframework.hateoas.PagedModel;
import org.springframework.hateoas.server.mvc.WebMvcLinkBuilder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@ApiV1Controller
public class ClientController implements ClientApi {

	@Autowired
	private ClientService service;

	@Autowired
	private AdesioneService adesioneService;

	@Autowired
	private PagedResourcesAssembler<ClientEntity> pagedResourceAssembler;

    @Autowired
    private ClientDettaglioAssembler dettaglioAssembler;
   
    @Autowired
    private ClientItemAssembler itemAssembler;   
	
	@Autowired
	private ClientEngineAssembler clientEngineAssembler;

	@Autowired
	private ClientAuthorization authorization;

	@Autowired
	private CoreAuthorization coreAuthorization;

	@Autowired
	private Configurazione configurazione;

	@Autowired
	private CertificatoScadenzaService certScadenzaService;

	private Logger logger = LoggerFactory.getLogger(ClientController.class);

	@Override
	public ResponseEntity<Client> createClient(ClientCreate clientCreate) {
		try {
			this.logger.info("Invocazione in corso ...");
			this.authorization.authorizeCreate(clientCreate);
			this.logger.debug("Autorizzazione completata con successo");     

			return this.service.runTransaction( () -> {

				ClientEntity entity = this.dettaglioAssembler.toEntity(clientCreate);

				if(this.service.existsByNomeSoggettoAmbiente(entity)) {
					throw new ConflictException(ErrorCode.CLT_409, Map.of("nome", clientCreate.getNome(), "soggetto", entity.getSoggetto().getNome(), "ambiente", clientCreate.getAmbiente().toString()));
				}
				
				this.service.save(entity);
				Client model = this.dettaglioAssembler.toModel(entity);

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
	public ResponseEntity<Void> deleteClient(UUID idClient) {
		try {
			return this.service.runTransaction( () -> {
	
				this.logger.info("Invocazione in corso ...");     
				ClientEntity entity = this.service.find(idClient)
						.orElseThrow(() -> new NotFoundException(ErrorCode.CLT_404));
				this.authorization.authorizeDelete(entity);
				this.logger.debug("Autorizzazione completata con successo");     
	
				if(!entity.getAdesioni().isEmpty()) {
					throw new RichiestaNonValidaSemanticamenteException(ErrorCode.VAL_422_CLIENT_HAS_ADHESIONS, Map.of("nome", entity.getNome(), "soggetto", entity.getSoggetto().getNome(), "ambiente", entity.getAmbiente().toString(), "numAdesioni", String.valueOf(entity.getAdesioni().size())));
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
			throw new InternalException(ErrorCode.SYS_500);
		}
	}

	@Override
	public ResponseEntity<Client> getClient(UUID idClient) {
		try {
			return this.service.runTransaction( () -> {
	
				this.logger.info("Invocazione in corso ...");     

				ClientEntity entity = this.service.find(idClient)
						.orElseThrow(() -> new NotFoundException(ErrorCode.CLT_404));
	
				this.authorization.authorizeGet(entity);
				
				this.logger.debug("Autorizzazione completata con successo");     

				Client model = this.dettaglioAssembler.toModel(entity);
	
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
	public ResponseEntity<PagedModelItemClient> listClient(UUID idSoggetto, String nome,
			UUID idOrganizzazione, AmbienteEnum ambiente, AuthTypeEnum authType, StatoClientEnum stato,
			UUID idClient, String q, Boolean dashboard, Integer page, Integer size, List<String> sort) {
		try {

			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");
				this.logger.debug("Autorizzazione completata con successo");

				ClientSpecification spec = new ClientSpecification();
				spec.setQ(Optional.ofNullable(q));
				spec.setNome(Optional.ofNullable(nome));
				spec.setIdClient(Optional.ofNullable(idClient));
				spec.setIdSoggetto(Optional.ofNullable(idSoggetto));
				spec.setIdOrganizzazione(Optional.ofNullable(idOrganizzazione));

				if(stato!=null) {
					spec.setStato(Optional.of(this.clientEngineAssembler.toStatoClient(stato)));
				}

				if(ambiente != null) {
					spec.setAmbiente(Optional.of(this.clientEngineAssembler.toAmbiente(ambiente)));
				}

				if(authType != null) {
					spec.setAuthType(Optional.of(this.clientEngineAssembler.getAuthType(authType)));
				}

				// Gestione filtro dashboard
				if(dashboard != null && dashboard) {
					// Solo GESTORE può usare il filtro dashboard
					if(!this.coreAuthorization.isAdmin()) {
						throw new NotAuthorizedException(ErrorCode.AUT_403);
					}

					// Filtra client in stato NUOVO (filtro base dashboard)
					spec.setDashboardStato(Optional.of(StatoEnum.NUOVO));

					// Filtra client associati ad adesioni negli stati configurati
					List<String> statiDashboardClient = this.configurazione.getAdesione().getStatiDashboardClient();
					if(statiDashboardClient != null && !statiDashboardClient.isEmpty()) {
						spec.setAdesioniStati(statiDashboardClient);
					}

					// Aggiungi client con certificato in scadenza (indipendentemente dallo stato)
					Set<Long> clientIdsInScadenza = this.certScadenzaService.getClientIdsInScadenza();
					if(!clientIdsInScadenza.isEmpty()) {
						spec.setOrClientIds(clientIdsInScadenza);
					}
				}

				CustomPageRequest pageable = new CustomPageRequest(page, size, sort, Arrays.asList("nome"));

				Page<ClientEntity> findAll = this.service.findAll(spec, pageable);

				Link link = Link.of(ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString(), IanaLinkRelations.SELF);

				PagedModel<ItemClient> lst = pagedResourceAssembler.toModel(findAll, this.itemAssembler, link);

				// Popola la data di scadenza certificato per i client in scadenza (solo dashboard)
				if(dashboard != null && dashboard) {
					Map<UUID, Date> scadenze = this.certScadenzaService.getClientScadenzeCertificato();
					if(!scadenze.isEmpty()) {
						for(ItemClient item : lst.getContent()) {
							Date scadenza = scadenze.get(item.getIdClient());
							if(scadenza != null) {
								item.setScadenzaCertificato(scadenza.toInstant().atOffset(ZoneOffset.UTC));
							}
						}
					}
				}

				PagedModelItemClient list = new PagedModelItemClient();
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
	public ResponseEntity<Client> updateClient(UUID idClient, ClientUpdate clientUpdate) {
		try {
			return this.service.runTransaction( () -> {
	
				this.logger.info("Invocazione in corso ...");     

				ClientEntity entity = this.service.find(idClient)
						.orElseThrow(() -> new NotFoundException(ErrorCode.CLT_404));
				this.authorization.authorizeUpdate(clientUpdate, entity);
				
				this.logger.debug("Autorizzazione completata con successo");     

				boolean nomeCambiato = !entity.getNome().equals(clientUpdate.getNome());
				boolean soggettoCambiato = !entity.getSoggetto().getIdSoggetto().equals(clientUpdate.getIdSoggetto().toString());
				boolean ambienteCambiato = !entity.getAmbiente().equals(this.clientEngineAssembler.toAmbiente(clientUpdate.getAmbiente()));
				
				if(nomeCambiato || soggettoCambiato || ambienteCambiato) {
					if(this.service.existsByNomeSoggettoAmbiente(clientUpdate.getNome(), clientUpdate.getIdSoggetto().toString(), this.clientEngineAssembler.toAmbiente(clientUpdate.getAmbiente()))) {
						throw new ConflictException(ErrorCode.CLT_409, Map.of("nome", clientUpdate.getNome(), "soggetto", entity.getSoggetto().getNome(), "ambiente", clientUpdate.getAmbiente().toString()));
					}

					if(entity.getStato().equals(StatoEnum.CONFIGURATO)) {
						throw new BadRequestException(ErrorCode.CLT_400_CONFIGURED, Map.of("nome", entity.getNome(), "soggetto", entity.getSoggetto().getNome(), "ambiente", entity.getAmbiente().toString()));
					}


					if(soggettoCambiato || ambienteCambiato) {
						AdesioneSpecification spec = new AdesioneSpecification();
						spec.setClient(Optional.of(idClient));
						long cnt = adesioneService.count(spec);

						if(cnt > 0) {
							throw new BadRequestException(ErrorCode.CLT_400_HAS_ADHESIONS, Map.of("nome", entity.getNome(), "soggetto", entity.getSoggetto().getNome(), "ambiente", entity.getAmbiente().toString(), "numAdesioni", String.valueOf(cnt)));
						}

					}
				}
				
				
				this.dettaglioAssembler.toEntity(clientUpdate, entity);
	
				this.service.save(entity);
				Client model = this.dettaglioAssembler.toModel(entity);
	
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
	public ResponseEntity<Resource> downloadAllegatoClient(UUID idClient, UUID idAllegato) {
		try {

			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     
				
				ClientEntity entity = this.service.find(idClient)
						.orElseThrow(() -> new NotFoundException(ErrorCode.CLT_404));
				this.authorization.authorizeGet(entity);
				
				this.logger.debug("Autorizzazione completata con successo");     

				EstensioneClientEntity allegato = entity.getEstensioni().stream().filter(e -> e.getDocumento()!= null && e.getDocumento().getUuid().equals(idAllegato.toString()))
						.findAny()
						.orElseThrow(() -> new NotFoundException(ErrorCode.DOC_404));
				Resource resource = new ByteArrayResource(allegato.getDocumento().getRawData());
				this.logger.info("Invocazione completata con successo");
				return ResponseEntity.status(HttpStatus.OK)
						.header("Content-Disposition", "attachment; filename="+allegato.getDocumento().getFilename())
						.body(resource);
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
	public ResponseEntity<Client> updateClientStato(UUID idClient, StatoClientUpdate statoClientUpdate) {
		try {
			return this.service.runTransaction( () -> {
	
				this.logger.info("Invocazione in corso ...");     
				
				ClientEntity entity = this.service.find(idClient)
						.orElseThrow(() -> new NotFoundException(ErrorCode.CLT_404));
				this.authorization.authorizeUpdate(null, entity);
				
				this.logger.debug("Autorizzazione completata con successo");     
	
				this.dettaglioAssembler.toEntity(statoClientUpdate, entity);
	
				this.service.save(entity);
				Client model = this.dettaglioAssembler.toModel(entity);
	
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
