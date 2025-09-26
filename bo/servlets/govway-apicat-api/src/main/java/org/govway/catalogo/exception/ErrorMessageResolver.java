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
package org.govway.catalogo.exception;

import java.io.IOException;
import org.govway.catalogo.exception.ErrorCode;
import java.io.InputStream;
import java.util.Locale;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Utility class per la risoluzione dei messaggi di errore dall'ErrorCode.
 * Supporta l'internazionalizzazione e la sostituzione di parametri dinamici tramite Map.
 *
 * I messaggi possono contenere placeholder nel formato ${nomeParametro} che verranno
 * sostituiti con i valori corrispondenti dalla mappa dei parametri.
 *
 * Esempio:
 * Messaggio: "Servizio [${nome}] con versione [${versione}] non trovato"
 * Parametri: {"nome": "ServizioTest", "versione": "1.0"}
 * Risultato: "Servizio [ServizioTest] con versione [1.0] non trovato"
 */
public class ErrorMessageResolver {

    private static final Logger LOGGER = Logger.getLogger(ErrorMessageResolver.class.getName());
    private static final String DEFAULT_MESSAGES_FILE = "error-messages.properties";
    private static final String MESSAGES_FILE_PREFIX = "error-messages";
    private static final String MESSAGES_FILE_SUFFIX = ".properties";

    // Pattern per trovare i placeholder ${nomeParametro} nel messaggio
    private static final Pattern PLACEHOLDER_PATTERN = Pattern.compile("\\$\\{([^}]+)\\}");

    private static final ConcurrentHashMap<Locale, Properties> messagesCache = new ConcurrentHashMap<>();
    private static Properties defaultMessages;

    static {
        loadDefaultMessages();
    }

    /**
     * Carica i messaggi di default (italiano o lingua di default del sistema)
     */
    private static void loadDefaultMessages() {
        try {
            defaultMessages = loadMessagesForLocale(null);
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Errore nel caricamento dei messaggi di default", e);
            defaultMessages = new Properties();
        }
    }

    /**
     * Carica i messaggi per una specifica lingua
     * @param locale la lingua desiderata, null per default
     * @return Properties con i messaggi
     */
    private static Properties loadMessagesForLocale(Locale locale) {
        String filename;
        if (locale == null) {
            filename = DEFAULT_MESSAGES_FILE;
        } else {
            filename = MESSAGES_FILE_PREFIX + "_" + locale.getLanguage() + MESSAGES_FILE_SUFFIX;
        }

        Properties messages = new Properties();

        try (InputStream is = ErrorMessageResolver.class.getClassLoader()
                .getResourceAsStream(filename)) {
            if (is != null) {
                messages.load(is);
            } else if (locale != null) {
                // Se il file per la lingua specifica non esiste, usa il default
                return new Properties(defaultMessages);
            }
        } catch (IOException e) {
            LOGGER.log(Level.WARNING, "Impossibile caricare il file: " + filename, e);
            if (locale != null) {
                return new Properties(defaultMessages);
            }
        }

        return messages;
    }

    /**
     * Risolve il messaggio per un ErrorCode senza parametri
     * @param errorCode il codice di errore
     * @return il messaggio
     */
    public static String resolveMessage(ErrorCode errorCode) {
        return resolveMessage(errorCode, null, null);
    }

    /**
     * Risolve il messaggio per un ErrorCode con i parametri specificati
     * @param errorCode il codice di errore
     * @param params mappa dei parametri da sostituire nel messaggio
     * @return il messaggio formattato
     */
    public static String resolveMessage(ErrorCode errorCode, Map<String, String> params) {
        return resolveMessage(errorCode, null, params);
    }

