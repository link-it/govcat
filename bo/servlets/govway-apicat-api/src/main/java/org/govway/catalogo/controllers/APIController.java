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

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.govway.catalogo.ApiV1Controller;
import org.govway.catalogo.assembler.AllegatoApiAssembler;
import org.govway.catalogo.assembler.ApiDettaglioAssembler;
import org.govway.catalogo.assembler.ApiEngineAssembler;
import org.govway.catalogo.assembler.ApiItemAssembler;
import org.govway.catalogo.assembler.ServizioDettaglioAssembler;
import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.authorization.ServizioAuthorization;
import org.govway.catalogo.core.business.utils.EServiceBuilder;
import org.govway.catalogo.core.business.utils.YamltoJsonUtils;
import org.govway.catalogo.core.dao.specifications.AllegatoApiSpecification;
import org.govway.catalogo.core.dao.specifications.ApiSpecification;
import org.govway.catalogo.core.dao.specifications.ServizioSpecification;
import org.govway.catalogo.core.orm.entity.AllegatoApiEntity;
import org.govway.catalogo.core.orm.entity.AllegatoApiEntity.TIPOLOGIA;
import org.govway.catalogo.core.orm.entity.AllegatoApiEntity.VISIBILITA;
import org.govway.catalogo.core.orm.entity.ApiConfigEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity.PROTOCOLLO;
import org.govway.catalogo.core.orm.entity.DocumentoEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.services.ApiService;
import org.govway.catalogo.core.services.DocumentoService;
import org.govway.catalogo.core.services.ServizioService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.api.ApiApi;
import org.govway.catalogo.servlets.model.*;
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
public class APIController implements ApiApi {

	private Logger logger = LoggerFactory.getLogger(APIController.class);

	@Autowired
	private ApiService service;

	@Autowired
	private ServizioService servizioService;

	@Autowired
	private CoreAuthorization coreAuthorization;   

	@Autowired
	private PagedResourcesAssembler<AllegatoApiEntity> allegatoPagedResourceAssembler;

	@Autowired
	private AllegatoApiAssembler allegatoAssembler;

	@Autowired
	private ApiDettaglioAssembler dettaglioAssembler;

	@Autowired
	private ServizioDettaglioAssembler servizioDettaglioAssembler;

	@Autowired
	private ApiItemAssembler itemAssembler;   

	@Autowired
	private ApiEngineAssembler engineAssembler;   

	@Autowired
	private EServiceBuilder serviceBuilder;

	@Autowired
	private ServizioAuthorization servizioAuthorization;   

	@Autowired
	private Configurazione configurazione;

	@Autowired
	private DocumentoService documentoService;

