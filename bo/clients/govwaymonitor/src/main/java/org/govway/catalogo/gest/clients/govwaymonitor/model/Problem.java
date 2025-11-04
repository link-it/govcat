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

import org.govway.catalogo.gest.clients.govwaymonitor.model.ProblemDetails;
import org.govway.catalogo.gest.clients.govwaymonitor.model.ProblemId;
import jakarta.validation.constraints.*;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.xml.bind.annotation.*;
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

public class Problem extends org.govway.catalogo.gest.clients.govwaymonitor.model.ProblemId {

    // Custom Type Adapter Factory for Gson serialization
    public static class CustomTypeAdapterFactory implements com.google.gson.TypeAdapterFactory {
        @SuppressWarnings("unchecked")
        @Override
        public <T> com.google.gson.TypeAdapter<T> create(com.google.gson.Gson gson, com.google.gson.reflect.TypeToken<T> type) {
            if (!Problem.class.isAssignableFrom(type.getRawType())) {
                return null;
            }
            return (com.google.gson.TypeAdapter<T>) new ProblemAdapter(gson);
        }
    }

    public static class ProblemAdapter extends com.google.gson.TypeAdapter<Problem> {
        private final com.google.gson.Gson gson;

        public ProblemAdapter(com.google.gson.Gson gson) {
            this.gson = gson;
        }

        @Override
        public void write(com.google.gson.stream.JsonWriter out, Problem value) throws java.io.IOException {
            gson.toJson(value, Problem.class, out);
        }

        @Override
        public Problem read(com.google.gson.stream.JsonReader in) throws java.io.IOException {
            return gson.fromJson(in, Problem.class);
        }
    }
}