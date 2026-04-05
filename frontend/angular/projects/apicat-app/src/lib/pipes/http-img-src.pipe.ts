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
import { PipeTransform, Pipe, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { asapScheduler, BehaviorSubject, of, scheduled, Subscription } from 'rxjs';
import { catchError, distinctUntilChanged, filter, finalize, map, switchMap, tap } from 'rxjs/operators';

import { faImage } from '@fortawesome/free-solid-svg-icons';

export type ImageParams = {
    path: string;
    width?: string;
    height?: string;
}

@Pipe({
    name: 'httpImgSrc',
    pure: false,
    standalone: true
})
export class HttpImgSrcPipe implements PipeTransform, OnDestroy {

    // Cache statica condivisa: path → Blob
    private static blobCache = new Map<string, Blob>();
    private static MAX_CACHE = 200;

    static invalidateCache(pattern: string): void {
        for (const key of HttpImgSrcPipe.blobCache.keys()) {
            if (key.includes(pattern)) {
                HttpImgSrcPipe.blobCache.delete(key);
            }
        }
    }

    private subscription = new Subscription();
    private latestValue!: string | SafeUrl;
    private latestBlobUrl?: string;
    private transformValue = new BehaviorSubject<string>('');
    private loadingImagePath!: string;
    private errorImagePath!: string;

    constructor(
        private httpClient: HttpClient,
        private domSanitizer: DomSanitizer,
        private cdr: ChangeDetectorRef
    ) {
        const transformSubscription = this.transformValue
            .asObservable()
            .pipe(
                filter((v: string | null): v is string => !!v),
                distinctUntilChanged(),
                switchMap((imagePath: string) => {
                    const cachedBlob = HttpImgSrcPipe.blobCache.get(imagePath);
                    const source$ = cachedBlob
                        ? scheduled([cachedBlob], asapScheduler)
                        : this.httpClient.get(imagePath, {observe: 'response', responseType: 'blob'}).pipe(
                            map((response: HttpResponse<Blob>) => response.body as Blob),
                            tap((blob: Blob) => {
                                if (HttpImgSrcPipe.blobCache.size >= HttpImgSrcPipe.MAX_CACHE) {
                                    const firstKey = HttpImgSrcPipe.blobCache.keys().next().value;
                                    if (firstKey) HttpImgSrcPipe.blobCache.delete(firstKey);
                                }
                                HttpImgSrcPipe.blobCache.set(imagePath, blob);
                            })
                        );
                    return source$.pipe(
                        map((blob: Blob) => URL.createObjectURL(blob)),
                        tap((blobUrl) => {
                            this.revokeLatestBlob();
                            this.latestBlobUrl = blobUrl;
                        }),
                        map((unsafeBlobUrl: string) => this.domSanitizer.bypassSecurityTrustUrl(unsafeBlobUrl)),
                        filter((blobUrl) => blobUrl !== this.latestValue),
                        catchError(() => of(this.errorImagePath))
                    );
                }),
                tap((imagePath: string | SafeUrl) => {
                    this.latestValue = imagePath;
                    this.cdr.markForCheck();
                }),
                finalize(() => {
                    this.revokeLatestBlob();
                })
            )
            .subscribe();

        this.subscription.add(transformSubscription);
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    public transform(image: ImageParams): string | SafeUrl {
        this.setLoadingAndErrorImagePaths(image);
        if (!image.path) {
            return this.errorImagePath;
        }
        this.transformValue.next(image.path);
        return this.latestValue || this.loadingImagePath;
    }

    private setLoadingAndErrorImagePaths(image: ImageParams): void {
        const loaderTranslateX = faImage.icon[0] / 2 - 70;
        const loaderTranslateY = faImage.icon[0] / 2 - 70;

        const svgLoaderString = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${image.width || '100%'}" height="${image.height || 'auto'}" viewBox="0 0 ${faImage.icon[0]} ${faImage.icon[1]}">
                <g transform="translate(${loaderTranslateX}, ${loaderTranslateY}) scale(0.3)">
                    <path d="${faImage.icon[4]}" fill="rgba(0, 62, 111, 0.2)"/>
                </g>
            </svg>
        `;

        this.loadingImagePath = `data:image/svg+xml;base64,${btoa(svgLoaderString)}`;

        const errorTranslateX = faImage.icon[0] / 2 - 70;
        const errorTranslateY = faImage.icon[0] / 2 - 70;

        const svgErrorString = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${image.width || '100%'}" height="${image.height || 'auto'}" viewBox="0 0 ${faImage.icon[0]} ${faImage.icon[1]}">
                <g transform="translate(${errorTranslateX}, ${errorTranslateY}) scale(0.3)">
                    <path d="${faImage.icon[4]}" fill="rgba(0, 62, 111, 0.2)"/>
                </g>
            </svg>
        `;

        this.errorImagePath = `data:image/svg+xml;base64,${btoa(svgErrorString)}`;
    }

    private revokeLatestBlob() {
        if (this.latestBlobUrl) {
            URL.revokeObjectURL(this.latestBlobUrl);
            this.latestBlobUrl = undefined;
        }
    }
}
