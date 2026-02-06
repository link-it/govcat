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

import java.util.List;

/**
 * @author Tommaso Burlon (tommaso.burlon@link.it)
 * @author $Author$
 * @version $Rev$, $Date$
 */
public class GruppoItem {
	private String nome;
	private List<String> azioni;
	private Boolean predefinito;
	
	public String getNome() {
		return nome;
	}
	public List<String> getAzioni() {
		return azioni;
	}
	public Boolean getPredefinito() {
		return predefinito;
	}
	public void setNome(String nome) {
		this.nome = nome;
	}
	public void setAzioni(List<String> azioni) {
		this.azioni = azioni;
	}
	public void setPredefinito(Boolean predefinito) {
		this.predefinito = predefinito;
	}
	
}
