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
package org.govway.catalogo.core.business.utils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class ConfigurazioneEService {

	private String defaultUrlPrefixCollaudo;
	private String defaultUrlPrefixProduzione;
	private String pdfLogo;
	private String templateUrlInvocazione;
	private Map<String,String> profili;
	private Set<String> statiSchedaAdesione;

	/** URL di invocazione censite per l'ambiente di collaudo, oltre a quella predefinita. */
	private List<UrlInvocazioneConfigurata> urlInvocazioneCollaudo = new ArrayList<>();
	/** URL di invocazione censite per l'ambiente di produzione, oltre a quella predefinita. */
	private List<UrlInvocazioneConfigurata> urlInvocazioneProduzione = new ArrayList<>();
	/** Etichetta della URL di invocazione predefinita, se configurata. */
	private String etichettaUrlInvocazioneDefault;
	
	public String getDefaultUrlPrefixCollaudo() {
		return defaultUrlPrefixCollaudo;
	}
	public void setDefaultUrlPrefixCollaudo(String defaultUrlPrefixCollaudo) {
		this.defaultUrlPrefixCollaudo = defaultUrlPrefixCollaudo;
	}
	public String getDefaultUrlPrefixProduzione() {
		return defaultUrlPrefixProduzione;
	}
	public void setDefaultUrlPrefixProduzione(String defaultUrlPrefixProduzione) {
		this.defaultUrlPrefixProduzione = defaultUrlPrefixProduzione;
	}
	public String getPdfLogo() {
		return pdfLogo;
	}
	public void setPdfLogo(String pdfLogo) {
		this.pdfLogo = pdfLogo;
	}
	public String getTemplateUrlInvocazione() {
		return templateUrlInvocazione;
	}
	public void setTemplateUrlInvocazione(String templateUrlInvocazione) {
		this.templateUrlInvocazione = templateUrlInvocazione;
	}
	public Map<String,String> getProfili() {
		return profili;
	}
	public void setProfili(Map<String,String> profili) {
		this.profili = profili;
	}
	public List<UrlInvocazioneConfigurata> getUrlInvocazioneCollaudo() {
		return urlInvocazioneCollaudo;
	}
	public void setUrlInvocazioneCollaudo(List<UrlInvocazioneConfigurata> urlInvocazioneCollaudo) {
		this.urlInvocazioneCollaudo = urlInvocazioneCollaudo != null ? urlInvocazioneCollaudo : new ArrayList<>();
	}
	public List<UrlInvocazioneConfigurata> getUrlInvocazioneProduzione() {
		return urlInvocazioneProduzione;
	}
	public void setUrlInvocazioneProduzione(List<UrlInvocazioneConfigurata> urlInvocazioneProduzione) {
		this.urlInvocazioneProduzione = urlInvocazioneProduzione != null ? urlInvocazioneProduzione : new ArrayList<>();
	}
	/** URL censite per l'ambiente indicato. */
	public List<UrlInvocazioneConfigurata> getUrlInvocazione(boolean collaudo) {
		return collaudo ? this.urlInvocazioneCollaudo : this.urlInvocazioneProduzione;
	}
	public String getEtichettaUrlInvocazioneDefault() {
		return etichettaUrlInvocazioneDefault;
	}
	public void setEtichettaUrlInvocazioneDefault(String etichettaUrlInvocazioneDefault) {
		this.etichettaUrlInvocazioneDefault = etichettaUrlInvocazioneDefault;
	}
	public Set<String> getStatiSchedaAdesione() {
		return statiSchedaAdesione;
	}
	public void setStatiSchedaAdesione(Set<String> statiSchedaAdesione) {
		this.statiSchedaAdesione = statiSchedaAdesione;
	}
	
}
