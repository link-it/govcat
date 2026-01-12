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
package org.govway.catalogo.gest.clients.govwayconfig.model;

import org.govway.catalogo.gest.clients.govwayconfig.model.ApiImplConfigurazioneStato;
import javax.validation.constraints.*;

import io.swagger.v3.oas.annotations.media.Schema;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlType;
import javax.xml.bind.annotation.XmlEnum;
import javax.xml.bind.annotation.XmlEnumValue;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonValue;
import com.fasterxml.jackson.annotation.JsonCreator;

import javax.validation.Valid;

public class CorrelazioneApplicativaBase extends ApiImplConfigurazioneStato {
  
  @Schema(description = "")
  private String elemento = null;
  
  @Schema(description = "")
  private Boolean generazioneErroreIdentificazioneFallita = true;
 /**
   * Get elemento
   * @return elemento
  **/
  @JsonProperty("elemento")
  @Valid
 @Size(max=255)  public String getElemento() {
    return elemento;
  }

  public void setElemento(String elemento) {
    this.elemento = elemento;
  }

  public CorrelazioneApplicativaBase elemento(String elemento) {
    this.elemento = elemento;
    return this;
  }

 /**
   * Get generazioneErroreIdentificazioneFallita
   * @return generazioneErroreIdentificazioneFallita
  **/
  @JsonProperty("generazione_errore_identificazione_fallita")
  @Valid
  public Boolean isGenerazioneErroreIdentificazioneFallita() {
    return generazioneErroreIdentificazioneFallita;
  }

  public void setGenerazioneErroreIdentificazioneFallita(Boolean generazioneErroreIdentificazioneFallita) {
    this.generazioneErroreIdentificazioneFallita = generazioneErroreIdentificazioneFallita;
  }

  public CorrelazioneApplicativaBase generazioneErroreIdentificazioneFallita(Boolean generazioneErroreIdentificazioneFallita) {
    this.generazioneErroreIdentificazioneFallita = generazioneErroreIdentificazioneFallita;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class CorrelazioneApplicativaBase {\n");
    sb.append("    ").append(toIndentedString(super.toString())).append("\n");
    sb.append("    elemento: ").append(toIndentedString(elemento)).append("\n");
    sb.append("    generazioneErroreIdentificazioneFallita: ").append(toIndentedString(generazioneErroreIdentificazioneFallita)).append("\n");
    sb.append("}");
    return sb.toString();
  }

  /**
   * Convert the given object to string with each line indented by 4 spaces
   * (except the first line).
   */
  private static String toIndentedString(java.lang.Object o) {
    if (o == null) {
      return "null";
    }
    return o.toString().replace("\n", "\n    ");
  }
}
