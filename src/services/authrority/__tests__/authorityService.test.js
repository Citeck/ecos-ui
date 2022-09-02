import authorityService from '../AuthorityService';
jest.mock('../authorityApi');

describe('Authority Service Test', () => {
  describe.each([{}, '', true, false, undefined, 123, null, Math])('Test with invalid args', authority => {
    it('authority: <' + authority + '> with type: ' + typeof authority, async () => {
      const resRef = await authorityService.getAuthorityRef(authority);
      expect(resRef).toEqual('');
      const resName = await authorityService.getAuthorityName(authority);
      expect(resName).toEqual('');
    });
  });

  describe.each([
    [[], [], []],
    ['admin', 'emodel/person@admin', 'admin'],
    ['GROUP_group', 'emodel/authority-group@group', 'GROUP_group'],
    ['workspace://SpacesStore/123', 'emodel/person@123', '123'],
    ['alfresco/@workspace://SpacesStore/123', 'emodel/person@123', '123'],
    ['alfresco/@workspace://SpacesStore/GROUP_abc', 'emodel/authority-group@abc', 'GROUP_abc'],
    ['people@admin', 'emodel/person@admin', 'admin'],
    ['alfresco/people@admin', 'emodel/person@admin', 'admin'],
    [
      ['admin', 'GROUP_test-group', 'people@admin'],
      ['emodel/person@admin', 'emodel/authority-group@test-group', 'emodel/person@admin'],
      ['admin', 'GROUP_test-group', 'admin']
    ]
  ])('getAuthorityRefTest', (srcAuth, expectedRef, expectedAuthName) => {
    it(srcAuth + ' > ' + expectedRef + ' > ' + expectedAuthName, async () => {
      const resRef = await authorityService.getAuthorityRef(srcAuth);
      expect(resRef).toEqual(expectedRef);
      const resAuthName = await authorityService.getAuthorityName(srcAuth);
      expect(resAuthName).toEqual(expectedAuthName);
    });
  });

  describe.each([['admin', false], ['emodel/authority-group@test-group', true], ['GROUP_group', true], [null, false], ['', false]])(
    'isAuthorityGroupTest',
    (authority, expectedRes) => {
      it(authority + ' > ' + expectedRes, () => {
        const result = authorityService.isAuthorityGroup(authority);
        expect(result).toEqual(expectedRes);
      });
    }
  );
});