    /**
     * Risolve il messaggio per un ErrorCode con lingua e parametri specificati
     * @param errorCode il codice di errore
     * @param locale la lingua desiderata (null per default)
     * @param params mappa dei parametri da sostituire nel messaggio
     * @return il messaggio formattato
     */
    public static String resolveMessage(ErrorCode errorCode, Locale locale, Map<String, String> params) {
        Properties messages = getMessagesForLocale(locale);

        String messageTemplate = messages.getProperty(errorCode.getCode());

        if (messageTemplate == null) {
            // Fallback: usa la descrizione dell'enum se il messaggio non è nel file properties
            messageTemplate = errorCode.getDescription();
            LOGGER.log(Level.WARNING, "Messaggio non trovato per il codice: " + errorCode.getCode() +
                      ", uso descrizione di fallback");
        }

        // Sostituisci i parametri nel messaggio usando la sintassi ${nomeParametro}
        if (params != null && !params.isEmpty()) {
            return replacePlaceholders(messageTemplate, params);
        }

        return messageTemplate;
    }

    /**
     * Sostituisce i placeholder nel messaggio con i valori dalla mappa dei parametri
     * @param template il template del messaggio con placeholder ${nomeParametro}
     * @param params la mappa dei parametri
     * @return il messaggio con i placeholder sostituiti
     */
    private static String replacePlaceholders(String template, Map<String, String> params) {
        if (template == null || params == null) {
            return template;
        }

        StringBuffer result = new StringBuffer();
        Matcher matcher = PLACEHOLDER_PATTERN.matcher(template);

        while (matcher.find()) {
            String placeholder = matcher.group(1);
            String value = params.get(placeholder);

            if (value != null) {
                // Escape dei caratteri speciali per evitare problemi con Matcher.appendReplacement
                value = Matcher.quoteReplacement(value);
                matcher.appendReplacement(result, value);
            } else {
                // Se il parametro non è nella mappa, lascia il placeholder com'è
                LOGGER.log(Level.WARNING, "Parametro non trovato per placeholder: " + placeholder);
                matcher.appendReplacement(result, matcher.group(0));
            }
        }
        matcher.appendTail(result);

        return result.toString();
    }

    /**
     * Ottiene i messaggi per la lingua specificata, con caching
     * @param locale la lingua desiderata
     * @return Properties con i messaggi
     */
    private static Properties getMessagesForLocale(Locale locale) {
        if (locale == null) {
            return defaultMessages;
        }

        return messagesCache.computeIfAbsent(locale, ErrorMessageResolver::loadMessagesForLocale);
    }

    /**
     * Pulisce la cache dei messaggi (utile per ricaricare i file properties)
     */
    public static void clearCache() {
        messagesCache.clear();
        loadDefaultMessages();
    }

    /**
     * Costruisce il messaggio di errore completo includendo il codice
     * @param errorCode il codice di errore
     * @param params mappa dei parametri da sostituire nel messaggio
     * @return messaggio nel formato "[CODICE] messaggio"
     */
    public static String buildErrorMessage(ErrorCode errorCode, Map<String, String> params) {
        String message = resolveMessage(errorCode, params);
        return "[" + errorCode.getCode() + "] " + message;
    }

    /**
     * Costruisce il messaggio di errore completo con lingua specificata
     * @param errorCode il codice di errore
     * @param locale la lingua desiderata
     * @param params mappa dei parametri da sostituire nel messaggio
     * @return messaggio nel formato "[CODICE] messaggio"
     */
    public static String buildErrorMessage(ErrorCode errorCode, Locale locale, Map<String, String> params) {
        String message = resolveMessage(errorCode, locale, params);
        return "[" + errorCode.getCode() + "] " + message;
    }

    /**
     * Crea una mappa di parametri da un array di coppie chiave-valore
     * Utility method per semplificare la creazione di mappe di parametri
     *
     * Esempio:
     * Map<String, String> params = ErrorMessageResolver.params("nome", "ServizioTest", "versione", "1.0");
     *
     * @param keyValuePairs coppie chiave-valore (deve essere un numero pari di elementi)
     * @return mappa dei parametri
     */
    public static Map<String, String> params(String... keyValuePairs) {
        if (keyValuePairs.length % 2 != 0) {
            throw new IllegalArgumentException("Il numero di parametri deve essere pari (chiave-valore)");
        }

        Map<String, String> params = new java.util.HashMap<>();
        for (int i = 0; i < keyValuePairs.length; i += 2) {
            params.put(keyValuePairs[i], keyValuePairs[i + 1]);
        }
        return params;
    }
}