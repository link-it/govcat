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

public class ProblemTitle implements AnyOfProblemId {
  
  @Schema(required = true, description = "A short, summary of the problem type. Written in english and readable for engineers (usually not suited for non technical stakeholders and not localized); example: Service Unavailable ")
 /**
   * A short, summary of the problem type. Written in english and readable for engineers (usually not suited for non technical stakeholders and not localized); example: Service Unavailable   
  **/
  private String title = null;
 /**
   * A short, summary of the problem type. Written in english and readable for engineers (usually not suited for non technical stakeholders and not localized); example: Service Unavailable 
   * @return title
  **/
  @JsonProperty("title")
  @NotNull
  @Valid
  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public ProblemTitle title(String title) {
    this.title = title;
    return this;
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class ProblemTitle {\n");
    
    sb.append("    title: ").append(toIndentedString(title)).append("\n");
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
      if (!ProblemTitle.class.isAssignableFrom(type.getRawType())) {
        return null;
      }
      return (com.google.gson.TypeAdapter<T>) new ProblemTitleAdapter(gson);
    }
  }

  public static class ProblemTitleAdapter extends com.google.gson.TypeAdapter<ProblemTitle> {
    private final com.google.gson.Gson gson;

    public ProblemTitleAdapter(com.google.gson.Gson gson) {
      this.gson = gson;
    }

    @Override
    public void write(com.google.gson.stream.JsonWriter out, ProblemTitle value) throws java.io.IOException {
      gson.toJson(value, ProblemTitle.class, out);
    }

    @Override
    public ProblemTitle read(com.google.gson.stream.JsonReader in) throws java.io.IOException {
      return gson.fromJson(in, ProblemTitle.class);
    }
  }
}
