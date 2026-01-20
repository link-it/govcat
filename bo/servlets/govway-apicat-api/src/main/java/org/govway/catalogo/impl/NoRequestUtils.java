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

import java.util.List;

import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

/**
 * Implementazione di RequestUtils per la modalità di autenticazione anonima.
 * Tutti i metodi restituiscono null poiché non c'è alcun utente autenticato.
 *
 * Attiva quando authentication.mode=ANONYMOUS.
 *
 * In questa modalità l'utente non viene mai valorizzato in sessione.
 * Solo le operazioni in whitelist sono permesse (controllate da ReadOnlyModeInterceptor).
 */
@Component
@ConditionalOnExpression("'${authentication.mode:HEADER}' == 'ANONYMOUS'")
public class NoRequestUtils extends AbstractRequestUtils {

    // ========================================================================
    // Implementazione metodi astratti
    // ========================================================================

    @Override
    protected String extractEmail() {
        return null;
    }

    @Override
    protected String extractFirstName() {
        return null;
    }

    @Override
    protected String extractLastName() {
        return null;
    }

    @Override
    protected String extractCf() {
        return null;
    }

    @Override
    protected String extractUsername() {
        return null;
    }

    @Override
    protected String extractOrganization() {
        return null;
    }

    @Override
    protected List<String> extractRuoli() {
        return null;
    }

    @Override
    protected String extractSede() {
        return null;
    }

    @Override
    protected String extractTelefono() {
        return null;
    }

    @Override
    protected String extractMatricola() {
        return null;
    }

    @Override
    protected String extractClassi() {
        return null;
    }

    @Override
    public String getHeaderAuthentication() {
        return null;
    }
}
