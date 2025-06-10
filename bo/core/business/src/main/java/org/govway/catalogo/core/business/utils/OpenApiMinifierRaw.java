package org.govway.catalogo.core.business.utils;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

public class OpenApiMinifierRaw {

	public static byte[] extractMinimalOpenApi(byte[] inputBytes) throws IOException {
		boolean isJson = isJsonFormat(inputBytes);
		if (isJson) {
			return extractMinimalJson(inputBytes);
		} else {
			return extractMinimalYaml(inputBytes);
		}
	}

	private static boolean isJsonFormat(byte[] inputBytes) {
		String preview = new String(inputBytes, 0, Math.min(inputBytes.length, 100), StandardCharsets.UTF_8).trim();
		return preview.startsWith("{") || preview.startsWith("[");
		}

		private static byte[] extractMinimalYaml(byte[] inputBytes) throws IOException {
			String versionLine = null;
			byte[] infoSection = extractSection(inputBytes, "info");
			byte[] pathsSection = extractSection(inputBytes, "paths");

			// cerchiamo anche openapi o swagger
			try (BufferedReader reader = new BufferedReader(new InputStreamReader(new ByteArrayInputStream(inputBytes), StandardCharsets.UTF_8))) {
				String line;
				while ((line = reader.readLine()) != null) {
					if (line.trim().startsWith("openapi:") || line.trim().startsWith("swagger:")) {
						versionLine = line.trim();
						break;
					}
				}
			}

			if (versionLine == null) throw new IOException("Missing 'openapi' or 'swagger' version field.");

			// compone il documento completo
			ByteArrayOutputStream out = new ByteArrayOutputStream();
			BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(out, StandardCharsets.UTF_8));

			writer.write(versionLine);
			writer.newLine();
			writer.write(new String(infoSection, StandardCharsets.UTF_8));
			writer.write(new String(pathsSection, StandardCharsets.UTF_8));
			writer.flush();

			return out.toByteArray();
		}

		public static byte[] extractMinimalJson(byte[] inputBytes) throws IOException {
			ObjectMapper mapper = new ObjectMapper();
			JsonNode root = mapper.readTree(new ByteArrayInputStream(inputBytes));

			String versionKey = root.has("openapi") ? "openapi"
					: root.has("swagger") ? "swagger"
							: null;
			if (versionKey == null) {
				throw new IOException("Missing 'openapi' or 'swagger' field.");
			}

			JsonNode versionValue = root.get(versionKey);
			JsonNode infoNode = root.path("info");
			JsonNode pathsNode = root.path("paths");

			if (infoNode.isMissingNode() || pathsNode.isMissingNode()) {
				throw new IOException("Missing 'info' or 'paths' section.");
			}

			ObjectNode minimal = mapper.createObjectNode();
			minimal.set(versionKey, versionValue);
			minimal.set("info", infoNode);
			minimal.set("paths", pathsNode);

			ByteArrayOutputStream output = new ByteArrayOutputStream();
			mapper.writerWithDefaultPrettyPrinter().writeValue(output, minimal);
			return output.toByteArray();
		}

		private static byte[] extractSection(byte[] inputBytes, String sectionName) throws IOException {
			ByteArrayInputStream inputStream = new ByteArrayInputStream(inputBytes);
			ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

			BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8));
			BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(outputStream, StandardCharsets.UTF_8));

			String line;
			boolean inSection = false;
			int baseIndent = -1;
			Pattern rootKeyPattern = Pattern.compile("^[a-zA-Z0-9_]+:\\s*$");

			while ((line = reader.readLine()) != null) {
				if (line.trim().startsWith(sectionName + ":")) {
					inSection = true;
					baseIndent = line.indexOf(sectionName.charAt(0));
					writer.write(line);
					writer.newLine();
					continue;
				}

				if (inSection) {
					int currentIndent = line.indexOf(line.trim());
					if (currentIndent <= baseIndent && rootKeyPattern.matcher(line.trim()).matches()) {
						break;
					}
					writer.write(line);
					writer.newLine();
				}
			}

			writer.flush();
			return outputStream.toByteArray();
		}
}
