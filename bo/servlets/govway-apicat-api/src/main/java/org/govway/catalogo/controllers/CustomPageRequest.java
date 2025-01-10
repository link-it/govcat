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
	package org.govway.catalogo.controllers;

	import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

	import org.springframework.data.domain.Pageable;
	import org.springframework.data.domain.Sort;
	import org.springframework.data.domain.Sort.Order;

	public class CustomPageRequest implements Pageable {
	    private final int page;
	    private final int size;
	    private final List<String> sort;
	    private final Sort sortedList;
	    List<String> sortingDefault;
	    String ascDescDefault;

	    public CustomPageRequest(int page, int size, List<String> sort, List<String> propertyDefault) {
	        this.page = page;
	        this.size = size;
			this.sort = sort;
	        if (propertyDefault==null || propertyDefault.isEmpty()) {
	        	propertyDefault = List.of("id","asc");
	        }
	        this.sortingDefault = propertyDefault;
	        
	        this.sortedList = parseSortList(sort);

	    }

	    public Sort parseSortList(List<String> sort) {
	    	// TODO: manca il controllo che la property esista, ogni entity ha un enum con la lista dei campi. però ogni entity ha un enum diverso, complica la cosa
	        if (sort == null || sort.isEmpty() || Sort.unsorted().toString().equals(sort.get(0))) {
	        	sort = sortingDefault;
	        }
	        List<Order> orders = new ArrayList<>();
//	        // il caso sort=nome,asc viene convertito nella lista{[nome],[asc]} come due elementi, invece di un unico elemento [nome,asc]
//	        if (sort.size()==2 && (sort.get(1).equals("asc") || sort.get(1).equals("desc"))) {
//	        	sort.set(0, sort.get(0)+","+sort.get(1));
//	        	sort.remove(1);
//	        }

	        List<String> sortt = new ArrayList<>();
	        
	        for (String sortField : sort) {
	            String[] fieldAndDirection = sortField.split(",");
	            sortt.addAll(Arrays.asList(fieldAndDirection));
	        }

	        List<Integer> ascs = new ArrayList<>();
	        List<Integer> descs = new ArrayList<>();
	        
	        for(int i=0; i < sortt.size(); i++) {
	        	if("asc".equals(sortt.get(i))) {
	        		ascs.add(i);
	        	}
	        	if("desc".equals(sortt.get(i))) {
	        		descs.add(i);
	        	}
	        }
	        for(int i=0; i < sortt.size(); i++) {
	        	if(ascs.contains(i) || descs.contains(i)) {
	        		continue;
	        	}
	        	
	        	if(i < sortt.size() -1) {
	        		if(ascs.contains(i+1)) {
	        			orders.add(Order.asc(sortt.get(i)));
	        		}else if(descs.contains(i+1)) {
	        			orders.add(Order.desc(sortt.get(i)));
	        		} else {
	        			orders.add(Order.asc(sortt.get(i)));
	        		}
	        	} else {
		        	orders.add(Order.asc(sortt.get(i)));
	        	}
	        }
	        return Sort.by(orders);
	    }

	    @Override
	    public int getPageNumber() {
	        return page;
	    }

	    @Override
	    public int getPageSize() {
	        return size;
	    }

	    @Override
	    public long getOffset() {
	        return (long) page * size;
	    }

	    @Override
	    public Pageable next() {
	        return new CustomPageRequest(page + 1, size, sort,sortingDefault);
	    }

	    public Pageable previous() {
	        return page == 0 ? this : new CustomPageRequest(page - 1, size, sort,sortingDefault);
	    }

	    @Override
	    public Pageable first() {
	        return new CustomPageRequest(0, size, sort,sortingDefault);
	    }

	    @Override
	    public boolean hasPrevious() {
	        return page > 0;
	    }

	    @Override
	    public Pageable previousOrFirst() {
	        return hasPrevious() ? previous() : first();
	    }

		@Override
		public Sort getSort() {
			return sortedList;
		}

		@Override
		public Pageable withPage(int pageNumber) {
			return new CustomPageRequest(pageNumber, size, sort, sortingDefault);
		}

	}
