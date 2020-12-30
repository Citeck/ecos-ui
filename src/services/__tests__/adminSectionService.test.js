import AdminSectionService from '../AdminSectionService';
import { groupSectionList } from '../__mocks__/adminSection.mock';

describe('AdminSection Service', () => {
  const BPM = { label: 'Модели бизнес-процессов', type: 'BPM', config: {} };

  describe('Method getSelectedSectionIndex', () => {
    it('found active in section', () => {
      const returnValue = AdminSectionService.getSelectedSectionIndex(groupSectionList[1].sections, BPM);
      expect(returnValue).toEqual(0);
    });
  });

  describe('Method getActiveSectionInGroups', () => {
    it('was found', () => {
      const returnValue = AdminSectionService.getActiveSectionInGroups(groupSectionList, i => i.type === BPM.type);
      expect(returnValue).toEqual(BPM);
    });

    it('unknown', () => {
      const returnValue = AdminSectionService.getActiveSectionInGroups(groupSectionList, i => i.type === null);
      expect(returnValue).toBeUndefined();
    });
  });
});
