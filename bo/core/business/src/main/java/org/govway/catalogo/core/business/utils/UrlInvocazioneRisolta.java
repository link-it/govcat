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
 * URL di invocazione di una API gia` risolta (placeholder sostituiti) per un ambiente.
 *
 * L'etichetta e` valorizzata solo per le URL aggiuntive (dalla seconda in poi): la URL
 * principale, risolta dalla gerarchia api -> servizio -> dominio -> soggetto referente ->
 * configurazione, non ha etichetta.
 */
public record UrlInvocazioneRisolta(String etichetta, String url) {
}
