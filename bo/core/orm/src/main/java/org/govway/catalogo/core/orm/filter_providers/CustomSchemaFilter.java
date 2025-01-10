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
package org.govway.catalogo.core.orm.filter_providers;

import java.util.Arrays;
import java.util.List;

import org.hibernate.boot.model.relational.Namespace;
import org.hibernate.boot.model.relational.Sequence;
import org.hibernate.mapping.Table;
import org.hibernate.tool.schema.spi.SchemaFilter;

public class CustomSchemaFilter implements SchemaFilter {

	  public static final CustomSchemaFilter INSTANCE = new CustomSchemaFilter();

	  private final List<String> tablesToExclude;
	  
	  public CustomSchemaFilter() {
		this.tablesToExclude = Arrays.asList("servizi_gruppi", "servizi_comunicazioni", "adesioni_comunicazioni");
	  }
	  
	  @Override
	  public boolean includeNamespace(Namespace namespace) {
	    return true;
	  }

	  @Override
	  public boolean includeTable(Table table) {
	    return !tablesToExclude.contains(table.getName());
	  }

	  @Override
	  public boolean includeSequence(Sequence sequence) {
	    return true;
	  }

}
