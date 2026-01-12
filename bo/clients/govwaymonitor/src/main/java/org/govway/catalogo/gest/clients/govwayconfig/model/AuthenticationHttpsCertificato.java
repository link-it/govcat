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

import org.govway.catalogo.gest.clients.govwayconfig.model.TipoAutenticazioneHttps;
import org.govway.catalogo.gest.clients.govwayconfig.model.TipoKeystore;
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

public class AuthenticationHttpsCertificato  implements OneOfAuthenticationHttpsCertificato {
  
  @Schema(required = true, description = "")
  private TipoAutenticazioneHttps tipo = null;
  
  @Schema(required = true, description = "")
  private byte[] archivio = null;
  
  @Schema(example = "alias", description = "")
  private String alias = null;
  
  @Schema(example = "changeit", description = "")
  private String password = null;
  
  @Schema(required = true, description = "")
  private TipoKeystore tipoCertificato = null;
  
  @Schema(example = "false", description = "")
  private Boolean strictVerification = false;
 /**
   * Get tipo
   * @return tipo
  **/
  @JsonProperty("tipo")
  @NotNull
  @Valid
  public TipoAutenticazioneHttps getTipo() {
    return tipo;
  }

  public void setTipo(TipoAutenticazioneHttps tipo) {
    this.tipo = tipo;
  }

  public AuthenticationHttpsCertificato tipo(TipoAutenticazioneHttps tipo) {
    this.tipo = tipo;
    return this;
  }

 /**
   * Get archivio
   * @return archivio
  **/
  @JsonProperty("archivio")
  @NotNull
  @Valid
  public byte[] getArchivio() {
    return archivio;
  }

  public void setArchivio(byte[] archivio) {
    this.archivio = archivio;
  }

  public AuthenticationHttpsCertificato archivio(byte[] archivio) {
    this.archivio = archivio;
    return this;
  }

 /**
   * Get alias
   * @return alias
  **/
  @JsonProperty("alias")
  @Valid
 @Size(max=255)  public String getAlias() {
    return alias;
  }

  public void setAlias(String alias) {
    this.alias = alias;
  }

  public AuthenticationHttpsCertificato alias(String alias) {
    this.alias = alias;
    return this;
  }

 /**
   * Get password
   * @return password
  **/
  @JsonProperty("password")
  @Valid
 @Size(max=255)  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }

  public AuthenticationHttpsCertificato password(String password) {
    this.password = password;
    return this;
  }

 /**
   * Get tipoCertificato
   * @return tipoCertificato
  **/
  @JsonProperty("tipo_certificato")
  @NotNull
  @Valid
  public TipoKeystore getTipoCertificato() {
    return tipoCertificato;
  }

  public void setTipoCertificato(TipoKeystore tipoCertificato) {
    this.tipoCertificato = tipoCertificato;
  }

  public AuthenticationHttpsCertificato tipoCertificato(TipoKeystore tipoCertificato) {
    this.tipoCertificato = tipoCertificato;
    return this;
  }

 /**
   * Get strictVerification
   * @return strictVerification
  **/
  @JsonProperty("strict_verification")
  @Valid
  public Boolean isStrictVerification() {
    return strictVerification;
  }

  public void setStrictVerification(Boolean strictVerification) {
    this.strictVerification = strictVerification;
  }

  public AuthenticationHttpsCertificato strictVerification(Boolean strictVerification) {
    this.strictVerification = strictVerification;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class AuthenticationHttpsCertificato {\n");
    
    sb.append("    tipo: ").append(toIndentedString(tipo)).append("\n");
    sb.append("    archivio: ").append(toIndentedString(archivio)).append("\n");
    sb.append("    alias: ").append(toIndentedString(alias)).append("\n");
    sb.append("    password: ").append(toIndentedString(password)).append("\n");
    sb.append("    tipoCertificato: ").append(toIndentedString(tipoCertificato)).append("\n");
    sb.append("    strictVerification: ").append(toIndentedString(strictVerification)).append("\n");
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
