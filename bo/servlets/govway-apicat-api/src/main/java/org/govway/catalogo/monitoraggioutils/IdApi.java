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

import org.govway.catalogo.core.orm.entity.ApiEntity.PROTOCOLLO;
import org.govway.catalogo.core.orm.entity.ApiEntity.RUOLO;

public class IdApi {

	private String nome;
	private String gruppo;
	private Integer versione;
	private RUOLO ruolo;
	private String soggetto;
	private String soggettoGestore;
	private PROTOCOLLO protocollo;
	private boolean fruizione;
	public Integer getVersione() {
		return versione;
	}
	public void setVersione(Integer versione) {
		this.versione = versione;
	}
	public String getNome() {
		return nome;
	}
	public void setNome(String nome) {
		this.nome = nome;
	}
	public RUOLO getRuolo() {
		return ruolo;
	}
	public void setRuolo(RUOLO ruolo) {
		this.ruolo = ruolo;
	}
	public String getSoggetto() {
		return soggetto;
	}
	public void setSoggetto(String soggetto) {
		this.soggetto = soggetto;
	}
//	public String getSoggettoGestore() {
//		return soggettoGestore;
//	}
//	public void setSoggettoGestore(String soggettoGestore) {
//		this.soggettoGestore = soggettoGestore;
//	}
	public PROTOCOLLO getProtocollo() {
		return protocollo;
	}
	public void setProtocollo(PROTOCOLLO protocollo) {
		this.protocollo = protocollo;
	}
	public boolean isFruizione() {
		return fruizione;
	}
	public void setFruizione(boolean fruizione) {
		this.fruizione = fruizione;
	}
	public String getGruppo() {
		return gruppo;
	}
	public void setGruppo(String gruppo) {
		this.gruppo = gruppo;
	}
	
	
}
