import AuthorityService from '../AuthorityService';
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
      let resRef = await AuthorityService.getAuthorityRef(srcRef);
      expect(resRef).toEqual(expectedRef);
    });
  });
});
