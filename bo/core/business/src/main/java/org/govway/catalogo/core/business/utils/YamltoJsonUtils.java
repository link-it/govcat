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
