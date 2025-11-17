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