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

import org.govway.catalogo.assembler.ApiItemAssembler;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.AmbienteEnum;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity.RUOLO;
import org.govway.catalogo.core.orm.entity.AuthTypeEntity;
import org.govway.catalogo.core.orm.entity.ClientAdesioneEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity.StatoEnum;
import org.govway.catalogo.core.orm.entity.PackageServizioEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.StatoAdesioneEntity;
import org.govway.catalogo.core.orm.entity.TIPO_REFERENTE;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.UpdateEntitaComplessaNonValidaSemanticamenteException;
import org.govway.catalogo.servlets.model.AdesioneCreate;
import org.govway.catalogo.servlets.model.AdesioneUpdate;
import org.govway.catalogo.servlets.model.AuthTypeEnum;
import org.govway.catalogo.servlets.model.Campo;
import org.govway.catalogo.servlets.model.ClientRichiesto;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneClasseDato;
import org.govway.catalogo.servlets.model.ConfigurazioneCustomAdesioneProprietaList;
import org.govway.catalogo.servlets.model.ConfigurazioneCustomProprieta;
import org.govway.catalogo.servlets.model.ConfigurazioneWorkflow;
import org.govway.catalogo.servlets.model.EntitaComplessaError;
import org.govway.catalogo.servlets.model.ErogazioneRichiesta;
import org.govway.catalogo.servlets.model.Ruolo;
import org.govway.catalogo.servlets.model.Sottotipo;
import org.govway.catalogo.servlets.model.SottotipoEnum;
import org.govway.catalogo.servlets.model.SpecificoPer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

public class AdesioneAuthorization extends DefaultWorkflowAuthorization<AdesioneCreate,AdesioneUpdate,AdesioneEntity> {

	public AdesioneAuthorization() {
		super(EntitaEnum.ADESIONE);
	}

	private Logger logger = LoggerFactory.getLogger(AdesioneAuthorization.class);

	@Autowired
	private Configurazione configurazione;
	
	@Autowired
	private ApiItemAssembler apiItemAssembler;
	
	@Override
	protected void checkCampiObbligatori(List<ConfigurazioneClasseDato> datiObbligatori, AdesioneEntity entity, String stato) {

		List<EntitaComplessaError> erroreLst = new ArrayList<>();

		if(datiObbligatori!=null) {
			for(ConfigurazioneClasseDato datoObbligatorio: datiObbligatori) {
				Map<String, EntitaComplessaError> errori = new HashMap<>();
				switch(datoObbligatorio) {
				case COLLAUDO:
					checkCampiObbligatoriCollProd(entity, errori, true, true);
					break;
				case GENERICO:
					checkCampiObbligatoriGenerico(entity, errori);
					break;
				case IDENTIFICATIVO:
					checkCampiObbligatoriIdentificativo(entity, errori);
					break;
				case PRODUZIONE:
					checkCampiObbligatoriCollProd(entity, errori, false, true);
					break;
				case REFERENTI:
					checkCampiObbligatoriReferenti(entity, errori);
					break;
				case SPECIFICA:
					checkCampiObbligatoriSpecifica(entity, errori);
					break;
				case COLLAUDO_CONFIGURATO:
					checkCampiObbligatoriCollProd(entity, errori, true, false);
					break;
				case PRODUZIONE_CONFIGURATO:
					checkCampiObbligatoriCollProd(entity, errori, false, false);
					break;
				}
				
				for(EntitaComplessaError errore: errori.values()) {
					errore.setDato(datoObbligatorio);
					if(errore.getCampi()!=null && !errore.getCampi().isEmpty()) {
						for(Campo c: errore.getCampi()) {
							this.logger.info("campo: " + c.getNomeCampo());
						}
						erroreLst.add(errore);
					}
				}
			}
		}
		
		if(erroreLst!=null && !erroreLst.isEmpty()) {
			throw new UpdateEntitaComplessaNonValidaSemanticamenteException("Forbidden", erroreLst);
		}
		
	}

