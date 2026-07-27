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
package org.govway.catalogo.core.orm;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;

import org.govway.catalogo.core.orm.filter_providers.SchemaFilterProvider;
import org.hibernate.boot.Metadata;
import org.hibernate.boot.MetadataSources;
import org.hibernate.boot.registry.StandardServiceRegistry;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.hibernate.tool.schema.spi.SchemaManagementToolCoordinator;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.core.type.AnnotationMetadata;
import org.springframework.core.type.classreading.MetadataReaderFactory;
import org.springframework.core.type.classreading.SimpleMetadataReaderFactory;
import org.springframework.util.ClassUtils;

import jakarta.persistence.Converter;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Entity;
import jakarta.persistence.MappedSuperclass;

/**
 * Genera gli script DDL di creazione/drop dello schema per tutti i database supportati,
 * partendo dalle entity annotate.
 *
 * Il bootstrap avviene tramite l'API nativa di Hibernate ({@link MetadataSources}) e non
 * tramite jakarta.persistence.Persistence#generateSchema: con Hibernate 7 quel percorso
 * richiede una connessione JDBC e non individua piu' le entity per autodetection dalla
 * persistence unit, producendo silenziosamente script vuoti.
 *
 * Gli script sono un artefatto di build (finiscono sotto target/) e non vengono versionati.
 */
public class HibernateSqlGenerator {

	public enum TipiDatabase {POSTGRESQL,MYSQL,ORACLE, DERBY, H2}

	/** Package scansionati alla ricerca delle classi mappate (entity, converter, embeddable). */
	private static final String[] MAPPED_PACKAGES = {
			"org.govway.catalogo.core.orm.entity",
			"org.govway.catalogo.core.orm.converters"
	};

	private HibernateSqlGenerator() {
	}

	/**
	 * Genera gli script per tutti i database supportati. Il fallimento su un singolo
	 * dialect non interrompe la generazione degli altri e non fa fallire la build:
	 * viene riportato a video insieme al riepilogo finale.
	 */
	public static void generate(String schemaName, String folder) throws IOException {

		List<String> mappedClasses = findMappedClasses();
		if(mappedClasses.isEmpty()) {
			System.err.println("[SqlGenerator] ATTENZIONE: nessuna classe mappata trovata nei package " + String.join(", ", MAPPED_PACKAGES) + ": nessuno script generato");
			return;
		}

		List<String> generati = new ArrayList<>();
		List<String> falliti = new ArrayList<>();

		for(TipiDatabase tipoDatabase: TipiDatabase.values()) {
			try {
				generate(schemaName, folder, tipoDatabase, mappedClasses);
				generati.add(tipoDatabase.toString());
			} catch (Exception e) {
				falliti.add(tipoDatabase.toString());
				System.err.println("[SqlGenerator] Errore nella generazione dello schema " + tipoDatabase + ": " + e.getMessage());
				e.printStackTrace(System.err);
				// Si prosegue con il database successivo: la generazione degli script
				// non e' bloccante per la build.
			}
		}

		System.out.println("[SqlGenerator] Classi mappate: " + mappedClasses.size() + " - script generati: " + String.join(", ", generati));
		if(!falliti.isEmpty()) {
			System.err.println("[SqlGenerator] ATTENZIONE: script NON generati per: " + String.join(", ", falliti));
		}
	}

	private static void generate(String schemaName, String folder, TipiDatabase tipoDatabase, List<String> mappedClasses) throws IOException {

		Path outputDir = Paths.get(folder, tipoDatabase.toString().toLowerCase());
		Files.createDirectories(outputDir);

		Path create = outputDir.resolve(schemaName + ".sql");
		Path drop = outputDir.resolve(schemaName + "_drop.sql");

		Files.deleteIfExists(create);
		Files.deleteIfExists(drop);

		Map<String, Object> settings = getSettings(create, drop, tipoDatabase);

		StandardServiceRegistry registry = new StandardServiceRegistryBuilder().applySettings(settings).build();
		try {
			MetadataSources sources = new MetadataSources(registry);
			for(String mappedClass: mappedClasses) {
				sources.addAnnotatedClassName(mappedClass);
			}
			Metadata metadata = sources.buildMetadata();

			SchemaManagementToolCoordinator.process(metadata, registry, settings, action -> {
				// nessuna azione differita: la generazione produce solo script su file
			});
		} finally {
			StandardServiceRegistryBuilder.destroy(registry);
		}
	}

