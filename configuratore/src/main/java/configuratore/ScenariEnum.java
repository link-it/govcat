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

/**
 * @author Tommaso Burlon (tommaso.burlon@link.it)
 * @author $Author$
 * @version $Rev$, $Date$
 */
public enum ScenariEnum {
	PDND("pdnd"),
	PDND_VOUCHER("pdndVoucher"),
	MTLS("mtls"),
	MTLS_SIGN("mtlsSign"),
	SIGN("sign"),
	MTLS_PDND("mtlsPdnd"),
	OAUTH_CLIENT_CREDENTIALS("oauthClientCredentials"),
	/**
	 * Applicativo con token policy letta da una proprietà custom dell'API.
	 *
	 * Dichiarato per ultimo di proposito: a parità di condizioni soddisfatte prevale l'ultimo
	 * scenario dell'enumerazione, quindi una condizione che seleziona un singolo profilo di
	 * autenticazione vince su quelle più generiche basate sul solo tipo di client.
	 */
	OAUTH_CC_TOKEN_POLICY("oauthCCTokenPolicy");
	
	private final String value;
	private ScenariEnum(String value) {
		this.value = value;
	}
	
	
	 @Override
	 public String toString() {
		 return this.value;
	 }
	 
	 public static ScenariEnum fromString(String str) {
		 ScenariEnum[] values = ScenariEnum.values();
		 for (ScenariEnum rv : values)
			 if (rv.toString().equals(str))
				 return rv;
		 return null;
	 }
}
