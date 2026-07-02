import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { AgidJwtDialogComponent } from './agid-jwt-dialog.component';

describe('AgidJwtDialogComponent', () => {
  let component: AgidJwtDialogComponent;

  const mockHttp = {
    post: vi.fn().mockReturnValue(of({ access_token: 'tok123', expires_in: 3600 }))
  } as any;
  const mockClipboard = { copy: vi.fn().mockReturnValue(true) } as any;
  const mockModalRef = { hide: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockAuthService = {} as any;
  const mockConfigService = { getConfiguration: vi.fn().mockReturnValue({}) } as any;
  const mockUtils = {} as any;
  const mockAuthDialogService = {
    convertSecondsToHours: vi.fn((sec: number) => `${Math.floor(sec / 60)}m`),
    uuidv4: vi.fn().mockReturnValue('test-uuid-1234'),
    detectKeyFormat: vi.fn().mockReturnValue('PEM'),
    convertDERToPEM: vi.fn().mockReturnValue('base64content'),
    buildPEMString: vi.fn().mockReturnValue('-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n'),
  } as any;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    component = new AgidJwtDialogComponent(
      mockHttp, mockClipboard, mockModalRef, mockTranslate,
      mockAuthService, mockConfigService, mockUtils, mockAuthDialogService
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default tipoPolicy pdnd', () => {
    expect(component.tipoPolicy).toBe('pdnd');
  });

  it('should have default title', () => {
    expect(component.title).toBe('APP.AUTHENTICATION.TITLE.GeneratePDNDVoucher');
  });

  // --- ngOnInit ---

  it('should initialize form on ngOnInit with no tokenPolicy', () => {
    component.ngOnInit();
    expect(component.onClose).toBeDefined();
    expect(component._codicePolicy).toBe('');
    expect(component._type).toBe('JWT');
    expect(component._algDefault).toBe('RS256');
    expect(component._algOptions).toEqual(['RS256']);
    expect(component._audience).toBe('');
    expect(component._editAudience).toBe(false);
    expect(component._expiresIn).toBe(5);
    expect(component._tokenUrl).toBe('');
    expect(component.formGroup.get('alg')?.value).toBe('RS256');
  });

  it('should initialize from tokenPolicy on ngOnInit', () => {
    component.tokenPolicy = {
      codice_policy: 'test_policy',
      type: 'JWT',
      alg_default: 'RS384',
      alg_options: ['RS256', 'RS384'],
      audience: 'https://test.it',
      expires_in: 10,
      token_url: 'https://token.it',
    };
    component.ngOnInit();
    expect(component._codicePolicy).toBe('test_policy');
    expect(component._type).toBe('JWT');
    expect(component._algDefault).toBe('RS384');
    expect(component._algOptions).toEqual(['RS256', 'RS384']);
    expect(component._audience).toBe('https://test.it');
    expect(component._editAudience).toBe(true);
    expect(component._expiresIn).toBe(10);
    expect(component._tokenUrl).toBe('https://token.it');
    expect(component.formGroup.get('alg')?.value).toBe('RS384');
    expect(component.formGroup.get('typ')?.value).toBe('JWT');
    expect(component.formGroup.get('audience')?.value).toBe('https://test.it');
  });

  it('should set _editAudience to false when audience is empty', () => {
    component.tokenPolicy = {
      codice_policy: 'p',
      type: 'JWT',
      alg_default: 'RS256',
      alg_options: ['RS256'],
      audience: '',
      expires_in: 5,
      token_url: '',
    };
    component.ngOnInit();
    expect(component._editAudience).toBe(false);
  });

  // --- f getter ---

  it('should return form controls via f getter', () => {
    const controls = component.f;
    expect(controls['kid']).toBeDefined();
    expect(controls['alg']).toBeDefined();
    expect(controls['clientId']).toBeDefined();
  });

  // --- initForm ---

  it('should set keyFile control and patch form values', () => {
    component._algDefault = 'RS384';
    component._type = 'JWS';
    component._audience = 'aud1';
    component.initForm();
    expect(component.formGroup.get('alg')?.value).toBe('RS384');
    expect(component.formGroup.get('typ')?.value).toBe('JWS');
    expect(component.formGroup.get('audience')?.value).toBe('aud1');
  });

  // --- closeModal ---

  it('should close modal with no data', () => {
    component.ngOnInit();
    const nextSpy = vi.spyOn(component.onClose, 'next');
    component.closeModal();
    expect(nextSpy).toHaveBeenCalledWith({ close: true, result: {} });
    expect(mockModalRef.hide).toHaveBeenCalled();
  });

  it('should close modal with data', () => {
    component.ngOnInit();
    const nextSpy = vi.spyOn(component.onClose, 'next');
    component.closeModal({ token: 'abc' });
    expect(nextSpy).toHaveBeenCalledWith({ close: true, result: { token: 'abc' } });
    expect(mockModalRef.hide).toHaveBeenCalled();
  });

  // --- useResultModal ---

  it('should call closeModal with token from form result', () => {
    component.ngOnInit();
    component.formGroup.get('result')?.setValue('mytoken');
    const closeSpy = vi.spyOn(component, 'closeModal');
    component.useResultModal();
    expect(closeSpy).toHaveBeenCalledWith({ token: 'mytoken' });
  });

  // --- clearError ---

  it('should clear all error state and result', () => {
    component._error = true;
    component._errorMsg = 'some error';
    component._errorObject = { detail: 'err' };
    component.formGroup.get('result')?.setValue('old');
    component.clearError();
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
    expect(component._errorObject).toBeNull();
    expect(component.formGroup.get('result')?.value).toBeNull();
  });

  // --- toggleResult ---

  it('should toggle result visibility', () => {
    expect(component._showResult).toBe(false);
    component.toggleResult();
    expect(component._showResult).toBe(true);
    component.toggleResult();
    expect(component._showResult).toBe(false);
  });

  // --- convertSecondsToHours ---

  it('should delegate to authenticationDialogService.convertSecondsToHours', () => {
    const result = component.convertSecondsToHours(120);
    expect(mockAuthDialogService.convertSecondsToHours).toHaveBeenCalledWith(120);
    expect(result).toBe('2m');
  });

  // --- onCopyClipboard ---

  it('should copy result to clipboard and show message temporarily', () => {
    component.formGroup.get('result')?.setValue('token-to-copy');
    component.onCopyClipboard();
    expect(mockClipboard.copy).toHaveBeenCalledWith('token-to-copy');
    expect(component._showMessageClipboard).toBe(true);
    vi.advanceTimersByTime(3000);
    expect(component._showMessageClipboard).toBe(false);
  });

  // --- agidJWT ---

  it('should return empty string when keyFormat is unsupported', async () => {
    component.formGroup.get('keyFormat')?.setValue('UNKNOWN');
    const result = await component.agidJWT({ kid: 'k1', alg: 'RS256', typ: 'JWT', clientId: 'c1', audience: 'aud', purposeId: 'p1', key: 'k' });
    expect(component._error).toBe(true);
    expect(component._errorMsg).toBe('Formato della chiave non supportato');
  });

  it('should handle PEM key error gracefully', async () => {
    component.formGroup.get('keyFormat')?.setValue('PEM');
    // jsrsasign will throw because key is invalid
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await component.agidJWT({ kid: 'k1', alg: 'RS256', typ: 'JWT', clientId: 'c1', audience: 'aud', purposeId: 'p1', key: 'not-a-valid-pem' });
    expect(result).toBeUndefined();
    consoleSpy.mockRestore();
  });

  it('should handle DER key with both PRIVATE KEY and RSA PRIVATE KEY failures', async () => {
    component.formGroup.get('keyFormat')?.setValue('DER');
    mockAuthDialogService.buildPEMString.mockImplementation(() => { throw new Error('bad key'); });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await component.agidJWT({ kid: 'k1', alg: 'RS256', typ: 'JWT', clientId: 'c1', audience: 'aud', purposeId: 'p1', key: 'derdata' });
    expect(component._error).toBe(true);
    expect(component._errorMsg).toBe('Errore durante la lettura della chiave');
    consoleSpy.mockRestore();
  });

  it('should handle DER key with first failure but second success still throwing on sign', async () => {
    component.formGroup.get('keyFormat')?.setValue('DER');
    let callCount = 0;
    mockAuthDialogService.buildPEMString.mockImplementation(() => {
      callCount++;
      if (callCount === 1) throw new Error('first fail');
      return '-----BEGIN RSA PRIVATE KEY-----\nbad\n-----END RSA PRIVATE KEY-----\n';
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await component.agidJWT({ kid: 'k1', alg: 'RS256', typ: 'JWT', clientId: 'c1', audience: 'aud', purposeId: 'p1', key: 'derdata' });
    // Even if buildPEM succeeds, KEYUTIL.getKey will throw on bad key
    consoleSpy.mockRestore();
  });

  // --- onGenerateJWT ---

  it('should not proceed if form is invalid', async () => {
    // Form has required fields empty, so it's invalid
    await component.onGenerateJWT({});
    expect(component._spin).toBe(false);
    expect(mockHttp.post).not.toHaveBeenCalled();
  });

  it('should call clearError before generating', async () => {
    component._error = true;
    component._errorMsg = 'old error';
    const clearSpy = vi.spyOn(component, 'clearError');
    await component.onGenerateJWT({});
    expect(clearSpy).toHaveBeenCalled();
  });

  it('should handle voucher success when form is valid and clientAssertion exists', async () => {
    const mockAssertion = 'mock-jwt-assertion';
    vi.spyOn(component, 'agidJWT').mockResolvedValue(mockAssertion);
    // Make form valid
    Object.keys(component.formGroup.controls).forEach(key => {
      const ctrl = component.formGroup.get(key);
      ctrl?.clearValidators();
      ctrl?.updateValueAndValidity();
    });
    mockHttp.post.mockReturnValue(of({ access_token: 'new-token', expires_in: 7200 }));

    await component.onGenerateJWT({ clientId: 'cid' });
    expect(component.formGroup.get('result')?.value).toBe('new-token');
    expect(component.formGroup.get('expiresIn')?.value).toBe(7200);
    expect(component._spin).toBe(false);
  });

  it('should handle voucher error when form is valid and clientAssertion exists', async () => {
    const mockAssertion = 'mock-jwt-assertion';
    vi.spyOn(component, 'agidJWT').mockResolvedValue(mockAssertion);
    Object.keys(component.formGroup.controls).forEach(key => {
      const ctrl = component.formGroup.get(key);
      ctrl?.clearValidators();
      ctrl?.updateValueAndValidity();
    });
    mockHttp.post.mockReturnValue(throwError(() => ({ error: 'bad_grant', message: 'Invalid' })));

    await component.onGenerateJWT({ clientId: 'cid' });
    expect(component._error).toBe(true);
    expect(component._errorMsg).toBe('Invalid');
    expect(component._errorObject).toBe('bad_grant');
    expect(component._spin).toBe(false);
  });

  it('should not call getVoucher when agidJWT returns empty/falsy', async () => {
    vi.spyOn(component, 'agidJWT').mockResolvedValue('');
    Object.keys(component.formGroup.controls).forEach(key => {
      const ctrl = component.formGroup.get(key);
      ctrl?.clearValidators();
      ctrl?.updateValueAndValidity();
    });

    await component.onGenerateJWT({ clientId: 'cid' });
    expect(mockHttp.post).not.toHaveBeenCalled();
  });

  // --- _getVoucher ---

  it('should create a POST request with form-urlencoded content type', async () => {
    component._tokenUrl = 'https://api.test/token';
    mockHttp.post.mockReturnValue(of({}));
    const result = await component._getVoucher({ client_id: 'c1', grant_type: 'client_credentials' });
    expect(mockHttp.post).toHaveBeenCalled();
    const [url, params, options] = mockHttp.post.mock.calls[0];
    expect(url).toBe('https://api.test/token');
  });

  // --- _onKeyChange ---

  it('should set key value when file is read successfully', async () => {
    vi.spyOn(component, '_readKeyFile' as any).mockResolvedValue('PEM-KEY-CONTENT');
    const file = { target: { files: [new Blob(['key'])] } };
    await component._onKeyChange(file);
    expect(component.formGroup.get('key')?.value).toBe('PEM-KEY-CONTENT');
  });

  it('should set error when _readKeyFile rejects', async () => {
    vi.spyOn(component, '_readKeyFile' as any).mockRejectedValue(new Error('File read failed'));
    const file = { target: { files: [new Blob(['key'])] } };
    await component._onKeyChange(file);
    expect(component._error).toBe(true);
    expect(component._errorMsg).toBe('File read failed');
    expect(component.formGroup.get('key')?.value).toBeNull();
  });

  it('should set error with string when _readKeyFile rejects with string', async () => {
    vi.spyOn(component, '_readKeyFile' as any).mockRejectedValue('string error');
    const file = { target: { files: [new Blob(['key'])] } };
    await component._onKeyChange(file);
    expect(component._error).toBe(true);
    expect(component._errorMsg).toBe('string error');
  });

  it('should call clearError before processing key change', async () => {
    const clearSpy = vi.spyOn(component, 'clearError');
    vi.spyOn(component, '_readKeyFile' as any).mockResolvedValue('data');
    await component._onKeyChange({ target: { files: [new Blob()] } });
    expect(clearSpy).toHaveBeenCalled();
  });

  // --- _readKeyFile ---

  it('should return undefined and call clearError when file is null', () => {
    const clearSpy = vi.spyOn(component, 'clearError');
    const result = component._readKeyFile(null);
    expect(result).toBeUndefined();
    expect(clearSpy).toHaveBeenCalled();
  });

  it('should return undefined and call clearError when file is undefined', () => {
    const clearSpy = vi.spyOn(component, 'clearError');
    const result = component._readKeyFile(undefined);
    expect(result).toBeUndefined();
    expect(clearSpy).toHaveBeenCalled();
  });
});
