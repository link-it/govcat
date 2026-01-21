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
 */
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-news-box',
  templateUrl: './news-box.component.html',
  styleUrls: ['./news-box.component.scss'],
  standalone: false
})
export class NewsBoxComponent implements OnInit {

  @Input() title: string = 'Title';
  @Input() content: string = 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Tenetur exercitationem dolorum molestiae ullam perferendis.';
  @Input() link: string = 'https://www.link.it';
  @Input() buttonText: string = 'Go';
  @Input() showClose: boolean = false;
  @Input() showBottonLink: boolean = true;

  constructor() { }

  ngOnInit() {
  }

}
