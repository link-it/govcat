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
package org.govway.catalogo.authorization;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.servlets.model.Campo;
import org.govway.catalogo.servlets.model.ConfigurazioneCambioStato;
import org.govway.catalogo.servlets.model.ConfigurazioneClasseDato;
import org.govway.catalogo.servlets.model.ConfigurazioneRuolo;
import org.govway.catalogo.servlets.model.ConfigurazioneStato;
import org.govway.catalogo.servlets.model.ConfigurazioneWorkflow;
import org.govway.catalogo.servlets.model.EntitaComplessaError;
import org.govway.catalogo.servlets.model.Grant;
import org.govway.catalogo.servlets.model.GrantType;
import org.govway.catalogo.servlets.model.Ruolo;
import org.govway.catalogo.servlets.model.Sottotipo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public abstract class DefaultWorkflowAuthorization<CREATE,UPDATE,ENTITY> extends DefaultAuthorization<CREATE, UPDATE, ENTITY> implements IWorkflowAuthorization<CREATE,UPDATE,ENTITY> {

	private Logger logger = LoggerFactory.getLogger(DefaultWorkflowAuthorization.class);
	
	@Override
	public void authorizeCambioStato(ENTITY entity, String statoFinale) {
		
		ConfigurazioneWorkflow workflow = getWorkflow(entity);
		String statoIniziale = getStato(entity);
		if(!workflow.getStati().contains(statoFinale)) {
			throw new NotAuthorizedException("Stato ["+statoFinale+"] non previsto dal workflow");
		}
		if(!workflow.getStati().contains(statoIniziale)) {
			throw new NotAuthorizedException("Stato ["+statoIniziale+"] non previsto dal workflow");
		}
		

		if(workflow.getStatoArchiviato()!=null && workflow.getStatoArchiviato().equals(statoFinale)) {
			// lo stato archiviato è per definizione raggiungibile da tutti gli stati del workflow
			return;
		} else if(workflow.getStatoArchiviato()!=null && workflow.getStatoArchiviato().equals(statoIniziale)) {
			// dallo stato archiviato si può tornare solo allo stato precedente
			String statoPrecedente = getStatoPrecedente(entity);
			if(!statoFinale.equals(statoPrecedente)) {
				throw new NotAuthorizedException("Stato ["+statoFinale+"] non raggiungibile dallo stato ["+statoIniziale+"] in quanto lo stato precedente e' ["+statoPrecedente+"]");
			}
		} else {

			List<ConfigurazioneCambioStato> lstStatoPartenza = workflow.getCambiStato().stream()
					.filter(cs -> cs.getStatoAttuale().equals(statoIniziale)).collect(Collectors.toList());

			if(lstStatoPartenza.isEmpty()) {
				throw new NotAuthorizedException("Stato ["+statoIniziale+"] non previsto dal workflow");
			}

			List<ConfigurazioneStato> lstStatiArrivo = new ArrayList<>();
			for(ConfigurazioneCambioStato confCambioStato: lstStatoPartenza) {
				addStato(confCambioStato.getStatoSuccessivo(), statoFinale, lstStatiArrivo);
				addStato(confCambioStato.getStatoPrecedente(), statoFinale,  lstStatiArrivo);
				
				for(ConfigurazioneStato ulteriore: confCambioStato.getStatiUlteriori()) {
					addStato(ulteriore, statoFinale, lstStatiArrivo);
				}
			}
			
			if(lstStatiArrivo.isEmpty()) {
				throw new NotAuthorizedException("Stato ["+statoFinale+"] non raggiungibile da ["+statoIniziale+"]");
			}


		}
		
	}
	
	public void authorizeUtenteCambioStato(ENTITY entity, String statoIniziale, String statoFinale) {

		this.checkPermessiUtente(entity, statoIniziale, statoFinale, true);
		this.checkCampiObbligatori(entity);
	}
	
	@Override
	public void authorizeModifica(ENTITY entity, List<ConfigurazioneClasseDato> classiDato) {
		
		this.logger.debug("authorizeModifica: " + entity.getClass() + " classiDato: " + classiDato + " ...");
		this.logger.debug("Check Campi Obbligatori");
		this.checkCampiObbligatori(entity);
		this.logger.debug("Check Campi Non Modificabili");
		this.checkCampiNonModificabili(entity, classiDato);
		this.logger.debug("authorizeModifica: " + entity.getClass() + " classiDato: " + classiDato + " OK");
		
	}

	private void addStato(ConfigurazioneStato stato, String statoFinale, List<ConfigurazioneStato> lstStati) {
		if(stato != null && stato.getNome().equals(statoFinale)) {
			lstStati.add(stato);
		}
	}
	
	private void checkCampiObbligatori(ENTITY entity) {
		checkCampiObbligatori(entity, this.getStato(entity));
	}
	
	public void checkCampiObbligatori(ENTITY entity, String stato) {
		
		ConfigurazioneWorkflow workflow = getWorkflow(entity);
		
		if(stato.equals(workflow.getStatoArchiviato())) {
			return;
		}
		
		ConfigurazioneCambioStato configurazioneStato = getStato(entity, stato);
		checkCampiObbligatori(configurazioneStato.getDatiObbligatori(), entity, stato);
		
	}
	
	private void checkPermessiUtente(ENTITY entity, String statoIniziale, String statoFinale, boolean cambioStato) {
		
		Grant grant = this.getGrant(entity);
		ConfigurazioneWorkflow workflow = getWorkflow(entity);
		if(this.coreAuthorization.isAdmin()) {
			this.logger.debug("Utente admin");
			return;
		}
		
		this.logger.debug("Grant: " + grant);
		this.logger.debug("Stato iniziale: " + statoIniziale);
		this.logger.debug("Stato finale: " + statoFinale);
		
		String errore = cambioStato ? "transitare nello stato": "operare nello stato";
		String erroreGrant = grant.getRuoli().isEmpty() ? "": " con grant "+grant.getRuoli();
		
		String stato = cambioStato ? statoFinale: statoIniziale;
		
		List<ConfigurazioneCambioStato> cambiStato = workflow.getCambiStato().stream()
		.filter(c -> c.getStatoAttuale().equals(statoIniziale)).collect(Collectors.toList());
		
		for(ConfigurazioneCambioStato c: cambiStato) {
			if(c.getStatoSuccessivo() != null && c.getStatoSuccessivo().getNome().equals(stato) && compatibile(c.getStatoSuccessivo().getRuoliAbilitati(), grant, cambioStato)) {
				return;
			}
			if(c.getStatoPrecedente() != null && c.getStatoPrecedente().getNome().equals(stato)  && compatibile(c.getStatoPrecedente().getRuoliAbilitati(), grant, cambioStato)) {
				return;
			}
		}
		
		throw new NotAuthorizedException("Utente"+erroreGrant+" non autorizzato a "+errore+" ["+stato+"]");

		
	}
	
	private boolean compatibile(List<ConfigurazioneRuolo> ruoliAbilitati, Grant grant, boolean cambioStato) {

		List<Boolean> lstPermessi = new ArrayList<>();
		
		if(grant.getRuoli().contains(Ruolo.REFERENTE_SUPERIORE)) {
			lstPermessi.add(ruoliAbilitati.contains(ConfigurazioneRuolo.REFERENTE_SUPERIORE));
		}

		if(grant.getRuoli().contains(Ruolo.REFERENTE)) {
			lstPermessi.add(ruoliAbilitati.contains(ConfigurazioneRuolo.REFERENTE));			
		}
		
		if(!cambioStato) {
			if(grant.getRuoli().contains(Ruolo.REFERENTE_TECNICO_SUPERIORE)) {
				lstPermessi.add(ruoliAbilitati.contains(ConfigurazioneRuolo.REFERENTE_SUPERIORE));
			}

			if(grant.getRuoli().contains(Ruolo.REFERENTE_TECNICO)) {
				lstPermessi.add(ruoliAbilitati.contains(ConfigurazioneRuolo.REFERENTE));
			}
			
		}

		if(grant.getRuoli().contains(Ruolo.RICHIEDENTE)) {
			lstPermessi.add(ruoliAbilitati.contains(ConfigurazioneRuolo.RICHIEDENTE));			
		}
		
		if(lstPermessi.size() > 0) {
			boolean compatibile = false;
			for(Boolean permesso: lstPermessi) {
				compatibile = compatibile || permesso;
			}
			return compatibile;
		}
		return false;
		
	}

	private void checkCampiNonModificabili(ENTITY entity, List<ConfigurazioneClasseDato> classiDato) {
		
		if(this.coreAuthorization.isAdmin()) {
			return;
		}

		String stato = getStato(entity);
		ConfigurazioneWorkflow workflow = getWorkflow(entity);
		if(stato.equals(workflow.getStatoArchiviato())) {
			return;
		}
		
		checkCampiNonModificabili(entity, classiDato, stato);
		
	}

	private ConfigurazioneCambioStato getStato(ENTITY entity, String stato) {
		
		ConfigurazioneWorkflow workflow = getWorkflow(entity);		
		String statoPartenza;
		if(workflow.getStatoArchiviato()!=null && workflow.getStatoArchiviato().equals(stato)) {
			statoPartenza = getStatoPrecedente(entity);
		} else {
			statoPartenza = stato;
		}
		List<ConfigurazioneCambioStato> lstStatoPartenza = workflow.getCambiStato().stream()
				.filter(cs -> cs.getStatoAttuale().equals(statoPartenza)).collect(Collectors.toList());

		if(lstStatoPartenza.size() != 1) {
			throw new InternalException("Configurazione errata. ["+lstStatoPartenza.size()+"] elementi per lo stato ["+statoPartenza+"]");
		}
		
		ConfigurazioneCambioStato statoSuccessivo = lstStatoPartenza.get(0);
		return statoSuccessivo;
	}

	protected void checkCampiNonModificabili(ENTITY entity, List<ConfigurazioneClasseDato> datiModificati, String stato) {
		List<String> lst = new ArrayList<>();
		
		Grant grant = getGrant(entity);
		
		this.logger.info("Stato: " + stato);
		this.logger.info("Grant: " + grant);
		this.logger.info("Dati modificati: " + datiModificati);
		
		for(ConfigurazioneClasseDato datoModificato: datiModificati) {
			if(!canModify(grant, datoModificato)) {
				lst.add(datoModificato.toString());
			}
		}

		if(!lst.isEmpty()) {
			throw new NotAuthorizedException("Tipo di dato "+lst+" non modificabile nello stato ["+stato+"]");
		}
	}

	private boolean canModify(Grant grant, ConfigurazioneClasseDato datoModificato) {
		GrantType gt = null;
		switch(datoModificato) {
		case COLLAUDO:
		case COLLAUDO_CONFIGURATO: gt = grant.getCollaudo();
			break;
		case GENERICO: gt = grant.getGenerico();
		break;
		case IDENTIFICATIVO: gt = grant.getIdentificativo();
		break;
		case PRODUZIONE:
		case PRODUZIONE_CONFIGURATO:  gt = grant.getProduzione();
		break;
		case REFERENTI:  gt = grant.getReferenti();
		break;
		case SPECIFICA:  gt = grant.getSpecifica();
		break;
		}

		if(gt==null) {
			return false;
		} else {
			return gt.equals(GrantType.SCRITTURA);
		}
	}

	protected GrantType getGrantType(ConfigurazioneClasseDato classe, List<Ruolo> lst, ENTITY entity) {

		if(lst.size()  == 0) {
			return GrantType.NESSUNO;
		}
		
		if(lst.contains(Ruolo.GESTORE)) {
			return GrantType.SCRITTURA;
		}
		
		ConfigurazioneCambioStato stato = this.getStato(entity, this.getStatoEquivalente(classe, entity));
		
		boolean isRuoloAbilitato = false;
		
		List<ConfigurazioneRuolo> lstConfRuoli = lst.stream()
					.map(r -> {
						switch(r) {
						case GESTORE: return ConfigurazioneRuolo.GESTORE;
						case REFERENTE_TECNICO:
						case REFERENTE:return ConfigurazioneRuolo.REFERENTE;
						case REFERENTE_TECNICO_SUPERIORE:
						case REFERENTE_SUPERIORE:return ConfigurazioneRuolo.REFERENTE_SUPERIORE;
						case RICHIEDENTE:return ConfigurazioneRuolo.RICHIEDENTE;
						}
						return null;
					}).collect(Collectors.toList());
		
		if(stato.getStatoSuccessivo() != null) {
			for(ConfigurazioneRuolo r: stato.getStatoSuccessivo().getRuoliAbilitati()) {
				if(lstConfRuoli.contains(r)) {
					isRuoloAbilitato = true;
				}
			}
		}
		
		if(stato.getDatiNonModificabili() != null && stato.getDatiNonModificabili().contains(classe) ||
				!isRuoloAbilitato) {
			return GrantType.LETTURA;
		} else {
			return GrantType.SCRITTURA;
		}
		
	}

	protected abstract ConfigurazioneWorkflow getWorkflow(ENTITY entity);

	private String getStatoEquivalente(ConfigurazioneClasseDato classe, ENTITY entity) {
		
		String statoCorrente = getStato(entity);
		
		if(classe.equals(ConfigurazioneClasseDato.PRODUZIONE) && (statoCorrente.contains("collaudo"))) {
			return "bozza";
		} else {
			return statoCorrente;
		}
	}

	public Grant getGrant(ENTITY entity) {

		Grant grant = new Grant();

		List<Ruolo> lst = this.getRuoli(entity);
		grant.setRuoli(lst);

		grant.setIdentificativo(this.getGrantType(ConfigurazioneClasseDato.IDENTIFICATIVO, lst, entity));
		grant.setReferenti(this.getGrantType(ConfigurazioneClasseDato.REFERENTI, lst, entity));
		grant.setSpecifica(this.getGrantType(ConfigurazioneClasseDato.SPECIFICA, lst, entity));
		grant.setGenerico(this.getGrantType(ConfigurazioneClasseDato.GENERICO, lst, entity));
		grant.setCollaudo(this.getGrantType(ConfigurazioneClasseDato.COLLAUDO, lst, entity));
		grant.setProduzione(this.getGrantType(ConfigurazioneClasseDato.PRODUZIONE, lst, entity));

		return grant;
	}
	
	protected void addCampi(String nomeCampo, EntitaComplessaError errore) {
		addCampi(nomeCampo, errore, false);
	}

	protected void addCampi(String nomeCampo, EntitaComplessaError errore, boolean custom) {
		Campo campo = new Campo();
		campo.setNomeCampo(nomeCampo);
		campo.setCustom(custom);
		errore.addCampiItem(campo);
	}

	protected EntitaComplessaError getErrore(Map<String, EntitaComplessaError> errori) {
		return getErrore(errori, null, new HashMap<>());
	}

	protected EntitaComplessaError getErrore(Map<String, EntitaComplessaError> errori, List<Sottotipo> sottotipo, Map<String, String> params) {
		String kParams = params.entrySet().stream().map(e -> e.getKey() + " " + e.getValue()).collect(Collectors.joining(" - "));
		String k = sottotipo != null ? sottotipo.stream().map(s -> s.getTipo() + " " + s.getIdentificativo()).collect(Collectors.joining(".")) + kParams: kParams;
		return errori.entrySet().stream()
				.filter(e -> e.getKey().equals(k))
				.map(e -> e.getValue())
				.findAny().orElseGet(() -> {
					EntitaComplessaError e = new EntitaComplessaError();
					e.setSottotipo(sottotipo);
					e.setParams(params);
					errori.put(kParams, e);
					return e;
				});
	}

	protected abstract List<Ruolo> getRuoli(ENTITY entity);

	protected abstract void checkCampiObbligatori(List<ConfigurazioneClasseDato> datiObbligatori, ENTITY entity, String stato);
	
	public abstract String getStato(ENTITY entity);
	public abstract String getStatoPrecedente(ENTITY entity);
	
}
