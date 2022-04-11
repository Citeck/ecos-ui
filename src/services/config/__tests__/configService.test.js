import ConfigService, { CREATE_MENU_TYPE } from '../ConfigService';

describe('Config Service Test', () => {
  it('Get Value Test', async () => {
    expect(await ConfigService.getValue(CREATE_MENU_TYPE)).toEqual('cascad');
    ConfigService.setValue(CREATE_MENU_TYPE, 'new-value');
    expect(await ConfigService.getValue(CREATE_MENU_TYPE)).toEqual('new-value');
    expect(await ConfigService.getValue('unknown-default')).toEqual('');
    expect(await ConfigService.getValue('unknown-str', { type: 'TEXT' })).toEqual('');
    expect(await ConfigService.getValue('unknown-num', { type: 'NUMBER' })).toEqual(0);
  });
});
