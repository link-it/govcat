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

import org.govway.catalogo.gest.clients.govwayconfig.model.KeystoreEnum;
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

public class ConnettoreConfigurazioneHttpsServer  {
  
  @Schema(example = "/path/to/truststore", required = true, description = "")
  private String truststorePath = null;
  
  @Schema(required = true, description = "")
  private KeystoreEnum truststoreTipo = null;
  
  @Schema(example = "pwd", required = true, description = "")
  private String truststorePassword = null;
  
  @Schema(description = "")
  private String truststoreCrl = null;
  
  @Schema(example = "PKIX", description = "")
  private String algoritmo = "PKIX";
 /**
   * Get truststorePath
   * @return truststorePath
  **/
  @JsonProperty("truststore_path")
  @NotNull
  @Valid
 @Size(max=255)  public String getTruststorePath() {
    return truststorePath;
  }

  public void setTruststorePath(String truststorePath) {
    this.truststorePath = truststorePath;
  }

  public ConnettoreConfigurazioneHttpsServer truststorePath(String truststorePath) {
    this.truststorePath = truststorePath;
    return this;
  }

 /**
   * Get truststoreTipo
   * @return truststoreTipo
  **/
  @JsonProperty("truststore_tipo")
  @NotNull
  @Valid
  public KeystoreEnum getTruststoreTipo() {
    return truststoreTipo;
  }

  public void setTruststoreTipo(KeystoreEnum truststoreTipo) {
    this.truststoreTipo = truststoreTipo;
  }

  public ConnettoreConfigurazioneHttpsServer truststoreTipo(KeystoreEnum truststoreTipo) {
    this.truststoreTipo = truststoreTipo;
    return this;
  }

 /**
   * Get truststorePassword
   * @return truststorePassword
  **/
  @JsonProperty("truststore_password")
  @NotNull
  @Valid
  public String getTruststorePassword() {
    return truststorePassword;
  }

  public void setTruststorePassword(String truststorePassword) {
    this.truststorePassword = truststorePassword;
  }

  public ConnettoreConfigurazioneHttpsServer truststorePassword(String truststorePassword) {
    this.truststorePassword = truststorePassword;
    return this;
  }

 /**
   * Get truststoreCrl
   * @return truststoreCrl
  **/
  @JsonProperty("truststore_crl")
  @Valid
  public String getTruststoreCrl() {
    return truststoreCrl;
  }

  public void setTruststoreCrl(String truststoreCrl) {
    this.truststoreCrl = truststoreCrl;
  }

  public ConnettoreConfigurazioneHttpsServer truststoreCrl(String truststoreCrl) {
    this.truststoreCrl = truststoreCrl;
    return this;
  }

 /**
   * Get algoritmo
   * @return algoritmo
  **/
  @JsonProperty("algoritmo")
  @Valid
 @Size(max=255)  public String getAlgoritmo() {
    return algoritmo;
  }

  public void setAlgoritmo(String algoritmo) {
    this.algoritmo = algoritmo;
  }

  public ConnettoreConfigurazioneHttpsServer algoritmo(String algoritmo) {
    this.algoritmo = algoritmo;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class ConnettoreConfigurazioneHttpsServer {\n");
    
    sb.append("    truststorePath: ").append(toIndentedString(truststorePath)).append("\n");
    sb.append("    truststoreTipo: ").append(toIndentedString(truststoreTipo)).append("\n");
    sb.append("    truststorePassword: ").append(toIndentedString(truststorePassword)).append("\n");
    sb.append("    truststoreCrl: ").append(toIndentedString(truststoreCrl)).append("\n");
    sb.append("    algoritmo: ").append(toIndentedString(algoritmo)).append("\n");
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
