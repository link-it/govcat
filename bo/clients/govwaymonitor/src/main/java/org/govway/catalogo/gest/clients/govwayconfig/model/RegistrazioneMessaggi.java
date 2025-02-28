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
import org.govway.catalogo.gest.clients.govwayconfig.model.RegistrazioneMessaggiConfigurazione;
import org.govway.catalogo.gest.clients.govwayconfig.model.StatoDefaultRidefinitoEnum;
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

public class RegistrazioneMessaggi extends ApiImplConfigurazioneStato {
  
  @Schema(required = true, description = "")
  private StatoDefaultRidefinitoEnum stato = null;
  
  @Schema(description = "")
  private RegistrazioneMessaggiConfigurazione richiesta = null;
  
  @Schema(description = "")
  private RegistrazioneMessaggiConfigurazione risposta = null;
 /**
   * Get stato
   * @return stato
  **/
  @JsonProperty("stato")
  @NotNull
  @Valid
  public StatoDefaultRidefinitoEnum getStato() {
    return stato;
  }

  public void setStato(StatoDefaultRidefinitoEnum stato) {
    this.stato = stato;
  }

  public RegistrazioneMessaggi stato(StatoDefaultRidefinitoEnum stato) {
    this.stato = stato;
    return this;
  }

 /**
   * Get richiesta
   * @return richiesta
  **/
  @JsonProperty("richiesta")
  @Valid
  public RegistrazioneMessaggiConfigurazione getRichiesta() {
    return richiesta;
  }

  public void setRichiesta(RegistrazioneMessaggiConfigurazione richiesta) {
    this.richiesta = richiesta;
  }

  public RegistrazioneMessaggi richiesta(RegistrazioneMessaggiConfigurazione richiesta) {
    this.richiesta = richiesta;
    return this;
  }

 /**
   * Get risposta
   * @return risposta
  **/
  @JsonProperty("risposta")
  @Valid
  public RegistrazioneMessaggiConfigurazione getRisposta() {
    return risposta;
  }

  public void setRisposta(RegistrazioneMessaggiConfigurazione risposta) {
    this.risposta = risposta;
  }

  public RegistrazioneMessaggi risposta(RegistrazioneMessaggiConfigurazione risposta) {
    this.risposta = risposta;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class RegistrazioneMessaggi {\n");
    sb.append("    ").append(toIndentedString(super.toString())).append("\n");
    sb.append("    stato: ").append(toIndentedString(stato)).append("\n");
    sb.append("    richiesta: ").append(toIndentedString(richiesta)).append("\n");
    sb.append("    risposta: ").append(toIndentedString(risposta)).append("\n");
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
