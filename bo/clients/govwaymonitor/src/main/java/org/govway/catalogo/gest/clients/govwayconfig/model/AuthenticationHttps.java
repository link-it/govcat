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

import org.govway.catalogo.gest.clients.govwayconfig.model.ModalitaAccessoEnum;
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

public class AuthenticationHttps  implements OneOfBaseCredenzialiCredenziali {
  
  @Schema(required = true, description = "")
  private ModalitaAccessoEnum modalitaAccesso = null;
  
  @Schema(required = true, description = "")
  @com.fasterxml.jackson.annotation.JsonTypeInfo(use = com.fasterxml.jackson.annotation.JsonTypeInfo.Id.NAME, include = com.fasterxml.jackson.annotation.JsonTypeInfo.As.EXISTING_PROPERTY, property = "tipo", visible = true )
  @com.fasterxml.jackson.annotation.JsonSubTypes({
    @com.fasterxml.jackson.annotation.JsonSubTypes.Type(value = AuthenticationHttpsCertificato.class, name = "certificato"),
    @com.fasterxml.jackson.annotation.JsonSubTypes.Type(value = AuthenticationHttpsConfigurazioneManuale.class, name = "configurazione-manuale")  })
  private OneOfAuthenticationHttpsCertificato certificato = null;
 /**
   * Get modalitaAccesso
   * @return modalitaAccesso
  **/
  @JsonProperty("modalita_accesso")
  @NotNull
  @Valid
  public ModalitaAccessoEnum getModalitaAccesso() {
    return modalitaAccesso;
  }

  public void setModalitaAccesso(ModalitaAccessoEnum modalitaAccesso) {
    this.modalitaAccesso = modalitaAccesso;
  }

  public AuthenticationHttps modalitaAccesso(ModalitaAccessoEnum modalitaAccesso) {
    this.modalitaAccesso = modalitaAccesso;
    return this;
  }

 /**
   * Get certificato
   * @return certificato
  **/
  @JsonProperty("certificato")
  @NotNull
  @Valid
  public OneOfAuthenticationHttpsCertificato getCertificato() {
    return certificato;
  }

  public void setCertificato(OneOfAuthenticationHttpsCertificato certificato) {
    this.certificato = certificato;
  }

  public AuthenticationHttps certificato(OneOfAuthenticationHttpsCertificato certificato) {
    this.certificato = certificato;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class AuthenticationHttps {\n");
    
    sb.append("    modalitaAccesso: ").append(toIndentedString(modalitaAccesso)).append("\n");
    sb.append("    certificato: ").append(toIndentedString(certificato)).append("\n");
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
