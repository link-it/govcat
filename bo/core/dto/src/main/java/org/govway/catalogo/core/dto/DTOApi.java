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

public class DTOApi {

    public enum RUOLO {
        EROGATO_SOGGETTO_DOMINIO,
        EROGATO_SOGGETTO_ADERENTE
    }

    public enum PROTOCOLLO {
        WSDL11,
        WSDL12,
        SWAGGER_2,
        OPENAPI_3
    }

	
    private String nomeApi;
    private Integer versioneApi;
    private RUOLO ruoloApi;
    private PROTOCOLLO protocolloApi;
    List<DTOAdesioneAPI> adesioneApi;
    //  le estensioni nelle api sono le estensioni specifiche per questa api
    private Map<String, String> estensioni;

    private List<DTOQuotaRateLimiting> rateLimiting = List.of();

    private boolean finalitaConfigurata;
    private String finalita;

    public DTOApi(String nomeApi, Integer versioneApi, RUOLO ruolo, PROTOCOLLO protocollo, Map<String, String> estensioni,List<DTOAdesioneAPI> adesioneApi) {
        this.nomeApi = nomeApi;
        this.versioneApi = versioneApi;
        this.ruoloApi = ruolo;
        this.protocolloApi = protocollo;
        this.estensioni = estensioni;
        this.adesioneApi = adesioneApi;
    }

    public  List<DTOAdesioneAPI> getDTOAdesioneApi() {
    	return adesioneApi;
    }
    
    public String getNomeApi() {
        return nomeApi;
    }

    public Integer getVersioneApi() {
        return versioneApi;
    }

    public RUOLO getRuoloApi() {
        return ruoloApi;
    }

    public PROTOCOLLO getProtocolloApi() {
        return protocolloApi;
    }

    public Map<String, String> getEstensioni() {
        return estensioni;
    }

    /** Quote dell'aderente per l'API nell'ambiente di configurazione, una per periodo; vuota se non indicate. */
    public List<DTOQuotaRateLimiting> getRateLimiting() {
        return rateLimiting;
    }

    public void setRateLimiting(List<DTOQuotaRateLimiting> rateLimiting) {
        this.rateLimiting = rateLimiting != null ? rateLimiting : List.of();
    }

    /**
     * La configurazione indica, per l'ambiente, la proprietà custom delle adesioni con la finalità
     * PDND (adesione.rate_limiting.finalita): in tal caso {@link #getFinalita()} è il suo valore.
     */
    public boolean isFinalitaConfigurata() {
        return finalitaConfigurata;
    }

    /** Finalità PDND dell'aderente per l'API, nulla se non indicata. */
    public String getFinalita() {
        return finalita;
    }

    public void setFinalita(boolean configurata, String finalita) {
        this.finalitaConfigurata = configurata;
        this.finalita = finalita;
    }

}
