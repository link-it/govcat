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

public class RateLimitingPolicyBase extends ApiImplConfigurazioneStato {
  
  @Schema(required = true, description = "")
  private String nome = null;
  
  @Schema(required = true, description = "")
  private StatoFunzionalitaConWarningEnum stato = null;
  
  @Schema(description = "")
  private Boolean sogliaRidefinita = false;
  
  @Schema(description = "")
  private Integer sogliaValore = null;
 /**
   * Get nome
   * @return nome
  **/
  @JsonProperty("nome")
  @NotNull
  @Valid
 @Size(max=255)  public String getNome() {
    return nome;
  }

  public void setNome(String nome) {
    this.nome = nome;
  }

  public RateLimitingPolicyBase nome(String nome) {
    this.nome = nome;
    return this;
  }

 /**
   * Get stato
   * @return stato
  **/
  @JsonProperty("stato")
  @NotNull
  @Valid
  public StatoFunzionalitaConWarningEnum getStato() {
    return stato;
  }

  public void setStato(StatoFunzionalitaConWarningEnum stato) {
    this.stato = stato;
  }

  public RateLimitingPolicyBase stato(StatoFunzionalitaConWarningEnum stato) {
    this.stato = stato;
    return this;
  }

 /**
   * Get sogliaRidefinita
   * @return sogliaRidefinita
  **/
  @JsonProperty("soglia_ridefinita")
  @Valid
  public Boolean isSogliaRidefinita() {
    return sogliaRidefinita;
  }

  public void setSogliaRidefinita(Boolean sogliaRidefinita) {
    this.sogliaRidefinita = sogliaRidefinita;
  }

  public RateLimitingPolicyBase sogliaRidefinita(Boolean sogliaRidefinita) {
    this.sogliaRidefinita = sogliaRidefinita;
    return this;
  }

 /**
   * Get sogliaValore
   * @return sogliaValore
  **/
  @JsonProperty("soglia_valore")
  @Valid
  public Integer getSogliaValore() {
    return sogliaValore;
  }

  public void setSogliaValore(Integer sogliaValore) {
    this.sogliaValore = sogliaValore;
  }

  public RateLimitingPolicyBase sogliaValore(Integer sogliaValore) {
    this.sogliaValore = sogliaValore;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class RateLimitingPolicyBase {\n");
    sb.append("    ").append(toIndentedString(super.toString())).append("\n");
    sb.append("    nome: ").append(toIndentedString(nome)).append("\n");
    sb.append("    stato: ").append(toIndentedString(stato)).append("\n");
    sb.append("    sogliaRidefinita: ").append(toIndentedString(sogliaRidefinita)).append("\n");
    sb.append("    sogliaValore: ").append(toIndentedString(sogliaValore)).append("\n");
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
