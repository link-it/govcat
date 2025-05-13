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