	private void checkEstensioniGruppo(AdesioneEntity adesione, ConfigurazioneClasseDato classeDato, Map<String, EntitaComplessaError> errore) {
		checkEstensioniGruppi(adesione, Arrays.asList(classeDato), errore);
	}

	private void checkEstensioniGruppi(AdesioneEntity adesione, List<ConfigurazioneClasseDato> classeDatoLst, Map<String, EntitaComplessaError> errore) {

		final AmbienteEnum ambiente = getAmbiente(classeDatoLst);

		List<ClientRichiesto> cr = this.getClientRichiesti(adesione.getServizio());

		this.logger.info("Controllo classi " + classeDatoLst);

		List<ConfigurazioneCustomAdesioneProprietaList> proprietaCustom = this.configurazione.getAdesione().getProprietaCustom();
		
		List<ConfigurazioneCustomAdesioneProprietaList> filtered = new ArrayList<>();
		
		if(proprietaCustom != null) {
			for(ConfigurazioneCustomAdesioneProprietaList p: proprietaCustom) {
				 if(classeDatoLst.contains(p.getClasseDato()) && applies(p, cr)) {
					filtered.add(p);
				}
			}
		}

		for(ConfigurazioneCustomAdesioneProprietaList f: filtered) {
			this.logger.info("Filtered: " + f.getLabelGruppo());
			
			for(ConfigurazioneCustomProprieta p: f.getProprieta()) {
				this.logger.info("Proprieta: " + p.getEtichetta() + " required: " + p.isRequired());
			}
			
		}
		

		filtered.stream().forEach(c -> {
			c.getProprieta().stream().filter(p -> p.isRequired()).forEach(p -> {

				Sottotipo sottotipoGruppo = new Sottotipo();
				sottotipoGruppo.setTipo(SottotipoEnum.CONFIGURAZIONE_GRUPPO);
				sottotipoGruppo.setIdentificativo(c.getNomeGruppo());

				Sottotipo sottotipoNome = new Sottotipo();
				sottotipoNome.setTipo(SottotipoEnum.CONFIGURAZIONE_NOME);
				sottotipoNome.setIdentificativo(p.getNome());

				if (c.getSpecificoPer() == null || c.getSpecificoPer().equals(SpecificoPer.ADESIONE)) {
					boolean match = adesione.getEstensioni().stream()
							.anyMatch(e -> e.getGruppo().equals(c.getNomeGruppo()) && e.getNome().equals(p.getNome())  && e.getAmbiente().equals(ambiente) && e.getApi() == null);

					if (!match) {
						Map<String, String> list = getPlaceholderConfigurazione(c, p);
						EntitaComplessaError error = getErrore(errore, Arrays.asList(sottotipoGruppo, sottotipoNome), list);
						addCampi("configurazione_non_trovata", error, true);
					}
				} else {
					List<ApiEntity> listApiSpecifico = adesione.getServizio().getApi().stream().filter(a -> {
						if(c.getSpecificoPer().equals(SpecificoPer.API)) {
							return true;
						} else if(c.getSpecificoPer().equals(SpecificoPer.API_SOGGETTO_ADERENTE)) {
							return a.getRuolo().equals(RUOLO.EROGATO_SOGGETTO_ADERENTE);
						} else {
							return a.getRuolo().equals(RUOLO.EROGATO_SOGGETTO_DOMINIO);
						}
					}).collect(Collectors.toList());
					
					for(ApiEntity api: listApiSpecifico) {
						boolean match = adesione.getEstensioni().stream()
								.anyMatch(e -> e.getGruppo().equals(c.getNomeGruppo()) && e.getNome().equals(p.getNome()) && e.getAmbiente().equals(ambiente) && e.getApi()!=null && e.getApi().getId().equals(api.getId()));
						
						if (!match) {
							Sottotipo sottotipoAPI = new Sottotipo();
							sottotipoAPI.setTipo(SottotipoEnum.API);
							sottotipoAPI.setIdentificativo(api.getIdApi());

							Map<String, String> list = getPlaceholderConfigurazioneAPI(c, p, api);
							EntitaComplessaError error = getErrore(errore, Arrays.asList(sottotipoGruppo, sottotipoAPI, sottotipoNome), list);
							addCampi("configurazione_non_trovata", error, true);
						}

					}
				}
			});
		});
	}

