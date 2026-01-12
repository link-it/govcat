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

import org.govway.catalogo.gest.clients.govwayconfig.model.ConnettoreConfigurazioneHttpsClient;
import org.govway.catalogo.gest.clients.govwayconfig.model.ConnettoreConfigurazioneHttpsServer;
import org.govway.catalogo.gest.clients.govwayconfig.model.SslTipologiaEnum;
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

public class ConnettoreConfigurazioneHttps  {
  
  @Schema(required = true, description = "")
  private SslTipologiaEnum tipologia = null;
  
  @Schema(example = "false", description = "")
  private Boolean hostnameVerifier = true;
  
  @Schema(example = "false", description = "")
  private Boolean trustAllServerCerts = false;
  
  @Schema(description = "")
  private ConnettoreConfigurazioneHttpsServer server = null;
  
  @Schema(description = "")
  private ConnettoreConfigurazioneHttpsClient client = null;
 /**
   * Get tipologia
   * @return tipologia
  **/
  @JsonProperty("tipologia")
  @NotNull
  @Valid
  public SslTipologiaEnum getTipologia() {
    return tipologia;
  }

  public void setTipologia(SslTipologiaEnum tipologia) {
    this.tipologia = tipologia;
  }

  public ConnettoreConfigurazioneHttps tipologia(SslTipologiaEnum tipologia) {
    this.tipologia = tipologia;
    return this;
  }

 /**
   * Get hostnameVerifier
   * @return hostnameVerifier
  **/
  @JsonProperty("hostname_verifier")
  @Valid
  public Boolean isHostnameVerifier() {
    return hostnameVerifier;
  }

  public void setHostnameVerifier(Boolean hostnameVerifier) {
    this.hostnameVerifier = hostnameVerifier;
  }

  public ConnettoreConfigurazioneHttps hostnameVerifier(Boolean hostnameVerifier) {
    this.hostnameVerifier = hostnameVerifier;
    return this;
  }

 /**
   * Get trustAllServerCerts
   * @return trustAllServerCerts
  **/
  @JsonProperty("trust_all_server_certs")
  @Valid
  public Boolean isTrustAllServerCerts() {
    return trustAllServerCerts;
  }

  public void setTrustAllServerCerts(Boolean trustAllServerCerts) {
    this.trustAllServerCerts = trustAllServerCerts;
  }

  public ConnettoreConfigurazioneHttps trustAllServerCerts(Boolean trustAllServerCerts) {
    this.trustAllServerCerts = trustAllServerCerts;
    return this;
  }

 /**
   * Get server
   * @return server
  **/
  @JsonProperty("server")
  @Valid
  public ConnettoreConfigurazioneHttpsServer getServer() {
    return server;
  }

  public void setServer(ConnettoreConfigurazioneHttpsServer server) {
    this.server = server;
  }

  public ConnettoreConfigurazioneHttps server(ConnettoreConfigurazioneHttpsServer server) {
    this.server = server;
    return this;
  }

 /**
   * Get client
   * @return client
  **/
  @JsonProperty("client")
  @Valid
  public ConnettoreConfigurazioneHttpsClient getClient() {
    return client;
  }

  public void setClient(ConnettoreConfigurazioneHttpsClient client) {
    this.client = client;
  }

  public ConnettoreConfigurazioneHttps client(ConnettoreConfigurazioneHttpsClient client) {
    this.client = client;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class ConnettoreConfigurazioneHttps {\n");
    
    sb.append("    tipologia: ").append(toIndentedString(tipologia)).append("\n");
    sb.append("    hostnameVerifier: ").append(toIndentedString(hostnameVerifier)).append("\n");
    sb.append("    trustAllServerCerts: ").append(toIndentedString(trustAllServerCerts)).append("\n");
    sb.append("    server: ").append(toIndentedString(server)).append("\n");
    sb.append("    client: ").append(toIndentedString(client)).append("\n");
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
