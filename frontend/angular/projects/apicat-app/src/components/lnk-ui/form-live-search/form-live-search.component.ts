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

// ng-select-wrapper.component.ts
import {
    Component,
    Input,
    Output,
    EventEmitter,
    forwardRef,
    OnInit,
    OnChanges,
    SimpleChanges,
} from "@angular/core";
import {
    ControlValueAccessor,
    FormGroup,
    NG_VALUE_ACCESSOR,
} from "@angular/forms";
import {BehaviorSubject, concat, Observable, of, Subject} from "rxjs";
import {catchError, debounceTime, distinctUntilChanged, scan, startWith, switchMap, tap} from "rxjs/operators";

import { AvailableBSPositions } from 'ngx-bootstrap/positioning';

@Component({
    selector: "lnk-form-live-search",
    templateUrl: "./form-live-search.component.html",
    styleUrls: ["./form-live-search.component.scss"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() =>LnkFormLiveSearchComponent),
            multi: true,
        },
    ],
    standalone: false
})
export class LnkFormLiveSearchComponent implements ControlValueAccessor, OnInit, OnChanges {
    @Input() id: string = '';
    @Input() label?: string;
    @Input() bindLabel: string = 'label';
    @Input() bindValue: string = 'value';
    @Input() placeholder: string = 'Select...';
    @Input() formGroup!: FormGroup;
    @Input() formControlName!: string;
    @Input() searchable: boolean = false;
    @Input() typeToSearchText: string = '';
    @Input() notFoundText: string = 'APP.MESSAGE.NoItemsFound';
    @Input() clearable: boolean = false;
    @Input() multiple: boolean = false;
    @Input() disabledSearch: boolean = false;
    @Input() searchService!: (term: string, page?: number) => Observable<any>;
    
    @Input() initValue: any = null;
    @Input() isEdit: boolean = false;
    @Input() inline: boolean = false;
    @Input() singleColumn: boolean = false;
    @Input() plainText: boolean = true;
    @Input() useOptional: boolean = false;
    @Input() reduced: boolean = false;
    @Input() appendTo: string = 'body';
    @Input() labelAlignRight: boolean = false;
    
    @Input() showHelp: boolean = true;
    @Input() showHelpOnlyEdit: boolean = true;
    @Input() iconHelp: string = 'bi bi-info-circle';
    @Input() helpPlacement: AvailableBSPositions = 'left';
    @Input() helpContext: string = '';
    @Input() helpParams: any = {};

    @Input() options: any = null;

    @Output() changeEvent = new EventEmitter<any>();

    value: any;
    disabled: boolean = false;
    loading: boolean = false

    currentTerm: string = '';

    pageNumber: number = 1;

    items$: any;
    textInput$ = new BehaviorSubject<string>('');
    hasMoreItems: boolean = true; // Indica se ci sono ancora elementi da caricare

    // Subject per memorizzare lo stato della ricerca (term e pageNumber)
    private searchState$ = new BehaviorSubject<{ term: string; pageNumber: number }>({
        term: '',
        pageNumber: 0,
    });

    onItemSelect(item: any) {
        const value = item ? item.value : undefined
        this.onChange(value)
        this.changeEvent.emit(item)
    }

    onChange: any = () => {
    };
    onTouched: any = () => {
    };

    writeValue(value: any): void {
        this.value = value;
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    ngOnInit() {
        this.loadItems();
        // Se esiste un valore iniziale, usalo per impostare il valore corrente
        if (this.initValue) {
            this.value = this.initValue.value;
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        // Gestisci i cambiamenti di initValue
        if (changes['initValue'] && changes['initValue'].currentValue) {
            this.value = changes['initValue'].currentValue.value;
        }
    }

    loadItems() {
        // Reagisci ai cambiamenti del termine di ricerca
        this.textInput$
            .pipe(
                startWith(''),
                distinctUntilChanged(),
                tap((term) => {
                    // Aggiorna lo stato della ricerca con il nuovo termine e resetta la pagina
                    this.searchState$.next({ term, pageNumber: 0 });
                    this.hasMoreItems = true; // Resetta il flag per il caricamento
                })
            )
            .subscribe();

        // Reagisci ai cambiamenti dello stato della ricerca
        this.items$ = this.searchState$.pipe(
            tap(() => (this.loading = true)), // Imposta lo stato di caricamento
            switchMap(({ term, pageNumber }) =>
                this.searchService(term, pageNumber).pipe(
                    catchError(() => of([])), // Gestisci gli errori
                    tap((results) => {
                        this.loading = false; // Disabilita lo stato di caricamento
                        // Se non ci sono risultati, non ci sono più elementi da caricare
                        if (results.length === 0) {
                            this.hasMoreItems = false;
                        }
                    })
                )
            ),
            // Accumula i risultati delle pagine successive
            scan((acc, results) => {
                if (this.searchState$.value.pageNumber === 0) {
                    // Se è la prima pagina, sostituisci i risultati esistenti
                    // Ma assicurati che initValue sia presente se esiste
                    let items = results;
                    if (this.initValue && !items.find((item: any) => item.value === this.initValue.value)) {
                        items = [this.initValue, ...results];
                    }
                    return items;
                } else {
                    // Altrimenti, concatena i nuovi risultati
                    return [...acc, ...results];
                }
            }, [])
        );
    }

    onScrollToEnd() {
        if (!this.hasMoreItems || !this.searchable) {
            return;
        }

        // Incrementa il numero di pagina e aggiorna lo stato della ricerca
        const currentState = this.searchState$.value;
        this.searchState$.next({
            term: currentState.term,
            pageNumber: currentState.pageNumber + 1,
        });
    }

    get colClassLabel(): string {
        return this.singleColumn && !this.inline ? `col-lg-12` : (this.options ? `col-lg-${this.options.Formfield.colLabel}` : `col-lg-4`);
    }

    get colClassValue(): string {
        return this.singleColumn && !this.inline ? `col-lg-12` : (this.options ? `col-lg-${this.options.Formfield.colValue}` : `col-lg-8`);
    }

    hasHelpMapper = (isEdit: boolean, key: string) => {
        if (this.showHelp) {
            return this.showHelpOnlyEdit ? isEdit : true
        }
        return false;
    }
}
