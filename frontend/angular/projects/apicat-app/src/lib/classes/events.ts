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
export enum EventType {
  MODAL_EVENT = 'MODAL:EVENT',
  BACK_EVENT = 'BACK:EVENT',
  UPDATE_LAYOUT = 'UPDATE:LAYOUT',
  CHANGE_VIEW = 'CHANGE:VIEW',
  NAVBAR_ACTION = 'NAVBAR:ACTION',
  REPORT_ACTION = 'REPORT:ACTION',
  NAVBAR_OPEN = 'NAVBAR:OPEN',
  NAVBAR_CLOSE = 'NAVBAR:CLOSE',
  SESSION_UPDATE = 'SESSION:UPDATE',
  USER_UPDATE = 'USER:UPDATE',
  PROFILE_UPDATE = 'PROFILE:UPDATE',
  LAYOUT_FULLWIDTH = 'LAYOUT:FULLWIDTH',
  REFRESH_DATA = 'REFRESH:DATA',
  BREADCRUMBS_RESET = 'BREADCRUMBS:RESET',
  WIZARD_CHECK_UPDATE = 'WIZARD:CHECKUPDATE',
}
