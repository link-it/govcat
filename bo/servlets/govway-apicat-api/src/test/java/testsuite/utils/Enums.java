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
package testsuite.utils;

import java.util.HashMap;
import java.util.Map;

public class Enums {

	public static final <T1,T2> HashMap<T1,T2> dualizeMap(Map<T2,T1> map) {
		HashMap<T1,T2> ret = new HashMap<T1,T2>();
		
		map.forEach( (t2, t1) -> ret.put(t1, t2));
		
		return ret;
	}

	public static <T1 extends Enum<T1>, T2 extends Enum<T2>> T2 convert(T1 src, Map<T1,T2> mapper) {
		if (src == null) return null;
		
		T2 ret = mapper.get(src);
		if (ret == null) {
			throw new IllegalArgumentException("Valore " + src.toString() + " per " + src.getClass().getSimpleName() + " sconosciuto." );
		}
		return ret;
	}
	
	
	public static <T1 extends Enum<T1>> void throwUnknown(T1 src) throws RuntimeException {
		throw new IllegalArgumentException("Valore <" + src + "> sconosciuto per enum <" + src.getClass().getCanonicalName()+">");
	}
	
	public static <T1 extends Enum<T1>> IllegalArgumentException exceptionUknown(T1 src) throws RuntimeException {
		return new IllegalArgumentException("Valore <" + src + "> sconosciuto per enum <" + src.getClass().getCanonicalName()+">");
	}
}
