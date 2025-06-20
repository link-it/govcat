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

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.govway.catalogo.controllers.APIController;
import org.govway.catalogo.core.business.utils.OpenapiUtils;
import org.govway.catalogo.core.business.utils.SwaggerUtils;
import org.govway.catalogo.core.business.utils.WsdlUtils;
import org.govway.catalogo.core.orm.entity.ApiConfigEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity.PROTOCOLLO;
import org.govway.catalogo.core.orm.entity.ApiEntity.RUOLO;
import org.govway.catalogo.core.orm.entity.AuthTypeEntity;
import org.govway.catalogo.core.orm.entity.DocumentoEntity;
import org.govway.catalogo.core.orm.entity.DominioEntity;
import org.govway.catalogo.core.orm.entity.EstensioneApiEntity;
import org.govway.catalogo.core.orm.entity.TipoServizio;
import org.govway.catalogo.core.services.ServizioService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.model.API;
import org.govway.catalogo.servlets.model.APICreate;
import org.govway.catalogo.servlets.model.APIDatiAmbienteCreate;
import org.govway.catalogo.servlets.model.APIDatiAmbienteUpdate;
import org.govway.catalogo.servlets.model.AuthTypeApiResource;
import org.govway.catalogo.servlets.model.AuthTypeApiResourceProprietaCustom;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneClasseDato;
import org.govway.catalogo.servlets.model.ConfigurazioneCompatibilitaApiEnum;
import org.govway.catalogo.servlets.model.ConfigurazioneCustomProprieta;
import org.govway.catalogo.servlets.model.ConfigurazioneCustomProprietaList;
import org.govway.catalogo.servlets.model.ConfigurazioneProfilo;
import org.govway.catalogo.servlets.model.ConfigurazioneTipoDominioEnum;
import org.govway.catalogo.servlets.model.ConfigurazioneTokenPolicy;
import org.govway.catalogo.servlets.model.ConfigurazioneTokenPolicyClientCredentials;
import org.govway.catalogo.servlets.model.ConfigurazioneTokenPolicyCodeGrant;
import org.govway.catalogo.servlets.model.ConfigurazioneTokenPolicyPdnd;
import org.govway.catalogo.servlets.model.ConfigurazioneTokenPolicyPdndAudit;
import org.govway.catalogo.servlets.model.ConfigurazioneTokenPolicyPdndAuditIntegrity;
import org.govway.catalogo.servlets.model.ConfigurazioneTokenPolicyPdndIntegrity;
import org.govway.catalogo.servlets.model.DatiCustomUpdate;
import org.govway.catalogo.servlets.model.DatiGenericiApiUpdate;
import org.govway.catalogo.servlets.model.DatiSpecificaApiUpdate;
import org.govway.catalogo.servlets.model.DocumentoCreate;
import org.govway.catalogo.servlets.model.IdentificativoApiUpdate;
import org.govway.catalogo.servlets.model.ProprietaCustom;
import org.govway.catalogo.servlets.model.ProtocolloEnum;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class ApiDettaglioAssembler extends RepresentationModelAssemblerSupport<ApiEntity, API> {

	private Logger logger = LoggerFactory.getLogger(ApiDettaglioAssembler.class);

	@Autowired
	private DocumentoAssembler allegatoAssembler;
	
	@Autowired
	private ServizioItemAssembler servizioItemAssembler;
	
	@Autowired
	private ServizioDettaglioAssembler servizioDettaglioAssembler;
	
	@Autowired
	private ApiEngineAssembler apiEngineAssembler;
	
	@Autowired
	private ServizioService servizioService;

	@Autowired
	private Configurazione configurazione;

	public static final String SEPARATOR = ",";

	public ApiDettaglioAssembler() {
		super(APIController.class, API.class);
	}

	@Override
	public API toModel(ApiEntity entity) {
		
		API dettaglio = instantiateModel(entity);

		BeanUtils.copyProperties(entity, dettaglio);

		dettaglio.setIdApi(UUID.fromString(entity.getIdApi()));
		dettaglio.setDescrizione(Optional.ofNullable(entity.getDescrizione()).map(d -> new String(d)).orElse(null));

		if(entity.getCollaudo()!= null) {
			dettaglio.setConfigurazioneCollaudo(this.apiEngineAssembler.toConfigurazione(entity.getCollaudo()));
		}
		
		if(entity.getProduzione()!= null) {
			dettaglio.setConfigurazioneProduzione(this.apiEngineAssembler.toConfigurazione(entity.getProduzione()));
		}
		
		Comparator<? super AuthTypeEntity> c = (o1, o2) -> {
			return (int) (o1.getId() - o2.getId());
		};
		
		List<AuthTypeEntity> lst = entity.getAuthType().stream().sorted(c).collect(Collectors.toList());
		
		for(AuthTypeEntity authType: lst) {
			AuthTypeApiResource g = new AuthTypeApiResource();
			g.setNote(authType.getNote());
			
			Optional<ConfigurazioneProfilo> configurazioneProfilo = this.configurazione.getServizio().getApi().getProfili()
					.stream()
					.filter(p -> p.getCodiceInterno().equals(authType.getProfilo()))
					.findAny();
					//.orElseThrow(() -> new BadRequestException("Profilo ["+authType.getProfilo()+"] non trovato"));
			if (configurazioneProfilo.isEmpty()) {
			    String errorMessage = String.format("Profilo [%s] non trovato", authType.getProfilo());
			    throw new BadRequestException(errorMessage);
			}

			g.setProfilo(authType.getProfilo());
			g.setResources(Arrays.asList(new String(authType.getResources()).split(SEPARATOR)));
			
			dettaglio.addGruppiAuthTypeItem(g);
		}

		dettaglio.setServizio(this.servizioItemAssembler.toModel(entity.getServizio()));
		dettaglio.setRuolo(this.apiEngineAssembler.toRuolo(entity.getRuolo()));

		dettaglio.setProprietaCustom(this.apiEngineAssembler.getApiProprietaCustom(entity));
		
		return dettaglio;
	}

	public ApiEntity toEntity(IdentificativoApiUpdate src, ApiEntity entity) {
		BeanUtils.copyProperties(src, entity);
		entity.setRuolo(this.apiEngineAssembler.toRuolo(src.getRuolo()));

		this.servizioDettaglioAssembler.setUltimaModifica(entity.getServizio());
		this.servizioService.save(entity.getServizio());

		return entity;
	}
	
	public ApiEntity toEntity(DatiGenericiApiUpdate src, ApiEntity entity) {
		BeanUtils.copyProperties(src, entity);

		entity.setDescrizione(Optional.ofNullable(src.getDescrizione()).map(d -> d.getBytes()).orElse(null));

		this.servizioDettaglioAssembler.setUltimaModifica(entity.getServizio());
		this.servizioService.save(entity.getServizio());

		return entity;
	}
	
	public ApiEntity toEntity(DatiCustomUpdate src, ApiEntity entity) {
		BeanUtils.copyProperties(src, entity);

		List<String> gruppiDaSovrascrivere = src.getProprietaCustom().stream().map(g -> g.getGruppo()).collect(Collectors.toList());
		
		List<EstensioneApiEntity> eDaSovrascrivere = entity.getEstensioni().stream().filter(e -> gruppiDaSovrascrivere.contains(e.getGruppo())).collect(Collectors.toList());
		entity.getEstensioni().removeAll(eDaSovrascrivere);
		
		getProprietaCustom(src.getProprietaCustom(), entity);

		this.servizioDettaglioAssembler.setUltimaModifica(entity.getServizio());
		this.servizioService.save(entity.getServizio());

		return entity;
	}
	
	public ApiEntity toEntity(DatiSpecificaApiUpdate src, ApiEntity entity) {
		BeanUtils.copyProperties(src, entity);
		
		
		if(entity.getRuolo().equals(RUOLO.EROGATO_SOGGETTO_DOMINIO)) {
			entity.getAuthType().clear();
			if(src.getGruppiAuthType()!=null) {
				entity.getAuthType().addAll(getAuthType(src.getGruppiAuthType(), entity));
			}
		}
		
		this.servizioDettaglioAssembler.setUltimaModifica(entity.getServizio());
		this.servizioService.save(entity.getServizio());

		return entity;
	}
	
	public ApiEntity toEntityCollaudo(APIDatiAmbienteUpdate src, ApiEntity entity) {
		BeanUtils.copyProperties(src, entity);
		entity.setCollaudo(toEntityAmbiente(src, entity.getCollaudo() != null ? entity.getCollaudo() : new ApiConfigEntity(), entity));

		this.servizioDettaglioAssembler.setUltimaModifica(entity.getServizio());
		this.servizioService.save(entity.getServizio());
		
		return entity;
	}
	
	public ApiEntity toEntityProduzione(APIDatiAmbienteUpdate src, ApiEntity entity) {
		BeanUtils.copyProperties(src, entity);
		entity.setProduzione(toEntityAmbiente(src, entity.getProduzione() != null ? entity.getProduzione() : new ApiConfigEntity(), entity));

		this.servizioDettaglioAssembler.setUltimaModifica(entity.getServizio());
		this.servizioService.save(entity.getServizio());

		return entity;
	}
	
	public ApiConfigEntity toEntityAmbiente(APIDatiAmbienteUpdate src, ApiConfigEntity entity, ApiEntity api) {
		if(src.getDatiErogazione()!=null) {
			entity.setNomeGateway(src.getDatiErogazione().getNomeGateway());
			entity.setVersioneGateway(src.getDatiErogazione().getVersioneGateway());
			
			entity.setUrl(src.getDatiErogazione().getUrl());
			entity.setUrlPrefix(src.getDatiErogazione().getUrlPrefix());
		} else {
			entity.setNomeGateway(null);
			entity.setVersioneGateway(null);
			
			entity.setUrl(null);
//			entity.setUrlPrefix(src.getDatiErogazione().getUrlPrefix());
		}
		
		if(src.getSpecifica()!=null) {
			entity.setSpecifica(this.allegatoAssembler.toEntity(src.getSpecifica(), entity.getSpecifica(), this.apiEngineAssembler.getUtenteSessione()));
		}
		
		entity.setProtocollo(toProtocollo(src.getProtocollo(), entity.getSpecifica()));

		this.servizioDettaglioAssembler.setUltimaModifica(api.getServizio());
		this.servizioService.save(api.getServizio());

		return entity;
	}
	
	public ApiEntity toEntity(APICreate src) {
		ApiEntity entity = new ApiEntity();
		BeanUtils.copyProperties(src, entity);
		
		entity.setDescrizione(Optional.ofNullable(src.getDescrizione()).map(d -> d.getBytes()).orElse(null));
		entity.setIdApi(UUID.randomUUID().toString());

		entity.getServizi().add(servizioService.find(src.getIdServizio()).
				orElseThrow(() -> new NotFoundException("Servizio ["+src.getIdServizio()+"] non trovato")));

		entity.setRuolo(this.apiEngineAssembler.toRuolo(src.getRuolo()));

		getProprietaCustom(src.getProprietaCustom(), entity);

		if(src.getConfigurazioneCollaudo()!=null) {
			entity.setCollaudo(getApiConfig(src.getConfigurazioneCollaudo(), entity));
		}

		if(src.getConfigurazioneProduzione()!=null) {
			entity.setProduzione(getApiConfig(src.getConfigurazioneProduzione(), entity));
		}

		if(entity.getRuolo().equals(RUOLO.EROGATO_SOGGETTO_DOMINIO) && src.getGruppiAuthType()!=null) {
			entity.getAuthType().addAll(getAuthType(src.getGruppiAuthType(), entity));
		}

		this.servizioDettaglioAssembler.setUltimaModifica(entity.getServizio());
		this.servizioService.save(entity.getServizio());

		return entity;
	}
	
	private PROTOCOLLO toProtocollo(ProtocolloEnum pr, DocumentoEntity spec) {

		if(spec!=null) {
			
			switch(pr) {
			case REST: 
				if (OpenapiUtils.isOpenapi(spec.getRawData())) {
					return PROTOCOLLO.OPENAPI_3;
				} else if (SwaggerUtils.isSwagger(spec.getRawData())) {
					return PROTOCOLLO.SWAGGER_2;
				} else {
					this.logger.error("Swagger / OpenAPI fornito non corretto");
					throw new BadRequestException("Swagger / OpenAPI fornito non corretto");
				}
			case SOAP:
				try {
					return WsdlUtils.getProtocolloApi(spec.getRawData());
				} catch (Exception e) {
					this.logger.error("WSDL fornito non corretto: " + e.getMessage(), e);
					throw new BadRequestException("WSDL fornito non corretto");
				}
			}

		} else {
			switch(pr) {
			case REST: return PROTOCOLLO.OPENAPI_3;
			case SOAP: return PROTOCOLLO.WSDL11;
			}
		}

		throw new BadRequestException("Impossibile trovare il protocollo");
	}

	private ApiConfigEntity getApiConfig(APIDatiAmbienteCreate src, ApiEntity api) {
		ApiConfigEntity entity = new ApiConfigEntity();

		checkSpecifica(src.getSpecifica());

		if(src.getSpecifica()!=null) {
			entity.setSpecifica(this.allegatoAssembler.toEntity(src.getSpecifica(), this.apiEngineAssembler.getUtenteSessione()));
		}
		
		entity.setProtocollo(toProtocollo(src.getProtocollo(), entity.getSpecifica()));
		
		if(src.getDatiErogazione()!= null) {
			entity.setNomeGateway(src.getDatiErogazione().getNomeGateway());
			entity.setVersioneGateway(src.getDatiErogazione().getVersioneGateway());
			
			entity.setUrl(src.getDatiErogazione().getUrl());
			entity.setUrlPrefix(src.getDatiErogazione().getUrlPrefix());

		}
		
		this.servizioDettaglioAssembler.setUltimaModifica(api.getServizio());
		this.servizioService.save(api.getServizio());

		return entity;
	}

	private void checkSpecifica(DocumentoCreate specifica) {
		if(this.configurazione.getServizio().getApi().isSpecificaObbligatorio()) {
			if(specifica == null || specifica.getContent() == null) {
				throw new BadRequestException("Specifica obbligatoria");
			}
		}
	}

	private void getProprietaCustom(List<ProprietaCustom> proprietaCustom, ApiEntity entity) {
		
		if(proprietaCustom!=null) {
			for(ProprietaCustom apc: proprietaCustom) {
				ConfigurazioneCustomProprietaList g = configurazione.getServizio().getApi().getProprietaCustom()
				.stream()
				.filter(c -> c.getNomeGruppo().equals(apc.getGruppo()))
				.findAny()
				.orElseThrow(() -> new BadRequestException("Gruppo ["+apc.getGruppo()+"] non trovato"));

				for(AuthTypeApiResourceProprietaCustom p: apc.getProprieta()) {
					Optional<ConfigurazioneCustomProprieta> configurazioneCustomProprieta = g.getProprieta()
					.stream()
					.filter(c -> c.getNome().equals(p.getNome()))
					.findAny();
					//.orElseThrow(() -> new BadRequestException("Proprieta ["+p.getNome()+"] non trovata per il gruppo ["+g.getNomeGruppo()+"]"));
					
					if (configurazioneCustomProprieta.isEmpty()) {
					    String errorMessage = String.format("Proprietà [%s] non trovata per il gruppo [%s]", p.getNome(), g.getNomeGruppo());
					    throw new BadRequestException(errorMessage);
					}
					
					EstensioneApiEntity e = new EstensioneApiEntity();
					
					e.setGruppo(apc.getGruppo());
					e.setNome(p.getNome());
					e.setValore(p.getValore());
					e.setApi(entity);
					
					entity.getEstensioni().add(e);
				}
			}
		}
	}

	private List<ConfigurazioneProfilo> getProfili(TipoServizio tipo) {
		if(tipo.equals(TipoServizio.API)) {
			return configurazione.getServizio().getApi().getProfili();
		} else {
			return configurazione.getServizio().getGenerico().getProfili();
		}
	}

	private ConfigurazioneTokenPolicy getTokenPolicy(TipoServizio tipo, String nomeTokenPolicy) {
		if(tipo.equals(TipoServizio.API)) {
			return configurazione.getServizio().getApi().getTokenPolicies()
					.stream()
					.filter(tp -> tp.getCodicePolicy().equals(nomeTokenPolicy))
					.findAny()
					.orElseThrow(() -> new InternalException("Nessuna Token Policy trovata con codice " + nomeTokenPolicy));
		} else {
			throw new BadRequestException("Impossibile caricare una token policy per un servizio di tipo " + tipo);
		}
	}

	private List<AuthTypeEntity> getAuthType(List<AuthTypeApiResource> authTypeLst, ApiEntity entity) {
		List<AuthTypeEntity> authTypeSet = new ArrayList<>();
		if(authTypeLst != null && !authTypeLst.isEmpty()) {
			for(AuthTypeApiResource gruppo: authTypeLst) {

				ConfigurazioneProfilo p = configurazione.getServizio().getApi().getProfili()
						.stream()
						.filter(pr -> pr.getCodiceInterno().equals(gruppo.getProfilo()))
						.findAny()
						.orElseThrow(() -> new BadRequestException("Profilo ["+gruppo.getProfilo()+"] non trovato"));

				DominioEntity d = entity.getServizio().getDominio();
				
				if(p.getTipoDominio()!= null) {
					
					ConfigurazioneTipoDominioEnum cd = entity.getServizio().isFruizione() ? ConfigurazioneTipoDominioEnum.ESTERNO: ConfigurazioneTipoDominioEnum.INTERNO;
					
					if(!p.getTipoDominio().equals(cd)) {
							throw new BadRequestException("Profilo ["+p.getEtichetta()+"] non compatibile col dominio " + d.getNome());
					}
				}
					
				if(p.getDomini()!= null) {
					if(!p.getDomini().stream().anyMatch(dNome -> dNome.equals(d.getNome()))) {
						throw new BadRequestException("Profilo ["+p.getEtichetta()+"] non compatibile col dominio " + d.getNome());
					}
				}
					
				if(p.getSoggetti()!= null) {
					if(!p.getSoggetti().stream().anyMatch(dNome -> dNome.equals(d.getSoggettoReferente().getNome()))) {
						throw new BadRequestException("Profilo ["+p.getEtichetta()+"] non compatibile col soggetto " + d.getSoggettoReferente().getNome());
					}
				}
					
				ConfigurazioneCompatibilitaApiEnum comp = null;
				
				switch(entity.getCollaudo().getProtocollo()) { //TODO
				case OPENAPI_3:
				case SWAGGER_2: comp = ConfigurazioneCompatibilitaApiEnum.REST;
					break;
				case WSDL11:
				case WSDL12:  comp = ConfigurazioneCompatibilitaApiEnum.SOAP;
					break;}

				if(p.getCompatibilita() != null && !p.getCompatibilita().equals(comp)) {
					throw new BadRequestException("Profilo ["+gruppo.getProfilo()+"] ha compatibilita " + p.getCompatibilita());
				}

				AuthTypeEntity authType = new AuthTypeEntity();
				authType.setApi(entity);
				authType.setNote(gruppo.getNote());
				authType.setProfilo(gruppo.getProfilo());
				authType.setResources(String.join(SEPARATOR, gruppo.getResources()).getBytes());

				authTypeSet.add(authType);
			}
		} else {
			throw new BadRequestException("Nessuna autenticazione configurata");
		}
		return authTypeSet;
	}

	public ConfigurazioneTokenPolicy toTokenPolicyModel(ApiEntity entity) {
		ConfigurazioneTokenPolicy ctp = selectTokenPolicy(entity);

		return populatePolicy(entity, ctp);
	}

	private ConfigurazioneTokenPolicy populatePolicy(ApiEntity entity, ConfigurazioneTokenPolicy ctp) {
		if(ctp == null) return null;
		switch(ctp.getTipoPolicy()) {
		case CLIENT_CREDENTIALS: return populatePolicyClientCredentials(entity, (ConfigurazioneTokenPolicyClientCredentials)ctp);
		case CODE_GRANT: return populatePolicyCodeGrant(entity, (ConfigurazioneTokenPolicyCodeGrant)ctp);
		case PDND: return populatePolicyPdnd(entity, (ConfigurazioneTokenPolicyPdnd)ctp);
		case PDND_AUDIT: return populatePolicyPdndAudit(entity, (ConfigurazioneTokenPolicyPdndAudit)ctp);
		case PDND_AUDIT_INTEGRITY: return populatePolicyPdndAuditIntegrity(entity, (ConfigurazioneTokenPolicyPdndAuditIntegrity)ctp);
		case PDND_INTEGRITY: return populatePolicyPdndIntegrity(entity, (ConfigurazioneTokenPolicyPdndIntegrity)ctp);
		}
		
		return null;
	}



	private String getAudience(ApiEntity entity, String nome) {
		Optional<EstensioneApiEntity> est = entity.getEstensioni()
				.stream()
				.filter(e -> e.getNome().equals(nome) && isCollaudo(e.getGruppo()))
				.findAny();
//		.orElseThrow(() -> new BadRequestException("Impossibile trovare una token policy per la API " + entity.getNome() + " " + entity.getVersione() + ": Valore Audience non trovato"));

		if(est.isPresent()) {
			return est.get().getValore();
		} else {
			return null;
		}
	}

	private boolean isCollaudo(String gruppo) {
		ConfigurazioneCustomProprietaList g = this.configurazione.getServizio().getApi().getProprietaCustom()
			.stream().filter(pc -> pc.getNomeGruppo().equals(gruppo))
			.findAny()
			.orElseThrow(() -> new InternalException("Gruppo ["+gruppo+"] non configurato"));
		return g.getClasseDato().equals(ConfigurazioneClasseDato.COLLAUDO) ||g.getClasseDato().equals(ConfigurazioneClasseDato.COLLAUDO_CONFIGURATO);
	}

	private static final String AUDIENCE_ESERVICE_PDND = "audience_eservice_pdnd";

	private ConfigurazioneTokenPolicy populatePolicyPdndIntegrity(ApiEntity entity,
			ConfigurazioneTokenPolicyPdndIntegrity ctp) {
		String aud = getAudience(entity, AUDIENCE_ESERVICE_PDND);
		
		ctp.setAudienceIntegrity(aud);

		return ctp;
	}

	private ConfigurazioneTokenPolicy populatePolicyPdndAuditIntegrity(ApiEntity entity,
			ConfigurazioneTokenPolicyPdndAuditIntegrity ctp) {
		String aud = getAudience(entity, AUDIENCE_ESERVICE_PDND);

		ctp.setAudienceAudit(aud);
		ctp.setAudienceIntegrity(aud);

		return ctp;
	}

	private ConfigurazioneTokenPolicy populatePolicyPdndAudit(ApiEntity entity,
			ConfigurazioneTokenPolicyPdndAudit ctp) {
		String aud = getAudience(entity, AUDIENCE_ESERVICE_PDND);
		ctp.setAudienceAudit(aud);

		return ctp;
	}

	private ConfigurazioneTokenPolicyClientCredentials populatePolicyClientCredentials(ApiEntity entity, ConfigurazioneTokenPolicyClientCredentials ctp) {
		return ctp;
	}

	private ConfigurazioneTokenPolicyCodeGrant populatePolicyCodeGrant(ApiEntity entity, ConfigurazioneTokenPolicyCodeGrant ctp) {
		return ctp;
	}

	private ConfigurazioneTokenPolicyPdnd populatePolicyPdnd(ApiEntity entity, ConfigurazioneTokenPolicyPdnd ctp) {
		return ctp;
	}

	private ConfigurazioneTokenPolicy selectTokenPolicy(ApiEntity entity) {

		if(entity.getRuolo().equals(RUOLO.EROGATO_SOGGETTO_DOMINIO)) {

			Comparator<? super AuthTypeEntity> c = (o1, o2) -> {
				return (int) (o1.getId() - o2.getId());
			};
			List<AuthTypeEntity> lst = entity.getAuthType().stream().sorted(c).collect(Collectors.toList());
			
			for(AuthTypeEntity authType: lst) {
				ConfigurazioneProfilo p = getProfili(entity.getServizio().getTipo())
						.stream()
						.filter(pr -> pr.getCodiceInterno().equals(authType.getProfilo()))
						.findAny()
						.orElseThrow(() -> new InternalException("Profilo ["+authType.getProfilo()+"] non trovato"));
				
				if(p.getCodiceTokenPolicy()!= null) {
					return getTokenPolicy(entity.getServizio().getTipo(), p.getCodiceTokenPolicy());
				}
				
			}
			return null;
		} else {
			return null;
		}

	}



}
