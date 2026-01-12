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
package org.govway.catalogo.core.dto;

import java.util.List;
import java.util.Map;

public class DTOAdesione {
	public enum AmbienteEnum {COLLAUDO, PRODUZIONE}

    private List<DTOApi> api;
    
    // Estensioni comuni a tutte le API, la chiave della hashmap è gruppo + "." + nomeEstensione
    private Map<String, String> estensioni;
    private DTOSoggetto soggettoErogatore;
    private DTOSoggetto soggettoAderente;
    // Presente solo se si tratta di una fruizione su Govway
    private DTOSoggetto soggettoFruitore;
    private AmbienteEnum ambienteConfigurazione;
    // Solo i client dell'ambiente dell'adesione
    private List<DTOClient> clients;
    private String statoAttuale;

    public DTOAdesione(List<DTOApi> api, Map<String, String> estensioni, DTOSoggetto soggettoErogatore, 
    		DTOSoggetto soggettoAderente, DTOSoggetto soggettoFruitore, 
    		AmbienteEnum ambienteConfigurazione, List<DTOClient> clients, String statoAttuale) {
        this.setApi(api);
        this.setEstensioni(estensioni);
        this.setSoggettoErogatore(soggettoErogatore);
        this.setSoggettoAderente(soggettoAderente);
        this.setSoggettoFruitore(soggettoFruitore);
        this.setAmbienteConfigurazione(ambienteConfigurazione);
        this.setClients(clients);
        this.setStatoAttuale(statoAttuale);
    }
    
    public String getStatoAttuale() {
    	return statoAttuale;
    }
    
    public List<DTOApi> getApi() {
        return api;
    }

    public Map<String, String> getEstensioni() {
        return estensioni;
    }

    public DTOSoggetto getSoggettoErogatore() {
        return soggettoErogatore;
    }

    public DTOSoggetto getSoggettoAderente() {
        return soggettoAderente;
    }

    public DTOSoggetto getSoggettoFruitore() {
        return soggettoFruitore;
    }

    public AmbienteEnum getAmbienteConfigurazione() {
        return ambienteConfigurazione;
    }

    public List<DTOClient> getClients() {
        return clients;
    }

	public void setEstensioni(Map<String, String> estensioni) {
		this.estensioni = estensioni;
	}

	public void setSoggettoErogatore(DTOSoggetto soggettoErogatore) {
		this.soggettoErogatore = soggettoErogatore;
	}

	public void setSoggettoAderente(DTOSoggetto soggettoAderente) {
		this.soggettoAderente = soggettoAderente;
	}

	public void setSoggettoFruitore(DTOSoggetto soggettoFruitore) {
		this.soggettoFruitore = soggettoFruitore;
	}

	public void setAmbienteConfigurazione(AmbienteEnum ambienteConfigurazione) {
		this.ambienteConfigurazione = ambienteConfigurazione;
	}

	public void setClients(List<DTOClient> clients) {
		this.clients = clients;
	}

	public void setStatoAttuale(String statoAttuale) {
		this.statoAttuale = statoAttuale;
	}

	public void setApi(List<DTOApi> api) {
		this.api = api;
	}

}