	private AmbienteEnum getAmbiente(List<ConfigurazioneClasseDato> classeDatoLst) {
		if(classeDatoLst.contains(ConfigurazioneClasseDato.COLLAUDO)) {
			return AmbienteEnum.COLLAUDO;
		} else if(classeDatoLst.contains(ConfigurazioneClasseDato.PRODUZIONE)) {
			return AmbienteEnum.PRODUZIONE;
		} else {
			return null;
		}
	}

	public boolean applies(ConfigurazioneCustomAdesioneProprietaList p, List<ClientRichiesto> cr) {
		if(p.getAuthType() == null && p.getProfili() == null) {
			return true;
		} else {
			boolean containsAuthType = false;
			boolean containsProfilo = false;
			if(p.getAuthType()!=null) {
				for(AuthTypeEnum atE: p.getAuthType()) {
					if(cr.stream().anyMatch(c -> c.getAuthType().equals(atE))) {
						containsAuthType = true;
					}
				}
			}
			if(p.getProfili()!=null) {
				for(String profilo: p.getProfili()) {
					if(cr.stream().anyMatch(c -> c.getProfilo().equals(profilo))) {
						containsProfilo = true;
					}
				}
			}
			return containsAuthType || containsProfilo;
		}
	
	}

	private void requireNotNull(Object campo, String nomeCampo, AdesioneEntity entity,  Map<String, EntitaComplessaError> errori, boolean custom) {
		
		Map<String, String> list = getPlaceholderAdesione(entity);
		EntitaComplessaError errore = getErrore(errori, null, list);
		
		if(campo == null) {
			this.logger.info("Aggiungo campo " + nomeCampo + " a errore " + errore.getSottotipo());
			addCampi(nomeCampo, errore, custom);
		}
	}

	private Map<String, String> getPlaceholderAdesione(AdesioneEntity entity) {
		Map<String, String> map = new HashMap<>();
		map.put("soggetto", entity.getSoggetto().getNome());
		map.put("nome_servizio", entity.getServizio().getNome());
		map.put("versione_servizio", entity.getServizio().getVersione());
		map.put("id_logico", entity.getIdLogico());
		return map;
	}


	private void checkCampiObbligatoriSpecifica(AdesioneEntity entity, Map<String, EntitaComplessaError> errore) {
		checkEstensioniGruppo(entity, ConfigurazioneClasseDato.SPECIFICA, errore);
	}

