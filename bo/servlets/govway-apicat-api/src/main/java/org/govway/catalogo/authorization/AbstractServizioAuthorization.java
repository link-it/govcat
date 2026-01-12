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
package org.govway.catalogo.authorization;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.govway.catalogo.core.dao.specifications.TassonomiaSpecification;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.AllegatoServizioEntity.VISIBILITA;
import org.govway.catalogo.core.orm.entity.ApiConfigEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity.RUOLO;
import org.govway.catalogo.core.orm.entity.AuthTypeEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.StatoServizioEntity;
import org.govway.catalogo.core.orm.entity.TIPO_REFERENTE;
import org.govway.catalogo.core.orm.entity.TassonomiaEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.services.TassonomiaService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.servlets.model.AuthTypeEnum;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneClasseDato;
import org.govway.catalogo.servlets.model.ConfigurazioneCustomProprietaList;
import org.govway.catalogo.servlets.model.EntitaComplessaError;
import org.govway.catalogo.servlets.model.Grant;
import org.govway.catalogo.servlets.model.Ruolo;
import org.govway.catalogo.servlets.model.ServizioCreate;
import org.govway.catalogo.servlets.model.ServizioUpdate;
import org.govway.catalogo.servlets.model.Sottotipo;
import org.govway.catalogo.servlets.model.SottotipoEnum;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public abstract class AbstractServizioAuthorization extends DefaultWorkflowAuthorization<ServizioCreate,ServizioUpdate,ServizioEntity> {

	public AbstractServizioAuthorization() {
		super(EntitaEnum.SERVIZIO);
	}

	@Autowired
	protected Configurazione configurazione;
	
	@Autowired
	private TassonomiaService tassonomiaService;

	public void authorizeExport() {
		this.coreAuthorization.requireAdmin();
	}

	public void checkCampiObbligatoriSpecifica(ServizioEntity entity,  Map<String, EntitaComplessaError> errore) {

		TassonomiaSpecification spec = new TassonomiaSpecification();
		spec.setObbligatorio(Optional.of(true));
		spec.setVisibile(Optional.of(true));
		Page<TassonomiaEntity> lst = this.tassonomiaService.findAll(spec, Pageable.unpaged());
		
		for(TassonomiaEntity t: lst) {
			boolean found = entity.getCategorie().stream().anyMatch(c -> c.getTassonomia().equals(t));
			
			if(!found) {
				requirePositiveInteger(0, "Definire almeno una categoria", t, errore, true);
			}
		}
	}

	public void checkCampiObbligatoriReferenti(ServizioEntity entity,  Map<String, EntitaComplessaError> errore) {
		int sizeR = (int) entity.getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE)).count();
//		int sizeRT = (int) entity.getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE_TECNICO)).count();
		requirePositiveInteger(sizeR, "referente", entity, errore);
