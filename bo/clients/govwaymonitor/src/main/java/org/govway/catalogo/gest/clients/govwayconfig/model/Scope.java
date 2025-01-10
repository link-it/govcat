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

import org.govway.catalogo.gest.clients.govwayconfig.model.ContestoEnum;
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

public class Scope  {
  
  @Schema(required = true, description = "")
  private String nome = null;
  
  @Schema(example = "descrizione dello scope", description = "")
  private String descrizione = null;
  
  @Schema(example = "urn://accesso_sola_lettura", description = "")
  private String identificativoEsterno = null;
  
  @Schema(description = "")
  private ContestoEnum contesto = null;
 /**
   * Get nome
   * @return nome
  **/
  @JsonProperty("nome")
  @NotNull
  @Valid
 @Pattern(regexp="^[_A-Za-z][._A-Za-z0-9]*$") @Size(max=255)  public String getNome() {
    return nome;
  }

  public void setNome(String nome) {
    this.nome = nome;
  }

  public Scope nome(String nome) {
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

  public Scope descrizione(String descrizione) {
    this.descrizione = descrizione;
    return this;
  }

 /**
   * Get identificativoEsterno
   * @return identificativoEsterno
  **/
  @JsonProperty("identificativo_esterno")
  @Valid
 @Size(max=255)  public String getIdentificativoEsterno() {
    return identificativoEsterno;
  }

  public void setIdentificativoEsterno(String identificativoEsterno) {
    this.identificativoEsterno = identificativoEsterno;
  }

  public Scope identificativoEsterno(String identificativoEsterno) {
    this.identificativoEsterno = identificativoEsterno;
    return this;
  }

 /**
   * Get contesto
   * @return contesto
  **/
  @JsonProperty("contesto")
  @Valid
  public ContestoEnum getContesto() {
    return contesto;
  }

  public void setContesto(ContestoEnum contesto) {
    this.contesto = contesto;
  }

  public Scope contesto(ContestoEnum contesto) {
    this.contesto = contesto;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class Scope {\n");
    
    sb.append("    nome: ").append(toIndentedString(nome)).append("\n");
    sb.append("    descrizione: ").append(toIndentedString(descrizione)).append("\n");
    sb.append("    identificativoEsterno: ").append(toIndentedString(identificativoEsterno)).append("\n");
    sb.append("    contesto: ").append(toIndentedString(contesto)).append("\n");
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
