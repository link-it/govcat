import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { AgidJwtSignatureDialogComponent } from './agid-jwt-signature-dialog.component';

describe('AgidJwtSignatureDialogComponent', () => {
  let component: AgidJwtSignatureDialogComponent;

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
    calculateSHA256: vi.fn().mockResolvedValue('abc123hash'),
  } as any;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    component = new AgidJwtSignatureDialogComponent(
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

  it('should have default tipoPolicy pdnd_integrity', () => {
    expect(component.tipoPolicy).toBe('pdnd_integrity');
  });

  it('should have default title', () => {
    expect(component.title).toBe('APP.AUTHENTICATION.TITLE.GenerateSignature');
  });

  // --- ngOnInit ---

  it('should initialize with default values when no tokenPolicy', () => {
    component.ngOnInit();
    expect(component._codicePolicy).toBe('');
    expect(component._type).toBe('JWT');
    expect(component._algDefault).toBe('RS256');
    expect(component._algOptions).toEqual(['RS256']);
    expect(component._audience).toBe('');
    expect(component._audience_integrity).toBe('');
    expect(component._editAudienceIntegrity).toBe(true);
    expect(component._expiration).toBe(5);
    expect(component._tokenUrl).toBe('');
    expect(component.formGroup.get('alg')?.value).toBe('RS256');
    expect(component.formGroup.get('expiration')?.value).toBe(5);
  });

  it('should initialize from tokenPolicy on ngOnInit', () => {
    component.tokenPolicy = {
      codice_policy: 'sig_policy',
      type: 'JWS',
      alg_default: 'RS384',
      alg_options: ['RS256', 'RS384'],
      audience: 'https://aud.it',
      audience_integrity: 'https://aud-int.it',
      expires_in: 15,
      token_url: 'https://token.it/sign',
    };
    component.ngOnInit();
    expect(component._codicePolicy).toBe('sig_policy');
    expect(component._type).toBe('JWS');
    expect(component._algDefault).toBe('RS384');
    expect(component._algOptions).toEqual(['RS256', 'RS384']);
    expect(component._audience).toBe('https://aud.it');
    expect(component._audience_integrity).toBe('https://aud-int.it');
    expect(component._editAudienceIntegrity).toBe(false);
    expect(component._expiration).toBe(15);
    expect(component._tokenUrl).toBe('https://token.it/sign');
    expect(component.formGroup.get('alg')?.value).toBe('RS384');
    expect(component.formGroup.get('typ')?.value).toBe('JWS');
    expect(component.formGroup.get('audience')?.value).toBe('https://aud.it');
    expect(component.formGroup.get('audience_integrity')?.value).toBe('https://aud-int.it');
  });

  it('should set _editAudienceIntegrity to true when audience_integrity is empty', () => {
    component.tokenPolicy = {
      codice_policy: 'p',
      type: 'JWT',
      alg_default: 'RS256',
      alg_options: ['RS256'],
      audience: 'a',
      audience_integrity: '',
      expires_in: 5,
      token_url: '',
    };
    component.ngOnInit();
    expect(component._editAudienceIntegrity).toBe(true);
  });

  // --- f getter ---

  it('should return form controls via f getter', () => {
    const controls = component.f;
    expect(controls['kid']).toBeDefined();
    expect(controls['alg']).toBeDefined();
    expect(controls['digest']).toBeDefined();
    expect(controls['signedToken']).toBeDefined();
  });

  // --- initForm ---

  it('should set keyFile control and patch form values', () => {
    component._algDefault = 'RS384';
    component._expiration = 20;
    component._type = 'JWS';
    component._audience = 'aud1';
    component._audience_integrity = 'aud-int1';
    component.initForm();
    expect(component.formGroup.get('alg')?.value).toBe('RS384');
    expect(component.formGroup.get('expiration')?.value).toBe(20);
    expect(component.formGroup.get('typ')?.value).toBe('JWS');
    expect(component.formGroup.get('audience')?.value).toBe('aud1');
    expect(component.formGroup.get('audience_integrity')?.value).toBe('aud-int1');
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
    component.closeModal({ digest: 'd', signature: 's' });
    expect(nextSpy).toHaveBeenCalledWith({ close: true, result: { digest: 'd', signature: 's' } });
    expect(mockModalRef.hide).toHaveBeenCalled();
  });

  // --- useResultModal ---

  it('should call closeModal with digest, signature, and voucher from form', () => {
    component.ngOnInit();
    component.formGroup.get('result')?.setValue('voucher-value');
    component.formGroup.get('digest')?.setValue('SHA-256=abc');
    component.formGroup.get('signedToken')?.setValue('signed-jwt');
    const closeSpy = vi.spyOn(component, 'closeModal');
    component.useResultModal();
    expect(closeSpy).toHaveBeenCalledWith({
      digest: 'SHA-256=abc',
      signature: 'signed-jwt',
      voucher: 'voucher-value'
    });
  });

  // --- clearError ---

  it('should clear all error state and form result fields', () => {
    component._error = true;
    component._errorMsg = 'error msg';
    component._errorObject = { detail: 'err' };
    component.formGroup.get('result')?.setValue('old');
    component.formGroup.get('expiresIn')?.setValue(100);
    component.formGroup.get('unsignedToken')?.setValue('ut');
    component.formGroup.get('signedToken')?.setValue('st');
    component.clearError();
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
    expect(component._errorObject).toBeNull();
    expect(component.formGroup.get('result')?.value).toBeNull();
    expect(component.formGroup.get('expiresIn')?.value).toBeNull();
    expect(component.formGroup.get('unsignedToken')?.value).toBeNull();
    expect(component.formGroup.get('signedToken')?.value).toBeNull();
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
    component.formGroup.get('result')?.setValue('my-token');
    component.onCopyClipboard();
    expect(mockClipboard.copy).toHaveBeenCalledWith('my-token');
    expect(component._showMessageClipboard).toBe(true);
    vi.advanceTimersByTime(3000);
    expect(component._showMessageClipboard).toBe(false);
  });

  // --- generateJWT ---

  it('should set error when keyFormat is unsupported', async () => {
    component.formGroup.get('keyFormat')?.setValue('UNKNOWN');
    await component.generateJWT({ kid: 'k1', alg: 'RS256', typ: 'JWT', clientId: 'c1', audience: 'aud', audience_integrity: 'aud2', purposeId: 'p1', key: 'k', userPayload: 'payload' });
    expect(component._error).toBe(true);
    expect(component._errorMsg).toBe('Formato della chiave non supportato');
  });

  it('should handle PEM key error gracefully', async () => {
    component.formGroup.get('keyFormat')?.setValue('PEM');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await component.generateJWT({ kid: 'k1', alg: 'RS256', typ: 'JWT', clientId: 'c1', audience: 'aud', audience_integrity: 'aud2', purposeId: 'p1', key: 'bad-key', userPayload: 'payload' });
    expect(result).toBeUndefined();
    consoleSpy.mockRestore();
  });

  it('should handle DER key with both PRIVATE KEY and RSA PRIVATE KEY failures', async () => {
    component.formGroup.get('keyFormat')?.setValue('DER');
    mockAuthDialogService.buildPEMString.mockImplementation(() => { throw new Error('bad key'); });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await component.generateJWT({ kid: 'k1', alg: 'RS256', typ: 'JWT', clientId: 'c1', audience: 'aud', audience_integrity: 'aud2', purposeId: 'p1', key: 'derdata', userPayload: 'payload' });
    expect(component._error).toBe(true);
    expect(component._errorMsg).toBe('Errore durante la lettura della chiave');
    consoleSpy.mockRestore();
  });

  // --- onGenerate ---

  it('should not proceed if form is invalid', async () => {
    await component.onGenerate({});
    expect(component._spin).toBe(false);
    expect(mockHttp.post).not.toHaveBeenCalled();
  });

  it('should call clearError before generating', async () => {
    component._error = true;
    const clearSpy = vi.spyOn(component, 'clearError');
    await component.onGenerate({});
    expect(clearSpy).toHaveBeenCalled();
  });

  it('should handle voucher success when form is valid and clientAssertion exists', async () => {
    vi.spyOn(component, 'generateJWT').mockResolvedValue('mock-assertion');
    Object.keys(component.formGroup.controls).forEach(key => {
      const ctrl = component.formGroup.get(key);
      ctrl?.clearValidators();
      ctrl?.updateValueAndValidity();
    });
    mockHttp.post.mockReturnValue(of({ access_token: 'new-token', expires_in: 7200 }));

    await component.onGenerate({ clientId: 'cid' });
    expect(component.formGroup.get('result')?.value).toBe('new-token');
    expect(component.formGroup.get('expiresIn')?.value).toBe(7200);
    expect(component._spin).toBe(false);
  });

  it('should handle voucher error when form is valid and clientAssertion exists', async () => {
    vi.spyOn(component, 'generateJWT').mockResolvedValue('mock-assertion');
    Object.keys(component.formGroup.controls).forEach(key => {
      const ctrl = component.formGroup.get(key);
      ctrl?.clearValidators();
      ctrl?.updateValueAndValidity();
    });
    mockHttp.post.mockReturnValue(throwError(() => ({ error: 'bad_grant', message: 'Invalid' })));

    await component.onGenerate({ clientId: 'cid' });
    expect(component._error).toBe(true);
    expect(component._errorMsg).toBe('Invalid');
    expect(component._errorObject).toBe('bad_grant');
    expect(component._spin).toBe(false);
  });

  it('should not call getVoucher when generateJWT returns null', async () => {
    vi.spyOn(component, 'generateJWT').mockResolvedValue(null);
    Object.keys(component.formGroup.controls).forEach(key => {
      const ctrl = component.formGroup.get(key);
      ctrl?.clearValidators();
      ctrl?.updateValueAndValidity();
    });

    await component.onGenerate({ clientId: 'cid' });
    expect(mockHttp.post).not.toHaveBeenCalled();
  });

  // --- getVoucher ---

  it('should create a POST request with form-urlencoded content type', async () => {
    component._tokenUrl = 'https://api.test/token';
    mockHttp.post.mockReturnValue(of({}));
    await component.getVoucher({ client_id: 'c1', grant_type: 'client_credentials' });
    expect(mockHttp.post).toHaveBeenCalled();
    const [url] = mockHttp.post.mock.calls[0];
    expect(url).toBe('https://api.test/token');
  });

  // --- _onKeyChange ---

  it('should set key value when file is read successfully', async () => {
    vi.spyOn(component, '_readKeyFile' as any).mockResolvedValue('PEM-KEY');
    await component._onKeyChange({ target: { files: [new Blob(['key'])] } });
    expect(component.formGroup.get('key')?.value).toBe('PEM-KEY');
  });

  it('should set error when _readKeyFile rejects', async () => {
    vi.spyOn(component, '_readKeyFile' as any).mockRejectedValue(new Error('File read failed'));
    await component._onKeyChange({ target: { files: [new Blob(['key'])] } });
    expect(component._error).toBe(true);
    expect(component._errorMsg).toBe('File read failed');
    expect(component.formGroup.get('key')?.value).toBeNull();
  });

  it('should set error with string when _readKeyFile rejects with string', async () => {
    vi.spyOn(component, '_readKeyFile' as any).mockRejectedValue('string error');
    await component._onKeyChange({ target: { files: [new Blob(['key'])] } });
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

  it('should return undefined and call clearError when file is null/falsy', () => {
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