	private void checkCampiObbligatoriReferenti(AdesioneEntity entity, Map<String, EntitaComplessaError> errore) {
		
		if(configurazione.getAdesione().isReferenteObbligatorio()) {
			int size = (int) entity.getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE)).count();
			requirePositiveInteger(size, "referenti", entity, errore);
		}
		checkEstensioniGruppo(entity, ConfigurazioneClasseDato.REFERENTI, errore);
	}

	private void checkCampiObbligatoriCollProd(AdesioneEntity entity, Map<String, EntitaComplessaError> errori, boolean collaudo, boolean consentiNonConfigurato) {
		
		
		List<ClientRichiesto> crLst = getClientRichiesti(entity.getServizio());
		
		AmbienteEnum ambiente = collaudo ? AmbienteEnum.COLLAUDO: AmbienteEnum.PRODUZIONE;
		
		List<org.govway.catalogo.core.orm.entity.ErogazioneEntity.StatoEnum> statiErogazioneConsentiti = consentiNonConfigurato ? Arrays.asList(org.govway.catalogo.core.orm.entity.ErogazioneEntity.StatoEnum.CONFIGURATO, org.govway.catalogo.core.orm.entity.ErogazioneEntity.StatoEnum.NUOVO) : Arrays.asList(org.govway.catalogo.core.orm.entity.ErogazioneEntity.StatoEnum.CONFIGURATO);
		
		for(ClientRichiesto cr: crLst) {

			if(!cr.getAuthType().equals(AuthTypeEnum.NO_DATI)) {
				Optional<ClientAdesioneEntity> oP = entity.getClient().stream().filter(c -> c.getProfilo().equals(cr.getProfilo()) && c.getAmbiente().equals(ambiente)).findAny();

				Sottotipo sottotipo = new Sottotipo();
				sottotipo.setTipo(SottotipoEnum.CLIENT);
				sottotipo.setIdentificativo(cr.getProfilo());
				if(!oP.isPresent()) {
					Map<String, String> list = getPlaceholderClientNonPresente(cr);
					EntitaComplessaError errore = getErrore(errori, Arrays.asList(sottotipo), list);
					addCampi("profilo_non_configurato", errore);
				} else {
					if(!consentiNonConfigurato) {
						if(oP.get().getClient() == null) {
							Map<String, String> list = getPlaceholderClientNonPresente(cr);
							EntitaComplessaError errore = getErrore(errori, Arrays.asList(sottotipo), list);
							addCampi("profilo_non_configurato", errore);
						}else if(!oP.get().getClient().getStato().equals(StatoEnum.CONFIGURATO)) {
							Map<String, String> list = getPlaceholderClient(oP.get().getClient(), cr);
							EntitaComplessaError errore = getErrore(errori, Arrays.asList(sottotipo), list);
							addCampi("client_non_configurato", errore);
						}
					}
				}
			}
		}
		
		List<ErogazioneRichiesta> erLst = getErogazioniRichieste(entity.getServizio());
		
		for(ErogazioneRichiesta er: erLst) {
			

			Sottotipo sottotipo = new Sottotipo();
			sottotipo.setTipo(SottotipoEnum.EROGAZIONE);
			sottotipo.setIdentificativo(er.getApi().getIdApi().toString());
			Map<String, String> list = getPlaceholderErogazione(er);
			EntitaComplessaError errore = getErrore(errori, Arrays.asList(sottotipo), list);
			
			if(!entity.getErogazioni().stream().anyMatch(e -> e.getApi().getIdApi().equals(er.getApi().getIdApi().toString()) && e.getAmbiente().equals(ambiente) && statiErogazioneConsentiti.contains(e.getStato()))) {
				addCampi("erogazione_non_configurata", errore);
			}
		}
		
		List<ConfigurazioneClasseDato> classeDatoLst = new ArrayList<>();
		
		if(collaudo) {
			classeDatoLst.add(ConfigurazioneClasseDato.COLLAUDO);
			if(!consentiNonConfigurato) {
				classeDatoLst.add(ConfigurazioneClasseDato.COLLAUDO_CONFIGURATO);
			}
		} else {
			classeDatoLst.add(ConfigurazioneClasseDato.PRODUZIONE);
			if(!consentiNonConfigurato) {
				classeDatoLst.add(ConfigurazioneClasseDato.PRODUZIONE_CONFIGURATO);
			}
		}
		checkEstensioniGruppi(entity, classeDatoLst, errori);
	}

	private Map<String, String> getPlaceholderClientNonPresente(ClientRichiesto entity) {
		Map<String, String> map = new HashMap<>();
		map.put("profilo", entity.getProfilo());
		return map;
	}

	private Map<String, String> getPlaceholderClient(ClientEntity entity, ClientRichiesto clientRichiesto) {
		Map<String, String> map = new HashMap<>();
		map.put("profilo", clientRichiesto.getProfilo());
		map.put("nome", entity.getNome());
		map.put("soggetto", entity.getSoggetto().getNome());
		return map;
	}

	private Map<String, String> getPlaceholderErogazione(ErogazioneRichiesta entity) {
		Map<String, String> map = new HashMap<>();
		map.put("nome", entity.getApi().getNome());
		map.put("versione", ""+entity.getApi().getVersione());
		return map;
	}

	private Map<String, String> getPlaceholderConfigurazione(ConfigurazioneCustomAdesioneProprietaList c, ConfigurazioneCustomProprieta entity) {
		Map<String, String> map = new HashMap<>();
		map.put("nome", entity.getEtichetta());
		map.put("nome_gruppo", c.getLabelGruppo());
		return map;
	}

	private Map<String, String> getPlaceholderConfigurazioneAPI(ConfigurazioneCustomAdesioneProprietaList c, ConfigurazioneCustomProprieta entity, ApiEntity api) {
		Map<String, String> map = new HashMap<>();
		map.put("nome", entity.getEtichetta());
		map.put("nome_gruppo", c.getLabelGruppo());
		map.put("nome_api", api.getNome());
		map.put("versione_api", ""+api.getVersione());
		return map;
	}


	private void checkCampiObbligatoriIdentificativo(AdesioneEntity entity, Map<String, EntitaComplessaError> errore) {
		requireNotNull(entity.getServizio(), "servizio", entity, errore);
		requireNotNull(entity.getSoggetto(), "soggetto", entity, errore);
		checkEstensioniGruppo(entity, ConfigurazioneClasseDato.IDENTIFICATIVO, errore);
	}

	private void checkCampiObbligatoriGenerico(AdesioneEntity entity, Map<String, EntitaComplessaError> errore) {
		if(configurazione.getServizio().isAdesioniMultiple()) {
			requireNotNull(entity.getIdLogico(), "identificativo", entity, errore);
		}
		checkEstensioniGruppo(entity, ConfigurazioneClasseDato.GENERICO, errore);
	}

	private void requireNotNull(Object campo, String nomeCampo, AdesioneEntity entity, Map<String, EntitaComplessaError> errori) {
		EntitaComplessaError errore = getErrore(errori);
		
		if(campo == null) {
			addCampi(nomeCampo, errore);
		}
	}

	private void requirePositiveInteger(Integer size, String nomeCampo, AdesioneEntity entity, Map<String, EntitaComplessaError> errori) {
		
		EntitaComplessaError errore = getErrore(errori);
		
		if(size <= 0) {
			addCampi(nomeCampo, errore);
		}
	}

	@Override
	public String getStato(AdesioneEntity entity) {
		return entity.getStato();
	}

	@Override
	public String getStatoPrecedente(AdesioneEntity entity) {

		Comparator<? super StatoAdesioneEntity> c = new Comparator<StatoAdesioneEntity>() {
			@Override
			public int compare(StatoAdesioneEntity o1, StatoAdesioneEntity o2) {
				return o2.getData().compareTo(o1.getData());
			}
		};
		
		List<StatoAdesioneEntity> lst = entity.getStati().stream()
				.filter(ss -> !ss.getStato().equals(entity.getStato()))
				.sorted(c).collect(Collectors.toList());
		
		if(lst.size() > 0) {
			return lst.get(0).getStato();
		} else {
			return configurazione.getAdesione().getWorkflow().getStatoIniziale();
		}
	}
	
	@Override
	protected List<Ruolo> getRuoli(AdesioneEntity entity) {
		
		UtenteEntity u = this.coreAuthorization.getUtenteSessione();
		
		List<Ruolo> lst = new ArrayList<>();
		
		if(this.coreAuthorization.isAdmin(u)) {
			lst.add(Ruolo.GESTORE);
		}
		
		if(this.coreAuthorization.isCoordinatore(u)) {
			lst.add(Ruolo.REFERENTE_SUPERIORE);
		}

		boolean refServizio = entity.getServizio().getReferenti().stream()
				.anyMatch(r -> r.getReferente().getId().equals(u.getId()) && r.getTipo().equals(TIPO_REFERENTE.REFERENTE));

		boolean refDominio = entity.getServizio().getDominio().getReferenti().stream()
				.anyMatch(r -> r.getReferente().getId().equals(u.getId()) && r.getTipo().equals(TIPO_REFERENTE.REFERENTE));

		if(refServizio || refDominio) {
			lst.add(Ruolo.REFERENTE_SUPERIORE);
		}
		
		boolean refAdesione = entity.getReferenti().stream()
				.anyMatch(r -> r.getReferente().getId().equals(u.getId()) && r.getTipo().equals(TIPO_REFERENTE.REFERENTE));

		if(refAdesione) {
			lst.add(Ruolo.REFERENTE);
		}

		boolean richiedenteAdesione = entity.getRichiedente().getId().equals(u.getId());
		
		if(richiedenteAdesione) {
			lst.add(Ruolo.RICHIEDENTE);
		}
		
		boolean refTecnicoServizio = entity.getServizio().getReferenti().stream()
				.anyMatch(r -> r.getReferente().getId().equals(u.getId()) && r.getTipo().equals(TIPO_REFERENTE.REFERENTE_TECNICO));
		
		boolean refTecnicoDominio = entity.getServizio().getDominio().getReferenti().stream()
				.anyMatch(r -> r.getReferente().getId().equals(u.getId()) && r.getTipo().equals(TIPO_REFERENTE.REFERENTE_TECNICO));
		
		if(refTecnicoServizio || refTecnicoDominio) {
			lst.add(Ruolo.REFERENTE_TECNICO_SUPERIORE);
		}
		

		boolean refTecnicoAdesione = entity.getReferenti().stream()
				.anyMatch(r -> r.getReferente().getId().equals(u.getId()) && r.getTipo().equals(TIPO_REFERENTE.REFERENTE_TECNICO));

		if(refTecnicoAdesione) {
			lst.add(Ruolo.REFERENTE_TECNICO);
		}
		
		return lst;
	}
	
	public List<ErogazioneRichiesta> getErogazioniRichieste(ServizioEntity servizio) {
		List<ErogazioneRichiesta> erogazioni = new ArrayList<>();
		
		for(ApiEntity api: this.getApi(servizio, RUOLO.EROGATO_SOGGETTO_ADERENTE)) {
			ErogazioneRichiesta c = new ErogazioneRichiesta();
			c.setApi(apiItemAssembler.toModel(api));
			erogazioni.add(c);
		}
		
		return erogazioni;
	}

	private List<ApiEntity> getApi(ServizioEntity servizio, RUOLO ruolo) {
		List<ApiEntity> apis = new ArrayList<>();
		
		if(!servizio.is_package()) {
			for(ApiEntity api: servizio.getApi()) {
				if(api.getRuolo().equals(ruolo)) {
					apis.add(api);
				}
			}
		} else {
			for(PackageServizioEntity pse: servizio.getComponenti()) {
				apis.addAll(getApi(pse.getServizio(), ruolo));
			}
		}
		
		return apis;
	}

	public List<ClientRichiesto> getClientRichiesti(ServizioEntity servizio) {
		List<ClientRichiesto> client = new ArrayList<>();

		Set<String> profili = new HashSet<>();
		
		for(ApiEntity api: this.getApi(servizio, RUOLO.EROGATO_SOGGETTO_DOMINIO)) {
		      for(AuthTypeEntity at: api.getAuthType()) {
	              profili.add(at.getProfilo());
		      }
		}
		

		
		for(String prof: profili) {
			ClientRichiesto c = new ClientRichiesto();
			c.setProfilo(prof);
			
			AuthTypeEnum atE = this.configurazione.getServizio().getApi().getProfili().stream()
			.filter(p -> p.getCodiceInterno().equals(prof))
			.findAny()
			.orElseThrow(() -> new BadRequestException("Profilo ["+prof+"] non trovato")).getAuthType();
			c.setAuthType(atE);
			client.add(c);
		}

		return client;
	}

	@Override
	protected ConfigurazioneWorkflow getWorkflow(AdesioneEntity entity) {
		return this.configurazione.getAdesione().getWorkflow();
	}
	
}	