import AdminSectionService from '../AdminSectionService';
import { NEW_VERSION_PREFIX } from '../../helpers/export/urls';

const groupSectionList = [
  {
    label: 'Управление системой',
    sections: [{ label: 'Инструменты разработчика', type: 'DEV_TOOLS', config: {} }]
  },
  {
    label: 'Управление процессами',
    sections: [{ label: 'Модели бизнес-процессов', type: 'BPM', config: {} }]
  },
  {
    label: 'Модель',
    sections: [{ label: 'Типы данных', type: 'JOURNAL', config: { journalId: 'ecos-types' } }]
  }
];

console.warn = jest.fn();

describe('AdminSection Service', () => {
  const BPM = { label: 'Модели бизнес-процессов', type: 'BPM', config: {} };

  describe('Method getSelectedSectionIndex', () => {
    it('found active in section', () => {
      const returnValue = AdminSectionService.getSelectedSectionIndex(groupSectionList[1].sections, BPM);
      expect(returnValue).toEqual(0);
    });

    it('no active in section', () => {
      const returnValue = AdminSectionService.getSelectedSectionIndex(groupSectionList[1].sections, undefined);
      expect(returnValue).toEqual(-1);
    });

    it('no section', () => {
      const returnValue = AdminSectionService.getSelectedSectionIndex(null, BPM);
      expect(returnValue).toEqual(-1);
    });
  });

  describe('Method getActiveSectionInGroups', () => {
    beforeEach(() => {
      delete window.location;
    });

    it('was found', () => {
      window.location = { href: `${NEW_VERSION_PREFIX}/bpmn-designer` };
      const returnValue = AdminSectionService.getActiveSectionInGroups(groupSectionList);
      expect(returnValue).toEqual(BPM);
    });

    it('unknown', () => {
      window.location = { href: `${NEW_VERSION_PREFIX}/test` };
      const returnValue = AdminSectionService.getActiveSectionInGroups(groupSectionList);
      expect(returnValue).toBeUndefined();
    });

    it('no groups', () => {
      window.location = { href: `${NEW_VERSION_PREFIX}/test` };
      const returnValue = AdminSectionService.getActiveSectionInGroups(null);
      expect(returnValue).toBeUndefined();
    });
  });
});
