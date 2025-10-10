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
package org.govway.catalogo.gest.clients.govwaymonitor.model;

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

public class ProblemType implements AnyOfProblemId {
  
  @Schema(example = "https://tools.ietf.org/html/rfc7231#section-6.6.4", required = true, description = "An absolute URI that identifies the problem type.  When dereferenced, it SHOULD provide human-readable documentation for the problem type (e.g., using HTML). ")
 /**
   * An absolute URI that identifies the problem type.  When dereferenced, it SHOULD provide human-readable documentation for the problem type (e.g., using HTML).   
  **/
  private String type = "about:blank";
 /**
   * An absolute URI that identifies the problem type.  When dereferenced, it SHOULD provide human-readable documentation for the problem type (e.g., using HTML). 
   * @return type
  **/
  @JsonProperty("type")
  @NotNull
  @Valid
  public String getType() {
    return type;
  }

  public void setType(String type) {
    this.type = type;
  }

  public ProblemType type(String type) {
    this.type = type;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class ProblemType {\n");
    
    sb.append("    type: ").append(toIndentedString(type)).append("\n");
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

  // Custom Type Adapter Factory for Gson serialization
  public static class CustomTypeAdapterFactory implements com.google.gson.TypeAdapterFactory {
    @SuppressWarnings("unchecked")
    @Override
    public <T> com.google.gson.TypeAdapter<T> create(com.google.gson.Gson gson, com.google.gson.reflect.TypeToken<T> type) {
      if (!ProblemType.class.isAssignableFrom(type.getRawType())) {
        return null;
      }
      return (com.google.gson.TypeAdapter<T>) new ProblemTypeAdapter(gson);
    }
  }

  public static class ProblemTypeAdapter extends com.google.gson.TypeAdapter<ProblemType> {
    private final com.google.gson.Gson gson;

    public ProblemTypeAdapter(com.google.gson.Gson gson) {
      this.gson = gson;
    }

    @Override
    public void write(com.google.gson.stream.JsonWriter out, ProblemType value) throws java.io.IOException {
      gson.toJson(value, ProblemType.class, out);
    }

    @Override
    public ProblemType read(com.google.gson.stream.JsonReader in) throws java.io.IOException {
      return gson.fromJson(in, ProblemType.class);
    }
  }
}
