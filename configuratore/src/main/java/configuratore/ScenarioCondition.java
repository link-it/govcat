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
package configuratore;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;

public class ScenarioCondition {	
	private List<ScenarioCondition> or;
	private List<ScenarioCondition> and;
	private Map<String, String> equalities;
	private String profiloAutenticazione = null;
	
	private ScenarioCondition() {
		this.or = new ArrayList<>();
		this.and = new ArrayList<>();
		this.equalities = new HashMap<>();
	}
	
	
	public static ScenarioCondition and(ScenarioCondition ...conditions) {
		ScenarioCondition condition = new ScenarioCondition();
		condition.and = List.of(conditions);
		return condition;
	}
	
	public static ScenarioCondition or(ScenarioCondition ...conditions) {
		ScenarioCondition condition = new ScenarioCondition();
		condition.or = List.of(conditions);
		return condition;
	}
	
	public static ScenarioCondition parse(Map<String, Map<String, String>> props, String name) {
		ScenarioCondition condition = new ScenarioCondition();
		Map<String, String> conditionProperty = props.get(name);
		
		for (Map.Entry<String, String> prop : conditionProperty.entrySet()) {
			String key = prop.getKey();
			String value = prop.getValue();
			
			if (key.equals("and") || key.equals("or")) {
				List<ScenarioCondition> subList = new ArrayList<>(); 
				String[] subConditions = value.split(",");
				
				for (String subCondition : subConditions)
					subList.add(ScenarioCondition.parse(props, subCondition));
				
				if (key.equals("and")) {
					condition.and.addAll(subList);
				} else {
					condition.or.addAll(subList);
				}
			} else if(key.equals("profilo")) {
				condition.profiloAutenticazione = value;
			} else {
				condition.equalities.put(key, value);
			}
		}
		return condition;
	}
	
	public static Map<String, Map<String, String>> parsePropery(Properties properties) {
		Map<String, Map<String, String>> parsedProperty = new HashMap<>();
		for (Map.Entry<Object, Object> property : properties.entrySet()) {
			String key = property.getKey().toString();
			String value = property.getValue().toString();
			
			if (key.contains(".")) {
				String[] keyPieces = key.split("\\.", 2);
				Map<String, String> condProperty = parsedProperty.getOrDefault(keyPieces[0], new HashMap<>());
				condProperty.put(keyPieces[1], value);
				parsedProperty.putIfAbsent(keyPieces[0], condProperty);
			}
		}
		return parsedProperty;
	}
	
	public boolean check(String profilo, Map<String, String> values) {
		
		if(this.profiloAutenticazione != null && !profilo.equals(this.profiloAutenticazione))
			return false;
		
		for (Map.Entry<String, String> equality : this.equalities.entrySet()) {
			String value = values.get(equality.getKey());
			if (value == null || !value.equals(equality.getValue()))
				return false;
		}
		
		for (ScenarioCondition condition : this.and) {
			if (!condition.check(profilo, values))
				return false;
		}
		
		if (!this.or.isEmpty()) {
			for (ScenarioCondition condition : this.or) {
				if (condition.check(profilo, values))
					return true;
			}
			return false;
		}
		
		return true;
	}
	
	@Override
	public String toString() {
		List<String> conditions = new ArrayList<>();
		List<String> subCondition = new ArrayList<>();
		
		if (this.profiloAutenticazione != null) {
			conditions.add("profilo == \"" + this.profiloAutenticazione + "\"");
		}
		for (Map.Entry<String, String> equality : this.equalities.entrySet())
			conditions.add(equality.getKey() + " == \"" + equality.getValue() + "\"");
		
		for (ScenarioCondition subCond : this.and) {
			subCondition.add(subCond.toString());
		}
		if (!subCondition.isEmpty())
			conditions.add(String.join(" && ", subCondition));
		
		subCondition.clear();
		for (ScenarioCondition subCond : this.or) {
			subCondition.add(subCond.toString());
		}
		if (!subCondition.isEmpty())
			conditions.add("(" + String.join(" || ", subCondition) + ")");
		
		return "(" + String.join(" && ", conditions) + ")";
	}
}
