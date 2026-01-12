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

import org.govway.catalogo.gest.clients.govwayconfig.model.ModalitaIdentificazioneAzioneEnum;
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

public class ApiImplUrlInvocazione  {
  
  @Schema(required = true, description = "")
  private ModalitaIdentificazioneAzioneEnum modalita = null;
  
  @Schema(description = "XPath/JsonPath nel caso di modalità 'content-based' o espressione regolare nel caso 'url-based'")
 /**
   * XPath/JsonPath nel caso di modalità 'content-based' o espressione regolare nel caso 'url-based'  
  **/
  private String pattern = null;
  
  @Schema(description = "Nome dell'header http nel caso di modalità 'header-based' o nome dell'unica azione in caso di modalità 'static'")
 /**
   * Nome dell'header http nel caso di modalità 'header-based' o nome dell'unica azione in caso di modalità 'static'  
  **/
  private String nome = null;
  
  @Schema(description = "Indicazione se oltre alla modalità indicata per individuare l'azione viene usata comunque la modalità 'interface-based'")
 /**
   * Indicazione se oltre alla modalità indicata per individuare l'azione viene usata comunque la modalità 'interface-based'  
  **/
  private Boolean forceInterface = true;
 /**
   * Get modalita
   * @return modalita
  **/
  @JsonProperty("modalita")
  @NotNull
  @Valid
  public ModalitaIdentificazioneAzioneEnum getModalita() {
    return modalita;
  }

  public void setModalita(ModalitaIdentificazioneAzioneEnum modalita) {
    this.modalita = modalita;
  }

  public ApiImplUrlInvocazione modalita(ModalitaIdentificazioneAzioneEnum modalita) {
    this.modalita = modalita;
    return this;
  }

 /**
   * XPath/JsonPath nel caso di modalità &#x27;content-based&#x27; o espressione regolare nel caso &#x27;url-based&#x27;
   * @return pattern
  **/
  @JsonProperty("pattern")
  @Valid
 @Size(max=255)  public String getPattern() {
    return pattern;
  }

  public void setPattern(String pattern) {
    this.pattern = pattern;
  }

  public ApiImplUrlInvocazione pattern(String pattern) {
    this.pattern = pattern;
    return this;
  }

 /**
   * Nome dell&#x27;header http nel caso di modalità &#x27;header-based&#x27; o nome dell&#x27;unica azione in caso di modalità &#x27;static&#x27;
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

  public ApiImplUrlInvocazione nome(String nome) {
    this.nome = nome;
    return this;
  }

 /**
   * Indicazione se oltre alla modalità indicata per individuare l&#x27;azione viene usata comunque la modalità &#x27;interface-based&#x27;
   * @return forceInterface
  **/
  @JsonProperty("force_interface")
  @Valid
  public Boolean isForceInterface() {
    return forceInterface;
  }

  public void setForceInterface(Boolean forceInterface) {
    this.forceInterface = forceInterface;
  }

  public ApiImplUrlInvocazione forceInterface(Boolean forceInterface) {
    this.forceInterface = forceInterface;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class ApiImplUrlInvocazione {\n");
    
    sb.append("    modalita: ").append(toIndentedString(modalita)).append("\n");
    sb.append("    pattern: ").append(toIndentedString(pattern)).append("\n");
    sb.append("    nome: ").append(toIndentedString(nome)).append("\n");
    sb.append("    forceInterface: ").append(toIndentedString(forceInterface)).append("\n");
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
