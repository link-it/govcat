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
package org.govway.catalogo.core.business.utils;

/**
 * Configurazione delle etichette per la generazione dei PDF.
 * Tutte le stringhe hanno valori di default per garantire il funzionamento
 * anche senza configurazione esplicita.
 *
 * Le properties vengono lette automaticamente dal file govcat-stampe.properties
 * con il prefisso "stampe." (es. stampe.eservice.titolo, stampe.scheda.header).
 * Il binding viene fatto in OpenAPI2SpringBoot tramite @ConfigurationProperties.
 */
public class StampeLabels {

    private EServiceLabels eservice = new EServiceLabels();
    private SchedaLabels scheda = new SchedaLabels();

    public EServiceLabels getEservice() {
        return eservice;
    }

    public void setEservice(EServiceLabels eservice) {
        this.eservice = eservice;
    }

    public SchedaLabels getScheda() {
        return scheda;
    }

    public void setScheda(SchedaLabels scheda) {
        this.scheda = scheda;
    }

    /**
     * Labels per il PDF EService (Descrittore)
     */
    public static class EServiceLabels {
        private String titolo = "Descrittore eService";
        private EServiceLabelSet label = new EServiceLabelSet();
        private ProfiliLabels profili = new ProfiliLabels();

        public String getTitolo() {
            return titolo;
        }

        public void setTitolo(String titolo) {
            this.titolo = titolo;
        }

        public EServiceLabelSet getLabel() {
            return label;
        }

        public void setLabel(EServiceLabelSet label) {
            this.label = label;
        }

        public ProfiliLabels getProfili() {
            return profili;
        }

        public void setProfili(ProfiliLabels profili) {
            this.profili = profili;
        }
    }

    /**
     * Set di label per EService
     */
    public static class EServiceLabelSet {
        private String dato = "Dato";
        private String valore = "Valore";
        private String nomeServizio = "Nome servizio";
        private String versione = "Versione";
        private String tecnologia = "Tecnologia";
        private String descrittore = "Descrittore";
        private String baseurlCollaudo = "Base URL pubblica (Collaudo)";
        private String baseurlProduzione = "Base URL pubblica (Produzione)";

        public String getDato() {
            return dato;
        }

        public void setDato(String dato) {
            this.dato = dato;
        }

        public String getValore() {
            return valore;
        }

        public void setValore(String valore) {
            this.valore = valore;
        }

        public String getNomeServizio() {
            return nomeServizio;
        }

        public void setNomeServizio(String nomeServizio) {
            this.nomeServizio = nomeServizio;
        }

        public String getVersione() {
            return versione;
        }

        public void setVersione(String versione) {
            this.versione = versione;
        }

        public String getTecnologia() {
            return tecnologia;
        }

        public void setTecnologia(String tecnologia) {
            this.tecnologia = tecnologia;
        }

        public String getDescrittore() {
            return descrittore;
        }

        public void setDescrittore(String descrittore) {
            this.descrittore = descrittore;
        }

        public String getBaseurlCollaudo() {
            return baseurlCollaudo;
        }

        public void setBaseurlCollaudo(String baseurlCollaudo) {
            this.baseurlCollaudo = baseurlCollaudo;
        }

        public String getBaseurlProduzione() {
            return baseurlProduzione;
        }

        public void setBaseurlProduzione(String baseurlProduzione) {
            this.baseurlProduzione = baseurlProduzione;
        }
    }

    /**
     * Labels per la sezione Profili nel PDF EService
     */
    public static class ProfiliLabels {
        private String titolo = "Profili di Interoperabilità da utilizzare per le operation/risorse dell'API";
        private String colonnaProfilo = "Profilo";
        private String colonnaOperations = "Operation/Risorse";
        private String tutteOperations = "Tutte";

        public String getTitolo() {
            return titolo;
        }

        public void setTitolo(String titolo) {
            this.titolo = titolo;
        }

