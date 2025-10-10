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

import org.govway.catalogo.gest.clients.govwayconfig.model.GestioneCorsAccessControl;
import org.govway.catalogo.gest.clients.govwayconfig.model.TipoGestioneCorsEnum;
import jakarta.validation.constraints.*;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;
import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlType;
import jakarta.xml.bind.annotation.XmlEnum;
import jakarta.xml.bind.annotation.XmlEnumValue;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonValue;
import com.fasterxml.jackson.annotation.JsonCreator;

import jakarta.validation.Valid;

public class GestioneCors  {
  
  @Schema(required = true, description = "")
  private Boolean ridefinito = false;
  
  @Schema(description = "")
  private TipoGestioneCorsEnum tipo = null;
  
  @Schema(description = "")
  private GestioneCorsAccessControl accessControl = null;
 /**
   * Get ridefinito
   * @return ridefinito
  **/
  @JsonProperty("ridefinito")
  @NotNull
  @Valid
  public Boolean isRidefinito() {
    return ridefinito;
  }

  public void setRidefinito(Boolean ridefinito) {
    this.ridefinito = ridefinito;
  }

  public GestioneCors ridefinito(Boolean ridefinito) {
    this.ridefinito = ridefinito;
    return this;
  }

 /**
   * Get tipo
   * @return tipo
  **/
  @JsonProperty("tipo")
  @Valid
  public TipoGestioneCorsEnum getTipo() {
    return tipo;
  }

  public void setTipo(TipoGestioneCorsEnum tipo) {
    this.tipo = tipo;
  }

  public GestioneCors tipo(TipoGestioneCorsEnum tipo) {
    this.tipo = tipo;
    return this;
  }

 /**
   * Get accessControl
   * @return accessControl
  **/
  @JsonProperty("access_control")
  @Valid
  public GestioneCorsAccessControl getAccessControl() {
    return accessControl;
  }

  public void setAccessControl(GestioneCorsAccessControl accessControl) {
    this.accessControl = accessControl;
  }

  public GestioneCors accessControl(GestioneCorsAccessControl accessControl) {
    this.accessControl = accessControl;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class GestioneCors {\n");
    
    sb.append("    ridefinito: ").append(toIndentedString(ridefinito)).append("\n");
    sb.append("    tipo: ").append(toIndentedString(tipo)).append("\n");
    sb.append("    accessControl: ").append(toIndentedString(accessControl)).append("\n");
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
