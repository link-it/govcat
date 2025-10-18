package org.govway.catalogo.reverse_proxy.config;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.ServletContextAware;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import javax.servlet.ServletContext;

/**
 * Controller per servire la configurazione dell'applicazione Angular
 * con supporto per override parziale tramite file esterno.
 *
 * Questo controller intercetta le richieste a /assets/config/app-config.json
 * e restituisce una configurazione merged se esiste un file di override esterno.
 */
@RestController
public class AppConfigController implements ServletContextAware {

    private static final Logger log = LoggerFactory.getLogger(AppConfigController.class);

    private final ObjectMapper objectMapper = new ObjectMapper();
    private ServletContext servletContext;

    @Value("${govcat.config.override.path:/var/govcat/conf/app-config-override.json}")
    private String overrideConfigPath;

    @Value("${govcat.config.override.enabled:true}")
    private boolean overrideEnabled;

    // Cache per la configurazione merged
    private volatile JsonNode cachedConfig;

    // Timestamp dell'ultima modifica del file di override
    private volatile long lastModifiedTime = -1;

    // Flag per verificare se la configurazione di default è già stata caricata
    private volatile boolean defaultConfigLoaded = false;

    @Override
    public void setServletContext(ServletContext servletContext) {
        this.servletContext = servletContext;
    }

    /**
     * Endpoint che restituisce la configurazione dell'applicazione Angular.
     * Se esiste un file di override esterno, viene fatto il merge con la configurazione di default.
     * La configurazione viene caricata una volta e tenuta in cache, ricaricata solo se il file esterno viene modificato.
     *
     * @return La configurazione merged in formato JSON
     */
    @GetMapping(value = "/assets/config/app-config.json", produces = MediaType.APPLICATION_JSON_VALUE)
    public JsonNode getAppConfig(HttpServletResponse response) {
        // Verifica se è necessario ricaricare la configurazione
        if (needsReload()) {
            synchronized (this) {
                // Double-check locking per evitare ricaricamenti multipli concorrenti
                if (needsReload()) {
                    cachedConfig = loadConfiguration(response);
                }
            }
        }

        return cachedConfig != null ? cachedConfig : loadConfiguration(response);
    }

    /**
     * Verifica se è necessario ricaricare la configurazione.
     *
     * @return true se la configurazione deve essere ricaricata
     */
    private boolean needsReload() {
        // Se non è mai stata caricata, deve essere ricaricata
        if (!defaultConfigLoaded) {
            return true;
        }

        // Se l'override è disabilitato e la configurazione è già caricata, non serve ricaricare
        if (!overrideEnabled) {
            return false;
        }

        // Verifica se il file di override esiste ed è stato modificato
        Path overridePath = Paths.get(overrideConfigPath);
        if (Files.exists(overridePath) && Files.isRegularFile(overridePath)) {
            try {
                long currentModifiedTime = Files.getLastModifiedTime(overridePath).toMillis();
                // Ricarica se il file è stato modificato dall'ultimo caricamento
                return currentModifiedTime != lastModifiedTime;
            } catch (IOException e) {
                log.warn("Impossibile verificare la data di modifica del file di override: {}", e.getMessage());
                // In caso di errore, mantieni la cache esistente
                return false;
            }
        } else if (lastModifiedTime != -1) {
            // Il file di override esisteva ma ora non esiste più, ricarica la configurazione di default
            return true;
        }

        return false;
    }

