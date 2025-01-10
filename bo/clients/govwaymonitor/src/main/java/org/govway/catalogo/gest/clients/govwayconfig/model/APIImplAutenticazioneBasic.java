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
package org.govway.catalogo.gest.clients.govwayconfig.model;

import org.govway.catalogo.gest.clients.govwayconfig.model.TipoAutenticazioneEnum;
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

public class APIImplAutenticazioneBasic  implements OneOfAPIImplAutenticazione, OneOfControlloAccessiAutenticazioneAutenticazione, OneOfGruppoNuovaConfigurazioneAutenticazione {
  
  @Schema(required = true, description = "")
  private TipoAutenticazioneEnum tipo = null;
  
  @Schema(example = "false", description = "")
  private Boolean forward = false;
  
  @Schema(example = "false", description = "")
  private Boolean opzionale = false;
 /**
   * Get tipo
   * @return tipo
  **/
  @JsonProperty("tipo")
  @NotNull
  @Valid
  public TipoAutenticazioneEnum getTipo() {
    return tipo;
  }

  public void setTipo(TipoAutenticazioneEnum tipo) {
    this.tipo = tipo;
  }

  public APIImplAutenticazioneBasic tipo(TipoAutenticazioneEnum tipo) {
    this.tipo = tipo;
    return this;
  }

 /**
   * Get forward
   * @return forward
  **/
  @JsonProperty("forward")
  @Valid
  public Boolean isForward() {
    return forward;
  }

  public void setForward(Boolean forward) {
    this.forward = forward;
  }

  public APIImplAutenticazioneBasic forward(Boolean forward) {
    this.forward = forward;
    return this;
  }

 /**
   * Get opzionale
   * @return opzionale
  **/
  @JsonProperty("opzionale")
  @Valid
  public Boolean isOpzionale() {
    return opzionale;
  }

  public void setOpzionale(Boolean opzionale) {
    this.opzionale = opzionale;
  }

  public APIImplAutenticazioneBasic opzionale(Boolean opzionale) {
    this.opzionale = opzionale;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class APIImplAutenticazioneBasic {\n");
    
    sb.append("    tipo: ").append(toIndentedString(tipo)).append("\n");
    sb.append("    forward: ").append(toIndentedString(forward)).append("\n");
    sb.append("    opzionale: ").append(toIndentedString(opzionale)).append("\n");
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
