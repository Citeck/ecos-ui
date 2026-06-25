import ConfigService, { CREATE_MENU_TYPE, CAMEL_VISUAL_EDITING_ENABLED } from '../ConfigService';

describe('Config Service Test', () => {
  it('Get Value Test', async () => {
    expect(await ConfigService.getValue(CREATE_MENU_TYPE)).toEqual('cascad');
    ConfigService.setValue(CREATE_MENU_TYPE, 'new-value');
    expect(await ConfigService.getValue(CREATE_MENU_TYPE)).toEqual('new-value');
    expect(await ConfigService.getValue('unknown-default')).toEqual('');
    expect(await ConfigService.getValue('unknown-str', { type: 'TEXT' })).toEqual('');
    expect(await ConfigService.getValue('unknown-num', { type: 'NUMBER' })).toEqual(0);
  });

  describe('CAMEL_VISUAL_EDITING_ENABLED flag', () => {
    it('returns false (default) when server value is empty/absent', async () => {
      // in test env _loadConfigsFunc resolves every requested key to null → default applies
      expect(await ConfigService.getValue(CAMEL_VISUAL_EDITING_ENABLED)).toEqual(false);
    });

    it('requests the value with a ?bool attribute (BOOLEAN type)', async () => {
      let requestedAttribute;
      const prevLoad = ConfigService._loadConfigsFunc;
      // drop any cached value so getValue is forced to call the loader
      ConfigService._values[CAMEL_VISUAL_EDITING_ENABLED] = {};
      ConfigService.setLoadConfigFunction(async configsMap => {
        requestedAttribute = configsMap[CAMEL_VISUAL_EDITING_ENABLED];
        return { result: null };
      });
      await ConfigService.getValue(CAMEL_VISUAL_EDITING_ENABLED);
      ConfigService.setLoadConfigFunction(prevLoad);
      expect(requestedAttribute).toEqual('value?bool');
    });
  });
});
