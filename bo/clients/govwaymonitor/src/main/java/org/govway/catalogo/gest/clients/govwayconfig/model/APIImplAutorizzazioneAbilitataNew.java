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

import org.govway.catalogo.gest.clients.govwayconfig.model.AllAnyEnum;
import org.govway.catalogo.gest.clients.govwayconfig.model.FonteEnum;
import org.govway.catalogo.gest.clients.govwayconfig.model.TipoAutorizzazioneEnum;
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

public class APIImplAutorizzazioneAbilitataNew  implements OneOfAPIImplAutorizzazione {
  
  @Schema(required = true, description = "")
  private TipoAutorizzazioneEnum tipo = null;
  
  @Schema(example = "false", required = true, description = "")
  private Boolean richiedente = true;
  
  @Schema(description = "")
  private String soggetto = null;
  
  @Schema(example = "false", required = true, description = "")
  private Boolean ruoli = false;
  
  @Schema(description = "")
  private FonteEnum ruoliFonte = null;
  
  @Schema(description = "")
  private AllAnyEnum ruoliRichiesti = null;
  
  @Schema(description = "")
  private String ruolo = null;
 /**
   * Get tipo
   * @return tipo
  **/
  @JsonProperty("tipo")
  @NotNull
  @Valid
  public TipoAutorizzazioneEnum getTipo() {
    return tipo;
  }

  public void setTipo(TipoAutorizzazioneEnum tipo) {
    this.tipo = tipo;
  }

  public APIImplAutorizzazioneAbilitataNew tipo(TipoAutorizzazioneEnum tipo) {
    this.tipo = tipo;
    return this;
  }

 /**
   * Get richiedente
   * @return richiedente
  **/
  @JsonProperty("richiedente")
  @NotNull
  @Valid
  public Boolean isRichiedente() {
    return richiedente;
  }

  public void setRichiedente(Boolean richiedente) {
    this.richiedente = richiedente;
  }

  public APIImplAutorizzazioneAbilitataNew richiedente(Boolean richiedente) {
    this.richiedente = richiedente;
    return this;
  }

 /**
   * Get soggetto
   * @return soggetto
  **/
  @JsonProperty("soggetto")
  @Valid
 @Pattern(regexp="^[0-9A-Za-z]+$") @Size(max=255)  public String getSoggetto() {
    return soggetto;
  }

  public void setSoggetto(String soggetto) {
    this.soggetto = soggetto;
  }

  public APIImplAutorizzazioneAbilitataNew soggetto(String soggetto) {
    this.soggetto = soggetto;
    return this;
  }

 /**
   * Get ruoli
   * @return ruoli
  **/
  @JsonProperty("ruoli")
  @NotNull
  @Valid
  public Boolean isRuoli() {
    return ruoli;
  }

  public void setRuoli(Boolean ruoli) {
    this.ruoli = ruoli;
  }

  public APIImplAutorizzazioneAbilitataNew ruoli(Boolean ruoli) {
    this.ruoli = ruoli;
    return this;
  }

 /**
   * Get ruoliFonte
   * @return ruoliFonte
  **/
  @JsonProperty("ruoli_fonte")
  @Valid
  public FonteEnum getRuoliFonte() {
    return ruoliFonte;
  }

  public void setRuoliFonte(FonteEnum ruoliFonte) {
    this.ruoliFonte = ruoliFonte;
  }

  public APIImplAutorizzazioneAbilitataNew ruoliFonte(FonteEnum ruoliFonte) {
    this.ruoliFonte = ruoliFonte;
    return this;
  }

 /**
   * Get ruoliRichiesti
   * @return ruoliRichiesti
  **/
  @JsonProperty("ruoli_richiesti")
  @Valid
  public AllAnyEnum getRuoliRichiesti() {
    return ruoliRichiesti;
  }

  public void setRuoliRichiesti(AllAnyEnum ruoliRichiesti) {
    this.ruoliRichiesti = ruoliRichiesti;
  }

  public APIImplAutorizzazioneAbilitataNew ruoliRichiesti(AllAnyEnum ruoliRichiesti) {
    this.ruoliRichiesti = ruoliRichiesti;
    return this;
  }

 /**
   * Get ruolo
   * @return ruolo
  **/
  @JsonProperty("ruolo")
  @Valid
 @Pattern(regexp="^[_A-Za-z][._A-Za-z0-9]*$") @Size(max=255)  public String getRuolo() {
    return ruolo;
  }

  public void setRuolo(String ruolo) {
    this.ruolo = ruolo;
  }

  public APIImplAutorizzazioneAbilitataNew ruolo(String ruolo) {
    this.ruolo = ruolo;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class APIImplAutorizzazioneAbilitataNew {\n");
    
    sb.append("    tipo: ").append(toIndentedString(tipo)).append("\n");
    sb.append("    richiedente: ").append(toIndentedString(richiedente)).append("\n");
    sb.append("    soggetto: ").append(toIndentedString(soggetto)).append("\n");
    sb.append("    ruoli: ").append(toIndentedString(ruoli)).append("\n");
    sb.append("    ruoliFonte: ").append(toIndentedString(ruoliFonte)).append("\n");
    sb.append("    ruoliRichiesti: ").append(toIndentedString(ruoliRichiesti)).append("\n");
    sb.append("    ruolo: ").append(toIndentedString(ruolo)).append("\n");
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