        public String getColonnaProfilo() {
            return colonnaProfilo;
        }

        public void setColonnaProfilo(String colonnaProfilo) {
            this.colonnaProfilo = colonnaProfilo;
        }

        public String getColonnaOperations() {
            return colonnaOperations;
        }

        public void setColonnaOperations(String colonnaOperations) {
            this.colonnaOperations = colonnaOperations;
        }

        public String getTutteOperations() {
            return tutteOperations;
        }

        public void setTutteOperations(String tutteOperations) {
            this.tutteOperations = tutteOperations;
        }
    }

    /**
     * Labels per il PDF Scheda Adesione
     */
    public static class SchedaLabels {
        private String header = "Scheda adesione";
        private SchedaLabelSet label = new SchedaLabelSet();
        private BaseurlLabels baseurl = new BaseurlLabels();
        private StatoLabels stato = new StatoLabels();

        public String getHeader() {
            return header;
        }

        public void setHeader(String header) {
            this.header = header;
        }

        public SchedaLabelSet getLabel() {
            return label;
        }

        public void setLabel(SchedaLabelSet label) {
            this.label = label;
        }

        public BaseurlLabels getBaseurl() {
            return baseurl;
        }

        public void setBaseurl(BaseurlLabels baseurl) {
            this.baseurl = baseurl;
        }

        public StatoLabels getStato() {
            return stato;
        }

        public void setStato(StatoLabels stato) {
            this.stato = stato;
        }
    }

    /**
     * Set di label per Scheda Adesione
     */
    public static class SchedaLabelSet {
        private String aderente = "Aderente";
        private String api = "API";
        private String apiRisposta = "API risposta";
        private String modalitaAutenticazione = "Modalità di autenticazione";
        private String client = "Client";
        private String profilo = "Profilo";
        private String erogazione = "Erogazione";
        private String baseurl = "BaseURL";
        private String referente = "Referente";
        private String referenteTecnico = "Referente tecnico";
        private String commonName = "Common Name";
        private String clientId = "Client ID";
        private String autenticazione = "Autenticazione";
        private String firma = "Firma";

        public String getAderente() {
            return aderente;
        }

        public void setAderente(String aderente) {
            this.aderente = aderente;
        }

        public String getApi() {
            return api;
        }

        public void setApi(String api) {
            this.api = api;
        }

        public String getApiRisposta() {
            return apiRisposta;
        }

        public void setApiRisposta(String apiRisposta) {
            this.apiRisposta = apiRisposta;
        }

        public String getModalitaAutenticazione() {
            return modalitaAutenticazione;
        }

        public void setModalitaAutenticazione(String modalitaAutenticazione) {
            this.modalitaAutenticazione = modalitaAutenticazione;
        }

        public String getClient() {
            return client;
        }

        public void setClient(String client) {
            this.client = client;
        }

        public String getProfilo() {
            return profilo;
        }

        public void setProfilo(String profilo) {
            this.profilo = profilo;
        }

        public String getErogazione() {
            return erogazione;
        }

        public void setErogazione(String erogazione) {
            this.erogazione = erogazione;
        }

        public String getBaseurl() {
            return baseurl;
        }

        public void setBaseurl(String baseurl) {
            this.baseurl = baseurl;
        }

        public String getReferente() {
            return referente;
        }

        public void setReferente(String referente) {
            this.referente = referente;
        }

        public String getReferenteTecnico() {
            return referenteTecnico;
        }

        public void setReferenteTecnico(String referenteTecnico) {
            this.referenteTecnico = referenteTecnico;
        }

        public String getCommonName() {
            return commonName;
        }

        public void setCommonName(String commonName) {
            this.commonName = commonName;
        }

        public String getClientId() {
            return clientId;
        }

        public void setClientId(String clientId) {
            this.clientId = clientId;
        }

        public String getAutenticazione() {
            return autenticazione;
        }