	private static Map<String, Object> getSettings(Path create, Path drop, TipiDatabase tipoDatabase) {
		Map<String, Object> map = new HashMap<>();

		map.put("jakarta.persistence.schema-generation.scripts.action", "drop-and-create");
		map.put("jakarta.persistence.schema-generation.scripts.create-target", create.toString());
		map.put("jakarta.persistence.schema-generation.scripts.drop-target", drop.toString());
		map.put("hibernate.hbm2ddl.schema_filter_provider", SchemaFilterProvider.class.getName());
		map.put("hibernate.hbm2ddl.delimiter", ";");
		map.put("hibernate.format_sql", "true");
		// Nessun database a disposizione in fase di build: il dialect e' imposto e la
		// lettura dei metadati JDBC va disabilitata esplicitamente (da Hibernate 6.5).
		map.put("hibernate.boot.allow_jdbc_metadata_access", "false");

		switch(tipoDatabase) {
		case H2:
			map.put("jakarta.persistence.database-product-name", "H2");
			map.put("hibernate.dialect","org.hibernate.dialect.H2Dialect");
			break;
		case DERBY:
			map.put("jakarta.persistence.database-product-name", "Derby");
			map.put("hibernate.dialect","org.hibernate.community.dialect.DerbyLegacyDialect");
			break;
		case MYSQL:
			map.put("jakarta.persistence.database-product-name", "MySQL");
			map.put("hibernate.dialect","org.hibernate.dialect.MySQLDialect");
			break;
		case ORACLE:
			map.put("jakarta.persistence.database-product-name", "Oracle");
			map.put("hibernate.dialect","org.hibernate.dialect.OracleDialect");
			break;
		case POSTGRESQL:
			map.put("jakarta.persistence.database-product-name", "Postgresql");
			map.put("hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");
			map.put("jakarta.persistence.database-major-version", "9");
			map.put("jakarta.persistence.database-minor-version", "1");
			break;
		default:
			break;
		}

		return map;
	}

	/**
	 * Individua le classi mappate scandendo il classpath: le entity non sono elencate nel
	 * persistence.xml e l'autodetection di Hibernate non e' disponibile in questo bootstrap.
	 * I converter vanno inclusi perche' quelli con autoApply influenzano il tipo delle colonne.
	 */
	private static List<String> findMappedClasses() throws IOException {

		MetadataReaderFactory readerFactory = new SimpleMetadataReaderFactory();
		ResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();

		TreeSet<String> classNames = new TreeSet<>();
		for(String mappedPackage: MAPPED_PACKAGES) {
			String pattern = ResourcePatternResolver.CLASSPATH_ALL_URL_PREFIX
					+ ClassUtils.convertClassNameToResourcePath(mappedPackage) + "/**/*.class";
			for(Resource resource: resolver.getResources(pattern)) {
				AnnotationMetadata metadata = readerFactory.getMetadataReader(resource).getAnnotationMetadata();
				if(isMapped(metadata)) {
					classNames.add(metadata.getClassName());
				}
			}
		}

		return Collections.unmodifiableList(new ArrayList<>(classNames));
	}

	private static boolean isMapped(AnnotationMetadata metadata) {
		return metadata.hasAnnotation(Entity.class.getName())
				|| metadata.hasAnnotation(MappedSuperclass.class.getName())
				|| metadata.hasAnnotation(Embeddable.class.getName())
				|| metadata.hasAnnotation(Converter.class.getName());
	}

}
