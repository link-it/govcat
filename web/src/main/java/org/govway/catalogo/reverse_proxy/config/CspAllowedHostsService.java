/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
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
package org.govway.catalogo.reverse_proxy.config;

import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Recupera dal backend la lista degli host upstream consentiti per il direttivo
 * connect-src della Content-Security-Policy del frontend.
 *
 * Cache in-memory con TTL configurabile: in caso di errore nel refresh, viene
 * restituita la cache scaduta come fallback (mai svuotata su errore).
 */
@Service
public class CspAllowedHostsService {

    private static final Logger logger = LoggerFactory.getLogger(CspAllowedHostsService.class);

    // La property org.govway.catalogo.api.url include già il prefisso /api/v1, quindi qui
    // concateniamo solo il path relativo dell'operazione (come fa il reverse proxy interno).
    private static final String CSP_HOSTS_PATH = "/tools/csp-allowed-hosts";

    @Autowired
    private WebConsoleConfig webConsoleConfig;

    @Value("${govcat.csp.allowed-hosts.enabled:true}")
    private boolean enabled;

    @Value("${govcat.csp.allowed-hosts.ttl-seconds:300}")
    private long ttlSeconds;

    private final RestTemplate restTemplate = new RestTemplate();

    private volatile CacheEntry cache;

    /**
     * Restituisce la lista degli host consentiti. Se la feature è disabilitata,
     * lista vuota. Altrimenti restituisce la cache, ricaricandola se scaduta.
     * In caso di errore nel refresh, restituisce la cache stale.
     */
    public List<String> getAllowedHosts() {
        if (!this.enabled) {
            return Collections.emptyList();
        }

        CacheEntry current = this.cache;
        if (current != null && !current.isExpired(this.ttlSeconds)) {
            return current.hosts;
        }

        try {
            List<String> fresh = fetchFromBackend();
            this.cache = new CacheEntry(fresh, Instant.now());
            return fresh;
        } catch (Exception e) {
            if (current != null) {
                logger.warn("Refresh della lista CSP allowed hosts fallito, uso cache stale ({} host): {}",
                        current.hosts.size(), e.getMessage());
                return current.hosts;
            }
            logger.warn("Recupero iniziale della lista CSP allowed hosts fallito, restituisco lista vuota: {}",
                    e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Restituisce gli host pronti per essere concatenati alla direttiva connect-src
     * della CSP: stringa separata da spazi, vuota se nessun host è configurato.
     */
    public String getAllowedHostsAsCspString() {
        List<String> hosts = getAllowedHosts();
        if (hosts.isEmpty()) {
            return "";
        }
        return hosts.stream().collect(Collectors.joining(" "));
    }

    private List<String> fetchFromBackend() {
        String baseUrl = this.webConsoleConfig.getUrlGovWayCatalogoAPI();
        if (baseUrl == null || baseUrl.isBlank()) {
            throw new IllegalStateException("URL backend (org.govway.catalogo.api.url) non configurato");
        }
        String url = baseUrl.endsWith("/")
                ? baseUrl.substring(0, baseUrl.length() - 1) + CSP_HOSTS_PATH
                : baseUrl + CSP_HOSTS_PATH;

        RequestEntity<Void> request = RequestEntity.method(HttpMethod.GET, url).build();
        ResponseEntity<List<String>> response = this.restTemplate.exchange(
                request,
                new ParameterizedTypeReference<List<String>>() {});

        List<String> body = response.getBody();
        return body != null ? body : Collections.emptyList();
    }

    private static final class CacheEntry {
        final List<String> hosts;
        final Instant fetchedAt;

        CacheEntry(List<String> hosts, Instant fetchedAt) {
            this.hosts = List.copyOf(hosts);
            this.fetchedAt = fetchedAt;
        }

        boolean isExpired(long ttlSeconds) {
            return Duration.between(this.fetchedAt, Instant.now()).getSeconds() >= ttlSeconds;
        }
    }
}
