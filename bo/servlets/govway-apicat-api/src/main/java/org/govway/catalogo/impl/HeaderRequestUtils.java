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
package org.govway.catalogo.impl;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Implementazione di RequestUtils per la modalità di autenticazione tramite header HTTP.
 * Estrae tutti i dati utente dagli header HTTP configurati.
 *
 * Attiva quando authentication.mode=HEADER (o non specificato, default).
 *
 * Questa è la modalità legacy che presume protezione infrastrutturale
 * e non effettua validazione dei dati.
 */
@Component
@ConditionalOnProperty(name = "authentication.mode", havingValue = "HEADER", matchIfMissing = true)
public class HeaderRequestUtils extends AbstractRequestUtils {

    @Value("${header.email}")
    private String emailHeader;

    @Value("${header.first_name}")
    private String firstNameHeader;

    @Value("${header.last_name}")
    private String lastNameHeader;

    @Value("${header.cf}")
    private String cfHeader;

    @Value("${header.username}")
    private String usernameHeader;

    @Value("${headerAuthentication}")
    private String headerAuthentication;

    @Value("${header.ruoli}")
    private String ruoliHeader;

    @Value("${header.sede}")
    private String sedeHeader;

    @Value("${header.matricola}")
    private String matricolaHeader;

    @Value("${header.telefono}")
    private String telefonoHeader;

    @Value("${header.classi}")
    private String classiHeader;

    @Value("${header.organization}")
    private String organizationHeader;

    @PostConstruct
    public void init() {
        logger.info("HeaderRequestUtils inizializzato - Modalità: HEADER");
        logger.debug("Header di autenticazione: {}", headerAuthentication);
    }

    /**
     * Legge un header dalla richiesta HTTP corrente.
     *
     * @param name nome dell'header
     * @return valore dell'header o null se non presente
     */
    private String getHeader(String name) {
        try {
            HttpServletRequest curRequest = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes())
                    .getRequest();
            return curRequest.getHeader(name);
        } catch (IllegalStateException e) {
            logger.warn("Impossibile ottenere la richiesta HTTP corrente: {}", e.getMessage());
            return null;
        }
    }

    // ========================================================================
    // Implementazione metodi astratti
    // ========================================================================

    @Override
    protected String extractEmail() {
        return getHeader(this.emailHeader);
    }

    @Override
    protected String extractFirstName() {
        return getHeader(this.firstNameHeader);
    }

    @Override
    protected String extractLastName() {
        return getHeader(this.lastNameHeader);
    }

    @Override
    protected String extractCf() {
        return getHeader(this.cfHeader);
    }

    @Override
    protected String extractUsername() {
        return getHeader(this.usernameHeader);
    }

    @Override
    protected String extractOrganization() {
        return getHeader(this.organizationHeader);
    }

    @Override
    protected List<String> extractRuoli() {
        String ruoliString = getHeader(this.ruoliHeader);

        if (ruoliString != null) {
            return Arrays.asList(ruoliString.split(","));
        } else {
            return null;
        }
    }

    @Override
    protected String extractSede() {
        return getHeader(this.sedeHeader);
    }

    @Override
    protected String extractTelefono() {
        return getHeader(this.telefonoHeader);
    }

    @Override
    protected String extractMatricola() {
        return getHeader(this.matricolaHeader);
    }

    @Override
    protected String extractClassi() {
        return getHeader(this.classiHeader);
    }

    // ========================================================================
    // Override specifici per modalità HEADER
    // ========================================================================

    @Override
    public String getHeaderAuthentication() {
        return getHeader(this.headerAuthentication);
    }
}
