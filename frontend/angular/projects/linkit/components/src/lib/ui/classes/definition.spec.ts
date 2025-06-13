import { ExtendedFabClass, FieldClass, FieldLinksClass, FieldType, FragmentClass, SubLinkClass } from "./definitions";

describe('Classes', () => {
  it('should create a FragmentClass instance', () => {
    const instance = new FragmentClass({ label: 'test', fragment: '#test' });
    expect(instance.label).toBe('test');
    expect(instance.fragment).toBe('#test');
  });

  it('should create an ExtendedFabClass instance', () => {
    const instance = new ExtendedFabClass({ label: 'test', icon: 'icon' });
    expect(instance.label).toBe('test');
    expect(instance.icon).toBe('icon');
  });

  it('should create a FieldClass instance', () => {
    const instance = new FieldClass({ type: FieldType.Text, label: 'test', value: 'value', link: 'link', data: 'data', icon: 'icon', download: true, json: {} });
    expect(instance.type).toBe(FieldType.Text);
    expect(instance.label).toBe('test');
    expect(instance.value).toBe('value');
    expect(instance.link).toBe('link');
    expect(instance.data).toBe('data');
    expect(instance.icon).toBe('icon');
    expect(instance.download).toBe(true);
    expect(instance.json).toEqual({});
  });

  it('should create a FieldLinksClass instance', () => {
    const instance = new FieldLinksClass({ label: 'test', sublinks: [{ value: 'value', link: 'link', data: 'data', icon: 'icon' }] });
    expect(instance.label).toBe('test');
    expect(instance.sublinks.length).toBe(1);
    expect(instance.sublinks[0] instanceof SubLinkClass).toBe(true);
  });

  it('should create a SubLinkClass instance', () => {
    const instance = new SubLinkClass({ value: 'value', link: 'link', data: 'data', icon: 'icon' });
    expect(instance.value).toBe('value');
    expect(instance.link).toBe('link');
    expect(instance.data).toBe('data');
    expect(instance.icon).toBe('icon');
  });
});