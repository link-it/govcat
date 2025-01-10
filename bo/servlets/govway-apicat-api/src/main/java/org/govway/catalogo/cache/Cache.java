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
package org.govway.catalogo.cache;

import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.stream.Collectors;

import org.joda.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Cache<V> {

	private Map<String, CachedObject<V>> map = new HashMap<>();

	private Logger logger = LoggerFactory.getLogger(Cache.class);

	private CacheConfiguration cacheConfiguration;
	public Cache(CacheConfiguration cacheConfiguration) {
		this.cacheConfiguration = cacheConfiguration;
	}
	
	public synchronized V cache(String key, V value) {
		if(this.cacheConfiguration.isEnabled()) {
			CachedObject<V> o = new CachedObject<V>();
			o.setObject(value);
			
			Instant instant = Instant.now();
			
			o.setDataCreazione(instant.toDate());
			o.setDataScadenza(instant.plus(this.cacheConfiguration.getTtl() * 1000).toDate());
			
			this.map.put(key, o);
			this.logger.debug("[CACHE abilitata] cache key["+key+"]");
			
			if(this.cacheConfiguration.getMaxElements() != null && this.map.size() >= this.cacheConfiguration.getMaxElements()) {
				this.logger.debug("[CACHE] Superata dimensione di ["+this.cacheConfiguration.getMaxElements()+"]: ["+this.map.size()+"]. Rimuovo un elemento.");
				remove();
			}
			
		} else {
			this.logger.debug("[CACHE disabilitata] cache key["+key+"]");
		}
		
		return value;
	}

	private  synchronized void remove() {
		
		Comparator<? super Entry<String, CachedObject<V>>> c = new Comparator<>() {

			@Override
			public int compare(Entry<String, CachedObject<V>> o1, Entry<String, CachedObject<V>> o2) {
				return o1.getValue().getDataCreazione().compareTo(o2.getValue().getDataCreazione());
			}
			
		};
		
		List<Entry<String, CachedObject<V>>> list = this.map.entrySet().stream().sorted(c).collect(Collectors.toList());
		Entry<String, CachedObject<V>> entry = list.get(0);

		this.logger.debug("[CACHE] Rimozione dell'elemento con chiave ["+entry.getKey()+"] inserito in data ["+entry.getValue().getDataCreazione()+"]...");
		boolean r = this.map.remove(entry.getKey(), entry.getValue());
		this.logger.debug("[CACHE] Rimozione dell'elemento con chiave ["+entry.getKey()+"] inserito in data ["+entry.getValue().getDataCreazione()+"] ok? " + r);
	}

	public Optional<V> get(String key) {
		V object = null;
		if(this.map.containsKey(key)) {
			CachedObject<V> o = this.map.get(key);
			this.logger.debug("[CACHE] get key["+key+"] trovata");
			
			if(o.getDataScadenza().after(new Date())) {
				this.logger.debug("[CACHE] get key["+key+"] valida fino al ["+o.getDataScadenza()+"]");
				object = o.getObject();
			} else {
				this.logger.debug("[CACHE] get key["+key+"] scaduta il ["+o.getDataScadenza()+"]");
			}
		}
		
		
		return Optional.ofNullable(object);
	}


}