//		requirePositiveInteger(sizeRT, "referente_tecnico", entity, errore);
	}

	public void checkCampiObbligatoriProduzione(ServizioEntity entity,  Map<String, EntitaComplessaError> errore) {
	}

	public void checkCampiObbligatoriIdentificativo(ServizioEntity entity,  Map<String, EntitaComplessaError> errore) {
		requireNotNull(entity.getNome(), "nome", entity, errore);
		requireNotNull(entity.getVersione(), "versione", entity, errore);
		requireNotNull(entity.getDominio(), "dominio", entity, errore);

		if(entity.isFruizione()) {
			requireNotNull(entity.getSoggettoInterno(), "soggetto_interno", entity, errore);
		}
	}

	public void checkCampiObbligatoriGenerico(ServizioEntity entity, Map<String, EntitaComplessaError> errore) {
		requireNotNull(entity.getDescrizione(), "descrizione", entity, errore);
		requireNotNull(entity.getDescrizioneSintetica(), "descrizione_sintetica", entity, errore);
	}

	public void checkCampiObbligatoriCollaudo(ServizioEntity entity,  Map<String, EntitaComplessaError> errore) {
	}

	protected void checkCampiObbligatoriSpecificaApi(ApiEntity entity,  Map<String, EntitaComplessaError> errore) {
		if(entity.getRuolo() != null && entity.getRuolo().equals(RUOLO.EROGATO_SOGGETTO_DOMINIO)) {
			requirePositiveInteger(entity.getAuthType().size(), "profili", entity, errore);
		}

		checkEstensioniGruppo(entity, ConfigurazioneClasseDato.SPECIFICA, errore);
	}

	protected void checkCampiObbligatoriIdentificativoApi(ApiEntity entity,  Map<String, EntitaComplessaError> errore) {
		requireNotNull(entity.getNome(), "nome", entity, errore);
		requireNotNull(entity.getVersione(), "versione", entity, errore);
		requireNotNull(entity.getRuolo(), "ruolo", entity, errore);
		checkEstensioniGruppo(entity, ConfigurazioneClasseDato.IDENTIFICATIVO, errore);
	}

	protected void checkCampiObbligatoriGenericoApi(ApiEntity entity,  Map<String, EntitaComplessaError> errore) {
		if(this.configurazione.getServizio().getApi().isCodiceAssetObbligatorio()) {
			requireNotNull(entity.getCodiceAsset(), "asset", entity, errore);
		}
		checkEstensioniGruppo(entity, ConfigurazioneClasseDato.GENERICO, errore);
	}

	protected void checkCampiObbligatoriProduzioneApi(ApiEntity entity,  Map<String, EntitaComplessaError> errore) {
		checkCampiObbligatoriAmbienteApi(entity.getProduzione(), entity, errore, "produzione");
		checkEstensioniGruppo(entity, ConfigurazioneClasseDato.PRODUZIONE, errore);
	}

	protected void checkCampiObbligatoriCollaudoApi(ApiEntity entity,  Map<String, EntitaComplessaError> errore) {
		checkCampiObbligatoriAmbienteApi(entity.getCollaudo(), entity, errore, "collaudo");
		checkEstensioniGruppo(entity, ConfigurazioneClasseDato.COLLAUDO, errore);
	}

	protected void checkCampiObbligatoriAmbienteApi(ApiConfigEntity config, ApiEntity entity,  Map<String, EntitaComplessaError> errore, String ambiente) {

		requireNotNull(config, ambiente, entity, errore);

		if(config!= null) {
			requireNotNull(config.getProtocollo(), "protocollo", entity, errore);
			
			if(configurazione.getServizio().getApi().isSpecificaObbligatorio()) {
				requireNotNull(config.getSpecifica(), "specifica", entity, errore);
			}
			if(entity.getRuolo().equals(RUOLO.EROGATO_SOGGETTO_DOMINIO)) {
				requireNotNull(config.getUrl(), "url_" + ambiente, entity, errore);
			}
		}
	}
	
	private void checkEstensioniGruppo(ApiEntity api, ConfigurazioneClasseDato classeDato, Map<String, EntitaComplessaError> errore) {
		List<AuthTypeEnum> atLst = new ArrayList<>();
		Set<String> profili = new HashSet<>();

		for(AuthTypeEntity at: api.getAuthType()) {
	
			AuthTypeEnum atE = this.configurazione.getServizio().getApi().getProfili().stream()
			.filter(p -> p.getCodiceInterno().equals(at.getProfilo()))
			.findAny()
			.orElseThrow(() -> new BadRequestException("Profilo ["+at.getProfilo()+"] non trovato")).getAuthType();
			atLst.add(atE);
			profili.add(at.getProfilo());
		}

		List<ConfigurazioneCustomProprietaList> proprietaCustom = this.configurazione.getServizio().getApi().getProprietaCustom();
		
		List<ConfigurazioneCustomProprietaList> filtered = new ArrayList<>();
		
		for(ConfigurazioneCustomProprietaList p: proprietaCustom) {
			if(p.getAuthType() == null && p.getProfili() == null) {
				filtered.add(p);
			} else {
				boolean containsAuthType = false;
				boolean containsProfilo = false;
				if(p.getAuthType()!=null) {
					for(AuthTypeEnum atE: p.getAuthType()) {
						if(atLst.contains(atE)) {
							containsAuthType = true;
						}
					}
				}
				
				if(p.getProfili()!=null) {
					for(String pr: p.getProfili()) {
						if(profili.contains(pr)) {
							containsProfilo = true;
						}
					}
				}
				
				boolean contains = containsAuthType || containsProfilo;
				
				if(contains) {
					filtered.add(p);
				}
			}
		}
		
		filtered
			.stream()
				.filter(c -> c.getClasseDato().equals(classeDato))
					.forEach(c -> {
						c.getProprieta()
							.stream()
							.filter(p -> p.isRequired())
							.forEach(p -> {
								boolean match = api.getEstensioni()
									.stream()
									.anyMatch(e -> e.getGruppo().equals(c.getNomeGruppo()) && e.getNome().equals(p.getNome()));
								
								if(!match) {
									requireNotNull(null, c.getNomeGruppo() + "." + p.getNome(), api, errore, true);
								}
							});
					});
	}

	protected void requireNotNull(Object campo, String nomeCampo, ServizioEntity entity,  Map<String, EntitaComplessaError> errori) {
		
		EntitaComplessaError errore = getErrore(errori);
		
		if(campo == null) {
			addCampi(nomeCampo, errore);
		}
	}

	private void requireNotNull(Object campo, String nomeCampo, ApiEntity entity,  Map<String, EntitaComplessaError> errori) {
		requireNotNull(campo, nomeCampo, entity, errori, false);
	}

	private void requireNotNull(Object campo, String nomeCampo, ApiEntity entity,  Map<String, EntitaComplessaError> errori, boolean custom) {
		
		Sottotipo sottotipo = getSottotipoAPI(entity);
		Map<String, String> list = getPlaceholderAPI(entity);
		EntitaComplessaError errore = getErrore(errori, Arrays.asList(sottotipo), list);
		
		if(campo == null) {
			addCampi(nomeCampo, errore, custom);
		}
	}

	private Sottotipo getSottotipoAPI(ApiEntity entity) {
		Sottotipo sottotipo = new Sottotipo();
		sottotipo.setTipo(SottotipoEnum.API);
		sottotipo.setIdentificativo(entity.getIdApi());
		return sottotipo;
	}

	private Sottotipo getSottotipoTassonomia(TassonomiaEntity entity) {
		Sottotipo sottotipo = new Sottotipo();
		sottotipo.setTipo(SottotipoEnum.TASSONOMIA);
		sottotipo.setIdentificativo(entity.getIdTassonomia());
		return sottotipo;
	}

	private Map<String, String> getPlaceholderAPI(ApiEntity entity) {
		Map<String, String> map = new HashMap<>();
		map.put("nome", entity.getNome());
		map.put("versione", ""+entity.getVersione());
		return map;
	}

	protected void requirePositiveInteger(Integer size, String nomeCampo, ServizioEntity entity,  Map<String, EntitaComplessaError> errori) {

		EntitaComplessaError errore = getErrore(errori);
		
		if(size <= 0) {
			addCampi(nomeCampo, errore);
		}
	}

	private void requirePositiveInteger(Integer size, String nomeCampo, TassonomiaEntity entity,  Map<String, EntitaComplessaError> errori, boolean custom) {

		Sottotipo sottotipo = getSottotipoTassonomia(entity);
		Map<String, String> map = new HashMap<>();
		map.put("nome", entity.getNome());
		EntitaComplessaError errore = getErrore(errori, Arrays.asList(sottotipo), map);
		
		if(size <= 0) {
			addCampi(nomeCampo, errore, custom);
		}
	}

	private void requirePositiveInteger(Integer size, String nomeCampo, ApiEntity entity,  Map<String, EntitaComplessaError> errori) {


		Sottotipo sottotipo = getSottotipoAPI(entity);
		Map<String, String> list = getPlaceholderAPI(entity);
		EntitaComplessaError errore = getErrore(errori, Arrays.asList(sottotipo), list);

		if(size <= 0) {
			addCampi(nomeCampo, errore);
		}
	}

	@Override
	public String getStato(ServizioEntity entity) {
		return entity.getStato();
	}

	@Override
	public String getStatoPrecedente(ServizioEntity entity) {

		Comparator<? super StatoServizioEntity> c = new Comparator<StatoServizioEntity>() {
			@Override
			public int compare(StatoServizioEntity o1, StatoServizioEntity o2) {
				return o2.getData().compareTo(o1.getData());
			}
		};
		
		List<StatoServizioEntity> lst = entity.getStati().stream()
				.filter(ss -> !ss.getStato().equals(entity.getStato()))
				.sorted(c).collect(Collectors.toList());
		
		if(lst.size() > 0) {
			return lst.get(0).getStato();
		} else {
			return configurazione.getServizio().getWorkflow().getStatoIniziale();
		}
	}

	@Override
	protected List<Ruolo> getRuoli(ServizioEntity entity) {
		UtenteEntity u = this.coreAuthorization.getUtenteSessione();
		
		List<Ruolo> lst = new ArrayList<>();
		
		if(this.coreAuthorization.isAdmin(u)) {
			lst.add(Ruolo.GESTORE);
		}
		
		if(this.coreAuthorization.isCoordinatore(u)) {
			lst.add(Ruolo.REFERENTE_SUPERIORE);
		}

		boolean refDominio = entity.getDominio().getReferenti().stream()
				.anyMatch(r -> r.getReferente().getId().equals(u.getId()) && r.getTipo().equals(TIPO_REFERENTE.REFERENTE));

		if(refDominio) {
			lst.add(Ruolo.REFERENTE_SUPERIORE);
		}
		
		boolean refServizio = entity.getReferenti().stream()
				.anyMatch(r -> r.getReferente().getId().equals(u.getId()) && r.getTipo().equals(TIPO_REFERENTE.REFERENTE));

		if(refServizio) {
			lst.add(Ruolo.REFERENTE);
		}

		boolean richiedenteServizio = entity.getRichiedente().getId().equals(u.getId());
		
		if(richiedenteServizio) {
			lst.add(Ruolo.RICHIEDENTE);
		}
		
		boolean refTecnicoDominio = entity.getDominio().getReferenti().stream()
				.anyMatch(r -> r.getReferente().getId().equals(u.getId()) && r.getTipo().equals(TIPO_REFERENTE.REFERENTE_TECNICO));
		
		if(refTecnicoDominio) {
			lst.add(Ruolo.REFERENTE_TECNICO_SUPERIORE);
		}
		

		boolean refTecnicoServizio = entity.getReferenti().stream()
				.anyMatch(r -> r.getReferente().getId().equals(u.getId()) && r.getTipo().equals(TIPO_REFERENTE.REFERENTE_TECNICO));

		if(refTecnicoServizio) {
			lst.add(Ruolo.REFERENTE_TECNICO);
		}
		
		return lst;
	}

	public List<VISIBILITA> getVisibilitaAllegato(ServizioEntity entity) {
		Grant grant = this.getGrant(entity);
		if(grant.getRuoli().contains(Ruolo.GESTORE)) {
			return null;
		}

		List<VISIBILITA> lst = new ArrayList<>();
		lst.add(VISIBILITA.PUBBLICO);
		if(grant.getRuoli().size() > 0) {
			lst.add(VISIBILITA.SERVIZIO);
			lst.add(VISIBILITA.ADESIONE);
		} else {
			boolean refAdesione = false;
			UtenteEntity u = this.coreAuthorization.getUtenteSessione();
			for(AdesioneEntity ad: entity.getAdesioni()) {
				refAdesione = refAdesione || ad.getReferenti().stream()
						.anyMatch(r -> r.getReferente().getId().equals(u.getId()));
			}
			if(refAdesione) {
				lst.add(VISIBILITA.ADESIONE);
			}
		}

		return lst;
		
	}


	public List<org.govway.catalogo.core.orm.entity.AllegatoApiEntity.VISIBILITA> getVisibilitaAllegatoApi(ServizioEntity entity) {
		Grant grant = this.getGrant(entity);
		if(grant.getRuoli().contains(Ruolo.GESTORE)) {
			return null;
		}

		List<org.govway.catalogo.core.orm.entity.AllegatoApiEntity.VISIBILITA> lst = new ArrayList<>();
		lst.add(org.govway.catalogo.core.orm.entity.AllegatoApiEntity.VISIBILITA.PUBBLICO);
		if(grant.getRuoli().size() > 0) {
			lst.add(org.govway.catalogo.core.orm.entity.AllegatoApiEntity.VISIBILITA.SERVIZIO);
			lst.add(org.govway.catalogo.core.orm.entity.AllegatoApiEntity.VISIBILITA.ADESIONE);
		} else {
			boolean refAdesione = false;
			UtenteEntity u = this.coreAuthorization.getUtenteSessione();
			for(AdesioneEntity ad: entity.getAdesioni()) {
				refAdesione = refAdesione || ad.getReferenti().stream()
						.anyMatch(r -> r.getReferente().getId().equals(u.getId()));
			}
			if(refAdesione) {
				lst.add(org.govway.catalogo.core.orm.entity.AllegatoApiEntity.VISIBILITA.ADESIONE);
			}
		}

		return lst;
		
	}

	protected void authorizeAnything() {
		if(!this.configurazione.getUtente().isConsentiAccessoAnonimo()) {
			this.coreAuthorization.requireLogged();
		}
	}
}