	@Override
	public ResponseEntity<List<Allegato>> createAllegatoAPI(UUID idApi, List<AllegatoItemCreate> allegatoCreate) {
		try {

			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     
				ApiEntity entity = findApi(idApi);

				Set<ConfigurazioneClasseDato> confS = new HashSet<>();
				Set<String> keys = new HashSet<>();
				for(AllegatoItemCreate allegato: allegatoCreate) {
					confS.add(allegato.getTipologia().equals(TipologiaAllegatoEnum.GENERICO) ? ConfigurazioneClasseDato.GENERICO : ConfigurazioneClasseDato.SPECIFICA);
				}

				this.servizioAuthorization.authorizeModifica(entity.getServizio(), confS.stream().collect(Collectors.toList()));
				this.logger.debug("Autorizzazione completata con successo");     

				List<Allegato> allegatoLst = new ArrayList<>();
				for(AllegatoItemCreate allegato: allegatoCreate) {
					if(!this.configurazione.getServizio().getVisibilitaAllegatiConsentite().contains(allegato.getVisibilita())) {
						throw new BadRequestException("Visibilita ["+allegato.getVisibilita()+"] non consentita");
					}
					AllegatoApiEntity allEntity = this.allegatoAssembler.toEntity(allegato, entity);
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

	private Optional<ServizioEntity> findOne(UUID idServizio) {
		
		UtenteEntity utente = this.coreAuthorization.getUtenteSessione();
		
		ServizioSpecification aspec = new ServizioSpecification();
		aspec.setStatiAderibili(this.configurazione.getServizio().getStatiAdesioneConsentita());

		if(!this.coreAuthorization.isAdmin()) {
			if(this.coreAuthorization.isAnounymous()) {
				aspec.setUtente(Optional.of(new UtenteEntity()));
			} else {
				aspec.setUtente(Optional.of(utente));
			}
		}

		aspec.setIdServizi(List.of(idServizio));

		return this.servizioService.findOne(aspec);

	}

	
	private ApiEntity findApi(UUID idApi) {
		ApiEntity entity = this.service.find(idApi)
				.orElseThrow(() -> new NotFoundException("Api ["+idApi+"] non trovata"));
		
		Optional<ServizioEntity> oS = this.findOne(UUID.fromString(entity.getServizio().getIdServizio()));
		
		if(!oS.isPresent()) {
			throw new NotFoundException("Api ["+idApi+"] non trovata");
		}
		
		return entity;
	}

	@Override
	public ResponseEntity<API> createApi(APICreate apiCreate) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     
				ApiEntity entity = this.dettaglioAssembler.toEntity(apiCreate);
				ServizioEntity servizio = entity.getServizio();
				this.servizioAuthorization.authorizeModifica(servizio, Arrays.asList(ConfigurazioneClasseDato.IDENTIFICATIVO));
				this.logger.debug("Autorizzazione completata con successo");     

				if(this.service.existsByNomeVersioneSoggetto(apiCreate.getNome(), apiCreate.getVersione(), UUID.fromString(servizio.getDominio().getSoggettoReferente().getIdSoggetto()))) {
					throw new ConflictException("API ["+apiCreate.getNome()+"/"+apiCreate.getVersione()+"/"+servizio.getDominio().getSoggettoReferente().getNome()+"] esiste gia");
				}

				this.service.save(entity);
				API api = this.dettaglioAssembler.toModel(entity);
				this.logger.info("Invocazione completata con successo");

				return ResponseEntity.ok(api);
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
	public ResponseEntity<Void> deleteAPI(UUID idApi) {
		try {
			this.logger.info("Invocazione in corso ...");     
			this.logger.debug("Autorizzazione completata con successo");     

			return this.service.runTransaction( () -> {

				ApiEntity entity = findApi(idApi);

				if(!entity.getErogazioni().isEmpty()) {
					throw new BadRequestException("Impossibile eliminare l'API ["+entity.getNome()+"/"+entity.getVersione()+"] perché è utilizzata in ["+entity.getErogazioni().size()+"] adesioni");
				}

				this.service.delete(entity);
				this.servizioAuthorization.authorizeModifica(entity.getServizio(), Arrays.asList(ConfigurazioneClasseDato.IDENTIFICATIVO));

				this.servizioDettaglioAssembler.setUltimaModifica(entity.getServizio());
				this.servizioService.save(entity.getServizio());
				
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
	public ResponseEntity<Void> deleteAllegatoAPI(UUID idApi, UUID idAllegato) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     
				AllegatoApiEntity entity = this.service.findAllegatoApi(idApi, idAllegato)
						.orElseThrow(() -> new NotFoundException("Allegato ["+idAllegato+"] non trovato per l'API ["+idApi+"]"));

				ConfigurazioneClasseDato conf = entity.getTipologia().equals(TIPOLOGIA.GENERICO) ? ConfigurazioneClasseDato.GENERICO : ConfigurazioneClasseDato.SPECIFICA;
				this.servizioAuthorization.authorizeModifica(entity.getApi().getServizio(), Arrays.asList(conf));

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
	public ResponseEntity<Resource> downloadAllegatoAPI(UUID idApi, UUID idAllegato) {
		try {
			this.logger.info("Invocazione in corso ...");     
			this.logger.debug("Autorizzazione completata con successo");     

			return this.service.runTransaction( () -> {

				AllegatoApiEntity entity = this.service.findAllegatoApi(idApi, idAllegato)
						.orElseThrow(() -> new NotFoundException("Allegato ["+idAllegato+"] non trovato per l'API ["+idApi+"]"));

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
	public ResponseEntity<Allegato> updateAllegatoAPI(UUID idApi, UUID idAllegato, AllegatoUpdate allegatoUpdate) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     

				AllegatoApiEntity entity = this.service.findAllegatoApi(idApi, idAllegato)
						.orElseThrow(() -> new NotFoundException("Allegato ["+idAllegato+"] non trovato per l'API ["+idApi+"]"));

				//entity.getApi().getAllegati().stream().forEach(a-> System.out.println("DOCUMENTO: " + a.getDocumento().getFilename() + " ID_ALLEGATO: " + a.getDocumento().getUuid()));
				
				ConfigurazioneClasseDato conf = entity.getTipologia().equals(TIPOLOGIA.GENERICO) ? ConfigurazioneClasseDato.GENERICO : ConfigurazioneClasseDato.SPECIFICA;
				this.servizioAuthorization.authorizeModifica(entity.getApi().getServizio(), Arrays.asList(conf));

				this.logger.debug("Autorizzazione completata con successo");     

				if(!this.configurazione.getServizio().getVisibilitaAllegatiConsentite().contains(allegatoUpdate.getVisibilita())) {
					throw new BadRequestException("Visibilita ["+allegatoUpdate.getVisibilita()+"] non consentita");
				}
				//this.allegatoAssembler.toEntity(allegatoUpdate,entity);

				String key = allegatoUpdate.getFilename()+ "_" + this.allegatoAssembler.toTipologia(allegatoUpdate.getTipologia());
				String keyString = "Nome: " + allegatoUpdate.getFilename()+ " di tipo: " + allegatoUpdate.getTipologia();

				//System.out.println(" NUMERO DI ELEMENTI: " + entity.getApi().getAllegati().size() + " - " + idAllegato + " - " + entity.getApi().getAllegati().iterator().next().getDocumento().getUuid());
				
				if(entity.getApi().getAllegati().stream().anyMatch(a-> !idAllegato.toString().equals(a.getDocumento().getUuid()) && key.equals(a.getDocumento().getFilename()+ "_" + a.getTipologia()))) {
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
	public ResponseEntity<API> getAPI(UUID idApi) {
		try {
			this.logger.info("Invocazione in corso ...");     
			this.logger.debug("Autorizzazione completata con successo");     

			return this.service.runTransaction( () -> {

				ApiEntity entity = findApi(idApi);
				API api = this.dettaglioAssembler.toModel(entity);
				this.logger.info("Invocazione completata con successo");

				return ResponseEntity.ok(api);
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
	public ResponseEntity<Resource> exportAPI(UUID idApi) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");     
				this.logger.debug("Autorizzazione completata con successo");     

				ApiEntity entity = findApi(idApi);

				this.logger.debug("Autorizzazione completata con successo");     
				Resource resource;
				try {
					resource = new ByteArrayResource(this.serviceBuilder.getEServiceApi(entity));
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
    public ResponseEntity<Resource> downloadSpecificaAPI(UUID idApi, AmbienteEnum ambiente, String versione, Boolean includiDocAllegati, DownloadSpecificaAPIModeEnum mode) {
		try {
			return this.service.runTransaction(() -> {

				this.logger.info("Invocazione in corso ...");     
				this.logger.debug("Autorizzazione completata con successo");     

				ApiEntity entityA = findApi(idApi);

				this.logger.debug("Autorizzazione completata con successo");   

				ApiConfigEntity entity = ambiente.equals(AmbienteEnum.COLLAUDO)? entityA.getCollaudo():  entityA.getProduzione();

				if(!entityA.getAllegati()
						.stream()
						.anyMatch(a -> a.getTipologia().equals(TIPOLOGIA.SPECIFICA)) ||
						!(includiDocAllegati != null && includiDocAllegati)) {
					
					if(entity.getSpecifica()!=null) {
						Resource resource;
						if(mode != null && mode.equals(DownloadSpecificaAPIModeEnum.TRY_OUT) && (entity.getProtocollo().equals(PROTOCOLLO.OPENAPI_3) || entity.getProtocollo().equals(PROTOCOLLO.SWAGGER_2))) {
							try {
								resource = new ByteArrayResource(this.serviceBuilder.getTryOutOpenAPI(entityA, entity, ambiente.equals(AmbienteEnum.COLLAUDO)));
							} catch (IOException e) {
								resource = new ByteArrayResource(entity.getSpecifica().getRawData());
							}
						} else {
							if(versione!=null) {
								DocumentoEntity documentoEntity = this.documentoService.findDocumentoByUuidAndVersion(entity.getSpecifica().getUuid(), Integer.parseInt(versione))
										.orElseThrow(() -> new NotFoundException("Documento con UUID ["+entity.getSpecifica().getUuid()+"] e versione ["+versione+"] non trovato"));
								
								if(mode == null || mode.equals(DownloadSpecificaAPIModeEnum.DOWNLOAD)) {
									resource = new ByteArrayResource(documentoEntity.getRawData());
								} else {
                                    try {
                                        byte[] jsonOpenapi = YamltoJsonUtils.convertYamlToJson(documentoEntity.getRawData());
                                        resource = new ByteArrayResource(jsonOpenapi);
                                    } catch (IOException e) {
                                        resource = new ByteArrayResource(documentoEntity.getRawData());
                                    }
                                }
							} else {
								if(mode == null || mode.equals(DownloadSpecificaAPIModeEnum.DOWNLOAD)) {
									resource = new ByteArrayResource(entity.getSpecifica().getRawData());
								} else {
                                    try {
                                        byte[] jsonOpenapi = YamltoJsonUtils.convertYamlToJson(entity.getSpecifica().getRawData());
                                        resource = new ByteArrayResource(jsonOpenapi);
                                    } catch (IOException e) {
                                        resource = new ByteArrayResource(entity.getSpecifica().getRawData());
                                    }
                                }
							}
						}
						

						this.logger.info("Invocazione completata con successo");
						return ResponseEntity.status(HttpStatus.OK)
								.header("Content-Disposition", "attachment; filename="+entity.getSpecifica().getFilename())
								.body(resource);
					} else {
						throw new BadRequestException("Specifica non presente");
					}
				} else {
					Resource resource;
					try {
						resource = new ByteArrayResource(this.serviceBuilder.getSpecificaApi(entityA, entity));
					} catch (Exception e) {
						this.logger.error("Errore nel recupero dell'eService: " + e.getMessage(), e);
						throw new InternalException(e);
					}
					return ResponseEntity.status(HttpStatus.OK)
							.header("Content-Disposition", "attachment; filename="+entity.getSpecifica().getFilename())
							.body(resource);
				}

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
	public ResponseEntity<PagedModelItemApi> listAPI(UUID idServizio, RuoloAPIEnum ruolo, UUID idApi, String nome, String versione, String q, 
			Integer page, Integer size, List<String> sort) {
		try {
			this.logger.info("Invocazione in corso ...");     
			this.servizioAuthorization.authorizeList();
			this.logger.debug("Autorizzazione completata con successo");     

			return this.service.runTransaction( () -> {

				ApiSpecification spec = new ApiSpecification();
				spec.setQ(Optional.ofNullable(q));
				spec.setNome(Optional.ofNullable(nome));

				if(versione != null) {
					spec.setVersione(Optional.of(Integer.parseInt(versione)));
				}
				spec.setIdApi(Optional.ofNullable(idApi));

				if(idServizio != null) {
					Optional<ServizioEntity> oServ = this.servizioService.find(idServizio);
					//					this.logger.info("Richiedo id servizio: " + idServizio);     
					if(oServ.isPresent()) {
						ServizioEntity s = oServ.get();
						//						this.logger.info("Trovato servizio: " + s.getNome() + " v" + s.getVersione() + " package: " + s.is_package());
						if(s.is_package()) {
							//							this.logger.info("Trovato servizio PACKAGE: " + s.getNome() + " v" + s.getVersione() + " package: " + s.is_package());
							spec.setServiziList(s.getComponenti().stream().map(serv-> UUID.fromString(serv.getServizio().getIdServizio())).collect(Collectors.toList()));
							//							this.logger.info("SERVIZI LIST: " + spec.getServiziList());
						} else {
							//							this.logger.info("Trovato servizio NON PACKAGE: " + s.getNome() + " v" + s.getVersione() + " package: " + s.is_package());
							spec.setServiziList(List.of(UUID.fromString(s.getIdServizio())));
							//							this.logger.info("SERVIZI LIST: " + spec.getServiziList());
						}
					} else {
						spec.setServiziList(List.of());
					}
				}

				if(ruolo != null) {
					spec.setRuolo(Optional.of(this.engineAssembler.toRuolo(ruolo)));
				}

				CustomPageRequest pageable = new CustomPageRequest(page, size, sort, Arrays.asList("nome"));

				Page<ApiEntity> findAll = this.service.findAll(spec, pageable);

				CollectionModel<ItemApi> lst = this.itemAssembler.toCollectionModel(findAll.getContent());

				PagedModelItemApi list = new PagedModelItemApi();
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
	public ResponseEntity<API> updateApi(UUID idApi, ApiUpdate apiUpdate, Boolean force) {
		try {
			return this.service.runTransaction(() -> {
				this.logger.info("Invocazione in corso ...");     

				ApiEntity entity = findApi(idApi);

				ServizioEntity servizio = entity.getServizio();

				List<ConfigurazioneClasseDato> lstClassiDato = new ArrayList<>();

				if(apiUpdate.getIdentificativo()!=null) {
					lstClassiDato.add(ConfigurazioneClasseDato.IDENTIFICATIVO);
					boolean nomeCambiato = !entity.getNome().equals(apiUpdate.getIdentificativo().getNome());
					boolean versioneCambiata = !entity.getVersione().equals(apiUpdate.getIdentificativo().getVersione());

					if(nomeCambiato || versioneCambiata) {
						if(this.service.existsByNomeVersioneSoggetto(apiUpdate.getIdentificativo().getNome(), apiUpdate.getIdentificativo().getVersione(), UUID.fromString(servizio.getDominio().getSoggettoReferente().getIdSoggetto()))) {
							throw new ConflictException("API ["+apiUpdate.getIdentificativo().getNome()+"/"+apiUpdate.getIdentificativo().getVersione()+"/"+servizio.getDominio().getSoggettoReferente().getNome()+"] esiste gia");
						}

					}

					this.dettaglioAssembler.toEntity(apiUpdate.getIdentificativo(), entity);

				}

				if(apiUpdate.getDatiGenerici()!=null) {
					lstClassiDato.add(ConfigurazioneClasseDato.GENERICO);
					this.dettaglioAssembler.toEntity(apiUpdate.getDatiGenerici(), entity);
				}

				if(apiUpdate.getDatiSpecifica()!=null) {
					lstClassiDato.add(ConfigurazioneClasseDato.SPECIFICA);
					this.dettaglioAssembler.toEntity(apiUpdate.getDatiSpecifica(), entity);
				}

				if(apiUpdate.getDatiCustom()!=null) {
					//					Map<String, ConfigurazioneClasseDato> map = new HashMap<>();

					//					for(ConfigurazioneApiCustomProprietaList cp: this.configurazione.getServizio().getApi().getProprietaCustom()) {
					//						map.put(cp.getNomeGruppo(), cp.getClasseDato());
					//					}

					for(ProprietaCustom pc: apiUpdate.getDatiCustom().getProprietaCustom()) {
						lstClassiDato.add(this.configurazione.getServizio().getApi().getProprietaCustom()
								.stream()
								.filter(cp -> cp.getNomeGruppo().equals(pc.getGruppo()))
								.findAny()
								.orElseThrow(() -> new BadRequestException("Gruppo ["+pc.getGruppo()+"] non esiste"))
								.getClasseDato());
					}

					this.dettaglioAssembler.toEntity(apiUpdate.getDatiCustom(), entity);
				}

				if(apiUpdate.getConfigurazioneCollaudo()!=null) {
					lstClassiDato.add(ConfigurazioneClasseDato.COLLAUDO);
					this.dettaglioAssembler.toEntityCollaudo(apiUpdate.getConfigurazioneCollaudo(), entity);
				}

				if(apiUpdate.getConfigurazioneProduzione()!=null) {
					lstClassiDato.add(ConfigurazioneClasseDato.PRODUZIONE);
					this.dettaglioAssembler.toEntityProduzione(apiUpdate.getConfigurazioneProduzione(), entity);
				}

				Grant grant = this.servizioDettaglioAssembler.toGrant(entity.getServizio());

				if(!isForce(force, grant.getRuoli())) {
					this.servizioAuthorization.authorizeModifica(servizio, lstClassiDato);
				}
				
				this.logger.debug("Autorizzazione completata con successo");     

				this.service.save(entity);
				API api = this.dettaglioAssembler.toModel(entity);
				this.logger.info("Invocazione completata con successo");

				return ResponseEntity.ok(api);

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
	

	@Override
	public ResponseEntity<PagedModelAllegato> listAllegatiApi(UUID idApi, String q, String filename,
			TipologiaAllegatoEnum tipologiaAllegato, VisibilitaAllegatoEnum visibilitaAllegato, 
			Integer page, Integer size, List<String> sort) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");  

				ApiEntity entity = findApi(idApi);

				this.logger.debug("Autorizzazione completata con successo");     

				AllegatoApiSpecification spec = new AllegatoApiSpecification();
				spec.setQ(Optional.ofNullable(q));
				spec.setFilename(Optional.ofNullable(filename));
				spec.setIdApi(Optional.of(idApi));

				if(tipologiaAllegato != null) {
					spec.setTipologia(Optional.of(allegatoAssembler.toTipologia(tipologiaAllegato)));
				}

				List<VISIBILITA> lstVisibilita = this.servizioAuthorization.getVisibilitaAllegatoApi(entity.getServizio());

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

				Page<AllegatoApiEntity> findAll = service.findAllAllegatiApi(spec, pageable);

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

	public ResponseEntity<ConfigurazioneTokenPolicy> getTokenPolicyAPI(UUID idApi) {
		try {
			this.logger.info("Invocazione in corso ...");     
			this.logger.debug("Autorizzazione completata con successo");     

			return this.service.runTransaction( () -> {

				ApiEntity entity = findApi(idApi);

				ConfigurazioneTokenPolicy api = this.dettaglioAssembler.toTokenPolicyModel(entity);
				this.logger.info("Invocazione completata con successo");

				if(api != null) {
					return ResponseEntity.ok(api);
				} else {
					return ResponseEntity.noContent().build();
				}
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
