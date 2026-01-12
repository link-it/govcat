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

import org.govway.catalogo.gest.clients.govwayconfig.model.BaseItem;
import org.govway.catalogo.gest.clients.govwayconfig.model.DominioEnum;
import org.govway.catalogo.gest.clients.govwayconfig.model.ProfiloEnum;
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

public class SoggettoItem extends BaseItem {
  
  @Schema(required = true, description = "")
  private String nome = null;
  
  @Schema(required = true, description = "")
  private DominioEnum dominio = null;
  
  @Schema(example = "0", description = "")
  private Integer countRuoli = null;
 /**
   * Get nome
   * @return nome
  **/
  @JsonProperty("nome")
  @NotNull
  @Valid
 @Pattern(regexp="^[0-9A-Za-z]+$") @Size(max=255)  public String getNome() {
    return nome;
  }

  public void setNome(String nome) {
    this.nome = nome;
  }

  public SoggettoItem nome(String nome) {
    this.nome = nome;
    return this;
  }

 /**
   * Get dominio
   * @return dominio
  **/
  @JsonProperty("dominio")
  @NotNull
  @Valid
  public DominioEnum getDominio() {
    return dominio;
  }

  public void setDominio(DominioEnum dominio) {
    this.dominio = dominio;
  }

  public SoggettoItem dominio(DominioEnum dominio) {
    this.dominio = dominio;
    return this;
  }

 /**
   * Get countRuoli
   * minimum: 0
   * @return countRuoli
  **/
  @JsonProperty("count_ruoli")
  @Valid
 @Min(0)  public Integer getCountRuoli() {
    return countRuoli;
  }

  public void setCountRuoli(Integer countRuoli) {
    this.countRuoli = countRuoli;
  }

  public SoggettoItem countRuoli(Integer countRuoli) {
    this.countRuoli = countRuoli;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class SoggettoItem {\n");
    sb.append("    ").append(toIndentedString(super.toString())).append("\n");
    sb.append("    nome: ").append(toIndentedString(nome)).append("\n");
    sb.append("    dominio: ").append(toIndentedString(dominio)).append("\n");
    sb.append("    countRuoli: ").append(toIndentedString(countRuoli)).append("\n");
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
