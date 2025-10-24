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

import org.apache.commons.lang3.tuple.Pair;

public class EnumsMapper<T1,T2 extends Enum<T2>>  {

	private final HashMap<T1,T2> l2r = new HashMap<>();
	private final HashMap<T2,T1> r2l = new HashMap<>();
	
	@SafeVarargs
	public EnumsMapper(Pair<T1,T2>... maps) {
		for(Pair<T1,T2> p : maps) {
			l2r.put(p.getLeft(), p.getRight());
			r2l.put(p.getRight(), p.getLeft());
		}
	}
	
	public T2 convert(T1 l) {
		return l2r.get(l);
	}
	
	public T1 convert(Enum<T2> r) {
		return r2l.get(r);
	}
	

}
