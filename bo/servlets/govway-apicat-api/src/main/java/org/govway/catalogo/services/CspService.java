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
package org.govway.catalogo.services;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.govway.catalogo.core.business.utils.EServiceBuilder;
import org.govway.catalogo.core.dao.repositories.ApiRepository;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.services.ApiService;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneApi;
import org.govway.catalogo.servlets.model.ConfigurazioneServizio;
import org.govway.catalogo.servlets.model.ConfigurazioneTokenPolicy;
import org.govway.catalogo.servlets.model.ConfigurazioneTokenPolicyCodeGrant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class CspService {

    private static final Logger logger = LoggerFactory.getLogger(CspService.class);

    private static final int API_PAGE_SIZE = 500;

    // I caratteri "#", "/", ":", "?" e gli spazi sono esclusi dall'host: gli URL passati
    // qui devono essere già risolti (no placeholder), ma manteniamo l'esclusione di '#'
    // come difesa in profondità per non emettere host non validi nel CSP.
    private static final Pattern SCHEME_HOST_PORT_PATTERN =
            Pattern.compile("^(https?)://([^/:#?\\s]+)(?::(\\d+))?", Pattern.CASE_INSENSITIVE);

    @Autowired
    private Configurazione configurazione;

    @Autowired
    private ApiService apiService;

    @Autowired
    private ApiRepository apiRepository;

    @Autowired
    private EServiceBuilder eServiceBuilder;

    public List<String> getCspAllowedHosts() {
        Set<String> result = new LinkedHashSet<>();
        collectFromTokenPolicies(result);
        collectFromResolvedApiUrls(result);
        return new ArrayList<>(result);
    }

    private void collectFromTokenPolicies(Set<String> result) {
        try {
            List<ConfigurazioneTokenPolicy> policies = Optional.ofNullable(this.configurazione)
                    .map(Configurazione::getServizio)
                    .map(ConfigurazioneServizio::getApi)
                    .map(ConfigurazioneApi::getTokenPolicies)
                    .orElse(Collections.emptyList());

            for (ConfigurazioneTokenPolicy policy : policies) {
                addNormalized(policy.getTokenUrl(), result);
                if (policy instanceof ConfigurazioneTokenPolicyCodeGrant codeGrant) {
                    addNormalized(codeGrant.getAuthUrl(), result);
                }
            }
        } catch (Exception e) {
            logger.warn("Errore nell'estrazione degli host dalle token policies: {}", e.getMessage());
        }
    }

    private void collectFromResolvedApiUrls(Set<String> result) {
        int pageNumber = 0;
        boolean hasMore = true;
        while (hasMore) {
            final int currentPage = pageNumber;
            try {
                Page<ApiEntity> apiPage = this.apiService.runTransaction(() -> {
                    Pageable pageable = PageRequest.of(currentPage, API_PAGE_SIZE);
                    Page<ApiEntity> p = this.apiRepository.findAll(pageable);
                    for (ApiEntity api : p.getContent()) {
                        resolveAndCollect(api, result);
                    }
                    return p;
                });
                hasMore = apiPage.hasNext();
            } catch (Exception e) {
                logger.warn("Errore durante la query paginata delle API (pagina {}): {}", currentPage, e.getMessage());
                return;
            }
            pageNumber++;
        }
    }

    private void resolveAndCollect(ApiEntity api, Set<String> result) {
        addResolvedUrl(api, false, result);
        addResolvedUrl(api, true, result);
    }

    private void addResolvedUrl(ApiEntity api, boolean collaudo, Set<String> result) {
        try {
            String resolved = this.eServiceBuilder.getUrlInvocazione(api, collaudo);
            addNormalized(resolved, result);
        } catch (Exception e) {
            logger.debug("Errore nella risoluzione URL per api id={} collaudo={}: {}",
                    api.getIdApi(), collaudo, e.getMessage());
        }
    }

    private void addNormalized(String rawUrl, Set<String> result) {
        extractSchemeHostPort(rawUrl).ifPresent(result::add);
    }

    private Optional<String> extractSchemeHostPort(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) {
            return Optional.empty();
        }
        Matcher matcher = SCHEME_HOST_PORT_PATTERN.matcher(rawUrl.trim());
        if (!matcher.find()) {
            return Optional.empty();
        }
        String scheme = matcher.group(1).toLowerCase();
        String host = matcher.group(2);
        String port = matcher.group(3);
        return Optional.of(scheme + "://" + host + (port != null ? ":" + port : ""));
    }
}
