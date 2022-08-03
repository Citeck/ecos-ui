import authorityService from '../AuthorityService';
jest.mock('../authorityApi');

describe('Authority Service Test', () => {
  describe.each([
    ['admin', 'emodel/person@admin'],
    ['GROUP_group', 'emodel/authority-group@group'],
    ['workspace://SpacesStore/123', 'emodel/person@123'],
    ['alfresco/@workspace://SpacesStore/123', 'emodel/person@123'],
    ['alfresco/@workspace://SpacesStore/GROUP_abc', 'emodel/authority-group@abc'],
    ['people@admin', 'emodel/person@admin'],
    ['alfresco/people@admin', 'emodel/person@admin'],
    [['admin', 'GROUP_test-group', 'people@admin'], ['emodel/person@admin', 'emodel/authority-group@test-group', 'emodel/person@admin']]
  ])('getAuthorityRefTest', (srcRef, expectedRef) => {
    it(srcRef + ' > ' + expectedRef, async () => {
      const resRef = await authorityService.getAuthorityRef(srcRef);
      expect(resRef).toEqual(expectedRef);
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
