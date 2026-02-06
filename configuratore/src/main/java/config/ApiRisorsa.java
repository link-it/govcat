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
public class ApiRisorsa {
	private String httpMethod;
	private String path;
	private String nome;
	private String descrizione;
	private Boolean idCollaborazione;
	private Boolean riferimentoIdRichiesta;
	
	public String getHttpMethod() {
		return httpMethod;
	}
	public String getPath() {
		return path;
	}
	public String getNome() {
		return nome;
	}
	public String getDescrizione() {
		return descrizione;
	}
	public Boolean getIdCollaborazione() {
		return idCollaborazione;
	}
	public Boolean getRiferimentoIdRichiesta() {
		return riferimentoIdRichiesta;
	}
	public void setHttpMethod(String httpMethod) {
		this.httpMethod = httpMethod;
	}
	public void setPath(String path) {
		this.path = path;
	}
	public void setNome(String nome) {
		this.nome = nome;
	}
	public void setDescrizione(String descrizione) {
		this.descrizione = descrizione;
	}
	public void setIdCollaborazione(Boolean idCollaborazione) {
		this.idCollaborazione = idCollaborazione;
	}
	public void setRiferimentoIdRichiesta(Boolean riferimentoIdRichiesta) {
		this.riferimentoIdRichiesta = riferimentoIdRichiesta;
	} 
}
