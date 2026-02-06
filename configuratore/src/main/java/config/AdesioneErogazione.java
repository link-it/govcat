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
package config;

/**
 * @author Tommaso Burlon (tommaso.burlon@link.it)
 * @author $Author$
 * @version $Rev$, $Date$
 */
public class AdesioneErogazione {
	private String nomeAPI;
	private Integer versione;
	private String nomeErogazione;
	private String gruppo;
	private String soggetto;
	private String profilo;
	private String tipoServizio = "APIGateway";
	
	public AdesioneErogazione nomeAPI(String nomeAPI) {
		this.nomeAPI = nomeAPI;
		return this;
	}
	
	public AdesioneErogazione versione(Integer versione) {
		this.versione = versione;
		return this;
	}
	
	public AdesioneErogazione nomeErogazione(String nomeErogazione) {
		this.nomeErogazione = nomeErogazione;
		return this;
	}
	
	public AdesioneErogazione gruppo(String gruppo) {
		this.gruppo = gruppo;
		return this;
	}
	
	public AdesioneErogazione soggetto(String soggetto) {
		this.soggetto = soggetto;
		return this;
	}
	
	public AdesioneErogazione profilo(String profilo) {
		this.profilo = profilo;
		return this;
	}
	
	public AdesioneErogazione tipoServizio(String tipoServizio) {
		this.tipoServizio = tipoServizio;
		return this;
	}

	public String getNomeAPI() {
		return nomeAPI;
	}

	public Integer getVersione() {
		return versione;
	}
	
	public String getNomeErogazione() {
		return nomeErogazione;
	}

	public String getGruppo() {
		return gruppo;
	}

	public String getSoggetto() {
		return soggetto;
	}

	public String getProfilo() {
		return profilo;
	}
	
	public String getTipoServizio() {
		return tipoServizio;
	}
	
}
