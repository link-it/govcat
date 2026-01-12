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
import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.TypeAdapter;
import com.google.gson.TypeAdapterFactory;
import com.google.gson.reflect.TypeToken;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonWriter;
import com.fasterxml.jackson.annotation.JsonCreator;

import java.io.IOException;
import java.util.ArrayList;
import java.util.logging.Level;

import jakarta.validation.Valid;

public class ProblemId implements AnyOfProblemId {

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class ProblemId {\n");
    
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
      if (!ProblemId.class.isAssignableFrom(type.getRawType())) {
        return null;
      }
      return (com.google.gson.TypeAdapter<T>) new ProblemIdAdapter(gson);
    }
  }

  public static class ProblemIdAdapter extends com.google.gson.TypeAdapter<ProblemId> {
    private final com.google.gson.Gson gson;

    public ProblemIdAdapter(com.google.gson.Gson gson) {
      this.gson = gson;
    }

    @Override
    public void write(com.google.gson.stream.JsonWriter out, ProblemId value) throws java.io.IOException {
      gson.toJson(value, ProblemId.class, out);
    }

    @Override
    public ProblemId read(com.google.gson.stream.JsonReader in) throws java.io.IOException {
      return gson.fromJson(in, ProblemId.class);
    }
  }
}
