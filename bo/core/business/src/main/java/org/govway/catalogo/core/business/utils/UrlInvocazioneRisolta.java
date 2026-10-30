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
 * URL di invocazione di una API gia` risolta (placeholder sostituiti) per un ambiente, con
 * l'identificativo e l'etichetta della voce di configurazione da cui deriva.
 *
 * L'identificativo {@value EServiceBuilder#ID_URL_INVOCAZIONE_DEFAULT} indica la URL
 * predefinita, risolta dalla gerarchia api -> servizio -> dominio -> soggetto referente ->
 * configurazione; la sua etichetta e` quella configurata in etichetta_default, se presente.
 */
public record UrlInvocazioneRisolta(String identificativo, String etichetta, String url) {
}
