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

import org.govway.catalogo.gest.clients.govwayconfig.model.ApiCanale;
import org.govway.catalogo.gest.clients.govwayconfig.model.ApiImplItem;
import org.govway.catalogo.gest.clients.govwayconfig.model.StatoApiEnum;
import org.govway.catalogo.gest.clients.govwayconfig.model.TipoApiEnum;
import java.util.List;
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

public class ApiImplViewItem extends ApiImplItem {
  
  @Schema(required = true, description = "")
  private String urlInvocazione = null;
  
  @Schema(required = true, description = "")
  private String connettore = null;
  
  @Schema(required = true, description = "")
  private String gestioneCors = null;
 /**
   * Get urlInvocazione
   * @return urlInvocazione
  **/
  @JsonProperty("url_invocazione")
  @NotNull
  @Valid
  public String getUrlInvocazione() {
    return urlInvocazione;
  }

  public void setUrlInvocazione(String urlInvocazione) {
    this.urlInvocazione = urlInvocazione;
  }

  public ApiImplViewItem urlInvocazione(String urlInvocazione) {
    this.urlInvocazione = urlInvocazione;
    return this;
  }

 /**
   * Get connettore
   * @return connettore
  **/
  @JsonProperty("connettore")
  @NotNull
  @Valid
  public String getConnettore() {
    return connettore;
  }

  public void setConnettore(String connettore) {
    this.connettore = connettore;
  }

  public ApiImplViewItem connettore(String connettore) {
    this.connettore = connettore;
    return this;
  }

 /**
   * Get gestioneCors
   * @return gestioneCors
  **/
  @JsonProperty("gestione_cors")
  @NotNull
  @Valid
  public String getGestioneCors() {
    return gestioneCors;
  }

  public void setGestioneCors(String gestioneCors) {
    this.gestioneCors = gestioneCors;
  }

  public ApiImplViewItem gestioneCors(String gestioneCors) {
    this.gestioneCors = gestioneCors;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class ApiImplViewItem {\n");
    sb.append("    ").append(toIndentedString(super.toString())).append("\n");
    sb.append("    urlInvocazione: ").append(toIndentedString(urlInvocazione)).append("\n");
    sb.append("    connettore: ").append(toIndentedString(connettore)).append("\n");
    sb.append("    gestioneCors: ").append(toIndentedString(gestioneCors)).append("\n");
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
