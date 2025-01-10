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
package test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

import org.junit.Test;

import configuratore.ScenarioCondition;

/**
 * @author Tommaso Burlon (tommaso.burlon@link.it)
 * @author $Author$
 * @version $Rev$, $Date$
 */
public class Conditions {	
	@SafeVarargs
	private static Map<String, String> merge(Map<String, String> ...maps) {
		Map<String, String> rv = new HashMap<>();
		for (Map<String, String> map : maps) 
			rv.putAll(map);
		return rv;
	}
	
	@Test
	public void testConditions() {
		Properties props = new Properties();
		props.put("cond1.profilo", "profilo");
		props.put("cond1.prop1", "value1");
		props.put("cond1.prop2", "value2");
		props.put("cond1.or", "cond2,cond3");
		
		props.put("cond2.prop1Cond2", "value1Cond2");
		props.put("cond2.prop2Cond2", "value2Cond2");
		props.put("cond2.and", "cond4,cond5");
		
		props.put("cond3.prop1Cond3", "value1Cond3");
		props.put("cond3.prop2Cond3", "value2Cond3");
		
		props.put("cond4.prop1Cond4", "value1Cond4");
		props.put("cond4.prop2Cond4", "value2Cond4");
		
		props.put("cond5.prop1Cond5", "value1Cond5");
		props.put("cond5.prop2Cond5", "value2Cond5");
		
		Map<String, Map<String, String>> parsedProp = ScenarioCondition.parsePropery(props);
		
		ScenarioCondition cond1 = ScenarioCondition.parse(parsedProp, "cond1");
		ScenarioCondition cond2 = ScenarioCondition.parse(parsedProp, "cond2");
		ScenarioCondition cond5 = ScenarioCondition.parse(parsedProp, "cond5");
		
		Map<String, String> validate1 = Map.of("prop1", "value1", "prop2", "value2");
		Map<String, String> validate2 = Map.of("prop1Cond2", "value1Cond2", "prop2Cond2", "value2Cond2");
		Map<String, String> validate3 = Map.of("prop1Cond3", "value1Cond3", "prop2Cond3", "value2Cond3");
		Map<String, String> validate4 = Map.of("prop1Cond4", "value1Cond4", "prop2Cond4", "value2Cond4");
		Map<String, String> validate5 = Map.of("prop1Cond5", "value1Cond5", "prop2Cond5", "value2Cond5");
		
		assertFalse(cond1.check("profilo", validate1));
		assertTrue(cond5.check("profilo", validate5));
		assertTrue(cond1.check("profilo", merge(validate1, validate3)));
		assertTrue(cond1.check("profilo", merge(validate1, validate2, validate4, validate5)));
		assertTrue(cond1.check("profilo", merge(validate1, validate2, validate4, validate5)));
		assertFalse(cond1.check("profil", merge(validate1, validate2, validate3, validate5)));
		assertFalse(cond2.check("null", merge(validate1, validate4, validate5)));
		
	}
}
