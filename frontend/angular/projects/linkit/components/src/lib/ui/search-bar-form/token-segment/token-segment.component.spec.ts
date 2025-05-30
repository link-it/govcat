import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TokenSegmentComponent } from './token-segment.component';
import { ConfigService } from '../../../services';
import { UtilsLib } from '../../../utils/utils.lib';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('TokenSegmentComponent', () => {
    let component: TokenSegmentComponent;
    let fixture: ComponentFixture<TokenSegmentComponent>;
    let mockConfigService = {
        getConfiguration: jasmine.createSpy('getConfiguration').and.returnValue({ AppConfig: { PDC_CONSOLE: { HOST: 'test_host' } } })
    };

    let httpTestingController: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
    declarations: [TokenSegmentComponent],
    imports: [],
    providers: [
        { provide: ConfigService, useValue: mockConfigService },
        UtilsLib,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
}).compileComponents();
    });

    beforeEach(() => {
        httpTestingController = TestBed.inject(HttpTestingController);
        fixture = TestBed.createComponent(TokenSegmentComponent);
        component = fixture.componentInstance;
        component.token = {
            data:
            {
                type: 'default',
                params: {
                    resource: 'test_resource',
                    path: 'test_path',
                    urlParam: 'test_urlParam'
                },
                data: []
            }, value: 'test_value'
        };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit onAction event with token value when _onAction is called', () => {
        const event = new Event('click');
        spyOn(event, 'stopPropagation');
        spyOn(component.onAction, 'emit');

        component._onAction(event);

        expect(event.stopPropagation).toHaveBeenCalled();
        expect(component.onAction.emit).toHaveBeenCalledWith(component.token);
    });

    it('should emit onRemove event with token value and index when _removeToken is called', () => {
        const event = new Event('click');
        spyOn(event, 'stopPropagation');
        spyOn(component.onRemove, 'emit');

        component._removeToken(event);

        expect(event.stopPropagation).toHaveBeenCalled();
        expect(component.onRemove.emit).toHaveBeenCalledWith({ token: component.token, index: component.index });
    });

    it('should set data$ correctly when _getDataFromData is called', () => {
        const arr = [1, 2];
        const data = [
            { value: 1, label: 'Label 1' },
            { value: 2, label: 'Label 2' },
            { value: 3, label: 'Label 3' }
        ];

        component._getDataFromData(arr, data);

        component.data$.subscribe(value => {
            expect(value).toEqual({ nome: 'Label 1, Label 2' });
        });
    });

    it('should set data$ correctly when _getData is called', () => {
        const endPoint = 'test_endPoint';
        const mockResponse = { content: ['test_content'] };

        component._getData(endPoint);

        const req = httpTestingController.expectOne('test_host/test_resourcetest_urlParamtest_value');
        expect(req.request.method).toEqual('GET');
        req.flush(mockResponse);

        component.data$.subscribe(value => {
            expect(value).toEqual(mockResponse.content[0]);
        });
    });

    it('should set data$ correctly when _getDataJoin is called', () => {
        const endPoint = 'test_endPoint';
        const data = ['test_data1', 'test_data2'];
        const mockResponses = [
            { content: ['test_content1'], nome: 'Nome 1' },
            { content: ['test_content2'], nome: 'Nome 2' }
        ];

        component._getDataJoin(endPoint, data);

        const reqs = httpTestingController.match(req => req.url.includes(endPoint) && req.method === 'GET');
        expect(reqs.length).toEqual(data.length);
        reqs.forEach((req, index) => req.flush(mockResponses[index]));

        component.data$.subscribe(value => {
            expect(value).toEqual({ nome: 'Nome 1, Nome 2' });
        });
    });

    it('should return correct value when _getObjectValue is called', () => {
        const data = { field1: 'value1', field2: 'value2' };
        const elem = 'test_{field1}_test_{field2}';
        spyOn(component.utilsLib, 'getObjectValue').and.callFake((data, field) => data[field]);

        const result = component._getObjectValue(data, elem);

        expect(result).toEqual('test_value1_test_value2');
        expect(component.utilsLib.getObjectValue).toHaveBeenCalledWith(data, 'field1');
        expect(component.utilsLib.getObjectValue).toHaveBeenCalledWith(data, 'field2');
    });

    it('should return correct value when _getObjectValueMapper is called', () => {
        const data = { nome: 'test_nome', field1: 'value1', field2: 'value2' };
        const elem = 'test_{field1}_test_{field2}';
        spyOn(component.utilsLib, 'getObjectValue').and.callFake((data, field) => data[field]);

        const result = component._getObjectValueMapper(data, elem);

        expect(result).toEqual('test_value1_test_value2');
        expect(component.utilsLib.getObjectValue).toHaveBeenCalledWith(data, 'field1');
        expect(component.utilsLib.getObjectValue).toHaveBeenCalledWith(data, 'field2');
    });

    it('should return data.nome when elem is not provided', () => {
        const data = { nome: 'test_nome' };
        const elem = '';

        const result = component._getObjectValueMapper(data, elem);

        expect(result).toEqual(data.nome);
    });

});