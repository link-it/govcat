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

public class ConnettoreConfigurazioneTimeout  {
  
  @Schema(example = "10000", required = true, description = "tempo massimo (in millisecondi) per instaurare una connessione")
 /**
   * tempo massimo (in millisecondi) per instaurare una connessione  
  **/
  private Integer connectionTimeout = null;
  
  @Schema(example = "150000", required = true, description = "tempo massimo (in millisecondi) per ricevere una risposta")
 /**
   * tempo massimo (in millisecondi) per ricevere una risposta  
  **/
  private Integer connectionReadTimeout = null;
  
  @Schema(example = "10000", required = true, description = "tempo medio (in millisecondi) atteso per ricevere una risposta")
 /**
   * tempo medio (in millisecondi) atteso per ricevere una risposta  
  **/
  private Integer tempoMedioRisposta = null;
 /**
   * tempo massimo (in millisecondi) per instaurare una connessione
   * @return connectionTimeout
  **/
  @JsonProperty("connection_timeout")
  @NotNull
  @Valid
  public Integer getConnectionTimeout() {
    return connectionTimeout;
  }

  public void setConnectionTimeout(Integer connectionTimeout) {
    this.connectionTimeout = connectionTimeout;
  }

  public ConnettoreConfigurazioneTimeout connectionTimeout(Integer connectionTimeout) {
    this.connectionTimeout = connectionTimeout;
    return this;
  }

 /**
   * tempo massimo (in millisecondi) per ricevere una risposta
   * @return connectionReadTimeout
  **/
  @JsonProperty("connection_read_timeout")
  @NotNull
  @Valid
  public Integer getConnectionReadTimeout() {
    return connectionReadTimeout;
  }

  public void setConnectionReadTimeout(Integer connectionReadTimeout) {
    this.connectionReadTimeout = connectionReadTimeout;
  }

  public ConnettoreConfigurazioneTimeout connectionReadTimeout(Integer connectionReadTimeout) {
    this.connectionReadTimeout = connectionReadTimeout;
    return this;
  }

 /**
   * tempo medio (in millisecondi) atteso per ricevere una risposta
   * @return tempoMedioRisposta
  **/
  @JsonProperty("tempo_medio_risposta")
  @NotNull
  @Valid
  public Integer getTempoMedioRisposta() {
    return tempoMedioRisposta;
  }

  public void setTempoMedioRisposta(Integer tempoMedioRisposta) {
    this.tempoMedioRisposta = tempoMedioRisposta;
  }

  public ConnettoreConfigurazioneTimeout tempoMedioRisposta(Integer tempoMedioRisposta) {
    this.tempoMedioRisposta = tempoMedioRisposta;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class ConnettoreConfigurazioneTimeout {\n");
    
    sb.append("    connectionTimeout: ").append(toIndentedString(connectionTimeout)).append("\n");
    sb.append("    connectionReadTimeout: ").append(toIndentedString(connectionReadTimeout)).append("\n");
    sb.append("    tempoMedioRisposta: ").append(toIndentedString(tempoMedioRisposta)).append("\n");
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
