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

public class RegistrazioneMessaggiConfigurazioneRegola  {
  
  @Schema(required = true, description = "")
  private Boolean headers = null;
  
  @Schema(required = true, description = "")
  private Boolean body = null;
  
  @Schema(required = true, description = "")
  private Boolean attachments = null;
 /**
   * Get headers
   * @return headers
  **/
  @JsonProperty("headers")
  @NotNull
  @Valid
  public Boolean isHeaders() {
    return headers;
  }

  public void setHeaders(Boolean headers) {
    this.headers = headers;
  }

  public RegistrazioneMessaggiConfigurazioneRegola headers(Boolean headers) {
    this.headers = headers;
    return this;
  }

 /**
   * Get body
   * @return body
  **/
  @JsonProperty("body")
  @NotNull
  @Valid
  public Boolean isBody() {
    return body;
  }

  public void setBody(Boolean body) {
    this.body = body;
  }

  public RegistrazioneMessaggiConfigurazioneRegola body(Boolean body) {
    this.body = body;
    return this;
  }

 /**
   * Get attachments
   * @return attachments
  **/
  @JsonProperty("attachments")
  @NotNull
  @Valid
  public Boolean isAttachments() {
    return attachments;
  }

  public void setAttachments(Boolean attachments) {
    this.attachments = attachments;
  }

  public RegistrazioneMessaggiConfigurazioneRegola attachments(Boolean attachments) {
    this.attachments = attachments;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class RegistrazioneMessaggiConfigurazioneRegola {\n");
    
    sb.append("    headers: ").append(toIndentedString(headers)).append("\n");
    sb.append("    body: ").append(toIndentedString(body)).append("\n");
    sb.append("    attachments: ").append(toIndentedString(attachments)).append("\n");
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
