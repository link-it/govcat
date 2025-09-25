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
package org.govway.catalogo.assembler;

import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Map.Entry;
import java.util.UUID;
import java.util.stream.Collectors;

import org.govway.catalogo.authorization.AdesioneAuthorization;
import org.govway.catalogo.controllers.AdesioniController;
import org.govway.catalogo.core.dao.specifications.ServizioSpecification;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.AmbienteEnum;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity.RUOLO;
import org.govway.catalogo.core.orm.entity.ClientAdesioneEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.core.orm.entity.DominioEntity.VISIBILITA;
import org.govway.catalogo.core.orm.entity.ErogazioneEntity;
import org.govway.catalogo.core.orm.entity.ErogazioneEntity.StatoEnum;
import org.govway.catalogo.core.orm.entity.EstensioneAdesioneEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.govway.catalogo.core.orm.entity.StatoAdesioneEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.services.ApiService;
import org.govway.catalogo.core.services.ClientService;
import org.govway.catalogo.core.services.ServizioService;
import org.govway.catalogo.core.services.SoggettoService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.exception.RichiestaNonValidaSemanticamenteException;
import org.govway.catalogo.servlets.model.Adesione;
import org.govway.catalogo.servlets.model.AdesioneClientCreate;
import org.govway.catalogo.servlets.model.AdesioneClientProposto;
import org.govway.catalogo.servlets.model.AdesioneClientUpdate;
import org.govway.catalogo.servlets.model.AdesioneCreate;
import org.govway.catalogo.servlets.model.AdesioneErogazioneUpdate;
import org.govway.catalogo.servlets.model.AdesioneIdClient;
import org.govway.catalogo.servlets.model.AdesioneIdentificativoUpdate;
import org.govway.catalogo.servlets.model.AuthTypeApiResourceProprietaCustom;
import org.govway.catalogo.servlets.model.ClientRichiesto;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneClasseDato;
import org.govway.catalogo.servlets.model.ConfigurazioneCustomAdesioneProprietaList;
import org.govway.catalogo.servlets.model.ConfigurazioneCustomProprieta;
import org.govway.catalogo.servlets.model.ConfigurazioneProfilo;
import org.govway.catalogo.servlets.model.DatiCustomAdesioneUpdate;
import org.govway.catalogo.servlets.model.DocumentoCreate;
import org.govway.catalogo.servlets.model.ErogazioneRichiesta;
import org.govway.catalogo.servlets.model.Grant;
import org.govway.catalogo.servlets.model.ProprietaCustom;
import org.govway.catalogo.servlets.model.ProprietaCustomAdesione;
import org.govway.catalogo.servlets.model.ReferenteCreate;
import org.govway.catalogo.servlets.model.Ruolo;
import org.govway.catalogo.servlets.model.StatoConfigurazioneAutomaticaEnum;
import org.govway.catalogo.servlets.model.StatoUpdate;
import org.govway.catalogo.servlets.model.TipoAdesioneClientUpdateEnum;
import org.govway.catalogo.servlets.model.TipoConfigurazioneCustomProprieta;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class AdesioneDettaglioAssembler extends RepresentationModelAssemblerSupport<AdesioneEntity, Adesione> {

	@Autowired
	private ServizioService servizioService;

	@Autowired
	private ApiService apiService;

	@Autowired
	private SoggettoService soggettoService;

	@Autowired
	private ClientDettaglioAssembler clientDettaglioAssembler;
	
	@Autowired
	private ClientService clientService;
	
	@Autowired
	private AdesioneEngineAssembler adesioneEngineAssembler;
	
	@Autowired
	private SoggettoItemAssembler soggettoAssembler;
	
	@Autowired
	private ServizioItemAssembler servizioAssembler;
	
	@Autowired
	private UtenteItemAssembler utenteAssembler;
	
	@Autowired
	private ReferenteAdesioneAssembler referenteAdesioneAssembler;

	@Autowired
	private DocumentoAssembler documentoAssembler;

	@Autowired
	private Configurazione configurazione;
	
	@Autowired
	private AdesioneAuthorization adesioneAuthorization;   

	public AdesioneDettaglioAssembler() {
		super(AdesioniController.class, Adesione.class);
	}

	@Override
	public Adesione toModel(AdesioneEntity entity) {
		
		Adesione dettaglio = instantiateModel(entity);

		BeanUtils.copyProperties(entity, dettaglio);

		if(entity.getStato().equals(configurazione.getAdesione().getWorkflow().getStatoArchiviato())) {
			dettaglio.setStatoPrecedente(this.adesioneAuthorization.getStatoPrecedente(entity));
		}
		

		dettaglio.setIdAdesione(UUID.fromString(entity.getIdAdesione()));

		dettaglio.setSoggetto(this.soggettoAssembler.toModel(entity.getSoggetto()));
		dettaglio.setServizio(this.servizioAssembler.toModel(entity.getServizio()));

		dettaglio.setUtenteRichiedente(this.utenteAssembler.toModel(entity.getRichiedente()));
		dettaglio.setDataCreazione(entity.getDataCreazione().toInstant().atOffset(ZoneOffset.UTC));

		if(entity.getDataUltimaModifica()!=null) {
			dettaglio.setDataUltimoAggiornamento(entity.getDataUltimaModifica().toInstant().atOffset(ZoneOffset.UTC));
		}
		if(entity.getUtenteUltimaModifica()!=null) {
			dettaglio.setUtenteUltimoAggiornamento(this.utenteAssembler.toModel(entity.getUtenteUltimaModifica()));
		}

		dettaglio.setStatoConfigurazioneAutomatica(Optional.ofNullable(entity.getStatoConfigurazione()).map(statoConfigurazione -> {
			switch(statoConfigurazione) {
			case FALLITA: return StatoConfigurazioneAutomaticaEnum.FALLITA;
			case IN_CODA: return StatoConfigurazioneAutomaticaEnum.IN_CODA;
			case KO: return StatoConfigurazioneAutomaticaEnum.KO;
			case OK: return StatoConfigurazioneAutomaticaEnum.OK;
			case RETRY: return StatoConfigurazioneAutomaticaEnum.RETRY;
			}
			
			return null;	
		}).orElse(null));

		List<ClientRichiesto> client = this.adesioneAuthorization.getClientRichiesti(entity.getServizio());
		List<ErogazioneRichiesta> erogazioni = this.adesioneAuthorization.getErogazioniRichieste(entity.getServizio());
		dettaglio.setClientRichiesti(client);
		dettaglio.setErogazioniRichieste(erogazioni);
		
		return dettaglio;
	}

	public AdesioneEntity toEntity(AdesioneClientUpdate src, String profilo, boolean collaudo, AdesioneEntity entity) {
		ClientEntity client = null;
		String nomeProposto;
		AmbienteEnum ambiente;
		
		ConfigurazioneProfilo pr = this.configurazione.getServizio().getApi().getProfili()
			.stream()
			.filter(p -> p.getCodiceInterno().equals(profilo))
			.findAny()
			.orElseThrow(() -> new BadRequestException(ErrorCode.GEN_002));

		ambiente = collaudo ? AmbienteEnum.COLLAUDO : AmbienteEnum.PRODUZIONE;

		AmbienteEnum ambienteBody;
		if(src.getTipoClient().equals(TipoAdesioneClientUpdateEnum.RIFERITO)) {
			AdesioneIdClient specSrc = (AdesioneIdClient)src;
			ambienteBody = specSrc.getAmbiente().equals(org.govway.catalogo.servlets.model.AmbienteEnum.COLLAUDO) ? AmbienteEnum.COLLAUDO : AmbienteEnum.PRODUZIONE;

			client = this.clientService.findByNomeSoggettoAmbiente(specSrc.getNome(), specSrc.getIdSoggetto(), ambiente)
			.orElseThrow(() -> new BadRequestException(ErrorCode.CLT_001));

			nomeProposto = null;
			this.clientDettaglioAssembler.checkClientProfilo(pr, client);
		} else if(src.getTipoClient().equals(TipoAdesioneClientUpdateEnum.PROPOSTO)) {

			if(this.configurazione.getAdesione().isVisualizzaElencoClientEsistenti()!= null && this.configurazione.getAdesione().isVisualizzaElencoClientEsistenti()) {
				throw new BadRequestException(ErrorCode.CLT_003);
			}
			AdesioneClientProposto specSrc = (AdesioneClientProposto) src;
			ambienteBody = specSrc.getAmbiente().equals(org.govway.catalogo.servlets.model.AmbienteEnum.COLLAUDO) ? AmbienteEnum.COLLAUDO : AmbienteEnum.PRODUZIONE;
			nomeProposto = specSrc.getNomeProposto();
		} else {
			AdesioneClientCreate specSrc = (AdesioneClientCreate)src;
			ambienteBody = specSrc.getAmbiente().equals(org.govway.catalogo.servlets.model.AmbienteEnum.COLLAUDO) ? AmbienteEnum.COLLAUDO : AmbienteEnum.PRODUZIONE;
			client = clientDettaglioAssembler.toEntity(specSrc);
			nomeProposto = null;
			
			if(this.clientService.existsByNomeSoggettoAmbiente(client)) {
				throw new ConflictException(ErrorCode.CLT_002);
			}
			
			this.clientDettaglioAssembler.checkClientProfilo(pr, client);
			clientService.save(client);
		}

		if(!ambiente.equals(ambienteBody)) {
			throw new BadRequestException(ErrorCode.VAL_001);
		}

		ClientAdesioneEntity adC = entity.getClient().stream().filter(ac -> ac.getProfilo().equals(profilo) && ac.getAmbiente().equals(ambiente)).findAny()
				.orElseGet(() -> {
					ClientAdesioneEntity adC1 = new ClientAdesioneEntity();
					adC1.setAdesione(entity);
					adC1.setProfilo(profilo);
					adC1.setAmbiente(ambiente);
					
					entity.getClient().add(adC1);
					return adC1;
				});

		if(nomeProposto!=null) {
			adC.setNomeProposto(nomeProposto);
		}
		adC.setClient(client);

		setUltimaModifica(entity);
		return entity;
	}

	public AdesioneEntity toEntity(AdesioneIdentificativoUpdate src, AdesioneEntity entity) {
		BeanUtils.copyProperties(src, entity);
		
		entity.setIdLogico(src.getIdLogico());
		entity.setServizio(getServizio(src.getIdServizio()));

		setSkipCollaudo(src.isSkipCollaudo(), entity);

		SoggettoEntity soggetto = getSoggetto(src.getIdSoggetto());
		
		if(!soggetto.getOrganizzazione().equals(entity.getSoggetto().getOrganizzazione())) {
			throw new BadRequestException(ErrorCode.ORG_005);
		}
		
		entity.setSoggetto(soggetto);
		
		check(entity);

		setUltimaModifica(entity);
		return entity;
	}

	private SoggettoEntity getSoggetto(UUID idSoggetto) {
		SoggettoEntity soggetto = this.soggettoService.find(idSoggetto).
				orElseThrow(() -> new NotFoundException(ErrorCode.ORG_005));
		return soggetto;
	}
	
//	public AdesioneEntity toEntity(AdesioneCollaudoUpdate src, AdesioneEntity entity) {
//		BeanUtils.copyProperties(src, entity);
//		
//		setUltimaModifica(entity);
//		return entity;
//	}
//	
	private void setSkipCollaudo(Boolean skipCollaudo, AdesioneEntity entity) {
		entity.setSkipCollaudo(skipCollaudo);

		if(entity.isSkipCollaudo() && !entity.getServizio().isSkipCollaudo()) {
			throw new BadRequestException(ErrorCode.ADE_004);
		}
	}

	public AdesioneEntity toEntity(StatoUpdate src, AdesioneEntity entity) {
		BeanUtils.copyProperties(src, entity);
		
		StatoAdesioneEntity e = new StatoAdesioneEntity();
		BeanUtils.copyProperties(src, e);

		e.setUuid(UUID.randomUUID().toString());
		e.setAdesione(entity);
		e.setData(new Date());
		e.setUtente(getUtenteSessione());
		entity.getStati().add(e);

		setUltimaModifica(entity);
		return entity;
	}
	
	
	public void setUltimaModifica(AdesioneEntity entity) {
		entity.setDataUltimaModifica(new Date());
		entity.setUtenteUltimaModifica(getUtenteSessione());
	}

	public AdesioneEntity toEntity(AdesioneCreate src) {
		AdesioneEntity entity = new AdesioneEntity();
		BeanUtils.copyProperties(src, entity);
		entity.setIdAdesione(UUID.randomUUID().toString());

		UtenteEntity utenteSessione = getUtenteSessione();

		if(configurazione.getAdesione()!= null &&
				configurazione.getAdesione().getWorkflow()!= null &&
				configurazione.getAdesione().getWorkflow().getStatoIniziale()!=null) {
			entity.setStato(configurazione.getAdesione().getWorkflow().getStatoIniziale());
		}

		entity.setServizio(getServizio(src.getIdServizio()));
		entity.setSoggetto(getSoggetto(src.getIdSoggetto()));

		setSkipCollaudo(src.isSkipCollaudo(), entity);

		check(entity);

		if(src.getReferenti()!=null) {
			for(ReferenteCreate referente: src.getReferenti()) {
				entity.getReferenti().add(referenteAdesioneAssembler.toEntity(referente, entity));
			}
		}

		entity.setDataCreazione(new Date());
		entity.setRichiedente(utenteSessione);

		if(configurazione.getAdesione()!= null &&
				!configurazione.getAdesione().isSceltaLiberaOrganizzazione()) {

			
			Grant grant = this.adesioneAuthorization.getGrant(entity);
			
			boolean admin = grant.getRuoli().contains(Ruolo.GESTORE);
			boolean ref = grant.getRuoli().contains(Ruolo.REFERENTE) || grant.getRuoli().contains(Ruolo.REFERENTE_SUPERIORE);

			if(!admin && !ref) {
				if(!entity.getSoggetto().getOrganizzazione().getId().equals(utenteSessione.getOrganizzazione().getId())) {
					throw new BadRequestException(ErrorCode.AUTH_005);
				}
			}
		}
		
		entity.setSearchTerms(entity.getServizio().getNome() + "_" + entity.getServizio().getVersione() + "_" + entity.getSoggetto().getNome());		
		return entity;
	}

	private void check(AdesioneEntity entity) {

		String servizioK = entity.getServizio().getNome()+"/"+entity.getServizio().getVersione();
		if(!this.configurazione.getServizio().getStatiAdesioneConsentita().contains(entity.getServizio().getStato())) {
			throw new BadRequestException(ErrorCode.ADE_003);
		}

		if(entity.getServizio().isAdesioneDisabilitata()) {
			throw new BadRequestException(ErrorCode.ADE_004);
		}

		if(entity.getServizio().getVisibilita() != null && entity.getServizio().getVisibilita().equals(VISIBILITA.COMPONENTE)) {
			throw new BadRequestException(ErrorCode.ADE_004);
		}

		if(entity.getServizio().isMultiAdesione() && entity.getIdLogico()==null) {
			throw new BadRequestException(ErrorCode.VAL_001);
		}

		if(entity.getServizio().isFruizione() && !entity.getSoggetto().getId().equals(entity.getServizio().getSoggettoInterno().getId())) {
			throw new BadRequestException(ErrorCode.ADE_004);
		}
		
		if(!entity.getSoggetto().isAderente()) {
			throw new BadRequestException(ErrorCode.ORG_005);
		}

		if(entity.isSkipCollaudo() && !entity.getServizio().isSkipCollaudo()) {
			throw new RichiestaNonValidaSemanticamenteException(ErrorCode.VAL_011);
		}
	}

	private ServizioEntity getServizio(UUID idServizio) {
		ServizioSpecification spec = new ServizioSpecification();
		spec.setStatiAderibili(this.configurazione.getServizio().getStatiAdesioneConsentita());
		spec.setIdServizi(Arrays.asList(idServizio));
		
		ServizioEntity servizio = this.servizioService.findOne(spec).
				orElseThrow(() -> new NotFoundException(ErrorCode.SRV_002));

		return servizio;
	}

	private UtenteEntity getUtenteSessione() {
		return this.adesioneEngineAssembler.getUtenteSessione();
	}

	public void toEntity(AdesioneErogazioneUpdate src, UUID idErogazione, boolean collaudo,
			AdesioneEntity entity) {

		AmbienteEnum ambiente = collaudo ? AmbienteEnum.COLLAUDO: AmbienteEnum.PRODUZIONE;
		
		ErogazioneEntity erogazione = entity.getErogazioni().stream()
		.filter(e -> e.getAmbiente().equals(ambiente) && e.getApi().getIdApi().equals(idErogazione.toString())).findAny()
		.orElseGet(() -> {
			ErogazioneEntity erog = new ErogazioneEntity();
			
			erog.setAmbiente(ambiente);
			erog.setApi(this.apiService.find(idErogazione).orElseThrow(() -> new NotFoundException(ErrorCode.API_003)));
			erog.setStato(StatoEnum.CONFIGURATO);
			
			entity.getErogazioni().add(erog);
			
			return erog;
		});
		
		BeanUtils.copyProperties(src, erogazione);

		setUltimaModifica(entity);
	}

	public Grant toGrant(AdesioneEntity entity) {
		return this.adesioneAuthorization.getGrant(entity);
	}

    public void toEntity(DatiCustomAdesioneUpdate src, boolean collaudo, AdesioneEntity entity) {
		BeanUtils.copyProperties(src, entity);

		if(src.getProprietaCustom()!=null) {
			for(ProprietaCustomAdesione pca: src.getProprietaCustom()) {
				
				for(ProprietaCustom g: pca.getGruppi()) {
				
					List<EstensioneAdesioneEntity> eDaSovrascrivere = entity.getEstensioni().stream().filter(e -> {
						boolean gruppo = g.getGruppo().equals(e.getGruppo());
						boolean api = false;
						if(pca.getApi() != null) {
							if(e.getApi() != null) {
								api = e.getApi().getIdApi().equals(pca.getApi().toString());
							}
						} else {
							api = e.getApi() == null;
						}
						
						boolean ambiente = collaudo ? e.getAmbiente().equals(AmbienteEnum.COLLAUDO):e.getAmbiente().equals(AmbienteEnum.PRODUZIONE);					
						return gruppo && api && ambiente;
					}).collect(Collectors.toList());

					getProprietaCustom(g, pca.getApi(), eDaSovrascrivere, entity);

				}

			}
		}

    }

	private void getProprietaCustom(ProprietaCustom apc, UUID idApi, List<EstensioneAdesioneEntity> oldProprietaCustom, AdesioneEntity entity) {
		
		List<ClientRichiesto> cr = this.adesioneAuthorization.getClientRichiesti(entity.getServizio());
		
		ApiEntity api = idApi != null ? this.apiService.find(idApi)
				.orElseThrow(() -> new NotFoundException(ErrorCode.API_003)) : null;

		ConfigurazioneCustomAdesioneProprietaList g = configurazione.getAdesione().getProprietaCustom().stream()
				.filter(c -> c.getNomeGruppo().equals(apc.getGruppo()) && this.adesioneAuthorization.applies(c, cr))
				.findAny().orElseThrow(() -> new BadRequestException(ErrorCode.GRP_001));

		AmbienteEnum ambiente = g.getClasseDato().equals(ConfigurazioneClasseDato.COLLAUDO)
				|| g.getClasseDato().equals(ConfigurazioneClasseDato.COLLAUDO_CONFIGURATO) ? AmbienteEnum.COLLAUDO
						: AmbienteEnum.PRODUZIONE;

		if (g.getSpecificoPer() != null) {
			switch (g.getSpecificoPer()) {
			case ADESIONE:
				checkApiNull(apc.getGruppo(), api);
				break;
			case API:
				checkApiNotNull(apc.getGruppo(), api, null);
				break;
			case API_SOGGETTO_ADERENTE:
				checkApiNotNull(apc.getGruppo(), api, RUOLO.EROGATO_SOGGETTO_ADERENTE);
				break;
			case API_SOGGETTO_DOMINIO:
				checkApiNotNull(apc.getGruppo(), api, RUOLO.EROGATO_SOGGETTO_DOMINIO);
				break;
			}
		} else {
			checkApiNull(apc.getGruppo(), api);
		}

		for (AuthTypeApiResourceProprietaCustom p : apc.getProprieta()) {
			ConfigurazioneCustomProprieta pr = g.getProprieta().stream().filter(c -> c.getNome().equals(p.getNome()))
					.findAny().orElseThrow(() -> new BadRequestException(ErrorCode.GEN_002));

			EstensioneAdesioneEntity e = oldProprietaCustom.stream().filter(est -> {
				boolean nomeGruppoAmbiente = est.getGruppo().equals(apc.getGruppo())
						&& est.getNome().equals(p.getNome()) && est.getAmbiente().equals(ambiente);
				boolean aapi = false;

				if (api == null) {
					aapi = est.getApi() == null;
				} else {
					aapi = est.getApi() != null && est.getApi().getId().equals(api.getId());
				}

				return nomeGruppoAmbiente && aapi;
			}).findAny().orElseGet(() -> {
				EstensioneAdesioneEntity est = new EstensioneAdesioneEntity();
				est.setApi(api);
				est.setGruppo(apc.getGruppo());
				est.setNome(p.getNome());
				est.setAmbiente(ambiente);
				est.setAdesione(entity);
				entity.getEstensioni().add(est);
				return est;
			});

			if (pr.getTipo().equals(TipoConfigurazioneCustomProprieta.FILE)) {
				if (p.getContent() != null) {
					DocumentoCreate docSrc = new DocumentoCreate();
					docSrc.setContent(p.getContent());
					docSrc.setContentType(p.getContentType());
					docSrc.setFilename(p.getFilename());
					e.setDocumento(documentoAssembler.toEntity(docSrc, getUtenteSessione()));
				} else if (p.getUuid() != null) {

					e.setDocumento(oldProprietaCustom.stream()
							.filter(est -> est.getGruppo().equals(g.getNomeGruppo())
									&& est.getNome().equals(p.getNome()) && est.getAmbiente().equals(ambiente)
									&& est.getDocumento() != null && est.getDocumento().getUuid().equals(p.getUuid()))
							.map(ee -> ee.getDocumento()).findAny().orElseThrow(() -> new BadRequestException(ErrorCode.DOC_001)));
				} else {
					throw new BadRequestException(ErrorCode.VAL_001);
				}
			} else {
				e.setValore(p.getValore());
			}

		}
		
		for(EstensioneAdesioneEntity opc: oldProprietaCustom) {
			if(!apc.getProprieta().stream().anyMatch(pc -> {
				return pc.getNome().equals(opc.getNome());
			})) {
				entity.getEstensioni().remove(opc);
			}
		}

		
	}

	private void checkApiNull(String gruppo, ApiEntity api) {
		if(api != null) {
			throw new BadRequestException(ErrorCode.VAL_002);
		}
	}

	private void checkApiNotNull(String gruppo, ApiEntity api, RUOLO ruolo) {
		if(api == null) {
			throw new BadRequestException(ErrorCode.VAL_002);
		} else {
			if(ruolo!= null && !ruolo.equals(api.getRuolo())) {
				throw new BadRequestException(ErrorCode.VAL_002);
			} 
		}
	}

	public List<ProprietaCustomAdesione> toConfigurazioni(List<EstensioneAdesioneEntity> lst) {
		List<ProprietaCustomAdesione> pcs = new ArrayList<>();
		
		Map<String, List<EstensioneAdesioneEntity>> map = new HashMap<>();
		for(EstensioneAdesioneEntity e: lst) {
			String k = null;
			if(e.getApi() == null) {
				k = "NULL";
			} else {
				k = e.getApi().getIdApi();
			}

			if(!map.containsKey(k)) {
				map.put(k, new ArrayList<>());
			}
			
			map.get(k).add(e);
		}
		
		for(Entry<String, List<EstensioneAdesioneEntity>> e: map.entrySet()) {
			pcs.add(toProprietaCustom(e.getKey(), e.getValue()));
		}
		
		return pcs;
	}

	private ProprietaCustomAdesione toProprietaCustom(String idApi, List<EstensioneAdesioneEntity> lst) {
		ProprietaCustomAdesione pca = new ProprietaCustomAdesione();
		
		if(!idApi.equals("NULL")) {
			pca.setApi(UUID.fromString(idApi));
		}
		
		Map<String, List<EstensioneAdesioneEntity>> map = new HashMap<>();
		for(EstensioneAdesioneEntity e: lst) {
			String k = e.getGruppo();
			if(!map.containsKey(k)) {
				map.put(k, new ArrayList<>());
			}
			
			map.get(k).add(e);
		}
		
		for(Entry<String, List<EstensioneAdesioneEntity>> e: map.entrySet()) {
			pca.getGruppi().add(toProprietaCustomPerGruppo(e.getKey(), e.getValue()));
		}

		
		return pca;
	}

	public ProprietaCustom toProprietaCustomPerGruppo(String gruppo, List<EstensioneAdesioneEntity> lst) {

		ProprietaCustom pc = new ProprietaCustom();
		pc.setGruppo(gruppo);

		List<AuthTypeApiResourceProprietaCustom> lstOut = new ArrayList<>();
		for(EstensioneAdesioneEntity e: lst) {
			AuthTypeApiResourceProprietaCustom p = new AuthTypeApiResourceProprietaCustom();
			p.setNome(e.getNome());
			if(e.getValore()!= null) {
				p.setValore(e.getValore());
			} else {
				p.setUuid(e.getDocumento().getUuid());
				p.setFilename(e.getDocumento().getFilename());
				p.setContentType(e.getDocumento().getTipo());
			}
			
			lstOut.add(p);
			
		}
		
		pc.setProprieta(lstOut);

		return pc;

	}
	
	


}
