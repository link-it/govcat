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
package org.govway.catalogo.impl;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.RequestUtils;
import org.govway.catalogo.core.orm.entity.ClasseUtenteEntity;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity.Ruolo;
import org.govway.catalogo.core.orm.entity.UtenteEntity.Stato;
import org.govway.catalogo.core.services.OrganizzazioneService;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.Idm;
import org.govway.catalogo.servlets.model.RuoloUtenteEnum;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Classe astratta base per le implementazioni di RequestUtils.
 * Contiene tutta la logica comune indipendente dalla modalità di autenticazione.
 *
 * Le classi figlie devono implementare i metodi astratti protected extract*()
 * per fornire i dati specifici della loro fonte di autenticazione.
 */
public abstract class AbstractRequestUtils implements RequestUtils {

    protected static final Logger logger = LoggerFactory.getLogger(AbstractRequestUtils.class);

    @Value("${ruolo_gestore_idm}")
    protected String ruoloGestoreIdm;

    @Value("${ruolo_referente_servizio_idm}")
    protected String ruoloReferenteServizioIdm;

    @Value("${whitelist.className}")
    protected String whiteList;

    @Autowired
    protected Configurazione configurazione;

    @Autowired
    protected OrganizzazioneService organizzazioneService;

    // ========================================================================
    // Metodi astratti - da implementare nelle classi concrete
    // ========================================================================

    /**
     * Estrae l'email dalla fonte di autenticazione.
     * @return email o null
     */
    protected abstract String extractEmail();

    /**
     * Estrae il nome dalla fonte di autenticazione.
     * @return nome o null
     */
    protected abstract String extractFirstName();

    /**
     * Estrae il cognome dalla fonte di autenticazione.
     * @return cognome o null
     */
    protected abstract String extractLastName();

    /**
     * Estrae il codice fiscale dalla fonte di autenticazione.
     * @return codice fiscale o null
     */
    protected abstract String extractCf();

    /**
     * Estrae lo username dalla fonte di autenticazione.
     * @return username o null
     */
    protected abstract String extractUsername();

    /**
     * Estrae l'organizzazione dalla fonte di autenticazione.
     * @return organizzazione o null
     */
    protected abstract String extractOrganization();

    /**
     * Estrae i ruoli dalla fonte di autenticazione.
     * @return lista di ruoli o null
     */
    protected abstract List<String> extractRuoli();

    /**
     * Estrae la sede dalla fonte di autenticazione.
     * @return sede o null
     */
    protected abstract String extractSede();

    /**
     * Estrae il telefono dalla fonte di autenticazione.
     * @return telefono o null
     */
    protected abstract String extractTelefono();

    /**
     * Estrae la matricola dalla fonte di autenticazione.
     * @return matricola o null
     */
    protected abstract String extractMatricola();

    /**
     * Estrae le classi dalla fonte di autenticazione.
     * @return classi o null
     */
    protected abstract String extractClassi();

    // ========================================================================
    // Implementazione metodi pubblici dell'interfaccia
    // ========================================================================

    @Override
    public InfoProfilo getPrincipal() {
        return getPrincipal(true);
    }

    @Override
    public InfoProfilo getPrincipal(boolean checkStato) {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();

        // Verifica se l'oggetto Authentication è null o non è istanziato correttamente
        if (a == null || a.getPrincipal() == null || !(a.getPrincipal() instanceof InfoProfilo)) {
            return null;
        }

        if (a.getPrincipal() instanceof InfoProfilo) {
            InfoProfilo p = (InfoProfilo) a.getPrincipal();

            if (checkStato) {
                if (p.utente == null) {
                    throw new NotAuthorizedException(ErrorCode.UT_404);
                }
                if (!p.utente.getStato().equals(Stato.ABILITATO)) {
                    throw new NotAuthorizedException(ErrorCode.UT_403);
                }
            }
            if (configurazione.getUtente().isAggiornamentoIdmAbilitato() && p.utente != null
                    && p.utente.getStato().equals(Stato.ABILITATO)) {
                // updateContact(p.utente); //TODO
            }

            return p;
        } else {
            return null;
        }
    }