    /**
     * Carica la configurazione dall'applicazione e dal file di override esterno (se presente).
     *
     * @param response HttpServletResponse per impostare lo stato in caso di errore
     * @return La configurazione merged in formato JSON
     */
    private JsonNode loadConfiguration(HttpServletResponse response) {
        try {
            // Carica configurazione di default dal webapp
            InputStream defaultConfigStream = servletContext.getResourceAsStream("/assets/config/app-config-default.json");

            if (defaultConfigStream == null) {
                log.error("File di configurazione di default non trovato: /assets/config/app-config-default.json");
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                return objectMapper.createObjectNode().put("error", "Configuration file not found");
            }

            JsonNode defaultConfig = objectMapper.readTree(defaultConfigStream);
            log.debug("Configurazione di default caricata");
            defaultConfigLoaded = true;

            // Se l'override è disabilitato, restituisci solo la configurazione di default
            if (!overrideEnabled) {
                log.debug("Override disabilitato, utilizzo solo configurazione di default");
                lastModifiedTime = -1;
                return defaultConfig;
            }

            // Controlla se esiste un file di override esterno
            Path overridePath = Paths.get(overrideConfigPath);
            if (Files.exists(overridePath) && Files.isRegularFile(overridePath)) {
                try {
                    long currentModifiedTime = Files.getLastModifiedTime(overridePath).toMillis();
                    log.info("File di override trovato: {} (ultima modifica: {})", overrideConfigPath, currentModifiedTime);

                    JsonNode overrideConfig = objectMapper.readTree(overridePath.toFile());
                    JsonNode mergedConfig = mergeJsonNodes(defaultConfig, overrideConfig);

                    // Aggiorna il timestamp solo se il caricamento è avvenuto con successo
                    lastModifiedTime = currentModifiedTime;
                    log.debug("Configurazione merged con successo e salvata in cache");
                    return mergedConfig;
                } catch (IOException e) {
                    log.error("Errore nella lettura del file di override: {}", e.getMessage(), e);
                    // Ritorna la configurazione di default in caso di errore
                    lastModifiedTime = -1;
                    return defaultConfig;
                }
            }

            log.debug("Nessun file di override trovato, utilizzo configurazione di default");
            lastModifiedTime = -1;
            return defaultConfig;

        } catch (IOException e) {
            log.error("Errore nel caricamento della configurazione: {}", e.getMessage(), e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            return objectMapper.createObjectNode().put("error", "Error loading configuration");
        }
    }

    /**
     * Effettua il merge ricorsivo di due JsonNode.
     * I valori in overrideNode sovrascrivono quelli in baseNode.
     *
     * Comportamento:
     * - Per gli oggetti: merge ricorsivo (le proprietà vengono unite)
     * - Per gli array: sostituzione completa
     * - Per i valori primitivi: sostituzione
     *
     * Esempio:
     * Base: {"a": 1, "b": {"c": 2, "d": 3}}
     * Override: {"b": {"c": 10, "e": 4}, "f": 5}
     * Risultato: {"a": 1, "b": {"c": 10, "d": 3, "e": 4}, "f": 5}
     *
     * @param baseNode Il nodo JSON di base
     * @param overrideNode Il nodo JSON con gli override
     * @return Il nodo JSON merged
     */
    private JsonNode mergeJsonNodes(JsonNode baseNode, JsonNode overrideNode) {
        if (overrideNode == null || overrideNode.isNull()) {
            return baseNode;
        }

        if (baseNode == null || baseNode.isNull()) {
            return overrideNode;
        }

        // Se entrambi sono oggetti, fai il merge ricorsivo
        if (baseNode.isObject() && overrideNode.isObject()) {
            ObjectNode result = ((ObjectNode) baseNode).deepCopy();

            overrideNode.fields().forEachRemaining(entry -> {
                String fieldName = entry.getKey();
                JsonNode overrideValue = entry.getValue();

                if (result.has(fieldName)) {
                    JsonNode baseValue = result.get(fieldName);
                    // Merge ricorsivo per oggetti nidificati
                    result.set(fieldName, mergeJsonNodes(baseValue, overrideValue));
                } else {
                    // Aggiungi il nuovo campo
                    result.set(fieldName, overrideValue);
                }
            });

            return result;
        }

        // Per tutti gli altri tipi (array, primitivi), sostituisci completamente
        return overrideNode;
    }
}
