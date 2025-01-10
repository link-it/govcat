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

import org.govway.catalogo.gest.clients.govwayconfig.model.ModalitaConfigurazioneGruppoEnum;
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

public class GruppoNuovaConfigurazione  implements OneOfGruppoConfigurazione {
  
  @Schema(required = true, description = "")
  private ModalitaConfigurazioneGruppoEnum modalita = null;
  
  @Schema(required = true, description = "")
  @com.fasterxml.jackson.annotation.JsonTypeInfo(use = com.fasterxml.jackson.annotation.JsonTypeInfo.Id.NAME, include = com.fasterxml.jackson.annotation.JsonTypeInfo.As.EXISTING_PROPERTY, property = "tipo", visible = true )
  @com.fasterxml.jackson.annotation.JsonSubTypes({
    @com.fasterxml.jackson.annotation.JsonSubTypes.Type(value = APIImplAutenticazioneDisabilitata.class, name = "disabilitato"),
    @com.fasterxml.jackson.annotation.JsonSubTypes.Type(value = APIImplAutenticazioneBasic.class, name = "http-basic"),
    @com.fasterxml.jackson.annotation.JsonSubTypes.Type(value = APIImplAutenticazioneHttps.class, name = "https"),
    @com.fasterxml.jackson.annotation.JsonSubTypes.Type(value = APIImplAutenticazionePrincipal.class, name = "principal"),
    @com.fasterxml.jackson.annotation.JsonSubTypes.Type(value = APIImplAutenticazioneApiKey.class, name = "api-key")  })
  private OneOfGruppoNuovaConfigurazioneAutenticazione autenticazione = null;
 /**
   * Get modalita
   * @return modalita
  **/
  @JsonProperty("modalita")
  @NotNull
  @Valid
  public ModalitaConfigurazioneGruppoEnum getModalita() {
    return modalita;
  }

  public void setModalita(ModalitaConfigurazioneGruppoEnum modalita) {
    this.modalita = modalita;
  }

  public GruppoNuovaConfigurazione modalita(ModalitaConfigurazioneGruppoEnum modalita) {
    this.modalita = modalita;
    return this;
  }

 /**
   * Get autenticazione
   * @return autenticazione
  **/
  @JsonProperty("autenticazione")
  @NotNull
  @Valid
  public OneOfGruppoNuovaConfigurazioneAutenticazione getAutenticazione() {
    return autenticazione;
  }

  public void setAutenticazione(OneOfGruppoNuovaConfigurazioneAutenticazione autenticazione) {
    this.autenticazione = autenticazione;
  }

  public GruppoNuovaConfigurazione autenticazione(OneOfGruppoNuovaConfigurazioneAutenticazione autenticazione) {
    this.autenticazione = autenticazione;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class GruppoNuovaConfigurazione {\n");
    
    sb.append("    modalita: ").append(toIndentedString(modalita)).append("\n");
    sb.append("    autenticazione: ").append(toIndentedString(autenticazione)).append("\n");
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
