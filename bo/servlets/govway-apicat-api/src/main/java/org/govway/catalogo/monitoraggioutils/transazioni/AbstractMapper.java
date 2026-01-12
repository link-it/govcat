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
package org.govway.catalogo.monitoraggioutils.transazioni;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.MappingIterator;
import com.fasterxml.jackson.databind.ObjectReader;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.fasterxml.jackson.databind.SequenceWriter;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.dataformat.csv.CsvMapper;
import com.fasterxml.jackson.dataformat.csv.CsvSchema;

public abstract class AbstractMapper<T> {

	final Class<T> typeParameterClass;
	final Class<?> typeParameterClassFormat;
	
	public AbstractMapper(Class<T> typeParameterClass, Class<?> typeParameterClassFormat) {
        this.typeParameterClass = typeParameterClass;
        this.typeParameterClassFormat = typeParameterClassFormat;
	}
	
	private ObjectWriter getWriter() {
		return getMapper().writerFor(this.typeParameterClass).with(getGenericSchema(getSchema()));
	}
	
	private ObjectReader getReader() {
		return getMapper().readerFor(this.typeParameterClass).with(getGenericSchema(getSchema()));
	}
	
	private CsvSchema getGenericSchema(CsvSchema columnSchema) {
		CsvSchema schema = getMapper().schemaFor(this.typeParameterClass)
				.withHeader()
				.withColumnsFrom(columnSchema)
				.withColumnSeparator(',')
				.withQuoteChar('"')
				.withComments()
				.withNullValue("");

		return schema;
	}

	public String writeValues(Collection<T> values) throws IOException {
		try(ByteArrayOutputStream baos = new ByteArrayOutputStream();SequenceWriter writeValues = getWriter().writeValues(baos);) {
			writeValues.writeAll(values);

			if(values.isEmpty()) {
				writeValues.writeAll(Arrays.asList());
			}
			
			return new String(baos.toByteArray());
		}
	}
	
	public void writeTo(Collection<T> values, Path path) throws IOException {
		String sValue = writeValues(values);
		Files.writeString(path, sValue);
	}
	
	public Collection<T> readFrom(Path path) throws IOException {
		return readValues(new String(Files.readAllBytes(path)));
	}
	
	public Collection<T> readValues(String csv) throws IOException {
		ObjectReader reader = getReader();
		MappingIterator<T> iter = reader.readValues(csv.getBytes());
		
		List<T> lst = new ArrayList<>();
		while(iter.hasNext()) {
			lst.add(iter.next());
		}

		return lst;
	}
	
	protected abstract CsvSchema getSchema();

	private CsvMapper getMapper() {
		CsvMapper mapper = new CsvMapper();

		if(this.typeParameterClassFormat!=null) {
			mapper.addMixIn(this.typeParameterClass, this.typeParameterClassFormat);
		}
		mapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
		mapper.configure(JsonGenerator.Feature.IGNORE_UNKNOWN, true);
		mapper.disable(MapperFeature.SORT_PROPERTIES_ALPHABETICALLY);

		return mapper;
	}


}