import reducer from '../adminSection';
import { initAdminSection, setActiveSection, setGroupSectionList } from '../../actions/adminSection';

const initialState = reducer(undefined, initAdminSection());
const sectionBPM = { label: 'Модели бизнес-процессов', type: 'BPM', config: {} };
const groupSection = [sectionBPM, sectionBPM];

describe('adminSection reducer tests', () => {
  it(`should handle "initAdminSection"`, () => {
    const newState = reducer(undefined, initAdminSection());
    expect(newState.groupSectionList).toEqual([]);
    expect(newState.activeSection).toEqual({});
  });

  it(`should handle "setActiveSection"`, () => {
    const newState = reducer(initialState, setActiveSection(sectionBPM));
    expect(newState.groupSectionList).toEqual(initialState.groupSectionList);
    expect(newState.activeSection).toEqual(sectionBPM);
  });

  it(`should handle "setGroupSectionList"`, () => {
    const newState = reducer(initialState, setGroupSectionList(groupSection));
    expect(newState.groupSectionList).toEqual(groupSection);
    expect(newState.activeSection).toEqual(initialState.activeSection);
  });
});