    @Override
    public UtenteEntity getUtente() {
        UtenteEntity utente = new UtenteEntity();
        utente.setIdUtente(UUID.randomUUID().toString());
        utente.setPrincipal(this.getUsername());
        utente.setEmailAziendale(this.getEmail());
        utente.setNome(this.getFirstName());
        utente.setCognome(this.getLastName());
        utente.setTelefonoAziendale(getTelefonoInternal());
        if (utente.getTelefonoAziendale() == null) {
            // mettere 00-00000 se null, temporaneamente
            utente.setTelefonoAziendale("00-000000");
        }

        if (this.configurazione.getUtente().isRuoloDaIdmAbilitato()) {
            Ruolo ruolo = this.getRuoloCodificatoDB();
            if (ruolo != null) {
                utente.setRuolo(ruolo);
            }
        }

        OrganizzazioneEntity orgDB = this.getOrganizzazioneDB();

        if (orgDB != null) {
            utente.setOrganizzazione(orgDB);
        }

        Set<ClasseUtenteEntity> classiDB = this.getClassiDB();

        if (!classiDB.isEmpty()) {
            utente.getClassi().addAll(classiDB);
        }

        return utente;
    }

    @Override
    public Idm getIdm() {
        Idm info = new Idm();
        info.setPrincipal(this.getUsername());
        info.setNome(this.getFirstName());
        info.setCognome(this.getLastName());
        info.setCodiceFiscale(this.getCf());
        info.setEmail(this.getEmail());
        info.setTelefono(getTelefonoInternal());
        info.setMatricola(getMatricolaInternal());
        info.setSede(getSedeInternal());

        if (this.configurazione.getUtente().isRuoloDaIdmAbilitato()) {
            info.setRuoli(getRuoliInternal());
            info.setRuoloCodificato(this.getRuoloCodificato());
        }
        return info;
    }

    @Override
    public boolean isWhiteListed() {
        // String classi = getClassi();
        // return classi != null && classi.contains(this.whiteList);
        return false;
    }

    @Override
    public String getEmail() {
        return extractEmail();
    }

    @Override
    public String getFirstName() {
        return extractFirstName();
    }

    @Override
    public String getLastName() {
        return extractLastName();
    }

    @Override
    public String getCf() {
        return extractCf();
    }

    @Override
    public String getUsername() {
        return extractUsername();
    }

    @Override
    public String getClassi() {
        return extractClassi();
    }

    @Override
    public String getOrganization() {
        return extractOrganization();
    }

    // ========================================================================
    // Metodi privati/protetti di utilità
    // ========================================================================

    private OrganizzazioneEntity getOrganizzazioneDB() {
        String orgUntrimmed = this.getOrganization();
        if (orgUntrimmed != null) {
            String org = orgUntrimmed.trim();

            return this.organizzazioneService.findByNome(org).orElseGet(() -> {
                OrganizzazioneEntity o = new OrganizzazioneEntity();
                o.setNome(org);
                o.setIdOrganizzazione(UUID.randomUUID().toString());
                o.setAderente(true);
                this.organizzazioneService.save(o);
                return o;
            });
        }

        return null;
    }

    private Set<ClasseUtenteEntity> getClassiDB() {
        // String cuString = this.getClassi();
        Set<ClasseUtenteEntity> set = new HashSet<>();
        // Logica commentata nel codice originale
        return set;
    }

    private RuoloUtenteEnum getRuoloCodificato() {
        return this.getRuoloCodificato(getRuoliInternal());
    }

    private Ruolo getRuoloCodificatoDB() {
        return this.getRuoloCodificatoDB(getRuoliInternal());
    }

    private RuoloUtenteEnum getRuoloCodificato(List<String> ruoli) {
        if (ruoli != null) {
            if (ruoli.stream().anyMatch(r -> r.equals(this.ruoloGestoreIdm))) {
                return RuoloUtenteEnum.GESTORE;
            }
            if (ruoli.stream().anyMatch(r -> r.equals(this.ruoloReferenteServizioIdm))) {
                return RuoloUtenteEnum.REFERENTE_SERVIZIO;
            }
        }
        return null;
    }

    private Ruolo getRuoloCodificatoDB(List<String> ruoli) {
        if (ruoli != null) {
            if (ruoli.stream().anyMatch(r -> r.equals(this.ruoloGestoreIdm))) {
                return Ruolo.AMMINISTRATORE;
            }
            if (ruoli.stream().anyMatch(r -> r.equals(this.ruoloReferenteServizioIdm))) {
                return Ruolo.REFERENTE_SERVIZIO;
            }
        }
        return null;
    }

    // Metodi internal per evitare override accidentali
    private List<String> getRuoliInternal() {
        return extractRuoli();
    }

    private String getSedeInternal() {
        return extractSede();
    }

    private String getTelefonoInternal() {
        return extractTelefono();
    }

    private String getMatricolaInternal() {
        return extractMatricola();
    }
}
