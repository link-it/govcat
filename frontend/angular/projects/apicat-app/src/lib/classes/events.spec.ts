import { describe, it, expect } from 'vitest';
import { EventType } from './events';

describe('EventType', () => {

  it('should define MODAL_EVENT', () => {
    expect(EventType.MODAL_EVENT).toBe('MODAL:EVENT');
  });

  it('should define BACK_EVENT', () => {
    expect(EventType.BACK_EVENT).toBe('BACK:EVENT');
  });

  it('should define UPDATE_LAYOUT', () => {
    expect(EventType.UPDATE_LAYOUT).toBe('UPDATE:LAYOUT');
  });

  it('should define CHANGE_VIEW', () => {
    expect(EventType.CHANGE_VIEW).toBe('CHANGE:VIEW');
  });

  it('should define NAVBAR_ACTION', () => {
    expect(EventType.NAVBAR_ACTION).toBe('NAVBAR:ACTION');
  });

  it('should define NAVBAR_OPEN and NAVBAR_CLOSE', () => {
    expect(EventType.NAVBAR_OPEN).toBe('NAVBAR:OPEN');
    expect(EventType.NAVBAR_CLOSE).toBe('NAVBAR:CLOSE');
  });

  it('should define SESSION_UPDATE', () => {
    expect(EventType.SESSION_UPDATE).toBe('SESSION:UPDATE');
  });

  it('should define USER_UPDATE', () => {
    expect(EventType.USER_UPDATE).toBe('USER:UPDATE');
  });

  it('should define PROFILE_UPDATE', () => {
    expect(EventType.PROFILE_UPDATE).toBe('PROFILE:UPDATE');
  });

  it('should define LAYOUT_FULLWIDTH', () => {
    expect(EventType.LAYOUT_FULLWIDTH).toBe('LAYOUT:FULLWIDTH');
  });

  it('should define REFRESH_DATA', () => {
    expect(EventType.REFRESH_DATA).toBe('REFRESH:DATA');
  });

  it('should define BREADCRUMBS_RESET', () => {
    expect(EventType.BREADCRUMBS_RESET).toBe('BREADCRUMBS:RESET');
  });

  it('should define WIZARD_CHECK_UPDATE', () => {
    expect(EventType.WIZARD_CHECK_UPDATE).toBe('WIZARD:CHECKUPDATE');
  });

  it('should define REPORT_ACTION', () => {
    expect(EventType.REPORT_ACTION).toBe('REPORT:ACTION');
  });

  it('should have exactly 15 members', () => {
    const members = Object.keys(EventType).filter(k => isNaN(Number(k)));
    expect(members.length).toBe(15);
  });

  it('should have unique values', () => {
    const values = Object.values(EventType);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });
});
