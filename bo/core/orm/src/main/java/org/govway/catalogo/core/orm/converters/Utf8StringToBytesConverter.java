package org.govway.catalogo.core.orm.converters;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.nio.charset.StandardCharsets;

@Converter(autoApply = true)
public class Utf8StringToBytesConverter implements AttributeConverter<byte[], String> {

    @Override
    public String convertToDatabaseColumn(byte[] attribute) {
        return attribute == null ? null : new String(attribute, StandardCharsets.UTF_8);
    }

    @Override
    public byte[] convertToEntityAttribute(String dbData) {
        return dbData == null ? null : dbData.getBytes(StandardCharsets.UTF_8);
    }
}
