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
package org.govway.catalogo.gest.clients.govwaymonitor;

import com.google.gson.TypeAdapter;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonWriter;
import org.govway.catalogo.gest.clients.govwaymonitor.model.AbstractOpenApiSchema;

import java.io.IOException;

public final class OpenApiSchemaAdapter extends TypeAdapter<AbstractOpenApiSchema> {
    @Override
    public void write(JsonWriter out, AbstractOpenApiSchema value) throws IOException {
        if (value == null || value.getActualInstance() == null) {
            out.nullValue();
            return;
        }
        // usa lo stesso Gson per serializzare l'istanza concreta
        out.jsonValue(org.govway.catalogo.gest.clients.govwaymonitor.impl.JSON.getGson()
                .toJson(value.getActualInstance()));
    }
    @Override
    public AbstractOpenApiSchema read(JsonReader in) throws IOException {
        // Se ti serve anche la deserializzazione generica, va implementata.
        throw new UnsupportedOperationException("not implemented");
    }
}