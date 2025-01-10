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

import org.govway.catalogo.gest.clients.govwayconfig.model.RateLimitingCriteriIntervalloEnum;
import org.govway.catalogo.gest.clients.govwayconfig.model.RateLimitingCriteriMetricaEnum;
import org.govway.catalogo.gest.clients.govwayconfig.model.RateLimitingIdentificazionePolicyEnum;
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

public class RateLimitingPolicyCriteri  implements OneOfRateLimitingPolicyBaseConIdentificazioneConfigurazione {
  
  @Schema(required = true, description = "")
  private RateLimitingIdentificazionePolicyEnum identificazione = null;
  
  @Schema(required = true, description = "")
  private RateLimitingCriteriMetricaEnum metrica = null;
  
  @Schema(description = "")
  private RateLimitingCriteriIntervalloEnum intervallo = null;
  
  @Schema(example = "false", description = "")
  private Boolean congestione = false;
  
  @Schema(example = "false", description = "")
  private Boolean degrado = false;
 /**
   * Get identificazione
   * @return identificazione
  **/
  @JsonProperty("identificazione")
  @NotNull
  @Valid
  public RateLimitingIdentificazionePolicyEnum getIdentificazione() {
    return identificazione;
  }

  public void setIdentificazione(RateLimitingIdentificazionePolicyEnum identificazione) {
    this.identificazione = identificazione;
  }

  public RateLimitingPolicyCriteri identificazione(RateLimitingIdentificazionePolicyEnum identificazione) {
    this.identificazione = identificazione;
    return this;
  }

 /**
   * Get metrica
   * @return metrica
  **/
  @JsonProperty("metrica")
  @NotNull
  @Valid
  public RateLimitingCriteriMetricaEnum getMetrica() {
    return metrica;
  }

  public void setMetrica(RateLimitingCriteriMetricaEnum metrica) {
    this.metrica = metrica;
  }

  public RateLimitingPolicyCriteri metrica(RateLimitingCriteriMetricaEnum metrica) {
    this.metrica = metrica;
    return this;
  }

 /**
   * Get intervallo
   * @return intervallo
  **/
  @JsonProperty("intervallo")
  @Valid
  public RateLimitingCriteriIntervalloEnum getIntervallo() {
    return intervallo;
  }

  public void setIntervallo(RateLimitingCriteriIntervalloEnum intervallo) {
    this.intervallo = intervallo;
  }

  public RateLimitingPolicyCriteri intervallo(RateLimitingCriteriIntervalloEnum intervallo) {
    this.intervallo = intervallo;
    return this;
  }

 /**
   * Get congestione
   * @return congestione
  **/
  @JsonProperty("congestione")
  @Valid
  public Boolean isCongestione() {
    return congestione;
  }

  public void setCongestione(Boolean congestione) {
    this.congestione = congestione;
  }

  public RateLimitingPolicyCriteri congestione(Boolean congestione) {
    this.congestione = congestione;
    return this;
  }

 /**
   * Get degrado
   * @return degrado
  **/
  @JsonProperty("degrado")
  @Valid
  public Boolean isDegrado() {
    return degrado;
  }

  public void setDegrado(Boolean degrado) {
    this.degrado = degrado;
  }

  public RateLimitingPolicyCriteri degrado(Boolean degrado) {
    this.degrado = degrado;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class RateLimitingPolicyCriteri {\n");
    
    sb.append("    identificazione: ").append(toIndentedString(identificazione)).append("\n");
    sb.append("    metrica: ").append(toIndentedString(metrica)).append("\n");
    sb.append("    intervallo: ").append(toIndentedString(intervallo)).append("\n");
    sb.append("    congestione: ").append(toIndentedString(congestione)).append("\n");
    sb.append("    degrado: ").append(toIndentedString(degrado)).append("\n");
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
