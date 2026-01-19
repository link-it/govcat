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
import { TestBed } from '@angular/core/testing';
import { ConfigService } from './config.service';
import { LocalStorageService } from './local-storage.service';

describe('LocalStorageService', () => {
    let service: LocalStorageService;
    let configService: ConfigService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                LocalStorageService,
                { provide: ConfigService, useValue: { getSessionPrefix: () => 'test' } }
            ]
        });

        service = TestBed.inject(LocalStorageService);
        configService = TestBed.inject(ConfigService);
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should set and get a string', () => {
        service.set('testKey', 'testValue');
        expect(service.getString('testKey')).toBe('testValue');
    });

    it('should set and get a number', () => {
        service.set('testKey', 123);
        expect(service.getNumber('testKey')).toBe(123);
    });

    it('should set and get a boolean', () => {
        service.set('testKey', true);
        expect(service.getBoolean('testKey')).toBe(true);
    });

    it('should set and get an item', () => {
        const item = { prop: 'value' };
        service.setItem('testKey', item);
        expect(service.getItem('testKey')).toEqual(item);
    });

    it('should remove an item', () => {
        service.set('testKey', 'testValue');
        service.remove('testKey');
        expect(service.getString('testKey')).toBeUndefined();
    });

    it('should clear all items', () => {
        service.set('testKey1', 'testValue1');
        service.set('testKey2', 'testValue2');
        service.clear();
        expect(service.getString('testKey1')).toBeUndefined();
        expect(service.getString('testKey2')).toBeUndefined();
    });

    it('should return default value for getNumber if key does not exist', () => {
        const defaultValue = 456;
        expect(service.getNumber('nonexistentKey', defaultValue)).toBe(defaultValue);
    });

    it('should return default value for getBoolean if key does not exist', () => {
        const defaultValue = false;
        expect(service.getBoolean('nonexistentKey', defaultValue)).toBe(defaultValue);
    });

    it('should return default value for getItem if key does not exist', () => {
        const defaultValue = { default: 'value' };
        expect(service.getItem('nonexistentKey', defaultValue)).toEqual(defaultValue);
    });
});