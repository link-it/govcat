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
package org.govway.catalogo.reverse_proxy.whitelist;

import java.util.Collections;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.http.HttpMethod;

@Configuration
@ConfigurationProperties(prefix = "regole")
@PropertySource(value = "classpath:whitelist.yaml", factory = YamlPropertySourceFactory.class)
public class Whitelist {

	List<String> get;
	List<String> put;
	List<String> post;
	List<String> patch;
	List<String> trace;
	List<String> head;
	List<String> options;
	List<String> delete;
	
	public List<String> getGet() {
		return get;
	}
	public void setGet(List<String> get) {
		this.get = get;
	}
	public List<String> getPut() {
		return put;
	}
	public void setPut(List<String> put) {
		this.put = put;
	}
	public List<String> getPost() {
		return post;
	}
	public void setPost(List<String> post) {
		this.post = post;
	}
	public List<String> getPatch() {
		return patch;
	}
	public void setPatch(List<String> patch) {
		this.patch = patch;
	}
	public List<String> getTrace() {
		return trace;
	}
	public void setTrace(List<String> trace) {
		this.trace = trace;
	}
	public List<String> getHead() {
		return head;
	}
	public void setHead(List<String> head) {
		this.head = head;
	}
	public List<String> getOptions() {
		return options;
	}
	public void setOptions(List<String> options) {
		this.options = options;
	}
	public List<String> getDelete() {
		return delete;
	}
	public void setDelete(List<String> delete) {
		this.delete = delete;
	}
	
	public List<String> getListaPerHttpMethod(HttpMethod httpMethod){
        if (httpMethod == null) {
            return Collections.emptyList();
        }

        switch (httpMethod.name()) {
            case "DELETE":
                return this.delete;
            case "GET":
                return this.get;
            case "HEAD":
                return this.head;
            case "OPTIONS":
                return this.options;
            case "PATCH":
                return this.patch;
            case "POST":
                return this.post;
            case "PUT":
                return this.put;
            case "TRACE":
                return this.trace;
            default:
                return Collections.emptyList();
        }
	}
}
