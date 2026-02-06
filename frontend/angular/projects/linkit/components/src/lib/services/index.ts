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
import { ConfigService } from "./config.service";
import { EventsManagerService } from "./eventsmanager.service";
import { GuiToolsService } from "./gui-tools.service";
import { LocalStorageService } from "./local-storage.service";
import { PageloaderService } from "./pageloader.service";
import { Tools } from "./tools.service";

export const services = [
    ConfigService,
    EventsManagerService,
    GuiToolsService,
    LocalStorageService,
    PageloaderService,
    Tools
];

export {
    ConfigService,
    EventsManagerService,
    GuiToolsService,
    LocalStorageService,
    PageloaderService,
    Tools
};