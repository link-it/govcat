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
package configuratore;

import java.util.Map;

import org.govway.catalogo.core.dto.DTOAdesione;
import org.govway.catalogo.core.dto.DTOAdesione.AmbienteEnum;
import org.govway.catalogo.core.dto.DTOAdesioneAPI;
import org.govway.catalogo.core.dto.DTOApi;
import org.govway.catalogo.core.dto.DTOApi.PROTOCOLLO;
import org.govway.catalogo.core.dto.DTOApi.RUOLO;
import org.govway.catalogo.core.dto.DTOSoggetto;


/**
 * @author Tommaso Burlon (tommaso.burlon@link.it)
 * @author $Author$
 * @version $Rev$, $Date$
 */

public class GruppoServizio {
	
	private DTOAdesione adesione;
	private DTOApi api;
	private DTOAdesioneAPI adesioneAPI;
	private String gruppo;
	private String nomeAPI;
	
	public GruppoServizio() {
		
	}
	
	public GruppoServizio(GruppoServizio src) {
		this.adesione = src.adesione;
		this.api = src.api;
		this.adesioneAPI = src.adesioneAPI;
		this.gruppo = src.gruppo;
		this.nomeAPI = src.nomeAPI;
	}
	
	public GruppoServizio adesione(DTOAdesione adesione) {
		this.adesione = adesione;
		return this;
	}
	
	public GruppoServizio api(DTOApi api) {
		this.api = api;
		return this;
	}
	
	public GruppoServizio adesioneAPI(DTOAdesioneAPI adesioneAPI) {
		this.adesioneAPI = adesioneAPI;
		return this;
	}
	
	public GruppoServizio nomeAPI(String nomeAPI) {
		this.nomeAPI = nomeAPI;
		return this;
	}
	
	public GruppoServizio gruppo(String gruppo) {
		this.gruppo = gruppo;
		return this;
	}

	public boolean isModI() {
		return this.getProfilo().equals("ModIPA") || this.getProfilo().equals("ModI");
	}
	
	public AmbienteEnum getAmbienteConfigurazione() {
		return adesione.getAmbienteConfigurazione();
	}

	public DTOSoggetto getSoggettoAderente() {
		return adesione.getSoggettoAderente();
	}

	public DTOSoggetto getSoggettoErogatore() {
		return adesione.getSoggettoErogatore();
	}

	public DTOSoggetto getSoggettoFruitore() {
		return adesione.getSoggettoFruitore();
	}

	public String getStatoAttuale() {
		return adesione.getStatoAttuale();
	}

	public String getNomeServizio() {
		return api.getNomeApi();
	}
	
	public String getNomeApi() {
		return this.nomeAPI;
	}
	
	public Integer getVersioneApi() {
		return api.getVersioneApi();
	}

	public PROTOCOLLO getProtocolloApi() {
		return api.getProtocolloApi();
	}

	public RUOLO getRuoloApi() {
		return api.getRuoloApi();
	}

	public Integer getVersioneServizio() {
		return api.getVersioneApi();
	}

	public String getProfilo() {
		return getSoggettoAderente().getTipoGateway();
	}
	
	public String getGruppo() {
		return gruppo;
	}
	
	public boolean isFruizione() {
		return getSoggettoFruitore() != null;
	}
	
	public Map<String, String> getEstensioni() {
		return this.api.getEstensioni();
	}
	
	 @Override
	 public String toString() {
		 StringBuilder sb = new StringBuilder();
		 sb.append(this.getProfilo())
		 	.append("/")
		 	.append(this.getNomeApi())
		 	.append("v" + this.getVersioneApi())
		 	.append("@");
		 
		 if (this.getSoggettoFruitore() != null) {
			 sb.append(this.getSoggettoFruitore().getTipoGateway())
			 	.append('/')
			 	.append(this.getSoggettoFruitore().getNomeGateway())
			 	.append("->");
		 }
		 
		 sb.append(this.getSoggettoErogatore().getTipoGateway())
		 	.append("/")
		 	.append(this.getSoggettoErogatore().getNomeGateway())
		 	.append("[")
		 	.append(this.getGruppo())
		 	.append("]");
		 
		 return sb.toString();
	 }
}
