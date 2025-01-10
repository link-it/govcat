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

import org.govway.catalogo.gest.clients.govwayconfig.model.APIImpl;
import org.govway.catalogo.gest.clients.govwayconfig.model.Connettore;
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

public class Erogazione extends APIImpl {
  
  @Schema(description = "")
  private String descrizione = null;
  
  @Schema(description = "")
  private String erogazioneNome = null;
  
  @Schema(description = "")
  private Integer erogazioneVersione = null;
  
  @Schema(description = "")
  private String canale = null;
 /**
   * Get descrizione
   * @return descrizione
  **/
  @JsonProperty("descrizione")
  @Valid
  public String getDescrizione() {
    return descrizione;
  }

  public void setDescrizione(String descrizione) {
    this.descrizione = descrizione;
  }

  public Erogazione descrizione(String descrizione) {
    this.descrizione = descrizione;
    return this;
  }

 /**
   * Get erogazioneNome
   * @return erogazioneNome
  **/
  @JsonProperty("erogazione_nome")
  @Valid
 @Pattern(regexp="^[_A-Za-z][._A-Za-z0-9]*$") @Size(max=255)  public String getErogazioneNome() {
    return erogazioneNome;
  }

  public void setErogazioneNome(String erogazioneNome) {
    this.erogazioneNome = erogazioneNome;
  }

  public Erogazione erogazioneNome(String erogazioneNome) {
    this.erogazioneNome = erogazioneNome;
    return this;
  }

 /**
   * Get erogazioneVersione
   * @return erogazioneVersione
  **/
  @JsonProperty("erogazione_versione")
  @Valid
  public Integer getErogazioneVersione() {
    return erogazioneVersione;
  }

  public void setErogazioneVersione(Integer erogazioneVersione) {
    this.erogazioneVersione = erogazioneVersione;
  }

  public Erogazione erogazioneVersione(Integer erogazioneVersione) {
    this.erogazioneVersione = erogazioneVersione;
    return this;
  }

 /**
   * Get canale
   * @return canale
  **/
  @JsonProperty("canale")
  @Valid
 @Size(max=255)  public String getCanale() {
    return canale;
  }

  public void setCanale(String canale) {
    this.canale = canale;
  }

  public Erogazione canale(String canale) {
    this.canale = canale;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class Erogazione {\n");
    sb.append("    ").append(toIndentedString(super.toString())).append("\n");
    sb.append("    descrizione: ").append(toIndentedString(descrizione)).append("\n");
    sb.append("    erogazioneNome: ").append(toIndentedString(erogazioneNome)).append("\n");
    sb.append("    erogazioneVersione: ").append(toIndentedString(erogazioneVersione)).append("\n");
    sb.append("    canale: ").append(toIndentedString(canale)).append("\n");
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
