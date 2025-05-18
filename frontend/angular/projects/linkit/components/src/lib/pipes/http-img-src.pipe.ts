import { PipeTransform, Pipe, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { BehaviorSubject, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap, take, tap } from 'rxjs/operators';

import { faImage } from '@fortawesome/free-solid-svg-icons';

export type ImageParams = {
    path: string;
    width?: string;
    height?: string;
}

@Pipe({
    name: 'httpImgSrc',
    pure: false,
    standalone: false
})
export class HttpImgSrcPipe implements PipeTransform, OnDestroy {

    private subscription = new Subscription();
    private latestValue!: string | SafeUrl;
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
                switchMap((imagePath: string) =>
                    this.httpClient.get(imagePath, {observe: 'response', responseType: 'blob'}).pipe(
                        take(1),
                        map((response: HttpResponse<Blob>) => (response.body !== null ? URL.createObjectURL(response.body) : '')),
                        map((unsafeBlobUrl: string) => this.domSanitizer.bypassSecurityTrustUrl(unsafeBlobUrl)),
                        filter((blobUrl: SafeUrl) => blobUrl !== this.latestValue),
                    ),
                ),
                // debounceTime(1000),
                tap((imagePath: string | SafeUrl) => {
                    if (this.latestValue && typeof this.latestValue === 'string') {
                        URL.revokeObjectURL(this.latestValue);
                    }

                    this.latestValue = imagePath;
                    this.cdr.markForCheck();
                }),
            )
            .subscribe();

        this.subscription.add(transformSubscription);
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();

        if (typeof this.latestValue === 'string') {
            URL.revokeObjectURL(this.latestValue);
        }
    }

    public transform(image: ImageParams): string | SafeUrl {
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

        if (!image.path) {
            return this.errorImagePath;
        }

        this.transformValue.next(image.path);
        return this.latestValue || this.loadingImagePath;
    }
}
