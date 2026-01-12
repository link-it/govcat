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
package org.govway.catalogo.monitoraggioutils.transazioni;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.govway.catalogo.monitoraggioutils.ConfigurazioneConnessione;
import org.govway.catalogo.monitoraggioutils.IdApi;
import org.govway.catalogo.servlets.monitor.model.EsitoTransazioneEnum;
import org.springframework.data.domain.Pageable;

public class ListTransazioniRequest {

	private ConfigurazioneConnessione configurazioneConnessione;
	private List<IdApi> lstIdApi;
	private OffsetDateTime dataDa;
	private OffsetDateTime dataA; 
	private String soggettoReferente;
	private String profilo;
	private EsitoTransazioneEnum esito; 
	private List<Integer> esitoCodici; 
	private UUID idAdesione; 
	private UUID idClient;
	private UUID idTransazione;
	private Pageable pageable;
	
	public OffsetDateTime getDataDa() {
		return dataDa;
	}
	public void setDataDa(OffsetDateTime dataDa) {
		this.dataDa = dataDa;
	}
	public OffsetDateTime getDataA() {
		return dataA;
	}
	public void setDataA(OffsetDateTime dataA) {
		this.dataA = dataA;
	}
	public EsitoTransazioneEnum getEsito() {
		return esito;
	}
	public void setEsito(EsitoTransazioneEnum esito) {
		this.esito = esito;
	}
	public UUID getIdAdesione() {
		return idAdesione;
	}
	public void setIdAdesione(UUID idAdesione) {
		this.idAdesione = idAdesione;
	}
	public UUID getIdClient() {
		return idClient;
	}
	public void setIdClient(UUID idClient) {
		this.idClient = idClient;
	}
	public Pageable getPageable() {
		return pageable;
	}
	public void setPageable(Pageable pageable) {
		this.pageable = pageable;
	}
	public ConfigurazioneConnessione getConfigurazioneConnessione() {
		return configurazioneConnessione;
	}
	public void setConfigurazioneConnessione(ConfigurazioneConnessione configurazioneConnessione) {
		this.configurazioneConnessione = configurazioneConnessione;
	}
	public List<IdApi> getLstIdApi() {
		return lstIdApi;
	}
	public void setLstIdApi(List<IdApi> lstIdApi) {
		this.lstIdApi = lstIdApi;
	}
	public String getProfilo() {
		return profilo;
	}
	public void setProfilo(String profilo) {
		this.profilo = profilo;
	}
	public List<Integer> getEsitoCodici() {
		return esitoCodici;
	}
	public void setEsitoCodici(List<Integer> esitoCodici) {
		this.esitoCodici = esitoCodici;
	}
	public UUID getIdTransazione() {
		return idTransazione;
	}
	public void setIdTransazione(UUID idTransazione) {
		this.idTransazione = idTransazione;
	}
	public String getSoggettoReferente() {
		return soggettoReferente;
	}
	public void setSoggettoReferente(String soggettoReferente) {
		this.soggettoReferente = soggettoReferente;
	}
}
