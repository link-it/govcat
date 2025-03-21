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
package org.govway.catalogo.core.orm.entity;

import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "profili")
public class ProfiloEntity {

    public enum AuthType {HTTP_BASIC, PDND, HTTPS, SIGN, HTTPS_SIGN, HTTPS_PDND, SIGN_PDND, HTTPS_PDND_SIGN, OAUTH_CLIENT_CREDENTIALS, OAUTH_AUTHORIZATION_CODE, INDIRIZZO_IP, NO_DATI}
    public enum ConfigurazioneCompatibilitaApi {SOAP, REST}
    public enum ConfigurazioneTipoDominio {INTERNO, ESTERNO}

    @Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_profili", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_profili", sequenceName = "seq_profili", allocationSize = 1)
    private Long id;

    @Column(name = "id_profilo", nullable = false, unique = true)
    private UUID idProfilo;

    @Column(name = "codice_interno", nullable = false, unique = true)
    private String codiceInterno;

    @Column(nullable = false)
    private String etichetta;

    @Column(name = "canale_default")
    private String canaleDefault;

    @Column(name = "profilo_govway")
    private String profiloGovway;

    @Column(name = "codice_token_policy")
    private String codiceTokenPolicy;

    @Column(name = "auth_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private AuthType authType;

    @Enumerated(EnumType.STRING)
    private ConfigurazioneCompatibilitaApi compatibilita;

    @Column(name = "tipo_dominio")
    @Enumerated(EnumType.STRING)
    private ConfigurazioneTipoDominio tipoDominio;

}
