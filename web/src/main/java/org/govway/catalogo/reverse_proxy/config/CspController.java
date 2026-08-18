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
package org.govway.catalogo.reverse_proxy.config;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint di supporto al recovery della Content-Security-Policy dell'index.jsp.
 *
 * La CSP viene emessa come header del documento e non è modificabile a runtime: se un servizio
 * viene creato dopo il caricamento della pagina, il suo host di invocazione non è presente nella
 * direttiva connect-src e il browser blocca la chiamata fino al successivo caricamento.
 *
 * Lo script incluso nell'index.jsp intercetta la violazione e interroga questo endpoint per sapere
 * se l'host bloccato è ormai tra quelli consentiti: in tal caso propone all'utente di ricaricare
 * la pagina, senza che debba accorgersene da solo.
 */
@RestController
public class CspController {

    private static final Logger logger = LoggerFactory.getLogger(CspController.class);

    private static final String ALLOWED_FIELD = "allowed";

    @Autowired
    private CspAllowedHostsService cspAllowedHostsService;

    /**
     * Verifica se l'origin indicato è tra quelli consentiti dalla lista aggiornata degli host upstream.
     *
     * @param origin origin bloccato dalla CSP, nella forma scheme://host[:porta]
     * @return 200 con {@code {"allowed": true|false}}, 400 se l'origin non è un valore http/https valido
     */
    @GetMapping(value = "/csp/allowed-origin", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Boolean>> isAllowedOrigin(@RequestParam(name = "origin") String origin) {

        String normalized = CspAllowedHostsService.normalizeOrigin(origin);
        if (normalized == null) {
            // Il valore ricevuto non viene riportato nei log: è un input non validato proveniente dal browser.
            logger.debug("Richiesta di verifica CSP con origin non valido: richiesta ignorata");
            return ResponseEntity.badRequest().cacheControl(CacheControl.noStore()).build();
        }

        boolean allowed = this.cspAllowedHostsService.isAllowedOriginAfterRefresh(normalized);

        logger.debug("Verifica CSP per l'origin [{}] completata con esito [{}]", normalized, allowed);

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(Map.of(ALLOWED_FIELD, allowed));
    }
}
