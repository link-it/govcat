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

public class CachingRispostaRegola  {
  
  @Schema(description = "")
  private Integer returnCodeMin = null;
  
  @Schema(description = "")
  private Integer returnCodeMax = null;
  
  @Schema(description = "")
  private Boolean fault = false;
  
  @Schema(description = "")
  private Integer cacheTimeoutSeconds = null;
 /**
   * Get returnCodeMin
   * @return returnCodeMin
  **/
  @JsonProperty("return-code-min")
  @Valid
  public Integer getReturnCodeMin() {
    return returnCodeMin;
  }

  public void setReturnCodeMin(Integer returnCodeMin) {
    this.returnCodeMin = returnCodeMin;
  }

  public CachingRispostaRegola returnCodeMin(Integer returnCodeMin) {
    this.returnCodeMin = returnCodeMin;
    return this;
  }

 /**
   * Get returnCodeMax
   * @return returnCodeMax
  **/
  @JsonProperty("return-code-max")
  @Valid
  public Integer getReturnCodeMax() {
    return returnCodeMax;
  }

  public void setReturnCodeMax(Integer returnCodeMax) {
    this.returnCodeMax = returnCodeMax;
  }

  public CachingRispostaRegola returnCodeMax(Integer returnCodeMax) {
    this.returnCodeMax = returnCodeMax;
    return this;
  }

 /**
   * Get fault
   * @return fault
  **/
  @JsonProperty("fault")
  @Valid
  public Boolean isFault() {
    return fault;
  }

  public void setFault(Boolean fault) {
    this.fault = fault;
  }

  public CachingRispostaRegola fault(Boolean fault) {
    this.fault = fault;
    return this;
  }

 /**
   * Get cacheTimeoutSeconds
   * @return cacheTimeoutSeconds
  **/
  @JsonProperty("cache_timeout_seconds")
  @Valid
  public Integer getCacheTimeoutSeconds() {
    return cacheTimeoutSeconds;
  }

  public void setCacheTimeoutSeconds(Integer cacheTimeoutSeconds) {
    this.cacheTimeoutSeconds = cacheTimeoutSeconds;
  }

  public CachingRispostaRegola cacheTimeoutSeconds(Integer cacheTimeoutSeconds) {
    this.cacheTimeoutSeconds = cacheTimeoutSeconds;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class CachingRispostaRegola {\n");
    
    sb.append("    returnCodeMin: ").append(toIndentedString(returnCodeMin)).append("\n");
    sb.append("    returnCodeMax: ").append(toIndentedString(returnCodeMax)).append("\n");
    sb.append("    fault: ").append(toIndentedString(fault)).append("\n");
    sb.append("    cacheTimeoutSeconds: ").append(toIndentedString(cacheTimeoutSeconds)).append("\n");
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
