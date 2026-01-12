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
package org.govway.catalogo.core.orm.converters;

import javax.persistence.AttributeConverter;
import javax.persistence.Converter;
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
