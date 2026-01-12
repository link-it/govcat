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

import org.govway.catalogo.gest.clients.govwayconfig.model.ApiInterfaccia;
import org.govway.catalogo.gest.clients.govwayconfig.model.BaseItem;
import org.govway.catalogo.gest.clients.govwayconfig.model.ProfiloEnum;
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

public class ApiInterfacciaView extends BaseItem {
  
  @Schema(required = true, description = "")
  private byte[] interfaccia = null;
  
  @Schema(required = true, description = "")
  @com.fasterxml.jackson.annotation.JsonTypeInfo(use = com.fasterxml.jackson.annotation.JsonTypeInfo.Id.NAME, include = com.fasterxml.jackson.annotation.JsonTypeInfo.As.EXISTING_PROPERTY, property = "protocollo", visible = true )
  @com.fasterxml.jackson.annotation.JsonSubTypes({
    @com.fasterxml.jackson.annotation.JsonSubTypes.Type(value = ApiInterfacciaRest.class, name = "rest"),
    @com.fasterxml.jackson.annotation.JsonSubTypes.Type(value = ApiInterfacciaSoap.class, name = "soap")  })
  private OneOfApiInterfacciaViewTipoInterfaccia tipoInterfaccia = null;
 /**
   * Get interfaccia
   * @return interfaccia
  **/
  @JsonProperty("interfaccia")
  @NotNull
  @Valid
  public byte[] getInterfaccia() {
    return interfaccia;
  }

  public void setInterfaccia(byte[] interfaccia) {
    this.interfaccia = interfaccia;
  }

  public ApiInterfacciaView interfaccia(byte[] interfaccia) {
    this.interfaccia = interfaccia;
    return this;
  }

 /**
   * Get tipoInterfaccia
   * @return tipoInterfaccia
  **/
  @JsonProperty("tipo_interfaccia")
  @NotNull
  @Valid
  public OneOfApiInterfacciaViewTipoInterfaccia getTipoInterfaccia() {
    return tipoInterfaccia;
  }

  public void setTipoInterfaccia(OneOfApiInterfacciaViewTipoInterfaccia tipoInterfaccia) {
    this.tipoInterfaccia = tipoInterfaccia;
  }

  public ApiInterfacciaView tipoInterfaccia(OneOfApiInterfacciaViewTipoInterfaccia tipoInterfaccia) {
    this.tipoInterfaccia = tipoInterfaccia;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class ApiInterfacciaView {\n");
    sb.append("    ").append(toIndentedString(super.toString())).append("\n");
    sb.append("    interfaccia: ").append(toIndentedString(interfaccia)).append("\n");
    sb.append("    tipoInterfaccia: ").append(toIndentedString(tipoInterfaccia)).append("\n");
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
