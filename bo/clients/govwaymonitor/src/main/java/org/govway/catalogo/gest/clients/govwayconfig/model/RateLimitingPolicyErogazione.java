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

import org.govway.catalogo.gest.clients.govwayconfig.model.RateLimitingPolicyBaseConIdentificazione;
import org.govway.catalogo.gest.clients.govwayconfig.model.RateLimitingPolicyFiltroErogazione;
import org.govway.catalogo.gest.clients.govwayconfig.model.RateLimitingPolicyGroupBy;
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

public class RateLimitingPolicyErogazione extends RateLimitingPolicyBaseConIdentificazione {
  
  @Schema(description = "")
  private RateLimitingPolicyFiltroErogazione filtro = null;
  
  @Schema(description = "")
  private RateLimitingPolicyGroupBy raggruppamento = null;
 /**
   * Get filtro
   * @return filtro
  **/
  @JsonProperty("filtro")
  @Valid
  public RateLimitingPolicyFiltroErogazione getFiltro() {
    return filtro;
  }

  public void setFiltro(RateLimitingPolicyFiltroErogazione filtro) {
    this.filtro = filtro;
  }

  public RateLimitingPolicyErogazione filtro(RateLimitingPolicyFiltroErogazione filtro) {
    this.filtro = filtro;
    return this;
  }

 /**
   * Get raggruppamento
   * @return raggruppamento
  **/
  @JsonProperty("raggruppamento")
  @Valid
  public RateLimitingPolicyGroupBy getRaggruppamento() {
    return raggruppamento;
  }

  public void setRaggruppamento(RateLimitingPolicyGroupBy raggruppamento) {
    this.raggruppamento = raggruppamento;
  }

  public RateLimitingPolicyErogazione raggruppamento(RateLimitingPolicyGroupBy raggruppamento) {
    this.raggruppamento = raggruppamento;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class RateLimitingPolicyErogazione {\n");
    sb.append("    ").append(toIndentedString(super.toString())).append("\n");
    sb.append("    filtro: ").append(toIndentedString(filtro)).append("\n");
    sb.append("    raggruppamento: ").append(toIndentedString(raggruppamento)).append("\n");
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
