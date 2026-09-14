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
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
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

    // Intervallo minimo tra due refresh forzati: il calcolo lato backend scandisce tutte le API,
    // quindi la segnalazione di una violazione CSP non deve poter essere usata per generare carico.
    private static final long MIN_FORCED_REFRESH_INTERVAL_SECONDS = 10;

    // Lunghezza massima accettata per un origin da normalizzare: gli origin reali sono molto
    // più corti, il limite serve solo a scartare subito input anomali.
    private static final int MAX_ORIGIN_LENGTH = 255;

    // I caratteri "#", "/", ":", "?" e gli spazi sono esclusi dall'host, coerentemente con la
    // normalizzazione applicata dal backend nel calcolo della lista.
    private static final Pattern SCHEME_HOST_PORT_PATTERN =
            Pattern.compile("^(https?)://([^/:#?\\s]+)(?::(\\d+))?", Pattern.CASE_INSENSITIVE);

    @Autowired
    private WebConsoleConfig webConsoleConfig;

    @Value("${govcat.csp.allowed-hosts.enabled:true}")
    private boolean enabled;

    @Value("${govcat.csp.allowed-hosts.ttl-seconds:300}")
    private long ttlSeconds;

    private final RestTemplate restTemplate = new RestTemplate();

    private final AtomicReference<CacheEntry> cache = new AtomicReference<>();

    private final AtomicReference<Instant> lastForcedRefresh = new AtomicReference<>();

    /**
     * Restituisce la lista degli host consentiti. Se la feature è disabilitata,
     * lista vuota. Altrimenti restituisce la cache, ricaricandola se scaduta.
     * In caso di errore nel refresh, restituisce la cache stale.
     */
    public List<String> getAllowedHosts() {
        if (!this.enabled) {
            return Collections.emptyList();
        }

        CacheEntry current = this.cache.get();
        if (current != null && !current.isExpired(this.ttlSeconds)) {
            return current.hosts;
        }

        try {
            List<String> fresh = fetchFromBackend();
            this.cache.set(new CacheEntry(fresh, Instant.now()));
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

    /**
     * Verifica se l'origin indicato risulta oggi tra gli host consentiti, forzando un refresh
     * della cache (nei limiti di {@link #MIN_FORCED_REFRESH_INTERVAL_SECONDS}) se non è già presente.
     *
     * Serve al recovery lato pagina: quando il browser segnala una connessione bloccata dalla CSP,
     * un esito positivo indica che ricaricando la pagina la CSP conterrà quell'host.
     *
     * @param origin origin nella forma scheme://host[:porta]
     * @return true se l'origin è tra quelli consentiti, false altrimenti (anche se la feature è disabilitata)
     */
    public boolean isAllowedOriginAfterRefresh(String origin) {
        if (!this.enabled) {
            return false;
        }

        String normalized = normalizeOrigin(origin);
        if (normalized == null) {
            return false;
        }

        if (containsOrigin(getCachedHosts(), normalized)) {
            return true;
        }

        forceRefresh();

        return containsOrigin(getCachedHosts(), normalized);
    }

    /**
     * Normalizza un URL o un origin nella forma scheme://host[:porta], omettendo la porta
     * quando coincide con quella di default dello schema (come fa il browser negli origin).
     *
     * @return l'origin normalizzato, oppure null se l'input non è un URL http/https valido
     */
    public static String normalizeOrigin(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank() || rawUrl.length() > MAX_ORIGIN_LENGTH) {
            return null;
        }

        Matcher matcher = SCHEME_HOST_PORT_PATTERN.matcher(rawUrl.trim());
        if (!matcher.find()) {
            return null;
        }

        String scheme = matcher.group(1).toLowerCase();
        String host = matcher.group(2).toLowerCase();
        String port = matcher.group(3);

        boolean portoDiDefault = port == null
                || ("http".equals(scheme) && "80".equals(port))
                || ("https".equals(scheme) && "443".equals(port));

        return scheme + "://" + host + (portoDiDefault ? "" : ":" + port);
    }

    private List<String> getCachedHosts() {
        return Optional.ofNullable(this.cache.get())
                .map(entry -> entry.hosts)
                .orElse(Collections.emptyList());
    }

    private boolean containsOrigin(List<String> hosts, String normalizedOrigin) {
        for (String host : hosts) {
            if (normalizedOrigin.equals(normalizeOrigin(host))) {
                return true;
            }
        }
        return false;
    }

    /**
     * Ricarica la lista dal backend ignorando il TTL. Il refresh viene eseguito al massimo una volta
     * ogni {@link #MIN_FORCED_REFRESH_INTERVAL_SECONDS} secondi; in caso di errore la cache resta invariata.
     */
    private void forceRefresh() {
        Instant now = Instant.now();
        Instant last = this.lastForcedRefresh.get();

        if (last != null && Duration.between(last, now).getSeconds() < MIN_FORCED_REFRESH_INTERVAL_SECONDS) {
            logger.debug("Refresh forzato della lista CSP allowed hosts ignorato: eseguito da meno di {} secondi",
                    MIN_FORCED_REFRESH_INTERVAL_SECONDS);
            return;
        }

        if (!this.lastForcedRefresh.compareAndSet(last, now)) {
            logger.debug("Refresh forzato della lista CSP allowed hosts ignorato: già in corso su un altro thread");
            return;
        }

        try {
            List<String> fresh = fetchFromBackend();
            this.cache.set(new CacheEntry(fresh, Instant.now()));
            logger.debug("Refresh forzato della lista CSP allowed hosts completato: {} host", fresh.size());
        } catch (Exception e) {
            logger.warn("Refresh forzato della lista CSP allowed hosts fallito, cache invariata: {}", e.getMessage());
        }
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