        public void setAutenticazione(String autenticazione) {
            this.autenticazione = autenticazione;
        }

        public String getFirma() {
            return firma;
        }

        public void setFirma(String firma) {
            this.firma = firma;
        }
    }

    /**
     * Labels per le BaseURL nella Scheda Adesione
     */
    public static class BaseurlLabels {
        private String pubbliche = "BaseURL pubbliche";
        private String pubblica = "BaseURL pubblica";
        private String collaudo = "(Ambiente di Collaudo)";
        private String produzione = "(Ambiente di Produzione)";

        public String getPubbliche() {
            return pubbliche;
        }

        public void setPubbliche(String pubbliche) {
            this.pubbliche = pubbliche;
        }

        public String getPubblica() {
            return pubblica;
        }

        public void setPubblica(String pubblica) {
            this.pubblica = pubblica;
        }

        public String getCollaudo() {
            return collaudo;
        }

        public void setCollaudo(String collaudo) {
            this.collaudo = collaudo;
        }

        public String getProduzione() {
            return produzione;
        }

        public void setProduzione(String produzione) {
            this.produzione = produzione;
        }
    }

    /**
     * Labels per gli stati della Scheda Adesione
     */
    public static class StatoLabels {
        private String bozza = "Bozza";
        private String richiestoCollaudo = "Richiesto in collaudo";
        private String inConfigurazioneCollaudo = "In configurazione in collaudo";
        private String pubblicatoCollaudo = "Pubblicato in collaudo";
        private String richiestoProduzione = "Richiesto in produzione";
        private String inConfigurazioneProduzione = "In configurazione in produzione";
        private String pubblicatoProduzione = "Pubblicato in produzione";
        private String pubblicatoProduzioneSenzaCollaudo = "Pubblicato in produzione senza collaudo";
        private String archiviato = "Archiviato";

        public String getBozza() {
            return bozza;
        }

        public void setBozza(String bozza) {
            this.bozza = bozza;
        }

        public String getRichiestoCollaudo() {
            return richiestoCollaudo;
        }

        public void setRichiestoCollaudo(String richiestoCollaudo) {
            this.richiestoCollaudo = richiestoCollaudo;
        }

        public String getInConfigurazioneCollaudo() {
            return inConfigurazioneCollaudo;
        }

        public void setInConfigurazioneCollaudo(String inConfigurazioneCollaudo) {
            this.inConfigurazioneCollaudo = inConfigurazioneCollaudo;
        }

        public String getPubblicatoCollaudo() {
            return pubblicatoCollaudo;
        }

        public void setPubblicatoCollaudo(String pubblicatoCollaudo) {
            this.pubblicatoCollaudo = pubblicatoCollaudo;
        }

        public String getRichiestoProduzione() {
            return richiestoProduzione;
        }

        public void setRichiestoProduzione(String richiestoProduzione) {
            this.richiestoProduzione = richiestoProduzione;
        }

        public String getInConfigurazioneProduzione() {
            return inConfigurazioneProduzione;
        }

        public void setInConfigurazioneProduzione(String inConfigurazioneProduzione) {
            this.inConfigurazioneProduzione = inConfigurazioneProduzione;
        }

        public String getPubblicatoProduzione() {
            return pubblicatoProduzione;
        }

        public void setPubblicatoProduzione(String pubblicatoProduzione) {
            this.pubblicatoProduzione = pubblicatoProduzione;
        }

        public String getPubblicatoProduzioneSenzaCollaudo() {
            return pubblicatoProduzioneSenzaCollaudo;
        }

        public void setPubblicatoProduzioneSenzaCollaudo(String pubblicatoProduzioneSenzaCollaudo) {
            this.pubblicatoProduzioneSenzaCollaudo = pubblicatoProduzioneSenzaCollaudo;
        }

        public String getArchiviato() {
            return archiviato;
        }

        public void setArchiviato(String archiviato) {
            this.archiviato = archiviato;
        }
    }
}
