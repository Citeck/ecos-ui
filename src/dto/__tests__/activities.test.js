import { ActivityTypes, PLANNED_ACTIVITY_TYPE } from '@citeck/constants/activity';
import Records from '@citeck/records-core';

import { ActivitiesApi } from '../../api/activities';
import { getCommentForWeb } from '../activities';

jest.mock('@citeck/records-core', () => ({
  __esModule: true,
  default: { get: jest.fn(), getRecordToEdit: jest.fn() }
}));
jest.mock('@/helpers/comments', () => ({ AllowedTagTypes: [], TagColorByType: {}, typeInternal: 'INTERNAL' }));
jest.mock('../../helpers/export/util', () => ({ t: value => value }));
jest.mock('../../helpers/util', () => ({ getBool: Boolean, getColorByString: () => '' }));
jest.mock('../../services/UserService', () => ({ __esModule: true, default: { getAvatarUrl: () => '' } }));
jest.mock('../../helpers/urls', () => ({ getWorkspaceId: () => 'crm-workspace' }));

const typeFromRecord = id => ({ id, displayName: 'Activity', parentType: PLANNED_ACTIVITY_TYPE });

describe('activity record data used by the editor', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([ActivityTypes.CALL, ActivityTypes.EMAIL, ActivityTypes.MEETING])(
    'sends edited topic and date for an existing %s loaded from Records',
    async typeId => {
      const source = {
        id: 'emodel/activity@existing',
        type: typeFromRecord(typeId),
        topic: 'Old topic',
        activityDate: '2030-01-01T10:00:00.000Z',
        text: '<p>Details</p>'
      };
      const pending = {};
      const saved = { ...source };
      Records.getRecordToEdit.mockReturnValue({
        att: (name, value) => {
          pending[name] = value;
        },
        save: jest.fn().mockImplementation(async () => {
          Object.assign(saved, pending);
        })
      });
      Records.get.mockReturnValue({ load: jest.fn().mockImplementation(async () => saved) });
      const selectedType = getCommentForWeb(source).type;
      const api = new ActivitiesApi();
      await api.update({
        id: source.id,
        record: 'emodel/deal@parent',
        selectedType,
        text: source.text,
        topic: 'Changed topic',
        activityDate: '2030-02-02T12:30:00.000Z',
        activityDuration: { id: 'PT30M' },
        responsible: 'emodel/person@manager',
        participants: []
      });
      expect(pending).toMatchObject({
        topic: 'Changed topic',
        activityDate: '2030-02-02T12:30:00.000Z',
        activityDuration: 'PT30M',
        responsible: 'emodel/person@manager',
        participants: []
      });
      const reloaded = getCommentForWeb(await api.getActivityById(source.id));
      expect(reloaded.topic).toBe('Changed topic');
      expect(reloaded.activityDate).toBe('2030-02-02T12:30:00.000Z');
      expect(reloaded.type.type).toBe(PLANNED_ACTIVITY_TYPE);
      expect(source.type).toEqual(typeFromRecord(typeId));
    }
  );

  it('preserves parentType for rendering and an explicitly supplied editor type', () => {
    const type = { ...typeFromRecord(ActivityTypes.CALL), type: 'custom-editor-type' };
    expect(getCommentForWeb({ type }).type).toEqual(type);
  });

  it('keeps comment and assignment type identifiers and does not invent missing types', () => {
    for (const id of [ActivityTypes.COMMENT, ActivityTypes.ASSIGNMENT]) {
      const type = { id, parentType: 'immediate-activity' };
      expect(getCommentForWeb({ type }).type).toMatchObject({ id, parentType: 'immediate-activity', type: 'immediate-activity' });
    }
    expect(getCommentForWeb({ text: 'No type' }).type).toBeUndefined();
    expect(getCommentForWeb({})).toEqual({});
  });
});
