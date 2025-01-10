package org.govway.catalogo.core.dto;

public class DTOAdesioneAPI {

    private String profilo;
    private String risorse;
    private String client;

    public DTOAdesioneAPI(String profilo, String risorse, String client) {
        this.profilo = profilo;
        this.risorse = risorse;
        this.client = client;
    }

    public String getProfilo() {
        return profilo;
    }

    public String getRisorse() {
        return risorse;
    }

    public String getClient() {
        return client;
    }
}
