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
package org.govway.catalogo.assembler;

import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.govway.catalogo.controllers.APIController;
import org.govway.catalogo.core.business.utils.EServiceBuilder;
import org.govway.catalogo.core.business.utils.OpenapiUtils;
import org.govway.catalogo.core.business.utils.SwaggerUtils;
import org.govway.catalogo.core.business.utils.WsdlUtils;
import org.govway.catalogo.core.dao.repositories.ApiConfigUrlInvocazioneRepository;
import org.govway.catalogo.core.orm.entity.ApiConfigEntity;
import org.govway.catalogo.core.orm.entity.ApiConfigUrlInvocazioneEntity;
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
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.services.ProfiloGovwayService;
import org.govway.catalogo.servlets.model.API;
import org.govway.catalogo.servlets.model.APICreate;
import org.govway.catalogo.servlets.model.APIDatiAmbiente;
import org.govway.catalogo.servlets.model.APIDatiAmbienteCreate;
import org.govway.catalogo.servlets.model.APIDatiAmbienteUpdate;
import org.govway.catalogo.servlets.model.ApiUpdate;
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
import org.govway.catalogo.servlets.model.ConfigurazioneUrlInvocazioneAmbiente;
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
import org.springframework.beans.factory.annotation.Value;
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
	private ApiConfigUrlInvocazioneRepository apiConfigUrlInvocazioneRepository;

	@Autowired
	private Configurazione configurazione;

	@Autowired
	private ProfiloGovwayService profiloGovwayService;

	/**
	 * Se abilitata, consente le specifiche REST in formato Swagger 2.0 (deprecato). Default: false.
	 * Il controllo si applica solo quando il contenuto della specifica cambia: le API gia` salvate
	 * con specifica Swagger 2.0 restano aggiornabili.
	 */
	@Value("${org.govway.api.catalogo.rest.parsing.swagger2.enabled:false}")
	private boolean supportaSwagger2;

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
			dettaglio.setConfigurazioneCollaudo(toConfigurazione(entity.getCollaudo(), true));
		}
		
		if(entity.getProduzione()!= null) {
			dettaglio.setConfigurazioneProduzione(toConfigurazione(entity.getProduzione(), false));
		}
		
		Comparator<? super AuthTypeEntity> c = (o1, o2) -> {
			return Long.compare(o1.getId(), o2.getId());
		};
		
		List<AuthTypeEntity> lst = entity.getAuthType().stream().sorted(c).collect(Collectors.toList());
		
		for(AuthTypeEntity authType: lst) {
			AuthTypeApiResource g = new AuthTypeApiResource();
			g.setNote(authType.getNote());
			
			Optional<ConfigurazioneProfilo> configurazioneProfilo = this.configurazione.getServizio().getApi().getProfili()
					.stream()
					.filter(p -> p.getCodiceInterno().equals(authType.getProfilo()))
					.findAny();
			if (configurazioneProfilo.isEmpty()) {
			    throw new BadRequestException(ErrorCode.VAL_400_PROFILE, Map.of("profilo", authType.getProfilo()));
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

	/**
	 * Dati della specifica di un ambiente, con le URL di invocazione associate. La selezione e`
	 * esposta solo nel dettaglio e non negli elenchi, per non inizializzare la collezione su
	 * ogni riga: lista omessa quando vuota, cioe` quando vale la sola URL predefinita.
	 */
	private APIDatiAmbiente toConfigurazione(ApiConfigEntity config, boolean collaudo) {
		APIDatiAmbiente datiAmbiente = this.apiEngineAssembler.toConfigurazione(config);

		List<String> urlInvocazione = getUrlInvocazione(config, collaudo);
		if(!urlInvocazione.isEmpty()) {
			datiAmbiente.setUrlInvocazione(urlInvocazione);
		}

		return datiAmbiente;
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
			Set<String> profiliPrima = getProfiliAuthType(entity);
			entity.getAuthType().clear();
			if(src.getGruppiAuthType()!=null) {
				entity.getAuthType().addAll(getAuthType(src.getGruppiAuthType(), entity));
			}

			// Le proprieta` custom dipendono dai profili di autenticazione: al cambio dei profili vengono
			// rimosse, tranne la ridefinizione del profilo GovWay (riservata al gestore). Eventuali dati_custom
			// della stessa richiesta vengono applicati dopo e quindi restano.
			if(!profiliPrima.equals(getProfiliAuthType(entity))) {
				entity.getEstensioni().removeIf(e -> !this.profiloGovwayService.isGruppoOverride(e.getGruppo()));
			}
		}

		this.servizioDettaglioAssembler.setUltimaModifica(entity.getServizio());
		this.servizioService.save(entity.getServizio());

		return entity;
	}

	/**
	 * Indica se la richiesta modifica al piu` la descrizione e le note delle autenticazioni: gli altri
	 * blocchi devono essere assenti o riportare i valori gia` salvati (la console li reinvia invariati).
	 */
	public boolean isSoloDescrizioneNote(ApiUpdate src, ApiEntity entity) {
		return src.getConfigurazioneCollaudo() == null
				&& src.getConfigurazioneProduzione() == null
				&& isInvariato(src.getIdentificativo(), entity)
				&& isInvariato(src.getDatiGenerici(), entity)
				&& isInvariato(src.getDatiSpecifica(), entity)
				&& isInvariato(src.getDatiCustom(), entity);
	}

	/**
	 * Applica la descrizione e le note delle autenticazioni di una richiesta verificata con
	 * {@link #isSoloDescrizioneNote(ApiUpdate, ApiEntity)}: le note sono aggiornate sui gruppi
	 * esistenti, senza ricostruirli.
	 */
	public ApiEntity toEntityDescrizioneNote(ApiUpdate src, ApiEntity entity) {
		if(src.getDatiGenerici() != null) {
			entity.setDescrizione(Optional.ofNullable(src.getDatiGenerici().getDescrizione()).map(d -> d.getBytes()).orElse(null));
		}

		if(src.getDatiSpecifica() != null && entity.getRuolo().equals(RUOLO.EROGATO_SOGGETTO_DOMINIO)) {
			List<AuthTypeEntity> salvati = getAuthTypeOrdinati(entity);
			for(int i = 0; i < salvati.size(); i++) {
				salvati.get(i).setNote(src.getDatiSpecifica().getGruppiAuthType().get(i).getNote());
			}
		}

		this.servizioDettaglioAssembler.setUltimaModifica(entity.getServizio());
		this.servizioService.save(entity.getServizio());

		return entity;
	}

	private boolean isInvariato(IdentificativoApiUpdate src, ApiEntity entity) {
		return src == null
				|| (Objects.equals(src.getNome(), entity.getNome())
						&& Objects.equals(src.getVersione(), entity.getVersione())
						&& src.getRuolo() != null
						&& this.apiEngineAssembler.toRuolo(src.getRuolo()).equals(entity.getRuolo()));
	}

	private boolean isInvariato(DatiGenericiApiUpdate src, ApiEntity entity) {
		// url_invocazione assente: la console non la invia sempre
		return src == null
				|| (Objects.equals(src.getCodiceAsset(), entity.getCodiceAsset())
						&& (src.getUrlInvocazione() == null || src.getUrlInvocazione().equals(entity.getUrlInvocazione())));
	}

	private boolean isInvariato(DatiSpecificaApiUpdate src, ApiEntity entity) {
		// i gruppi di autenticazione sono gestiti solo per le API erogate dal soggetto di dominio
		if(src == null || !entity.getRuolo().equals(RUOLO.EROGATO_SOGGETTO_DOMINIO)) {
			return true;
		}

		// confronto posizionale, nell'ordine restituito da toModel
		List<AuthTypeApiResource> gruppi = Optional.ofNullable(src.getGruppiAuthType()).orElse(List.of());
		List<AuthTypeEntity> salvati = getAuthTypeOrdinati(entity);
		if(gruppi.size() != salvati.size()) {
			return false;
		}

		for(int i = 0; i < salvati.size(); i++) {
			AuthTypeApiResource gruppo = gruppi.get(i);
			AuthTypeEntity salvato = salvati.get(i);
			if(!salvato.getProfilo().equals(gruppo.getProfilo()) || gruppo.getResources() == null
					|| !String.join(SEPARATOR, gruppo.getResources()).equals(new String(salvato.getResources()))) {
				return false;
			}
		}
		return true;
	}

	private boolean isInvariato(DatiCustomUpdate src, ApiEntity entity) {
		if(src == null) {
			return true;
		}
		if(src.getProprietaCustom() == null) {
			return false;
		}

		for(ProprietaCustom gruppo: src.getProprietaCustom()) {
			// un gruppo non configurato resta respinto dal percorso ordinario
			boolean configurato = this.configurazione.getServizio().getApi().getProprietaCustom()
					.stream()
					.anyMatch(c -> c.getNomeGruppo().equals(gruppo.getGruppo()));
			if(!configurato || gruppo.getProprieta() == null) {
				return false;
			}

			List<Map.Entry<String, String>> richieste = gruppo.getProprieta().stream()
					.map(p -> new AbstractMap.SimpleEntry<>(p.getNome(), p.getValore()))
					.collect(Collectors.toList());
			List<Map.Entry<String, String>> salvate = entity.getEstensioni().stream()
					.filter(e -> e.getGruppo().equals(gruppo.getGruppo()))
					.map(e -> new AbstractMap.SimpleEntry<>(e.getNome(), e.getValore()))
					.collect(Collectors.toList());
			if(richieste.size() != salvate.size() || !new HashSet<>(richieste).equals(new HashSet<>(salvate))) {
				return false;
			}
		}
		return true;
	}

	private List<AuthTypeEntity> getAuthTypeOrdinati(ApiEntity entity) {
		return entity.getAuthType().stream()
				.sorted(Comparator.comparing(AuthTypeEntity::getId))
				.collect(Collectors.toList());
	}
	
	public ApiEntity toEntityCollaudo(APIDatiAmbienteUpdate src, ApiEntity entity) {
		BeanUtils.copyProperties(src, entity);
		entity.setCollaudo(toEntityAmbiente(src, entity.getCollaudo() != null ? entity.getCollaudo() : new ApiConfigEntity(), entity, true));

		this.servizioDettaglioAssembler.setUltimaModifica(entity.getServizio());
		this.servizioService.save(entity.getServizio());
		
		return entity;
	}
	
	public ApiEntity toEntityProduzione(APIDatiAmbienteUpdate src, ApiEntity entity) {
		BeanUtils.copyProperties(src, entity);
		entity.setProduzione(toEntityAmbiente(src, entity.getProduzione() != null ? entity.getProduzione() : new ApiConfigEntity(), entity, false));

		this.servizioDettaglioAssembler.setUltimaModifica(entity.getServizio());
		this.servizioService.save(entity.getServizio());

		return entity;
	}
	
	public ApiConfigEntity toEntityAmbiente(APIDatiAmbienteUpdate src, ApiConfigEntity entity, ApiEntity api, boolean collaudo) {

		// Selezione assente: resta invariata, cosi` un client che non la invia non la azzera.
		// Lista vuota: si torna alla sola URL predefinita.
		if(src.getUrlInvocazione() != null) {
			setUrlInvocazione(src.getUrlInvocazione(), entity, collaudo);
		}

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
		
		DocumentoEntity specificaPrecedente = entity.getSpecifica();

		if(src.getSpecifica()!=null) {
			entity.setSpecifica(this.allegatoAssembler.toEntity(src.getSpecifica(), entity.getSpecifica(), this.apiEngineAssembler.getUtenteSessione()));
		}
		
		entity.setProtocollo(toProtocollo(src.getProtocollo(), entity.getSpecifica(), isContenutoModificato(specificaPrecedente, entity.getSpecifica())));

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
				orElseThrow(() -> new NotFoundException(ErrorCode.SRV_404, Map.of("idServizio", src.getIdServizio().toString()))));

		entity.setRuolo(this.apiEngineAssembler.toRuolo(src.getRuolo()));

		getProprietaCustom(src.getProprietaCustom(), entity);

		if(src.getConfigurazioneCollaudo()!=null) {
			entity.setCollaudo(getApiConfig(src.getConfigurazioneCollaudo(), entity, true));
		}

		if(src.getConfigurazioneProduzione()!=null) {
			entity.setProduzione(getApiConfig(src.getConfigurazioneProduzione(), entity, false));
		}

		if(entity.getRuolo().equals(RUOLO.EROGATO_SOGGETTO_DOMINIO) && src.getGruppiAuthType()!=null) {
			entity.getAuthType().addAll(getAuthType(src.getGruppiAuthType(), entity));
		}

		this.profiloGovwayService.checkProfili(entity);

		this.servizioDettaglioAssembler.setUltimaModifica(entity.getServizio());
		this.servizioService.save(entity.getServizio());

		return entity;
	}
	
	/**
	 * Indica se la specifica risultante ha un contenuto diverso da quella precedente
	 * (il frontend reinvia la specifica anche quando non viene modificata).
	 */
	private boolean isContenutoModificato(DocumentoEntity precedente, DocumentoEntity attuale) {
		if(attuale == null) {
			return false;
		}
		return precedente == null || !Arrays.equals(precedente.getRawData(), attuale.getRawData());
	}

	private PROTOCOLLO toProtocollo(ProtocolloEnum pr, DocumentoEntity spec, boolean specificaModificata) {

		if(spec!=null) {
			
			switch(pr) {
			case REST: 
				if (OpenapiUtils.isOpenapi(spec.getRawData())) {
					return PROTOCOLLO.OPENAPI_3;
				} else if (SwaggerUtils.isSwagger(spec.getRawData())) {
					if(specificaModificata && !this.supportaSwagger2) {
						this.logger.warn("Specifica Swagger 2.0 rifiutata: il supporto e` disabilitato (property 'org.govway.api.catalogo.rest.parsing.swagger2.enabled')");
						throw new BadRequestException(ErrorCode.DOC_400_SWAGGER2);
					}
					return PROTOCOLLO.SWAGGER_2;
				} else {
					this.logger.error("Swagger / OpenAPI fornito non corretto");
					throw new BadRequestException(ErrorCode.DOC_400_FORMAT);
				}
			case SOAP:
				try {
					return WsdlUtils.getProtocolloApi(spec.getRawData());
				} catch (Exception e) {
					this.logger.error("WSDL fornito non corretto: " + e.getMessage(), e);
					throw new BadRequestException(ErrorCode.DOC_400_FORMAT, e);
				}
			}

		} else {
			switch(pr) {
			case REST: return PROTOCOLLO.OPENAPI_3;
			case SOAP: return PROTOCOLLO.WSDL11;
			}
		}

		throw new BadRequestException(ErrorCode.SYS_500);
	}

	private ApiConfigEntity getApiConfig(APIDatiAmbienteCreate src, ApiEntity api, boolean collaudo) {
		ApiConfigEntity entity = new ApiConfigEntity();

		checkSpecifica(src.getSpecifica());

		setUrlInvocazione(src.getUrlInvocazione(), entity, collaudo);

		if(src.getSpecifica()!=null) {
			entity.setSpecifica(this.allegatoAssembler.toEntity(src.getSpecifica(), this.apiEngineAssembler.getUtenteSessione()));
		}
		
		entity.setProtocollo(toProtocollo(src.getProtocollo(), entity.getSpecifica(), true));
		
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
				throw new BadRequestException(ErrorCode.VAL_400_REQUIRED);
			}
		}
	}

	/**
	 * Sostituisce integralmente le URL di invocazione associate alla specifica dell'ambiente.
	 * Le URL disponibili sono quelle censite in configurazione per quell'ambiente, piu`
	 * l'identificativo riservato della URL predefinita.
	 */
	private void setUrlInvocazione(List<String> identificativi, ApiConfigEntity entity, boolean collaudo) {

		validaUrlInvocazione(identificativi, collaudo);

		// Le righe non piu` selezionate sono cancellate esplicitamente: la collezione non usa
		// orphanRemoval (vedi ApiConfigEntity).
		List<ApiConfigUrlInvocazioneEntity> precedenti = new ArrayList<>(entity.getUrlInvocazione());
		entity.getUrlInvocazione().clear();
		this.apiConfigUrlInvocazioneRepository.deleteAll(precedenti);

		if(identificativi == null) {
			return;
		}

		int posizione = 1;
		for(String identificativo: identificativi) {
			ApiConfigUrlInvocazioneEntity urlEntity = new ApiConfigUrlInvocazioneEntity();
			urlEntity.setApiConfig(entity);
			urlEntity.setPosizione(posizione++);
			urlEntity.setIdentificativo(identificativo);
			entity.getUrlInvocazione().add(urlEntity);
		}
	}

	private void validaUrlInvocazione(List<String> identificativi, boolean collaudo) {

		if(identificativi == null) {
			return;
		}

		Set<String> disponibili = new HashSet<>();
		disponibili.add(EServiceBuilder.ID_URL_INVOCAZIONE_DEFAULT);
		getUrlInvocazioneConfigurate(collaudo).forEach(u -> disponibili.add(u.getIdentificativo()));

		Set<String> gia = new HashSet<>();
		for(String identificativo: identificativi) {

			if(identificativo == null || !disponibili.contains(identificativo)) {
				throw new BadRequestException(ErrorCode.API_400_URL_NOT_FOUND,
						Map.of("identificativo", String.valueOf(identificativo),
								"ambiente", collaudo ? "collaudo" : "produzione"));
			}

			if(!gia.add(identificativo)) {
				throw new BadRequestException(ErrorCode.API_400_URL_DUPLICATE, Map.of("identificativo", identificativo));
			}
		}
	}

	/** URL censite in configurazione per l'ambiente indicato, lista vuota se la sezione manca. */
	private List<ConfigurazioneUrlInvocazioneAmbiente> getUrlInvocazioneConfigurate(boolean collaudo) {
		return Optional.ofNullable(this.configurazione.getServizio().getApi().getUrlInvocazione())
				.map(u -> collaudo ? u.getCollaudo() : u.getProduzione())
				.orElse(List.of());
	}

	/**
	 * Identificativi associati alla specifica, filtrati su quanto ancora censito in
	 * configurazione: una voce rimossa dalla configurazione non viene piu` proposta e, se il
	 * client rimanda la selezione cosi` com'e`, non fa fallire il salvataggio.
	 */
	public List<String> getUrlInvocazione(ApiConfigEntity config, boolean collaudo) {

		if(config == null) {
			return List.of();
		}

		Set<String> disponibili = new HashSet<>();
		disponibili.add(EServiceBuilder.ID_URL_INVOCAZIONE_DEFAULT);
		getUrlInvocazioneConfigurate(collaudo).forEach(u -> disponibili.add(u.getIdentificativo()));

		return config.getUrlInvocazione().stream()
				.map(ApiConfigUrlInvocazioneEntity::getIdentificativo)
				.filter(disponibili::contains)
				.collect(Collectors.toList());
	}

	private void getProprietaCustom(List<ProprietaCustom> proprietaCustom, ApiEntity entity) {
		
		if(proprietaCustom!=null) {
			for(ProprietaCustom apc: proprietaCustom) {
				ConfigurazioneCustomProprietaList g = configurazione.getServizio().getApi().getProprietaCustom()
				.stream()
				.filter(c -> c.getNomeGruppo().equals(apc.getGruppo()))
				.findAny()
				.orElseThrow(() -> new BadRequestException(ErrorCode.GRP_404, Map.of("idGruppo", apc.getGruppo())));

				this.profiloGovwayService.checkModificaGruppo(apc.getGruppo());

				for(AuthTypeApiResourceProprietaCustom p: apc.getProprieta()) {
					Optional<ConfigurazioneCustomProprieta> configurazioneCustomProprieta = g.getProprieta()
					.stream()
					.filter(c -> c.getNome().equals(p.getNome()))
					.findAny();

					if (configurazioneCustomProprieta.isEmpty()) {
					    throw new BadRequestException(ErrorCode.VAL_400_CUSTOM_PROPERTY, Map.of("nome", p.getNome(), "gruppo", g.getNomeGruppo()));
					}

					this.profiloGovwayService.checkValoreOverride(apc.getGruppo(), p.getNome(), p.getValore());
					
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
					.orElseThrow(() -> new InternalException(ErrorCode.SYS_500));
		} else {
			throw new BadRequestException(ErrorCode.SYS_500);
		}
	}

	private Set<String> getProfiliAuthType(ApiEntity entity) {
		return entity.getAuthType().stream().map(AuthTypeEntity::getProfilo).collect(Collectors.toSet());
	}

	private List<AuthTypeEntity> getAuthType(List<AuthTypeApiResource> authTypeLst, ApiEntity entity) {
		List<AuthTypeEntity> authTypeSet = new ArrayList<>();
		if(authTypeLst != null && !authTypeLst.isEmpty()) {
			for(AuthTypeApiResource gruppo: authTypeLst) {

				ConfigurazioneProfilo p = configurazione.getServizio().getApi().getProfili()
						.stream()
						.filter(pr -> pr.getCodiceInterno().equals(gruppo.getProfilo()))
						.findAny()
						.orElseThrow(() -> new BadRequestException(ErrorCode.VAL_400_PROFILE, Map.of("profilo", gruppo.getProfilo())));

				DominioEntity d = entity.getServizio().getDominio();
				
				if(p.getTipoDominio()!= null) {
					
					// tipo_dominio limita il profilo alle erogazioni (interno) o alle fruizioni (esterno)
					ConfigurazioneTipoDominioEnum cd = entity.getServizio().isFruizione() ? ConfigurazioneTipoDominioEnum.ESTERNO : ConfigurazioneTipoDominioEnum.INTERNO;
					
					if(!p.getTipoDominio().equals(cd)) {
							throw new BadRequestException(ErrorCode.VAL_422);
					}
				}
					
				if(p.getDomini()!= null && !p.getDomini().isEmpty()) {
					if(!p.getDomini().stream().anyMatch(dNome -> dNome.equals(d.getNome()))) {
						throw new BadRequestException(ErrorCode.VAL_422);
					}
				}
					
				if(p.getSoggetti()!= null && !p.getSoggetti().isEmpty()) {
					if(!p.getSoggetti().stream().anyMatch(dNome -> dNome.equals(d.getSoggettoReferente().getNome()))) {
						throw new BadRequestException(ErrorCode.VAL_422);
					}
				}
					
				ConfigurazioneCompatibilitaApiEnum comp = null;

				// Il collaudo puo` mancare (es. API in bozza con la sola produzione): si usa la configurazione disponibile (Issue 412)
				ApiConfigEntity config = entity.getCollaudo() != null ? entity.getCollaudo() : entity.getProduzione();
				if(config == null) {
					throw new BadRequestException(ErrorCode.VAL_400_REQUIRED, Map.of("campo", "configurazione_collaudo"));
				}

				switch(config.getProtocollo()) { //TODO
				case OPENAPI_3:
				case SWAGGER_2: comp = ConfigurazioneCompatibilitaApiEnum.REST;
					break;
				case WSDL11:
				case WSDL12:  comp = ConfigurazioneCompatibilitaApiEnum.SOAP;
					break;}

				if(p.getCompatibilita() != null && !p.getCompatibilita().equals(comp)) {
					throw new BadRequestException(ErrorCode.VAL_422);
				}

				AuthTypeEntity authType = new AuthTypeEntity();
				authType.setApi(entity);
				authType.setNote(gruppo.getNote());
				authType.setProfilo(gruppo.getProfilo());
				authType.setResources(String.join(SEPARATOR, gruppo.getResources()).getBytes());

				authTypeSet.add(authType);
			}
		} else {
			throw new BadRequestException(ErrorCode.VAL_400_REQUIRED);
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
			.orElseThrow(() -> new InternalException(ErrorCode.SYS_500));
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
				return Long.compare(o1.getId(), o2.getId());
			};
			List<AuthTypeEntity> lst = entity.getAuthType().stream().sorted(c).collect(Collectors.toList());
			
			for(AuthTypeEntity authType: lst) {
				ConfigurazioneProfilo p = getProfili(entity.getServizio().getTipo())
						.stream()
						.filter(pr -> pr.getCodiceInterno().equals(authType.getProfilo()))
						.findAny()
						.orElseThrow(() -> new InternalException(ErrorCode.SYS_500));
				
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
