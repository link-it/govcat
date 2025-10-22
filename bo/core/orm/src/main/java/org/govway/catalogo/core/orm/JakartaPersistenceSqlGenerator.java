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
package org.govway.catalogo.core.orm;
import java.io.IOException;
import java.lang.reflect.Method;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

import org.govway.catalogo.core.orm.filter_providers.SchemaFilterProvider;

public class JakartaPersistenceSqlGenerator {

	public enum TipiDatabase {POSTGRESQL,MYSQL,ORACLE, DERBY, H2}
	
	public static void generate(String persistenceId, String folder) throws IOException {

//		TipiDatabase[] values = {TipiDatabase.POSTGRESQL,TipiDatabase.MYSQL,TipiDatabase.ORACLE, TipiDatabase.DERBY};
		for(TipiDatabase tipoDatabase: TipiDatabase.values()) {
			try {
				generate(persistenceId, folder, tipoDatabase);
			} catch (IOException e) {
				System.err.println("Error generating SQL for " + tipoDatabase + ": " + e.getMessage());
				e.printStackTrace(System.err);
				// Continue with next database instead of stopping
			}
		}
	}
	
	private static void generate(String persistenceId, String folder, TipiDatabase tipoDatabase) throws IOException {

		String create= folder + tipoDatabase.toString().toLowerCase() +  "/"+persistenceId+".sql";
		String drop = folder + tipoDatabase.toString().toLowerCase()+ "/"+persistenceId+"_drop.sql";

		Files.deleteIfExists(Paths.get(create));
        Files.deleteIfExists(Paths.get(drop));

        Map<String, String> map = getMap(persistenceId, create, drop, tipoDatabase);
		
		// Persistence.generateSchema(persistenceId, map);
		try {
			Class<?> cPersistence = Class.forName("jakarta.persistence.Persistence");
			Method m = cPersistence.getMethod("generateSchema", persistenceId.getClass(), java.util.Map.class);
			m.invoke(null, persistenceId, map);
		}catch(Throwable t) {
			throw new IOException(t);
		}
      
	}

	private static Map<String, String> getMap(String persistenceId, String create, String drop, TipiDatabase tipoDatabase) throws IOException {
		Map<String, String> map = new HashMap<String, String>();

        map.put("jakarta.persistence.schema-generation.scripts.action", "drop-and-create");
        map.put("jakarta.persistence.schema-generation.scripts.create-target", create);
        map.put("jakarta.persistence.schema-generation.scripts.drop-target", drop);
        map.put("hibernate.hbm2ddl.schema_filter_provider", SchemaFilterProvider.class.getName());
        map.put("hibernate.hbm2ddl.delimiter", ";");
        map.put("hibernate.format_sql", "true");
		
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

}
