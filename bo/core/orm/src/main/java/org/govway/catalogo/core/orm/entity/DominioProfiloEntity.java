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

@Getter
@Setter
@Entity
@Table(name = "domini_profili", uniqueConstraints = { @UniqueConstraint(columnNames = { "id_dominio", "id_profilo" }) })
public class DominioProfiloEntity {

    @Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_domini_profili", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_domini_profili", sequenceName = "seq_domini_profili", allocationSize = 1)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "id_dominio", referencedColumnName = "id")
    private DominioEntity dominio;

    @ManyToOne
    @JoinColumn(name = "id_profilo", referencedColumnName = "id")
    private ProfiloEntity profilo;

}
