import { AfterContentChecked, Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';

import { TranslateService } from '@ngx-translate/core';
import { BsDatepickerConfig, BsDatepickerDirective } from 'ngx-bootstrap/datepicker';

import { Tools, ConfigService } from '@linkit/components';
import { OpenAPIService } from '@app/services/openAPI.service';
import { AuthenticationService } from '@app/services/authentication.service';

import * as moment from 'moment';

import { BarVertical2DComponent, BarVerticalComponent, LegendPosition, LineChartComponent, PieChartComponent, ScaleType, colorSets } from '@swimlane/ngx-charts';
import * as htmlToImage from 'html-to-image';

enum ReportTypeInformationEnum {
  NumberOfTransactions = 'numero_transazioni',
  BandOcupation = 'occupazione_banda',
  AverageResponseTime = 'tempo_medio_risposta',
}

enum ReportTimeInterval {
  Hourly = 'orario',
  Daily = 'giornaliero',
  Weekly = 'settimanale',
  Monthly = 'mensile'
}

enum TimeIntervalType {
  LastHours = 'ultime_ore',
  LastDays = 'ultimi_giorni',
  LastMonths = 'ultimi_mesi',
  Custom = 'personalizzato',
}

enum TransactionOutcome {
  Personalized = 'personalizzato',
  OK = 'ok',
  Fault = 'fault',
  Failed = 'fallite',
  FailedAndFault = 'fallite_e_fault',
  FailedExcludeDiscarded = 'fallite_escludi_scartate',
  FailedAndFaultExcludeDiscarded = 'fallite_e_fault_escludi_scartate',
}

enum ReportType {
  Pie = 'pie',
  Bar = 'bar',
  Table = 'table'
}

enum TimeTrendReportType {
  Line = 'line',
  Bar = 'bar',
  Table = 'table'
}

interface DistributionType {
  trendReport: boolean;
  value: string;
  code: string;
  label: string;
  tableFirstColumnLabel: string;
}

interface TimeProgressionItem {
  data: string;
  valore: number
}

interface DistributionOutcomeItem {
  data: string;
  valore_ok: number;
  valore_fault: number;
  valore_fallite: number;
}

interface DistributionErrorItem {
  esito: number;
  descrizione: string;
  valore: number;
}

interface DistributionRemoteSubjectItem {
  nome: string;
  valore: number;
}

interface DistributionOperationItem {
  nome: string;
  valore: number;
  operazione: string;
  erogatore: string;
}

// does not work
interface DistributionApplicationItem {
  nome: string;
  valore: number;
  soggetto: string;
}

// does not work
interface DistributionTokenClientIdItem {
  client_id: string;
  soggetto: string;
  applicativo: string;
  valore: number;
}

// does not work
interface DistributionTokenIssuerItem {
  issuer: string;
  valore: number;
}

interface DistributionPrincipalItem {
  indirizzo: string;
  valore: number;
}

interface DistributionIpItem {
  indirizzo: string;
  valore: number;
}

interface DownloadType {
  label: string; 
  icon: string;
  action: string;
  acceptHeader: string;
}

enum StatisticCode {
  AndamentoTemporale = 'andamento_temporale',
  DistribuzioneEsiti = 'distribuzione_esiti',
  DistribuzioneErrori = 'distribuzione_errori',
  DistribuzioneSoggettoRemoto = 'distribuzione_soggetto_remoto',
  DistribuzioneOperazione = 'distribuzione_operazione',
  DistribuzioneApplicativo = 'distribuzione_applicativo',
  DistribuzioneIp = 'distribuzione_ip',
  DistribuzioneTokenClientId = 'distribuzione_token_client_id',
  DistribuzioneIssuer = 'distribuzione_token_issuer',
  DistribuzionePrincipal = 'distribuzione_principal',
  DistribuzioneApi = 'distribuzione_api', // NOT IMPLEMENTED
}

enum StatisticsUrl {
  AndamentoTemporale = 'andamento-temporale',
  DistribuzioneEsiti = 'distribuzione-esiti',
  DistribuzioneErrori = 'distribuzione-errori',
  DistribuzioneSoggettoRemoto = 'distribuzione-soggetto-remoto',
  DistribuzioneOperazione = 'distribuzione-operazione',
  DistribuzioneApplicativo = 'distribuzione-applicativo',
  DistribuzioneIp = 'distribuzione-ip',
  DistribuzioneTokenClientId = 'distribuzione-token-clientid',
  DistribuzioneIssuer = 'distribuzione-token-issuer',
  DistribuzionePrincipal = 'distribuzione-principal',
  DistribuzioneApi = 'distribuzione-api', // NOT IMPLEMENTED
}

const domainStatistics = [
  StatisticsUrl.AndamentoTemporale,
  StatisticsUrl.DistribuzioneEsiti,
  StatisticsUrl.DistribuzioneErrori,
  StatisticsUrl.DistribuzioneOperazione
];

@Component({
  selector: 'app-statistiche',
  templateUrl: 'statistiche.component.html',
  styleUrls: ['statistiche.component.scss'],
  standalone: false
})
export class StatisticheComponent implements OnInit, AfterContentChecked {
  static readonly Name = 'StatisticheComponent';
  readonly model: string = 'statistiche';

  @ViewChild('dpFrom', { static: false, read: BsDatepickerDirective }) dpFrom!: BsDatepickerDirective;
  @ViewChild('dpTo', { static: false, read: BsDatepickerDirective }) dpTo!: BsDatepickerDirective;

  id: number | null = null;
  environmentId: string = 'collaudo'; // collaudo / produzione

  service: any = null;

  generalConfig: any = Tools.Configurazione || null;
  config: any;
  statisticheConfig: any;

  _showFilter: boolean = true;

  _formGroup: UntypedFormGroup = new UntypedFormGroup({});

  _spin: boolean = true;
  desktop: boolean = false;

  _message: string = 'APP.MESSAGE.SelectStatistic';
  _messageHelp: string = 'APP.MESSAGE.SelectStatisticHelp';
  _messageUnimplemented: string = 'APP.MESSAGE.Unimplemented';
  _messageNoResponseUnimplemented: string = 'APP.MESSAGE.NoResponseUnimplemented';

  _error: boolean = false;
  _errorMsg: string = '';

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Services', url: '', type: 'title', iconBs: 'grid-3x3-gap' },
    { label: '...', url: '', type: 'title' }
  ];

  single: {name: string, value: number}[] = [];
  multi: {name: string, series: {name: string, value: number}[]}[] = [];
  multi_bar_chart: {name: string, series: {name: string, value: number}[]}[] = [];

  get multi_table_rows() {
    let rows:any = [];

    // map this.multi.series to rows
    this.multi.forEach((serie) => {
      serie.series.forEach((row) => {
        const existingRow = rows.find((r:any) => r.name === row.name);
        if (existingRow) {
          existingRow[serie.name] = row.value;
        } else {
          const newRow:any = {name: row.name};
          newRow[serie.name] = row.value;
          rows.push(newRow);
        }
      });
    });

    return rows;
  }

  chartOptions: any = null;

  view: any = null; // [700, 400];

  maxDate = new Date();

  colorSchemeChangeEnabled = false;

 // options
  showXAxis: boolean = true;
  showYAxis: boolean = true;
  gradient: boolean = false;
  showLegend: boolean = true;
  legendTitle: string = 'Legend';
  legendPosition = LegendPosition.Right;
  showXAxisLabel: boolean = true;
  tooltipDisabled: boolean = false;
  showText: boolean = true;
  xAxisLabel: string = 'Country';
  showYAxisLabel: boolean = true;
  yAxisLabel: string = 'GDP Per Capita';
  showGridLines: boolean = true;
  innerPadding: string = '10%';
  barPadding: number = 8;
  groupPadding: number = 16;
  roundDomains: boolean = false;
  maxRadius: number = 10;
  minRadius: number = 3;
  showSeriesOnHover: boolean = true;
  roundEdges: boolean = true;
  animations: boolean = true;
  xScaleMin: any;
  xScaleMax: any;
  yScaleMin!: number;
  yScaleMax!: number;
  showDataLabel: boolean = false;
  noBarWhenZero: boolean = true;
  trimXAxisTicks: boolean = true;
  trimYAxisTicks: boolean = true;
  rotateXAxisTicks: boolean = true;
  maxXAxisTickLength: number = 16;
  maxYAxisTickLength: number = 16;
  strokeColor: string = '#FFFFFF';
  strokeWidth: number = 2;
  colorSets: any;
  colorScheme: any = null;
  schemeType = ScaleType.Ordinal;
  selectedColorScheme!: string;
  rangeFillOpacity: number = 0.15;

  linkitColorScheme = {
    name: "linkit",
    selectable: true,
    group: "ordinal",
    domain: ["#96b964", "#ff8f52", "#cd4a51", "#00b862", "#afdf0a", "#a7b61a", "#f3e562", "#ff9800", "#ff5722", "#ff4514"]
  };

  get colorSchemeResolved() {
    if (this._formGroup.get('distribution_type')?.value.value === 'distribuzione-esiti') {
      return this.linkitColorScheme;
    }
    return this.colorScheme;
  }

  tipoGrafico: ReportType|TimeTrendReportType = ReportType.Bar; // bar - line - pie - table

  exportList: DownloadType[] = [];
  exportListDefault: DownloadType[] = [
    { label: 'CSV', icon: 'filetype-csv', action: 'export-csv', acceptHeader: 'text/csv' },
    { label: 'XLS', icon: 'filetype-xls', action: 'export-xls', acceptHeader: 'application/vnd.ms-excel' },
    { label: 'PDF', icon: 'filetype-pdf', action: 'export-pdf', acceptHeader: 'application/pdf' },
    { label: 'PNG', icon: 'filetype-png', action: 'export-png', acceptHeader: 'image/png' },
  ];

  private readonly _bsDatepickerConfig: Partial<BsDatepickerConfig> = {
    adaptivePosition: true,
    withTimepicker: false,
    containerClass: 'theme-dark-blue',
    showTodayButton: true,
    todayPosition: 'left',
    todayButtonLabel: this.translate.instant('APP.BUTTON.Today'),
    showClearButton: true,
    clearPosition: 'right',
    clearButtonLabel: this.translate.instant('APP.BUTTON.Clear'),
    showWeekNumbers: false,
    dateInputFormat: 'DD/MM/YYYY'
  };

  private readonly _bsDatepickerConfigWithTime: Partial<BsDatepickerConfig> = {
    adaptivePosition: true,
    withTimepicker: true,
    containerClass: 'theme-dark-blue',
    showTodayButton: true,
    todayPosition: 'left',
    todayButtonLabel: this.translate.instant('APP.BUTTON.Today'),
    showClearButton: true,
    clearPosition: 'right',
    clearButtonLabel: this.translate.instant('APP.BUTTON.Clear'),
    showWeekNumbers: false,
    dateInputFormat: 'DD/MM/YYYY, HH:mm'
  };

  private useTimepicker: boolean = false;

  get bsDatepickerConfig() {
    return this.useTimepicker ? this._bsDatepickerConfigWithTime : this._bsDatepickerConfig;
  }

  @ViewChild('pieChart', { static: false, read: PieChartComponent}) pieChart: PieChartComponent | undefined;
  @ViewChild('lineChart', { static: false, read: LineChartComponent}) lineChart: LineChartComponent | undefined;
  @ViewChild('verticalBarChart', { static: false, read: BarVerticalComponent}) verticalBarChart: BarVerticalComponent | undefined;
  @ViewChild('verticalBarChart2D', { static: false, read: BarVertical2DComponent}) verticalBarChart2D: BarVertical2DComponent | undefined;

  @ViewChild('captureGraphArea', { static: false }) captureGraphArea: any;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly translate: TranslateService,
    private readonly configService: ConfigService,
    public tools: Tools,
    public apiService: OpenAPIService,
    private readonly authenticationService: AuthenticationService
  ) {
    Object.assign(this, {
      colorSets
    });

    this.config = this.configService.getConfiguration();

    const allowedExportTypes: string[] = this.generalConfig?.monitoraggio?.statistiche?.formati_report || [];
    const filteredExportList = allowedExportTypes.length
        ? this.exportListDefault.filter(el => allowedExportTypes.includes(el.action.split('export-')[1]))
        : this.exportListDefault;
    this.exportList = [ ...filteredExportList ];

    const _state = this.router.getCurrentNavigation()?.extras.state;
    this.service = _state?.service || null;

    this._loadTransactionDetailedOutcomes();
    this._initSearchForm();
  }

  @HostListener('window:resize') _onResize() {
    this.desktop = (window.innerWidth >= 992);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.id = params['id'];
        this.environmentId = params['id_ambiente'] || 'collaudo';
        this.configService.getConfig(this.model).subscribe(
          (config: any) => {
            this.statisticheConfig = config;
            this.chartOptions = config.chartOptions;
            if (this.chartOptions.selectedColorScheme) {
              this.setColorScheme(this.chartOptions.selectedColorScheme);
            } else {
              this.colorScheme = this.chartOptions.colorScheme;
            }

            if (!this.service) {
              this._loadServizio();
            } else {
              this._initBreadcrumb();
            }
            this._resetData();
          }
        );
      }
    });
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  _initBreadcrumb() {
    let _title: string;
    if (this.service) {
      _title = this.service.nome + ' v. ' + this.service.versione;
    } else if (this.id) {
      _title = `${this.id}`;
    } else {
      _title = this.translate.instant('APP.TITLE.New');
    }
    const _toolTipServizio = this.service ? this.translate.instant('APP.WORKFLOW.STATUS.' + this.service.stato) : '';
    const _view = (localStorage.getItem('SERVIZI_VIEW') === 'TRUE') ? '/view' : '';
    this.breadcrumbs = [
      { label: 'APP.TITLE.Services', url: '/servizi', type: 'link', iconBs: 'grid-3x3-gap' },
      { label: `${_title}`, url: `/servizi/${this.id}${_view}`, type: 'link', tooltip: _toolTipServizio },
      { label: 'APP.TITLE.Statistics', url: ``, type: 'link' }
    ];
  }

  _setErrorMessages(error: boolean) {
    this._error = error;
    if (this._error) {
      this._message = 'APP.MESSAGE.ERROR.Default';
      this._messageHelp = 'APP.MESSAGE.ERROR.DefaultHelp';
    } else {
      this._message = 'APP.MESSAGE.SelectStatistic';
      this._messageHelp = 'APP.MESSAGE.SelectStatisticHelp';
    }
  }

  _initSearchForm() {
    const dateFrom = moment().subtract(1, 'month').toDate();
    dateFrom.setHours(0, 0, 0, 0);
    const dateTo = moment().toDate();
    dateTo.setHours(0, 0, 0, 0);
    
    const apiControl = new UntypedFormControl(null, [Validators.required]);
    const reportTimeIntervalControl = new UntypedFormControl(ReportTimeInterval.Daily, [Validators.required]);
    const distributionTypeControl = new UntypedFormControl(null, [Validators.required]);
    const reportTransactionOutcomeCodesControl = new UntypedFormControl(null);
    const dateFromControl = new UntypedFormControl(dateFrom, [Validators.required]);
    const dateToControl = new UntypedFormControl(dateTo, [Validators.required]);

    this._formGroup = new UntypedFormGroup({
      api: apiControl,
      adesione: new UntypedFormControl(null),
      distribution_type: distributionTypeControl,
      report_information_type: new UntypedFormControl(ReportTypeInformationEnum.NumberOfTransactions, [Validators.required]),
      report_time_interval: reportTimeIntervalControl,
      report_date_from: dateFromControl,
      report_date_to: dateToControl,
      report_transaction_outcome_type: new UntypedFormControl(null),
      report_transaction_outcome_codes: reportTransactionOutcomeCodesControl
    });

    apiControl.valueChanges.subscribe((value: any) => this.setupAdesioneField(value));

    dateFromControl.valueChanges.subscribe((value: Date) => {
      if (!value || value.getMinutes() === 0) return;

      value.setMinutes(0, 0, 0);
      this.dpFrom.bsValueChange.next(value);
    });

    dateToControl.valueChanges.subscribe((value: Date) => {
      if (!value || value.getMinutes() === 0) return;

      value.setMinutes(0, 0, 0);
      this.dpTo.bsValueChange.next(value);
    });

    reportTimeIntervalControl.valueChanges.subscribe((current: ReportTimeInterval | null) => {
      this.useTimepicker = current === ReportTimeInterval.Hourly;
    });

    distributionTypeControl.valueChanges.subscribe((current: DistributionType | null) => {
      if (!current) {
        this.tipoGrafico = ReportType.Bar;
        return;
      }
      this.tipoGrafico = current.trendReport ? TimeTrendReportType.Line : ReportType.Bar;
      
      if (current.trendReport) {
        reportTimeIntervalControl?.enable();
        reportTimeIntervalControl?.setValue(ReportTimeInterval.Hourly);
      } else {
        reportTimeIntervalControl?.setValue(ReportTimeInterval.Daily);
        reportTimeIntervalControl?.disable();
      }

      this.colorSchemeChangeEnabled = true;
      if (current.value === 'distribuzione-esiti') {
        this.colorSchemeChangeEnabled = false;
      }

      this.prepareTransactionOutcomeField(current.value === StatisticsUrl.DistribuzioneErrori);
      this.setupAdesioneField(this._formGroup.get('api')?.value);
    });

    reportTransactionOutcomeCodesControl.disable();
    this._formGroup.get('report_transaction_outcome_type')?.valueChanges.subscribe((current: TransactionOutcome | null) => {
      if (!reportTransactionOutcomeCodesControl) return;

      if (current && current !== TransactionOutcome.Personalized || !current) {
        reportTransactionOutcomeCodesControl.clearValidators();
        reportTransactionOutcomeCodesControl.setValue(null);
        reportTransactionOutcomeCodesControl.disable();
      } else {
        reportTransactionOutcomeCodesControl.setValidators([Validators.required]);
        reportTransactionOutcomeCodesControl.enable();
      }
      reportTransactionOutcomeCodesControl.updateValueAndValidity();
    });

    this._formGroup.valueChanges.subscribe((value: any) => {
      this.single = [];
      this.multi = [];
    });
  }

  private prepareTransactionOutcomeField(isErrorDistribution: boolean) {
    this.transactionOutcomes = isErrorDistribution ? this._transactionOutcomes.filter((o) => o.value !== TransactionOutcome.OK): this._transactionOutcomes;
    const transactionOutcomeControl = this._formGroup.get('report_transaction_outcome_type');
    if (transactionOutcomeControl && isErrorDistribution && transactionOutcomeControl.value === TransactionOutcome.OK) {
      transactionOutcomeControl.setValue(null);
    }
  }

  private setupAdesioneField(apiValue: any) {
    const adesioneControl = this._formGroup.get('adesione');
    if (!adesioneControl) return;

    adesioneControl.enable();

    let _distributionTypes: DistributionType[] = [];
    if (apiValue && apiValue.ruolo === 'erogato_soggetto_aderente') {
        adesioneControl.setValidators([Validators.required]);
        _distributionTypes = [
          ...this.distributionTypesDefault,
          ...this.distributionTypesAdherentSubject
        ];
    } else {
        adesioneControl.clearValidators();
        _distributionTypes = [
          ...this.distributionTypesDefault,
          ...this.distributionTypesSubjectDomain
        ];

        const distributionType: DistributionType = this._formGroup.get('distribution_type')?.value;

        if (!distributionType || !domainStatistics.some((s) => s === distributionType.value)) {
          adesioneControl.setValue(null);
          adesioneControl.disable();
        }
    }

    const allowedTypes: string[] = this.generalConfig?.monitoraggio?.statistiche?.tipi_distribuzione || [];
    const filteredDistributionTypes = allowedTypes.length
        ? _distributionTypes.filter(dt => allowedTypes.includes(dt.code))
        : _distributionTypes;
    this.distributionTypes = [ ...filteredDistributionTypes ];

    adesioneControl.updateValueAndValidity();
  }

  public canShowAdesioneAdherentSubject() {
    const api = this._formGroup.get('api')?.value;
    return api && api.ruolo === 'erogato_soggetto_aderente';
  }

  public onChangeApi($event: any) {
    this._formGroup.get('adesione')?.setValue(null);
  }

  public canShowAdesioneSubjectDomain() {
    const distributionType: DistributionType = this._formGroup.get('distribution_type')?.value;
    if (!distributionType || !domainStatistics.some((s) => s === distributionType.value)) return false;

    const api = this._formGroup.get('api')?.value;
    return api && api.ruolo !== 'erogato_soggetto_aderente';
  }

  _loadServizio() {
    if (this.id) {
      this.service = null;
      this.apiService.getDetails('servizi', this.id).subscribe({
        next: (response: any) => {
          this.service = response;
          this._initBreadcrumb();
        },
        error: (error: any) => {
          Tools.OnError(error);
        }
      });
      this.loadApis(this.id.toString());
      this.loadAdhesions(this.id.toString());
    }
  }

  public apis = [];
  private async loadApis(id_servizio: string) {
    this.apiService.getList('api', {params: {id_servizio}}).subscribe({
      next: (response: any) => {
        this.apis = response.content;
        this.preselectAndMakeApiReadonlyIfOnlyOne();
      },
      error: (error: any) => {
        Tools.OnError(error);
      }
    });
  }

  private preselectAndMakeApiReadonlyIfOnlyOne() {
    this.setupAdesioneField(null);
    if (this.apis.length === 1) {
      const apiControl = this._formGroup.get('api');
      if (!apiControl) return;
      apiControl.setValue(this.apis[0]);
      apiControl.disable();

      this.setupAdesioneField(this.apis[0]);
    }
  }

  public adhesions = [];
  private async loadAdhesions(id_servizio: string) { 
    this.apiService.getList('adesioni', {params: {id_servizio}}).subscribe({
      next: (response: any) => {
        this.adhesions = response.content;
      },
      error: (error: any) => {
        Tools.OnError(error);
      }
    });
  }

  public distributionTypes: DistributionType[] = [];

  public distributionTypesDefault: DistributionType[] = [
    { trendReport: true, value: StatisticsUrl.AndamentoTemporale, code: StatisticCode.AndamentoTemporale, label: 'Andamento Temporale', tableFirstColumnLabel: 'Data'},
    { trendReport: true, value: StatisticsUrl.DistribuzioneEsiti, code: StatisticCode.DistribuzioneEsiti, label: 'Distribuzione per Esiti', tableFirstColumnLabel: 'Data' },
    { trendReport: false, value: StatisticsUrl.DistribuzioneErrori, code: StatisticCode.DistribuzioneErrori, label: 'Distribuzione per Errori', tableFirstColumnLabel: 'Esito' },
    { trendReport: false, value: StatisticsUrl.DistribuzioneSoggettoRemoto, code: StatisticCode.DistribuzioneSoggettoRemoto, label: 'Distribuzione per Soggetto Remoto', tableFirstColumnLabel: 'Soggetto' },
    { trendReport: false, value: StatisticsUrl.DistribuzioneOperazione, code: StatisticCode.DistribuzioneOperazione, label: 'Distribuzione per Operazione', tableFirstColumnLabel: 'Azione' },
    { trendReport: false, value: StatisticsUrl.DistribuzioneApplicativo, code: StatisticCode.DistribuzioneApplicativo, label: 'Distribuzione per Applicativo', tableFirstColumnLabel: 'Applicativo' },
    { trendReport: false, value: StatisticsUrl.DistribuzioneIp, code: StatisticCode.DistribuzioneIp, label: 'Distribuzione per Indirizzo IP',  tableFirstColumnLabel: 'Indirizzo IP' },
  ];

  public distributionTypesSubjectDomain: DistributionType[] = [
    { trendReport: false, value: StatisticsUrl.DistribuzioneTokenClientId, code: StatisticCode.DistribuzioneTokenClientId, label: 'Distribuzione per Token ClientId', tableFirstColumnLabel: 'ClientId' },
    { trendReport: false, value: StatisticsUrl.DistribuzioneIssuer, code: StatisticCode.DistribuzioneIssuer, label: 'Distribuzione per Token Issuer', tableFirstColumnLabel: 'Issuer' },
  ];

  public distributionTypesAdherentSubject: DistributionType[] = [
    { trendReport: false, value: StatisticsUrl.DistribuzionePrincipal, code: StatisticCode.DistribuzionePrincipal, label: 'Distribuzione per Principal', tableFirstColumnLabel: 'Principal' },
  ];

  public reportTypeInformations = [
    { value: ReportTypeInformationEnum.NumberOfTransactions, label: this.translate.instant('APP.LABEL.' + ReportTypeInformationEnum.NumberOfTransactions) },
    { value: ReportTypeInformationEnum.BandOcupation, label: this.translate.instant('APP.LABEL.' + ReportTypeInformationEnum.BandOcupation) },
    { value: ReportTypeInformationEnum.AverageResponseTime, label: this.translate.instant('APP.LABEL.' + ReportTypeInformationEnum.AverageResponseTime) },
  ];

  public reportTimeIntervals = [ 
    { value: ReportTimeInterval.Hourly, label: this.translate.instant('APP.LABEL.' + ReportTimeInterval.Hourly) },
    { value: ReportTimeInterval.Daily, label: this.translate.instant('APP.LABEL.' + ReportTimeInterval.Daily) },
    { value: ReportTimeInterval.Weekly, label: this.translate.instant('APP.LABEL.' + ReportTimeInterval.Weekly) },
    { value: ReportTimeInterval.Monthly, label: this.translate.instant('APP.LABEL.' + ReportTimeInterval.Monthly) },
  ];

  public _transactionOutcomes: {value: string, label: string}[] = [ 
    { value: TransactionOutcome.Personalized, label: this.translate.instant('APP.LABEL.TRANSACTION_OUTCOME.' + TransactionOutcome.Personalized) },
    { value: TransactionOutcome.OK, label: this.translate.instant('APP.LABEL.TRANSACTION_OUTCOME.' + TransactionOutcome.OK) },
    { value: TransactionOutcome.Fault, label: this.translate.instant('APP.LABEL.TRANSACTION_OUTCOME.' + TransactionOutcome.Fault) },
    { value: TransactionOutcome.Failed, label: this.translate.instant('APP.LABEL.TRANSACTION_OUTCOME.' + TransactionOutcome.Failed) },
    { value: TransactionOutcome.FailedAndFault, label: this.translate.instant('APP.LABEL.TRANSACTION_OUTCOME.' + TransactionOutcome.FailedAndFault) },
    { value: TransactionOutcome.FailedExcludeDiscarded, label: this.translate.instant('APP.LABEL.TRANSACTION_OUTCOME.' + TransactionOutcome.FailedExcludeDiscarded) },
    { value: TransactionOutcome.FailedAndFaultExcludeDiscarded, label: this.translate.instant('APP.LABEL.TRANSACTION_OUTCOME.' + TransactionOutcome.FailedAndFaultExcludeDiscarded) }
  ];

  public transactionOutcomes: {value: string, label: string}[] = [];

  public transactionDetailedOutcomes: {value: number, label:string}[] = [];

  private _loadTransactionDetailedOutcomes() {
    this.transactionDetailedOutcomes = Array(...Array(53).keys()).map((_, i) => ({value: i, label: this.translate.instant('APP.ESITO.SHORT.INDEX_' + i)}));
  }

  _resetData() {
    this._spin = false;
    this.single = [];
    this.multi = [];
    this._setErrorMessages(false);
  }

  private _getReportUri(formValue: any) {
    const api = this._formGroup.get('api')?.value;

    const ambiente = this.environmentId === 'collaudo' ? 'collaudo' : 'produzione';
    const erogazioneOrFruizione = this._tipoVerifica(api);
    const _soggetto = this._getSoggettoNome();

    const distibutionType: DistributionType = formValue.distribution_type;

    return `${ambiente}/${erogazioneOrFruizione}/${_soggetto}/report/${distibutionType.value}`;
  }

  _tipoVerifica(api: any) {
    if (api.ruolo === 'erogato_soggetto_dominio') {
      if (this.service?.soggetto_interno) {
        return 'fruizioni';
      } else {
        return 'erogazioni';
      }
    } else {
      return 'fruizioni';
    }
  }

  _hasPDNDAuthType(api: any) {
    let _hasPDND: boolean = false;

    const _profili = this.authenticationService._getConfigModule('servizio')?.api?.profili || [];

    api.dati_erogazione.gruppi_auth_type.map((auth: any) => {
      const _profile = _profili.find((item: any) => item.codice_interno === auth.profilo);
      if (_profile.auth_type.includes('pdnd')) {
        _hasPDND = true;
      }
    });

    return _hasPDND;
  }

  _getSoggettoNome() {
      return this.service?.soggetto_interno?.nome || this.service?.dominio?.soggetto_referente?.nome
  }

  _isSoggettoPDND() {
    const _soggettoServizio = this.service?.dominio?.soggetto_referente?.nome || '';
    const _soggettiPDND = this.authenticationService._getConfigModule('pdnd') || [];

    const _index = _soggettiPDND.findIndex((item: any) => item.nome_soggetto === _soggettoServizio);

    return (_index !== -1);
  }

  private prepareDownloadUrlQuery(formValue: any) {
    let httpParams = new HttpParams();
    const dateFrom = JSON.parse(JSON.stringify(moment(formValue.report_date_from)));
    const dateTo = JSON.parse(JSON.stringify(moment(formValue.report_date_to)));

    httpParams = httpParams.set('data_da', dateFrom);
    httpParams = httpParams.set('data_a', dateTo);
    httpParams = httpParams.set('id_servizio', this.service.id_servizio);
    httpParams = httpParams.set('id_api', this._formGroup.get('api')?.value.id_api);

    if (formValue.report_transaction_outcome_type) {
      httpParams = httpParams.set('esito', formValue.report_transaction_outcome_type);
    }

    if (formValue.adesione) {
      httpParams = httpParams.set('id_adesione', formValue.adesione.id_adesione);
    }

    httpParams = httpParams.set('unita_tempo', formValue.report_time_interval ? formValue.report_time_interval : ReportTimeInterval.Hourly);
    httpParams = httpParams.set('tipo_intervallo_temporale', 'personalizzato');
    httpParams = httpParams.set('tipo_report', this.tipoGrafico);
    httpParams = httpParams.set('tipo_informazione_report', formValue.report_information_type);
    return httpParams;
  }

  _onSubmit(formValue: any) {
    this._formGroup.markAllAsTouched();
    if (this._formGroup.invalid) return;

    const api = this._formGroup.get('api')?.value;

    let momentFrom = moment(formValue.report_date_from);
    let momentTo = moment(formValue.report_date_to);

    if (!this.useTimepicker) {
      momentFrom = momentFrom.startOf('day');
      momentTo = momentTo.startOf('day');
    }

    const dateFrom = JSON.parse(JSON.stringify(momentFrom));
    const dateTo = JSON.parse(JSON.stringify(momentTo));

    const distibutionType: DistributionType = formValue.distribution_type;

    const request: any = {
      api: {
        id_servizio: this.service.id_servizio,
        id_api: api.id_api,
        id_adesione: formValue.adesione ? formValue.adesione.id_adesione: undefined,
        // "id_client": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      },
      // "operazione": "Ta",
      unita_tempo: formValue.report_time_interval ? formValue.report_time_interval : ReportTimeInterval.Hourly,
      intervallo_temporale: {
        tipo_intervallo_temporale: 'personalizzato',
        data_inizio: dateFrom,
        data_fine: dateTo
      },
      tipo_report_andamento_temporale: this.tipoGrafico,
      tipo_informazione_report: formValue.report_information_type,
    }

    if (formValue.report_transaction_outcome_type || formValue.report_transaction_outcome_codes?.length) {
      request.esito = {
        tipo: formValue.report_transaction_outcome_type ? formValue.report_transaction_outcome_type : undefined,
        codici: formValue.report_transaction_outcome_codes?.length > 0 ? formValue.report_transaction_outcome_codes : undefined
      }
    }

    const url = this._getReportUri(formValue);

    this.single = [];
    this.multi = [];
    this.multi_bar_chart = [];

    this._spin = true;
    this._setErrorMessages(false);

    this.apiService.postMonitor(url, request).subscribe({
      next: (result: {valori: any[]}) => { 
        this._spin = false;

        if (!result?.valori?.length) {
          this._message = 'APP.MESSAGE.NoTransactionsForPeriod';
          this._messageHelp = 'APP.MESSAGE.NoTransactionsForPeriodHelp';  
          return;
        }

        switch (distibutionType.value) {
          case StatisticsUrl.AndamentoTemporale: {
            const values = result.valori as TimeProgressionItem[];
            this.single = values.map((v) => ({name: v.data, value: v.valore}));

            this.multi = [
              {name: this.translate.instant('APP.LABEL.' + formValue.report_information_type), series: values.map((v) => ({name: v.data, value: v.valore}))},
            ];;
            this.multi_bar_chart = values.map((v) => {
              return {
                name: v.data,
                series: [
                  {name: this.translate.instant('APP.LABEL.' + formValue.report_information_type), value: v.valore},
                ]
              }
            });
            break;
          }
          case StatisticsUrl.DistribuzioneEsiti: {
            const outcomeValues = result.valori as DistributionOutcomeItem[];
            this.single = outcomeValues.map((v) => ({name: v.data, value: v.valore_ok}));
            
            this.multi_bar_chart = outcomeValues.map((v) => {
              return {
                name: v.data,
                series: [
                  {name: this.translate.instant('APP.LABEL.TRANSACTION_OUTCOME.' + TransactionOutcome.OK), value: v.valore_ok},
                  {name: this.translate.instant('APP.LABEL.TRANSACTION_OUTCOME.' + TransactionOutcome.Fault), value: v.valore_fault},
                  {name: this.translate.instant('APP.LABEL.TRANSACTION_OUTCOME.' + TransactionOutcome.Failed), value: v.valore_fallite},
                ]
              }
            });

            this.multi = [
              {name: this.translate.instant('APP.LABEL.TRANSACTION_OUTCOME.' + TransactionOutcome.OK), series: outcomeValues.map((v) => ({name: v.data, value: v.valore_ok}))},
              {name: this.translate.instant('APP.LABEL.TRANSACTION_OUTCOME.' + TransactionOutcome.Fault), series: outcomeValues.map((v) => ({name: v.data, value: v.valore_fault}))},
              {name: this.translate.instant('APP.LABEL.TRANSACTION_OUTCOME.' + TransactionOutcome.Failed), series: outcomeValues.map((v) => ({name: v.data, value: v.valore_fallite}))},
            ];
            break;
          }
          case StatisticsUrl.DistribuzioneErrori: {
            const errorValues = result.valori as DistributionErrorItem[];
            this.single = errorValues.map((v) => ({name: v.esito.toString(), value: v.valore}));
            break;
          }
          case StatisticsUrl.DistribuzioneSoggettoRemoto: {
            const remoteSubjectValues = result.valori as DistributionRemoteSubjectItem[];
            this.single = remoteSubjectValues.map((v) => ({name: v.nome, value: v.valore}));
            break;
          }
          case StatisticsUrl.DistribuzioneOperazione: {
            //checkout grouping below
            const operationValues = result.valori as DistributionOperationItem[];
            this.single = operationValues.map((v) => ({name: v.operazione, value: v.valore}));
            break;
          }
          case StatisticsUrl.DistribuzioneApplicativo: {
            // does not work
            const applicationValues = result.valori as DistributionApplicationItem[];
            this.single = applicationValues.map((v) => ({name: v.nome, value: v.valore}));
            break;
          }
          case StatisticsUrl.DistribuzioneTokenClientId: {
            // possibly multi
            const tokenClientIdValues = result.valori as DistributionTokenClientIdItem[];
            this.single = tokenClientIdValues.map((v) => ({name: v.client_id, value: v.valore}));
            break;
          }
          case StatisticsUrl.DistribuzioneIssuer: {
            const tokenIssuerValues = result.valori as DistributionTokenIssuerItem[];
            this.single = tokenIssuerValues.map((v) => ({name: v.issuer, value: v.valore}));
            break;
          }
          case StatisticsUrl.DistribuzionePrincipal: {
            const principalValues = result.valori as DistributionPrincipalItem[];
            this.single = principalValues.map((v) => ({name: v.indirizzo, value: v.valore}));
            break;
          }
          case StatisticsUrl.DistribuzioneIp: {
            const ipValues = result.valori as DistributionIpItem[];
            this.single = ipValues.map((v) => ({name: v.indirizzo, value: v.valore}));
            break;
          }
        }
      },
      error: (error: any) => {
        this._spin = false;
        this._setErrorMessages(true);
        this._errorMsg = error.error?.message || error.message;
      }
    });
  }

  onBreadcrumb(event: any) {
    this.router.navigate([event.url]);
  }

  _resetScroll() {
    Tools.ScrollElement('container-scroller', 0);
  }

  _showCollaudo() {
    this.environmentId = 'collaudo';
    this._resetData();
  }

  _showProduzione() {
    this.environmentId = 'produzione';
    this._resetData();
  }

  _isCollaudo() {
    return (this.environmentId === 'collaudo');
  }

  _toggleFilter() {
    this._showFilter = !this._showFilter;
    setTimeout(() => {
      this.pieChart?.update();
      this.verticalBarChart?.update();
      this.verticalBarChart2D?.update();
      this.lineChart?.update();
    }, 300);
  }

  onSelect(event: any) {}

  setTipoGrafico(type: any) {
    this.tipoGrafico = type
  }

  onExport(downloadType: DownloadType) {
    this._formGroup.markAllAsTouched();
    if (this._formGroup.invalid) return;

    const fileName = this._formGroup.get('distribution_type')?.value.value;

    if ('export-png' === downloadType.action) {
      let nodeList: NodeList = this.captureGraphArea.nativeElement.querySelectorAll('.ngx-charts-outer');

      let preservedAnimation = '';

      nodeList.forEach((node: Node) => {
        preservedAnimation = (node as HTMLDivElement).style.animation;
        (node as HTMLDivElement).style.animation = 'none';
      })

      getScreenshotOfElement(this.captureGraphArea.nativeElement, fileName).then(() => {
        nodeList.forEach((node: Node) => {
          (node as HTMLDivElement).style.animation = preservedAnimation;
        });
      });
    } else {
      const url = this._getReportUri(this._formGroup.value);
      const httpParams = this.prepareDownloadUrlQuery( this._formGroup.value);
  
      let headers = new HttpHeaders();
      headers = headers.set('Accept', downloadType.acceptHeader);
  
      this._spin = true;
      this._setErrorMessages(false);
      this.apiService.downloadMonitor(url, httpParams, headers).subscribe({
        next: (result: HttpResponse<Blob>) => {
          this._spin = false;
          const blob = new Blob([result.body as BlobPart], { type: downloadType.acceptHeader });

          const anchor = document.createElement('a');

          anchor.download = fileName;
          anchor.href = (window.webkitURL || window.URL).createObjectURL(blob);
          anchor.dataset.downloadurl = [downloadType.acceptHeader, anchor.download, anchor.href].join(':');
          anchor.click();
          
        },
        error: (error: any) => {
          this._spin = false;
          this._setErrorMessages(true);
          this._errorMsg = error.error?.message || error.message;
        }
      });
    }
  }

  // Chart utilities

  setColorScheme(name: string) {
    this.selectedColorScheme = name;
    this.colorScheme = this.colorSets.find((s: any) => s.name === name);
  }
}

function getScreenshotOfElement(element: HTMLElement, fileName: string) {
  const promise = new Promise<void>((resolve, reject) => {

  htmlToImage.toPng(element, {height: element.scrollHeight + 30, width: element.scrollWidth + 30, backgroundColor: '#ffffff'})
    .then(function (imageData) {
      const link = document.createElement("a");
      link.setAttribute("download", fileName + ".png");
      link.setAttribute("href", imageData);
      link.click();
      resolve();
    });
  });

  return promise;
}
