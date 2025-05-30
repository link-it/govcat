import { PipeTransform, Pipe, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { BehaviorSubject, of, Subscription } from 'rxjs';
import { catchError, distinctUntilChanged, filter, finalize, map, switchMap, take, tap } from 'rxjs/operators';

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
                switchMap((imagePath: string) =>
                    this.httpClient.get(imagePath, {observe: 'response', responseType: 'blob'}).pipe(
                        map((response: HttpResponse<Blob>) => URL.createObjectURL(response.body as Blob)),
                        tap((blobUrl) => {
                            this.revokeLatestBlob();
                            this.latestBlobUrl = blobUrl;
                        }),
                        map((unsafeBlobUrl: string) => this.domSanitizer.bypassSecurityTrustUrl(unsafeBlobUrl)),
                        filter((blobUrl) => blobUrl !== this.latestValue),
                        catchError(() => of(this.errorImagePath))
                    ),
                ),
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
