import { describe, it, expect } from 'vitest';
import { Erogazioni } from './erogazioni';

describe('Erogazioni', () => {
  it('should create with defaults', () => {
    const e = new Erogazioni();
    expect(e.url).toBeNull();
    expect(e.indirizzi_ip).toBeNull();
    expect(e.certificato_server).toBeNull();
  });

  it('should assign data from constructor', () => {
    const e = new Erogazioni({
      url: 'https://api.example.com',
      indirizzi_ip: '192.168.1.1',
      certificato_server: { cn: 'CN=server' },
    });
    expect(e.url).toBe('https://api.example.com');
    expect(e.indirizzi_ip).toBe('192.168.1.1');
    expect(e.certificato_server).toEqual({ cn: 'CN=server' });
  });

  it('should ignore unknown keys', () => {
    const e = new Erogazioni({ unknown: 'val' });
    expect((e as any).unknown).toBeUndefined();
  });
});
