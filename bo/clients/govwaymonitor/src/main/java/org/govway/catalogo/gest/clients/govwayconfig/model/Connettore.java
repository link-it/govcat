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

import org.govway.catalogo.gest.clients.govwayconfig.model.ConnettoreConfigurazioneHttpBasic;
import org.govway.catalogo.gest.clients.govwayconfig.model.ConnettoreConfigurazioneHttps;
import org.govway.catalogo.gest.clients.govwayconfig.model.ConnettoreConfigurazioneProxy;
import org.govway.catalogo.gest.clients.govwayconfig.model.ConnettoreConfigurazioneTimeout;
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

public class Connettore  {
  
  @Schema(example = "http://ente.it/servizio", required = true, description = "")
  private String endpoint = null;
  
  @Schema(description = "")
  private ConnettoreConfigurazioneHttpBasic autenticazioneHttp = null;
  
  @Schema(description = "")
  private ConnettoreConfigurazioneHttps autenticazioneHttps = null;
  
  @Schema(description = "")
  private ConnettoreConfigurazioneProxy proxy = null;
  
  @Schema(description = "")
  private ConnettoreConfigurazioneTimeout tempiRisposta = null;
  
  @Schema(description = "")
  private String tokenPolicy = null;
 /**
   * Get endpoint
   * @return endpoint
  **/
  @JsonProperty("endpoint")
  @NotNull
  @Valid
  public String getEndpoint() {
    return endpoint;
  }

  public void setEndpoint(String endpoint) {
    this.endpoint = endpoint;
  }

  public Connettore endpoint(String endpoint) {
    this.endpoint = endpoint;
    return this;
  }

 /**
   * Get autenticazioneHttp
   * @return autenticazioneHttp
  **/
  @JsonProperty("autenticazione_http")
  @Valid
  public ConnettoreConfigurazioneHttpBasic getAutenticazioneHttp() {
    return autenticazioneHttp;
  }

  public void setAutenticazioneHttp(ConnettoreConfigurazioneHttpBasic autenticazioneHttp) {
    this.autenticazioneHttp = autenticazioneHttp;
  }

  public Connettore autenticazioneHttp(ConnettoreConfigurazioneHttpBasic autenticazioneHttp) {
    this.autenticazioneHttp = autenticazioneHttp;
    return this;
  }

 /**
   * Get autenticazioneHttps
   * @return autenticazioneHttps
  **/
  @JsonProperty("autenticazione_https")
  @Valid
  public ConnettoreConfigurazioneHttps getAutenticazioneHttps() {
    return autenticazioneHttps;
  }

  public void setAutenticazioneHttps(ConnettoreConfigurazioneHttps autenticazioneHttps) {
    this.autenticazioneHttps = autenticazioneHttps;
  }

  public Connettore autenticazioneHttps(ConnettoreConfigurazioneHttps autenticazioneHttps) {
    this.autenticazioneHttps = autenticazioneHttps;
    return this;
  }

 /**
   * Get proxy
   * @return proxy
  **/
  @JsonProperty("proxy")
  @Valid
  public ConnettoreConfigurazioneProxy getProxy() {
    return proxy;
  }

  public void setProxy(ConnettoreConfigurazioneProxy proxy) {
    this.proxy = proxy;
  }

  public Connettore proxy(ConnettoreConfigurazioneProxy proxy) {
    this.proxy = proxy;
    return this;
  }

 /**
   * Get tempiRisposta
   * @return tempiRisposta
  **/
  @JsonProperty("tempi_risposta")
  @Valid
  public ConnettoreConfigurazioneTimeout getTempiRisposta() {
    return tempiRisposta;
  }

  public void setTempiRisposta(ConnettoreConfigurazioneTimeout tempiRisposta) {
    this.tempiRisposta = tempiRisposta;
  }

  public Connettore tempiRisposta(ConnettoreConfigurazioneTimeout tempiRisposta) {
    this.tempiRisposta = tempiRisposta;
    return this;
  }

 /**
   * Get tokenPolicy
   * @return tokenPolicy
  **/
  @JsonProperty("token_policy")
  @Valid
 @Pattern(regexp="^[_A-Za-z][._A-Za-z0-9]*$") @Size(max=255)  public String getTokenPolicy() {
    return tokenPolicy;
  }

  public void setTokenPolicy(String tokenPolicy) {
    this.tokenPolicy = tokenPolicy;
  }

  public Connettore tokenPolicy(String tokenPolicy) {
    this.tokenPolicy = tokenPolicy;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class Connettore {\n");
    
    sb.append("    endpoint: ").append(toIndentedString(endpoint)).append("\n");
    sb.append("    autenticazioneHttp: ").append(toIndentedString(autenticazioneHttp)).append("\n");
    sb.append("    autenticazioneHttps: ").append(toIndentedString(autenticazioneHttps)).append("\n");
    sb.append("    proxy: ").append(toIndentedString(proxy)).append("\n");
    sb.append("    tempiRisposta: ").append(toIndentedString(tempiRisposta)).append("\n");
    sb.append("    tokenPolicy: ").append(toIndentedString(tokenPolicy)).append("\n");
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
