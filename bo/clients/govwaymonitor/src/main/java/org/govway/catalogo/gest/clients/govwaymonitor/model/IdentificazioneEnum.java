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
package org.govway.catalogo.gest.clients.govwaymonitor.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Gets or Sets IdentificazioneEnum
 */
public enum IdentificazioneEnum {
	EROGAZIONE_SOGGETTO("erogazione_soggetto"),
	FRUIZIONE_APPLICATIVO("fruizione_applicativo"),
	EROGAZIONE_APPLICATIVO("erogazione_applicativo"),
	IDENTIFICATIVO_AUTENTICATO("identificativo_autenticato"),
	EROGAZIONE_TOKEN_INFO("erogazione_token_info"),
	TOKEN_INFO("token_info"),
	INDIRIZZO_IP("indirizzo_ip");

  private String value;

  IdentificazioneEnum(String value) {
    this.value = value;
  }

  @Override
  @JsonValue
  public String toString() {
    return String.valueOf(value);
  }

  @JsonCreator
  public static IdentificazioneEnum fromValue(String text) {
    for (IdentificazioneEnum b : IdentificazioneEnum.values()) {
      if (String.valueOf(b.value).equals(text)) {
        return b;
      }
    }
    return null;
  }
}