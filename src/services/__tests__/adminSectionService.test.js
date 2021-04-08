import { NEW_VERSION_PREFIX } from '../../helpers/export/urls';
import AdminSectionService from '../AdminSectionService';

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
      window.location = { href: `${NEW_VERSION_PREFIX}/admin` };
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

  describe.each([
    ['default type - BPM', `${NEW_VERSION_PREFIX}/admin`, 'BPM'],
    ['type - BPM', `${NEW_VERSION_PREFIX}/admin?type=BPM`, 'BPM'],
    ['type - JOURNAL', `${NEW_VERSION_PREFIX}/admin?type=JOURNAL`, 'JOURNAL'],
    ['type - DEV_TOOLS', `${NEW_VERSION_PREFIX}/dev-tools`, 'DEV_TOOLS'],
    ['type - unknown', `${NEW_VERSION_PREFIX}/another-page`, undefined]
  ])('Method getActiveSectionType > %s', (title, href, output) => {
    beforeEach(() => {
      delete window.location;
    });

    it(title, () => {
      window.location = { href };
      const returnValue = AdminSectionService.getActiveSectionType(groupSectionList);
      expect(returnValue).toEqual(output);
    });
  });

  describe.each([
    ['BPM > JOURNAL', 'BPM', 'JOURNAL', { updateUrl: true, pushHistory: true, openNewTab: false }],
    ['JOURNAL > BPM', 'JOURNAL', 'BPM', { updateUrl: true, pushHistory: true, openNewTab: false }],
    ['JOURNAL > DEV_TOOLS', 'JOURNAL', 'DEV_TOOLS', { updateUrl: false, pushHistory: true, openNewTab: true }],
    ['DEV_TOOLS > JOURNAL', 'DEV_TOOLS', 'JOURNAL', { updateUrl: false, pushHistory: true, openNewTab: true }]
  ])('Method getTabOptions > %s', (title, a, b, output) => {
    it(title, () => {
      const returnValue = AdminSectionService.getTabOptions(a, b);
      expect(returnValue).toEqual(output);
    });
  });

  describe.each([
    ['page models', { type: 'BPM' }, '/v2/admin?type=BPM'],
    ['page some journal', { type: 'JOURNAL', config: { journalId: 'journalId' } }, '/v2/admin?journalId=journalId&type=JOURNAL'],
    ['page dev tools', { type: 'DEV_TOOLS' }, '/v2/dev-tools']
  ])('Method getURLSection > %s', (title, type, output) => {
    it(title, () => {
      const returnValue = AdminSectionService.getURLSection(type);
      expect(returnValue).toEqual(output);
    });
  });
});
