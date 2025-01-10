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

import org.govway.catalogo.gest.clients.govwayconfig.model.HttpMethodEnum;
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

public class ApiRisorsa  {
  
  @Schema(required = true, description = "")
  private HttpMethodEnum httpMethod = null;
  
  @Schema(example = "/libri", required = true, description = "")
  private String path = null;
  
  @Schema(description = "")
  private String nome = null;
  
  @Schema(description = "")
  private String descrizione = null;
  
  @Schema(example = "false", description = "")
  private Boolean idCollaborazione = false;
  
  @Schema(example = "false", description = "")
  private Boolean riferimentoIdRichiesta = null;
 /**
   * Get httpMethod
   * @return httpMethod
  **/
  @JsonProperty("http_method")
  @NotNull
  @Valid
  public HttpMethodEnum getHttpMethod() {
    return httpMethod;
  }

  public void setHttpMethod(HttpMethodEnum httpMethod) {
    this.httpMethod = httpMethod;
  }

  public ApiRisorsa httpMethod(HttpMethodEnum httpMethod) {
    this.httpMethod = httpMethod;
    return this;
  }

 /**
   * Get path
   * @return path
  **/
  @JsonProperty("path")
  @NotNull
  @Valid
 @Size(max=255)  public String getPath() {
    return path;
  }

  public void setPath(String path) {
    this.path = path;
  }

  public ApiRisorsa path(String path) {
    this.path = path;
    return this;
  }

 /**
   * Get nome
   * @return nome
  **/
  @JsonProperty("nome")
  @Valid
 @Pattern(regexp="^[_A-Za-z][._A-Za-z0-9]*$") @Size(max=255)  public String getNome() {
    return nome;
  }

  public void setNome(String nome) {
    this.nome = nome;
  }

  public ApiRisorsa nome(String nome) {
    this.nome = nome;
    return this;
  }

 /**
   * Get descrizione
   * @return descrizione
  **/
  @JsonProperty("descrizione")
  @Valid
 @Size(max=255)  public String getDescrizione() {
    return descrizione;
  }

  public void setDescrizione(String descrizione) {
    this.descrizione = descrizione;
  }

  public ApiRisorsa descrizione(String descrizione) {
    this.descrizione = descrizione;
    return this;
  }

 /**
   * Get idCollaborazione
   * @return idCollaborazione
  **/
  @JsonProperty("id_collaborazione")
  @Valid
  public Boolean isIdCollaborazione() {
    return idCollaborazione;
  }

  public void setIdCollaborazione(Boolean idCollaborazione) {
    this.idCollaborazione = idCollaborazione;
  }

  public ApiRisorsa idCollaborazione(Boolean idCollaborazione) {
    this.idCollaborazione = idCollaborazione;
    return this;
  }

 /**
   * Get riferimentoIdRichiesta
   * @return riferimentoIdRichiesta
  **/
  @JsonProperty("riferimento_id_richiesta")
  @Valid
  public Boolean isRiferimentoIdRichiesta() {
    return riferimentoIdRichiesta;
  }

  public void setRiferimentoIdRichiesta(Boolean riferimentoIdRichiesta) {
    this.riferimentoIdRichiesta = riferimentoIdRichiesta;
  }

  public ApiRisorsa riferimentoIdRichiesta(Boolean riferimentoIdRichiesta) {
    this.riferimentoIdRichiesta = riferimentoIdRichiesta;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class ApiRisorsa {\n");
    
    sb.append("    httpMethod: ").append(toIndentedString(httpMethod)).append("\n");
    sb.append("    path: ").append(toIndentedString(path)).append("\n");
    sb.append("    nome: ").append(toIndentedString(nome)).append("\n");
    sb.append("    descrizione: ").append(toIndentedString(descrizione)).append("\n");
    sb.append("    idCollaborazione: ").append(toIndentedString(idCollaborazione)).append("\n");
    sb.append("    riferimentoIdRichiesta: ").append(toIndentedString(riferimentoIdRichiesta)).append("\n");
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
