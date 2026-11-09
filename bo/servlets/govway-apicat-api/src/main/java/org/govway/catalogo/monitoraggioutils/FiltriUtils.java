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
package org.govway.catalogo.monitoraggioutils;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;
import java.util.stream.Collectors;

import org.govway.catalogo.core.dao.specifications.ApiSpecification;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.ApiConfigEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity.RUOLO;
import org.govway.catalogo.core.orm.entity.AuthTypeEntity;
import org.govway.catalogo.core.orm.entity.ClientAdesioneEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.core.orm.entity.ErogazioneEntity;
import org.govway.catalogo.core.orm.entity.EstensioneApiEntity;
import org.govway.catalogo.core.orm.entity.PackageServizioEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.govway.catalogo.core.services.AdesioneService;
import org.govway.catalogo.core.services.ApiService;
import org.govway.catalogo.core.services.ServizioService;
import org.govway.catalogo.core.services.SoggettoService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.services.ProfiloGovwayService;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneProfilo;
import org.govway.catalogo.servlets.model.ConfigurazioneProprietaAudit;
import org.govway.catalogo.servlets.monitor.model.AmbienteEnum;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public class FiltriUtils {

	
	@Autowired
	private ServizioService servizioService;

	@Autowired
	private SoggettoService soggettoService;

	@Autowired
	private ApiService apiService;

	@Autowired
	private AdesioneService adesioneService;

	@Autowired
	private Configurazione configurazione;   

	@Autowired
	private ProfiloGovwayService profiloGovwayService;

	public String getProfilo(UUID idServizio, UUID idApi) {
		return this.servizioService.runTransaction(() -> {
			ServizioEntity servizio = this.servizioService.find(idServizio)
					.orElseThrow(() -> new NotFoundException(ErrorCode.SRV_404, Map.of("idServizio", idServizio.toString())));

			ApiEntity api = null;
			if(idApi != null) {
				api = this.apiService.find(idApi)
					.orElseThrow(() -> new NotFoundException(ErrorCode.API_404, Map.of("idApi", idApi.toString())));
			}
	
			String ridefinito = null;
			
			for(ApiEntity c: servizio.getApi()) {
				if(api == null || api.getId().equals(c.getId())) {
					// La ridefinizione del gestore sull'API prevale sul profilo_govway dei profili
					if(ridefinito == null) {
						ridefinito = this.profiloGovwayService.getOverride(c);
					}
					List<AuthTypeEntity> authTypeList = c.getAuthType();
					for(AuthTypeEntity at: authTypeList) {
						if(ridefinito == null) {
							Optional<ConfigurazioneProfilo> pr = this.configurazione.getServizio().getApi().getProfili()
									.stream()
								.filter(p -> p.getCodiceInterno().equals(at.getProfilo())).findAny();
							if(pr.isPresent() && pr.get().getProfiloGovway()!=null) {
								ridefinito = pr.get().getProfiloGovway();
							}
						}
					}
				}
			}
			
			if(ridefinito != null) {
				return ridefinito;
			} else {
				return this.configurazione.getMonitoraggio().getProfiloGovwayDefault();
			}
			
		});

	}

	public ApiEntity findAPI(String nome, Integer versione, SoggettoEntity soggetto) {
		ApiSpecification spec = new ApiSpecification();
		spec.setNome(Optional.of(nome));
		spec.setVersione(Optional.of(versione));
		Page<ApiEntity> findAll = this.apiService.findAll(spec, Pageable.unpaged());
		
		ApiEntity api = null;
		if(findAll.isEmpty()) {
			return null;
//			throw new NotFoundException("API ["+nome+"/"+versione+"/"+soggetto.getNome()+"] non trovata");
		} else {
			if(findAll.getSize() == 1) {
				Optional<ApiEntity> apiEntity = findAll.stream().findAny();
				if(apiEntity.isPresent())
					api = apiEntity.get();
			} else {
				Optional<ApiEntity> oApi = this.apiService.findByNomeVersioneSoggetto(nome, versione, UUID.fromString(soggetto.getIdSoggetto()));
				if(oApi.isPresent()) {
					api = oApi.get();
				} else {
					Optional<ApiEntity> apiEntity = findAll.stream().findAny();
					if(apiEntity.isPresent())
						api = apiEntity.get();
				}
			}
		}
		return api;
	}
	
	/**
	 * Un'API ha l'audit in un ambiente se almeno una delle proprietà custom indicate per quell'ambiente
	 * in monitoraggio.proprieta_audit è valorizzata.
	 */
	public static boolean isAuditAbilitato(List<ConfigurazioneProprietaAudit> proprietaAudit, Collection<EstensioneApiEntity> estensioni, AmbienteEnum ambiente) {
		if(proprietaAudit == null || estensioni == null) {
			return false;
		}
		return proprietaAudit.stream()
				.filter(p -> p.getAmbiente() != null && p.getAmbiente().getValue().equals(ambiente.getValue()))
				.anyMatch(p -> estensioni.stream()
						.anyMatch(e -> p.getNomeGruppo().equals(e.getGruppo())
								&& p.getNomeProprieta().equals(e.getNome())
								&& e.getValore() != null && !e.getValore().isBlank()));
	}

	/**
	 * Verifica che l'API abbia l'audit nell'ambiente indicato.
	 */
	public void checkApiAudit(UUID idApi, AmbienteEnum ambiente) {
		this.apiService.runTransaction(() -> {
			ApiEntity api = this.apiService.find(idApi)
					.orElseThrow(() -> new NotFoundException(ErrorCode.API_404, Map.of("idApi", idApi.toString())));
			checkApiAudit(api, ambiente);
		});
	}

	/**
	 * Verifica che l'API di una transazione, individuata come in fase di visualizzazione della transazione, abbia l'audit
	 * nell'ambiente indicato.
	 */
	public void checkApiAudit(String nome, Integer versione, String erogatore, AmbienteEnum ambiente) {
		this.apiService.runTransaction(() -> {
			SoggettoEntity soggetto = this.soggettoService.findByNome(erogatore)
					.orElseThrow(() -> new NotFoundException(ErrorCode.SOG_404_BY_NAME, Map.of("nomeSoggetto", erogatore)));
			ApiEntity api = findAPI(nome, versione, soggetto);
			if(api == null) {
				throw new BadRequestException(ErrorCode.MON_400_AUDIT_API, Map.of("nomeApi", nome, "versioneApi", String.valueOf(versione), "ambiente", ambiente.getValue()));
			}
			checkApiAudit(api, ambiente);
		});
	}

	private void checkApiAudit(ApiEntity api, AmbienteEnum ambiente) {
		if(!isAuditAbilitato(this.configurazione.getMonitoraggio().getProprietaAudit(), api.getEstensioni(), ambiente)) {
			throw new BadRequestException(ErrorCode.MON_400_AUDIT_API, Map.of("nomeApi", api.getNome(), "versioneApi", String.valueOf(api.getVersione()), "ambiente", ambiente.getValue()));
		}
	}

	public String getSoggettoNome(String nome) {

		SoggettoEntity soggetto = this.soggettoService.findByNome(nome)
				.orElseThrow(() -> new NotFoundException(ErrorCode.SOG_404_BY_NAME, Map.of("nomeSoggetto", nome)));
		return soggetto.getNomeGateway() != null ? soggetto.getNomeGateway(): soggetto.getNome();
	}

	public List<IdApi> getApi(UUID idServizio, UUID idApi, UUID idAdesione, AmbienteEnum ambiente) {
		
		return this.servizioService.runTransaction(() -> {
			ServizioEntity servizio = this.servizioService.find(idServizio)
					.orElseThrow(() -> new NotFoundException(ErrorCode.SRV_404, Map.of("idServizio", idServizio.toString())));

			ApiEntity api = null;
			if(idApi != null) {

				api = this.apiService.find(idApi)
					.orElseThrow(() -> new NotFoundException(ErrorCode.API_404, Map.of("idApi", idApi.toString())));

				if(!api.getServizi().stream()
					.anyMatch(s -> {
						boolean apiInServizio = s.getId().equals(servizio.getId());
						boolean apiInPackage = s.getPackages().stream().anyMatch(p -> p.get_package().getId().equals(servizio.getId()));
						return apiInServizio || apiInPackage;
					})) {
					throw new BadRequestException(ErrorCode.VAL_422_API_SERVICE_MISMATCH, Map.of("nomeApi", api.getNome(), "versioneApi", String.valueOf(api.getVersione()), "nomeServizio", servizio.getNome(), "versioneServizio", servizio.getVersione()));
				}

			}

			AdesioneEntity adesione = null;
			if(idAdesione != null) {
				adesione = this.adesioneService.findByIdAdesione(idAdesione.toString())
					.orElseThrow(() -> new NotFoundException(ErrorCode.ADE_404, Map.of("idAdesione", idAdesione.toString())));
			}
	
			List<IdApi> apiLst = new ArrayList<>();
			
			Set<ApiEntity> apiServizioLst = new HashSet<>();
			
			if(servizio.is_package()) {
				for(PackageServizioEntity c: servizio.getComponenti()) {
					apiServizioLst.addAll(c.getServizio().getApi());
				}
			} else {
				apiServizioLst = servizio.getApi(); 
			}
			
			for(ApiEntity ap: apiServizioLst) {
				if(api == null || api.getId().equals(ap.getId())) {
					ApiConfigEntity conf = ambiente.equals(AmbienteEnum.COLLAUDO) ? ap.getCollaudo(): ap.getProduzione();
					if(ap.getRuolo().equals(RUOLO.EROGATO_SOGGETTO_DOMINIO)) {
						
 						IdApi id = new IdApi();
						id.setNome(conf.getNomeGateway() != null ? conf.getNomeGateway(): ap.getNome());
						id.setVersione(conf.getVersioneGateway() != null ? conf.getVersioneGateway(): ap.getVersione());
						id.setRuolo(ap.getRuolo());
						id.setProtocollo(conf.getProtocollo());

						// Il flag isFruizione() è il segnale autoritativo; soggettoErogatore deve comunque
						// essere valorizzato (protegge da NPE e da dati sporchi). Calcolato una sola volta
						// così che "tipo" ed "erogatore" restino sempre coerenti tra loro.
						boolean fruizione = servizio.isFruizione() && servizio.getSoggettoErogatore()!=null;

						if(fruizione) {
							id.setFruizione(true);
						}

						if(fruizione) {
							// Fruizione: l'erogatore verso GovWay è l'ente erogatore (provider) indicato sul servizio,
							// anche quando si filtra per adesione. Coerente con il nuovo modello (vedi EServiceBuilder.getUrlInvocazione
							// e AdesioneDTOConverter): per le fruizioni dominio.getSoggettoReferente() è il fruitore interno, non l'erogatore.
							id.setSoggetto(getSoggettoNome(servizio.getSoggettoErogatore().getNome()));
							if(adesione != null) {
								// Il fruitore è sempre il referente del dominio: l'adesione si distingue per l'applicativo fruitore.
								id.setApplicativoFruitore(getApplicativoFruitore(adesione, ap, ambiente));
							}
						} else if(adesione != null) {
							id.setSoggetto(getSoggettoNome(adesione.getSoggetto().getNome()));
						} else {
							// Erogazione: l'erogatore è il soggetto referente del dominio.
							id.setSoggetto(getSoggettoNome(servizio.getDominio().getSoggettoReferente().getNome()));
						}

						apiLst.add(id);
					} else {
						for(AdesioneEntity ades: servizio.getAdesioni()) {
							if(idAdesione == null || ades.getIdAdesione().equals(idAdesione.toString())) {
								if(this.configurazione.getAdesione().getStatiSchedaAdesione().contains(ades.getStato())) {
									for(ErogazioneEntity e: ades.getErogazioni()) {
										if(e.getApi() != null && e.getApi().getId().equals(ap.getId())) {
											IdApi idErog = new IdApi();
											idErog.setNome(e.getApi().getNome());
											idErog.setVersione(e.getApi().getVersione());
											idErog.setRuolo(ap.getRuolo());
											idErog.setProtocollo(conf.getProtocollo());
											idErog.setSoggetto(getSoggettoNome(ades.getSoggetto().getNome()));
											
											apiLst.add(idErog);
										}
									}
								} else {
									if(idAdesione != null && ades.getIdAdesione().equals(idAdesione.toString())) {
										throw new BadRequestException(ErrorCode.ADE_400_STATE_MONITORING, Map.of("idAdesione", idAdesione.toString(), "stato", ades.getStato().toString()));
									}
								}
							}
						}
					}
				}
			}

			if(apiLst.isEmpty()) {
				throw new BadRequestException(ErrorCode.API_404_FOR_SERVICE, Map.of("idServizio", idServizio.toString()));
			}
			
			return apiLst;
		});

	}

	/**
	 * Applicativo GovWay con cui l'adesione fruisce l'API nell'ambiente: è il client associato all'adesione
	 * per l'ambiente e per i profili dell'API (lo stesso nome con cui il configuratore censisce l'applicativo).
	 * Il monitoraggio GovWay accetta un solo applicativo nel filtro: senza client o con più client distinti
	 * il filtro per adesione non è applicabile.
	 */
	private String getApplicativoFruitore(AdesioneEntity adesione, ApiEntity api, AmbienteEnum ambiente) {
		Set<String> profili = api.getAuthType().stream()
				.map(AuthTypeEntity::getProfilo)
				.collect(Collectors.toSet());

		Set<String> applicativi = adesione.getClient().stream()
				.filter(ca -> ca.getAmbiente().name().equals(ambiente.name()))
				.filter(ca -> profili.contains(ca.getProfilo()))
				.map(ClientAdesioneEntity::getClient)
				.filter(Objects::nonNull)
				.map(ClientEntity::getNome)
				.collect(Collectors.toCollection(TreeSet::new));

		Map<String, String> params = Map.of("idAdesione", adesione.getIdAdesione(),
				"nomeApi", api.getNome(),
				"versioneApi", String.valueOf(api.getVersione()),
				"ambiente", ambiente.getValue());

		if(applicativi.isEmpty()) {
			throw new BadRequestException(ErrorCode.ADE_400_MONITORING_CLIENT_ASSENTE, params);
		}

		if(applicativi.size() > 1) {
			Map<String, String> paramsMultipli = new HashMap<>(params);
			paramsMultipli.put("applicativi", String.join(", ", applicativi));
			throw new BadRequestException(ErrorCode.ADE_400_MONITORING_CLIENT_MULTIPLI, paramsMultipli);
		}

		return applicativi.iterator().next();
	}
	
}
