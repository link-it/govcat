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
public class ErogazioneApiImplementata {
	private String soggetto;
	private String profilo;
	private String apiNome;
	private Integer apiVersione;
	private Integer[] versioni;
	
	public String getSoggetto() {
		return soggetto;
	}
	public String getProfilo() {
		return profilo;
	}
	public String getApiNome() {
		return apiNome;
	}
	public Integer getApiVersione() {
		return apiVersione;
	}
	public Integer[] getVersioni() {
		return versioni;
	}
	public void setSoggetto(String soggetto) {
		this.soggetto = soggetto;
	}
	public void setProfilo(String profilo) {
		this.profilo = profilo;
	}
	public void setApiNome(String apiNome) {
		this.apiNome = apiNome;
	}
	public void setApiVersione(Integer apiVersione) {
		this.apiVersione = apiVersione;
	}
	public void setVersioni(Integer[] versioni) {
		this.versioni = versioni;
	}
	
	
}
