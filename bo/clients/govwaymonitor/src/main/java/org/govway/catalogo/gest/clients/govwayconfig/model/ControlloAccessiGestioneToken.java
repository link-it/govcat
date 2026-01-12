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

import org.govway.catalogo.gest.clients.govwayconfig.model.ApiImplConfigurazioneStato;
import org.govway.catalogo.gest.clients.govwayconfig.model.StatoFunzionalitaConWarningEnum;
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

public class ControlloAccessiGestioneToken extends ApiImplConfigurazioneStato {
  
  @Schema(description = "indica se la gestione del token è abilitata o meno")
 /**
   * indica se la gestione del token è abilitata o meno  
  **/
  private Boolean abilitato = null;
  
  @Schema(description = "identificativo della Policy da utilizzare per la gestione del token")
 /**
   * identificativo della Policy da utilizzare per la gestione del token  
  **/
  private String policy = null;
  
  @Schema(description = "indica se la presenza del token è obbligatoria o opzionale")
 /**
   * indica se la presenza del token è obbligatoria o opzionale  
  **/
  private Boolean tokenOpzionale = false;
  
  @Schema(description = "")
  private StatoFunzionalitaConWarningEnum validazioneJwt = null;
  
  @Schema(description = "")
  private StatoFunzionalitaConWarningEnum introspection = null;
  
  @Schema(description = "")
  private StatoFunzionalitaConWarningEnum userInfo = null;
  
  @Schema(description = "indica se il forward del token, nelle modalità descritte nella policy, è attivo o meno")
 /**
   * indica se il forward del token, nelle modalità descritte nella policy, è attivo o meno  
  **/
  private Boolean tokenForward = true;
 /**
   * indica se la gestione del token è abilitata o meno
   * @return abilitato
  **/
  @JsonProperty("abilitato")
  @Valid
  public Boolean isAbilitato() {
    return abilitato;
  }

  public void setAbilitato(Boolean abilitato) {
    this.abilitato = abilitato;
  }

  public ControlloAccessiGestioneToken abilitato(Boolean abilitato) {
    this.abilitato = abilitato;
    return this;
  }

 /**
   * identificativo della Policy da utilizzare per la gestione del token
   * @return policy
  **/
  @JsonProperty("policy")
  @Valid
 @Size(max=255)  public String getPolicy() {
    return policy;
  }

  public void setPolicy(String policy) {
    this.policy = policy;
  }

  public ControlloAccessiGestioneToken policy(String policy) {
    this.policy = policy;
    return this;
  }

 /**
   * indica se la presenza del token è obbligatoria o opzionale
   * @return tokenOpzionale
  **/
  @JsonProperty("token_opzionale")
  @Valid
  public Boolean isTokenOpzionale() {
    return tokenOpzionale;
  }

  public void setTokenOpzionale(Boolean tokenOpzionale) {
    this.tokenOpzionale = tokenOpzionale;
  }

  public ControlloAccessiGestioneToken tokenOpzionale(Boolean tokenOpzionale) {
    this.tokenOpzionale = tokenOpzionale;
    return this;
  }

 /**
   * Get validazioneJwt
   * @return validazioneJwt
  **/
  @JsonProperty("validazione_jwt")
  @Valid
  public StatoFunzionalitaConWarningEnum getValidazioneJwt() {
    return validazioneJwt;
  }

  public void setValidazioneJwt(StatoFunzionalitaConWarningEnum validazioneJwt) {
    this.validazioneJwt = validazioneJwt;
  }

  public ControlloAccessiGestioneToken validazioneJwt(StatoFunzionalitaConWarningEnum validazioneJwt) {
    this.validazioneJwt = validazioneJwt;
    return this;
  }

 /**
   * Get introspection
   * @return introspection
  **/
  @JsonProperty("introspection")
  @Valid
  public StatoFunzionalitaConWarningEnum getIntrospection() {
    return introspection;
  }

  public void setIntrospection(StatoFunzionalitaConWarningEnum introspection) {
    this.introspection = introspection;
  }

  public ControlloAccessiGestioneToken introspection(StatoFunzionalitaConWarningEnum introspection) {
    this.introspection = introspection;
    return this;
  }

 /**
   * Get userInfo
   * @return userInfo
  **/
  @JsonProperty("user_info")
  @Valid
  public StatoFunzionalitaConWarningEnum getUserInfo() {
    return userInfo;
  }

  public void setUserInfo(StatoFunzionalitaConWarningEnum userInfo) {
    this.userInfo = userInfo;
  }

  public ControlloAccessiGestioneToken userInfo(StatoFunzionalitaConWarningEnum userInfo) {
    this.userInfo = userInfo;
    return this;
  }

 /**
   * indica se il forward del token, nelle modalità descritte nella policy, è attivo o meno
   * @return tokenForward
  **/
  @JsonProperty("token_forward")
  @Valid
  public Boolean isTokenForward() {
    return tokenForward;
  }

  public void setTokenForward(Boolean tokenForward) {
    this.tokenForward = tokenForward;
  }

  public ControlloAccessiGestioneToken tokenForward(Boolean tokenForward) {
    this.tokenForward = tokenForward;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class ControlloAccessiGestioneToken {\n");
    sb.append("    ").append(toIndentedString(super.toString())).append("\n");
    sb.append("    abilitato: ").append(toIndentedString(abilitato)).append("\n");
    sb.append("    policy: ").append(toIndentedString(policy)).append("\n");
    sb.append("    tokenOpzionale: ").append(toIndentedString(tokenOpzionale)).append("\n");
    sb.append("    validazioneJwt: ").append(toIndentedString(validazioneJwt)).append("\n");
    sb.append("    introspection: ").append(toIndentedString(introspection)).append("\n");
    sb.append("    userInfo: ").append(toIndentedString(userInfo)).append("\n");
    sb.append("    tokenForward: ").append(toIndentedString(tokenForward)).append("\n");
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
