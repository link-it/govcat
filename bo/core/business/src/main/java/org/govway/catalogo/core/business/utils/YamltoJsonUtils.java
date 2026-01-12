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
package org.govway.catalogo.core.business.utils;
import java.io.BufferedWriter;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;

import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;

import com.fasterxml.jackson.databind.ObjectMapper;

public class YamltoJsonUtils {

	public static byte[] convertYamlToJson(byte[] inputBytes) throws IOException {
		boolean isJson = isJsonFormat(inputBytes);
		if (isJson) {
			return inputBytes;
		} else {
			try(InputStream is = new ByteArrayInputStream(inputBytes);
					ByteArrayOutputStream os = new ByteArrayOutputStream();) {
				convertYamlToJson(is, os);
				return os.toByteArray();
			}
		}
	}

	private static void convertYamlToJson(InputStream yamlInput, OutputStream jsonOutput) throws IOException {
		LoaderOptions options = new LoaderOptions();
		options.setCodePointLimit(Integer.MAX_VALUE); // Disabilita il limite

		Yaml yaml = new Yaml(options);
		Iterator<Object> docs = yaml.loadAll(yamlInput).iterator();

		ObjectMapper jsonMapper = new ObjectMapper();

		try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(jsonOutput))) {
			while (docs.hasNext()) {
				Object doc = docs.next();
				jsonMapper.writerWithDefaultPrettyPrinter().writeValue(writer, doc);
			}
		}
	}

	private static boolean isJsonFormat(byte[] inputBytes) {
		String preview = new String(inputBytes, 0, Math.min(inputBytes.length, 100), StandardCharsets.UTF_8).trim();
		return preview.startsWith("{") || preview.startsWith("[");
	}

}
