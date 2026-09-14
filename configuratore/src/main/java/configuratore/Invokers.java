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
package configuratore;

import java.io.IOException;
import java.util.Map;

import org.govway.catalogo.core.dto.DTOAdesione.AmbienteEnum;

import config.GovwayConfigInvoker;
import keycloak.KeycloakInvoker;

/**
 * @author Tommaso Burlon (tommaso.burlon@link.it)
 * @author $Author$
 * @version $Rev$, $Date$
 */
public class Invokers {
	private Map<AmbienteEnum, KeycloakInvoker> keycloak;
	private Map<AmbienteEnum, GovwayConfigInvoker> config;
	
	/**
	 * Invoker di govway dell'ambiente in configurazione, valorizzato solo sulla vista
	 * restituita da {@link #perAmbiente(AmbienteEnum)}.
	 */
	private GovwayConfigInvoker configAmbiente;
	
	public Invokers(Map<AmbienteEnum, KeycloakInvoker> keycloak, Map<AmbienteEnum, GovwayConfigInvoker> config) {
		this(keycloak, config, null);
	}
	
	private Invokers(Map<AmbienteEnum, KeycloakInvoker> keycloak, Map<AmbienteEnum, GovwayConfigInvoker> config, GovwayConfigInvoker configAmbiente) {
		this.keycloak = keycloak == null ? Map.of() : Map.copyOf(keycloak);
		this.config = config == null ? Map.of() : Map.copyOf(config);
		this.configAmbiente = configAmbiente;
	}
	
	/**
	 * Invoker legati all'ambiente dell'adesione in configurazione: come keycloak, anche l'API di
	 * configurazione di govway e' configurata per ambiente.
	 *
	 * Va invocato una volta per adesione: gli scenari ricevono la vista gia' risolta e
	 * continuano a usare {@link #getConfigInvoker()} senza occuparsi dell'ambiente.
	 *
	 * @param ambiente ambiente dell'adesione
	 * @return vista sugli invoker di quell'ambiente
	 * @throws IOException se l'ambiente non e' valorizzato o govway non e' configurato per esso
	 */
	public Invokers perAmbiente(AmbienteEnum ambiente) throws IOException {
		if (ambiente == null)
			throw new IOException("ambiente dell'adesione non valorizzato, impossibile individuare govway");
		
		GovwayConfigInvoker invoker = this.config.get(ambiente);
		
		if (invoker == null)
			throw new IOException("govway non configurato per l'ambiente " + ambiente);
		
		return new Invokers(this.keycloak, this.config, invoker);
	}
	
	/**
	 * Keycloak dell'ambiente dell'adesione in configurazione: collaudo e produzione sono
	 * istanze distinte, configurate separatamente nelle properties del configuratore.
	 */
	public KeycloakInvoker getKeycloak(AmbienteEnum ambiente) throws IOException {
		if (ambiente == null)
			throw new IOException("ambiente dell'adesione non valorizzato, impossibile individuare keycloak");
		
		KeycloakInvoker invoker = this.keycloak.get(ambiente);
		
		if (invoker == null)
			throw new IOException("keycloak non configurato per l'ambiente " + ambiente);
		
		return invoker;
	}
	
	/**
	 * @return invoker di govway dell'ambiente dell'adesione in configurazione
	 * @throws IllegalStateException se invocato su invoker non risolti per ambiente
	 */
	public GovwayConfigInvoker getConfigInvoker() {
		if (this.configAmbiente == null)
			throw new IllegalStateException("invoker di govway non risolto per ambiente: invocare prima perAmbiente(...)");
		
		return this.configAmbiente;
	}
}