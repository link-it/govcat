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
import {Inject, Injectable, Renderer2} from '@angular/core';
import {DOCUMENT} from '@angular/common';

const RemoveClasses = (NewClassNames) => {
  const MatchClasses = NewClassNames.map((Class) => document.body.classList.contains(Class));
  return MatchClasses.indexOf(true) !== -1;
};

export const ToggleClasses = (Toggle, ClassNames) => {
  const Level = ClassNames.indexOf(Toggle);
  const NewClassNames = ClassNames.slice(0, Level + 1);

  if (RemoveClasses(NewClassNames)) {
    NewClassNames.map((Class) => document.body.classList.remove(Class));
  } else {
    document.body.classList.add(Toggle);
  }
};

@Injectable()
export class ClassToggler {

  constructor(
    @Inject(DOCUMENT) private document: any,
    private renderer: Renderer2,
  ) {}

  removeClasses(NewClassNames) {
    const MatchClasses = NewClassNames.map((Class) => this.document.body.classList.contains(Class));
    return MatchClasses.indexOf(true) !== -1;
  }

  toggleClasses(Toggle, ClassNames) {
    const Level = ClassNames.indexOf(Toggle);
    const NewClassNames = ClassNames.slice(0, Level + 1);

    if (this.removeClasses(NewClassNames)) {
      NewClassNames.map((Class) => this.renderer.removeClass(this.document.body, Class));
    } else {
      this.renderer.addClass(this.document.body, Toggle);
    }
  }
}
