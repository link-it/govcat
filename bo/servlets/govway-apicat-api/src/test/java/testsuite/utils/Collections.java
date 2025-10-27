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

import static org.apache.commons.collections4.IterableUtils.emptyIfNull;

import java.util.Iterator;
import java.util.Optional;
import java.util.function.Predicate;

public class Collections {
	
	public static <T> Optional<T> findFirst(Iterable<? extends T> collection, Predicate<? super T> test) {
	    T value = null;
	    for (Iterator<? extends T> it = emptyIfNull(collection).iterator(); it.hasNext();) {
		        if (test.test(value = it.next()))
		            return Optional.of(value);
	    }
	    
	    return Optional.empty();
	}
	
	
	public static <T> Optional<T> findFirst(Iterable<? extends T> collection, T value) {		
	    for (Iterator<? extends T> it = emptyIfNull(collection).iterator(); it.hasNext();) {
	    	T maybeEqual = it.next();
	        if (value.equals(maybeEqual)) {
	            return Optional.of(maybeEqual);
	        }
	    }
	    return Optional.empty();
	}
	
	
	public static <T> Optional<T> remove(Iterable<? extends T> collection, T value) {
	    
	    for (Iterator<? extends T> it = emptyIfNull(collection).iterator(); it.hasNext();) {
	    	T ret = it.next();
	    	if (value.equals(ret)) {
	            it.remove();
	            return Optional.of(ret);
	        }
	    }
	    return Optional.empty();
	}
	
	
	public static <T> Optional<T> remove(Iterable<? extends T> collection, Predicate<? super T> test) {
	    T value = null;
	    for (Iterator<? extends T> it = emptyIfNull(collection).iterator(); it.hasNext();)
	        if (test.test(value = it.next())) {
	            it.remove();
	            return Optional.of(value);
	        }
	    return Optional.empty();
	}
	
	
	public static <T> Iterable<? extends T> filterInPlace(Iterable<? extends T> collection, Predicate<? super T> test) {
		if (collection != null) {
			for (Iterator<? extends T> it = emptyIfNull(collection).iterator(); it.hasNext();)
		        if (!test.test(it.next())) {
		            it.remove();
		        }
		}
		return collection;
	}
	
	

}
