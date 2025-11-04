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

import org.govway.catalogo.gest.clients.govwayconfig.model.TipoAutenticazioneEnum;
import org.govway.catalogo.gest.clients.govwayconfig.model.TipoAutenticazionePrincipal;
import org.govway.catalogo.gest.clients.govwayconfig.model.TipoAutenticazionePrincipalToken;
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

public class APIImplAutenticazionePrincipal  implements OneOfAPIImplAutenticazione, OneOfControlloAccessiAutenticazioneAutenticazione, OneOfGruppoNuovaConfigurazioneAutenticazione {
  
  @Schema(required = true, description = "")
  private TipoAutenticazioneEnum tipo = null;
  
  @Schema(required = true, description = "")
  private TipoAutenticazionePrincipal tipoPrincipal = null;
  
  @Schema(description = "")
  private TipoAutenticazionePrincipalToken token = null;
  
  @Schema(description = "indica il nome dell'header http in caso di autenticazione principal 'header-based',  il nome del parametro della query nel caso di autenticazione principal 'form-based' o il nome del claim in caso di autenticazione principal 'token' con tipo di claim 'custom' ")
 /**
   * indica il nome dell'header http in caso di autenticazione principal 'header-based',  il nome del parametro della query nel caso di autenticazione principal 'form-based' o il nome del claim in caso di autenticazione principal 'token' con tipo di claim 'custom'   
  **/
  private String nome = null;
  
  @Schema(example = "indica l'espressione regolare da utilizzare in caso di autenticazione 'url-based'", description = "")
  private String pattern = null;
  
  @Schema(example = "false", description = "")
  private Boolean forward = false;
  
  @Schema(example = "false", description = "")
  private Boolean opzionale = false;
 /**
   * Get tipo
   * @return tipo
  **/
  @JsonProperty("tipo")
  @NotNull
  @Valid
  public TipoAutenticazioneEnum getTipo() {
    return tipo;
  }

  public void setTipo(TipoAutenticazioneEnum tipo) {
    this.tipo = tipo;
  }

  public APIImplAutenticazionePrincipal tipo(TipoAutenticazioneEnum tipo) {
    this.tipo = tipo;
    return this;
  }

 /**
   * Get tipoPrincipal
   * @return tipoPrincipal
  **/
  @JsonProperty("tipo_principal")
  @NotNull
  @Valid
  public TipoAutenticazionePrincipal getTipoPrincipal() {
    return tipoPrincipal;
  }

  public void setTipoPrincipal(TipoAutenticazionePrincipal tipoPrincipal) {
    this.tipoPrincipal = tipoPrincipal;
  }

  public APIImplAutenticazionePrincipal tipoPrincipal(TipoAutenticazionePrincipal tipoPrincipal) {
    this.tipoPrincipal = tipoPrincipal;
    return this;
  }

 /**
   * Get token
   * @return token
  **/
  @JsonProperty("token")
  @Valid
  public TipoAutenticazionePrincipalToken getToken() {
    return token;
  }

  public void setToken(TipoAutenticazionePrincipalToken token) {
    this.token = token;
  }

  public APIImplAutenticazionePrincipal token(TipoAutenticazionePrincipalToken token) {
    this.token = token;
    return this;
  }

 /**
   * indica il nome dell&#x27;header http in caso di autenticazione principal &#x27;header-based&#x27;,  il nome del parametro della query nel caso di autenticazione principal &#x27;form-based&#x27; o il nome del claim in caso di autenticazione principal &#x27;token&#x27; con tipo di claim &#x27;custom&#x27; 
   * @return nome
  **/
  @JsonProperty("nome")
  @Valid
 @Size(max=255)  public String getNome() {
    return nome;
  }

  public void setNome(String nome) {
    this.nome = nome;
  }

  public APIImplAutenticazionePrincipal nome(String nome) {
    this.nome = nome;
    return this;
  }

 /**
   * Get pattern
   * @return pattern
  **/
  @JsonProperty("pattern")
  @Valid
  public String getPattern() {
    return pattern;
  }

  public void setPattern(String pattern) {
    this.pattern = pattern;
  }

  public APIImplAutenticazionePrincipal pattern(String pattern) {
    this.pattern = pattern;
    return this;
  }

 /**
   * Get forward
   * @return forward
  **/
  @JsonProperty("forward")
  @Valid
  public Boolean isForward() {
    return forward;
  }

  public void setForward(Boolean forward) {
    this.forward = forward;
  }

  public APIImplAutenticazionePrincipal forward(Boolean forward) {
    this.forward = forward;
    return this;
  }

 /**
   * Get opzionale
   * @return opzionale
  **/
  @JsonProperty("opzionale")
  @Valid
  public Boolean isOpzionale() {
    return opzionale;
  }

  public void setOpzionale(Boolean opzionale) {
    this.opzionale = opzionale;
  }

  public APIImplAutenticazionePrincipal opzionale(Boolean opzionale) {
    this.opzionale = opzionale;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class APIImplAutenticazionePrincipal {\n");
    
    sb.append("    tipo: ").append(toIndentedString(tipo)).append("\n");
    sb.append("    tipoPrincipal: ").append(toIndentedString(tipoPrincipal)).append("\n");
    sb.append("    token: ").append(toIndentedString(token)).append("\n");
    sb.append("    nome: ").append(toIndentedString(nome)).append("\n");
    sb.append("    pattern: ").append(toIndentedString(pattern)).append("\n");
    sb.append("    forward: ").append(toIndentedString(forward)).append("\n");
    sb.append("    opzionale: ").append(toIndentedString(opzionale)).append("\n");
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
