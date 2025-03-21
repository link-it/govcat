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
package org.govway.catalogo.authorization;

import org.govway.catalogo.core.orm.entity.ProfiloEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity.Ruolo;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.servlets.model.ProfiloCreate;
import org.govway.catalogo.servlets.model.ProfiloUpdate;

public class ProfiloAuthorization extends  DefaultAuthorization<ProfiloCreate, ProfiloUpdate, ProfiloEntity> {

    public void authorizeCreateDominioAssociation() {
        try {
            this.coreAuthorization.requireAdmin();
        } catch (NotAuthorizedException e) {
            throw new NotAuthorizedException("Una associazione tra Dominio e Profilo può essere creata solo con Ruolo " + Ruolo.AMMINISTRATORE);
        }
    }

    public void authorizeCreateSoggettoAssociation() {
        try {
            this.coreAuthorization.requireAdmin();
        } catch (NotAuthorizedException e) {
            throw new NotAuthorizedException("Una associazione tra Soggetto e Profilo può essere creata solo con Ruolo " + Ruolo.AMMINISTRATORE);
        }
    }

    public void authorizeDeleteDominioAssociation() {
        try {
            this.coreAuthorization.requireAdmin();
        } catch (NotAuthorizedException e) {
            throw new NotAuthorizedException("Una associazione tra Dominio e Profilo può essere eliminata solo con Ruolo " + Ruolo.AMMINISTRATORE);
        }
    }

    public void authorizeDeleteSoggettoAssociation() {
        try {
            this.coreAuthorization.requireAdmin();
        } catch (NotAuthorizedException e) {
            throw new NotAuthorizedException("Una associazione tra Soggetto e Profilo può essere eliminata solo con Ruolo " + Ruolo.AMMINISTRATORE);
        }
    }
}
