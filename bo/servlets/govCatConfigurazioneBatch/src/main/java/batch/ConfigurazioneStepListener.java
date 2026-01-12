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
package batch;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.govway.catalogo.core.business.utils.configurazione.ConfigurazioneReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.ExitStatus;
import org.springframework.batch.core.StepExecution;
import org.springframework.batch.core.StepExecutionListener;

import java.util.List;
import java.util.Map;

public class ConfigurazioneStepListener implements StepExecutionListener {

    private final String externalPath;

    public ConfigurazioneStepListener(String externalPath) {
        this.externalPath = externalPath;
    }
    private static final Logger logger = LoggerFactory.getLogger(ConfigurazioneStepListener.class);

    @Override
    public void beforeStep(StepExecution stepExecution) {
        try {
            ConfigurazioneReader confReader = new ConfigurazioneReader(externalPath);
            logger.debug("[ConfigurazioneStepListener]: path file di configurazione {}",externalPath);
            List<Map<String, String>> statoConf = confReader.getTuttaConfigurazioneAutomatica();

            ObjectMapper objectMapper = new ObjectMapper();
            String statoConfJson = objectMapper.writeValueAsString(statoConf);

            stepExecution.getExecutionContext().putString("STATO_CONF_JSON", statoConfJson);

        } catch (Exception e) {
            throw new RuntimeException("Errore nella lettura della configurazione", e);
        }
    }

    @Override
    public ExitStatus afterStep(StepExecution stepExecution) {
        return null;
    }
}
