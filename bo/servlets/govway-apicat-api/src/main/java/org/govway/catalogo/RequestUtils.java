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
package org.govway.catalogo;

import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.servlets.model.Idm;

/**
 * Interfaccia per l'accesso ai dati dell'utente autenticato.
 * Fornisce metodi per estrarre informazioni dall'utente corrente,
 * indipendentemente dalla modalità di autenticazione utilizzata (HEADER o OIDC_JWT).
 *
 * Le implementazioni concrete sono:
 * - HeaderRequestUtils: per autenticazione tramite header HTTP
 * - OidcRequestUtils: per autenticazione tramite token JWT OIDC
 *
 * L'implementazione corretta viene selezionata automaticamente da Spring
 * in base alla property authentication.mode.
 */
public interface RequestUtils {

    /**
     * Ottiene il profilo dell'utente autenticato.
     * Verifica che l'utente sia abilitato.
     *
     * @return InfoProfilo dell'utente corrente o null se non autenticato
     * @throws org.govway.catalogo.exception.NotAuthorizedException se l'utente non è abilitato
     */
    InfoProfilo getPrincipal();

    /**
     * Ottiene il profilo dell'utente autenticato.
     *
     * @param checkStato se true, verifica che l'utente sia abilitato
     * @return InfoProfilo dell'utente corrente o null se non autenticato
     * @throws org.govway.catalogo.exception.NotAuthorizedException se checkStato=true e l'utente non è abilitato
     */
    InfoProfilo getPrincipal(boolean checkStato);

    /**
     * Costruisce un oggetto UtenteEntity dai dati dell'utente autenticato.
     * L'entità viene popolata con i dati estratti dalla fonte di autenticazione.
     *
     * @return UtenteEntity popolato con i dati dell'utente corrente
     */
    UtenteEntity getUtente();

    /**
     * Ottiene le informazioni IDM (Identity Management) dell'utente autenticato.
     * Include dati anagrafici e ruoli.
     *
     * @return oggetto Idm con le informazioni dell'utente
     */
    Idm getIdm();

    /**
     * Verifica se l'utente corrente è in whitelist.
     *
     * @return true se l'utente è in whitelist
     */
    boolean isWhiteListed();

    /**
     * Ottiene l'email dell'utente autenticato.
     *
     * @return email o null se non disponibile
     */
    String getEmail();

    /**
     * Ottiene il nome dell'utente autenticato.
     *
     * @return nome o null se non disponibile
     */
    String getFirstName();

    /**
     * Ottiene il cognome dell'utente autenticato.
     *
     * @return cognome o null se non disponibile
     */
    String getLastName();

    /**
     * Ottiene il codice fiscale dell'utente autenticato.
     *
     * @return codice fiscale o null se non disponibile
     */
    String getCf();

    /**
     * Ottiene lo username dell'utente autenticato.
     *
     * @return username o null se non disponibile
     */
    String getUsername();

    /**
     * Ottiene il valore dell'header di autenticazione.
     * In modalità HEADER, restituisce il valore dell'header configurato.
     * In modalità OIDC_JWT, può restituire null o un valore di fallback.
     *
     * @return valore dell'header di autenticazione
     */
    String getHeaderAuthentication();

    /**
     * Ottiene le classi utente dell'utente autenticato.
     * Nota: questo campo potrebbe non essere supportato in tutte le modalità.
     *
     * @return classi utente o null se non disponibile
     */
    String getClassi();

    /**
     * Ottiene l'organizzazione dell'utente autenticato.
     *
     * @return nome dell'organizzazione o null se non disponibile
     */
    String getOrganization();
}
