import WidgetService from '../../../../services/WidgetService';
import Records from '../../Records';
import actionsRegistry from '../actionsRegistry';
import { SetTaskAssignee } from '../actionStore';

jest.mock('../recordActionsApi');

jest.spyOn(global, 'fetch').mockImplementation(() => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ id: '', attributes: {} })
  });
});

describe('action Set Task Assignee', () => {
  actionsRegistry.register(new SetTaskAssignee());
  const actionSetTaskAssignee = actionsRegistry.getHandler(SetTaskAssignee.ACTION_ID);
  const record = Records.get('workspace://SpacesStore/a0652fbe-8b72-4a1c-9ca7-3d72c72a7f9e');
  const TEST_USER = 'workspace://SpacesStore/test-user';

  const assignToSmbInConfig = [
    {
      title: 'Assign To Me',
      input: { assignTo: 'me' },
      output: { action: 'claim', owner: '$CURRENT' }
    },
    {
      title: 'Assign To Someone (with assignee)',
      input: { assignTo: 'someone', assignee: TEST_USER },
      output: { action: 'claim', owner: TEST_USER }
    },
    {
      title: 'Assign To Group',
      input: { assignTo: 'group' },
      output: { action: 'release', owner: '' }
    },
    {
      title: 'Assign To Me (without assignTo)',
      input: { actionOfAssignment: 'claim', assignee: '$CURRENT' },
      output: { action: 'claim', owner: '$CURRENT' }
    },
    {
      title: 'Assign To Smb (without assignTo)',
      input: { actionOfAssignment: 'claim', assignee: TEST_USER },
      output: { action: 'claim', owner: TEST_USER }
    },
    {
      title: 'Assign To Group (without assignTo)',
      input: { actionOfAssignment: 'release' },
      output: { action: 'release', owner: '' }
    },
    {
      title: 'Assign To Group (without assignTo)',
      input: { actionOfAssignment: 'release' },
      output: { action: 'release', owner: '' }
    }
  ];

  assignToSmbInConfig.forEach(async item => {
    it(item.title, async () => {
      const result = await actionSetTaskAssignee.execForRecord(record, item.input);
      expect(result).toEqual(item.output);
    });
  });

  const assignToSmbInSelect = [
    {
      title: 'Assign To Someone (without assignee)',
      assignee: TEST_USER,
      input: { assignTo: 'someone' },
      output: { action: 'claim', owner: 'workspace://SpacesStore/test-user' }
    },
    {
      title: 'Assign To Someone (cancel)',
      assignee: false,
      input: { assignTo: 'someone' },
      output: { cancel: true }
    }
  ];

  const openSelectOrgstructModal = WidgetService.openSelectOrgstructModal;

  assignToSmbInSelect.forEach(async item => {
    it(item.title, async () => {
      WidgetService.openSelectOrgstructModal = ({ onSelect }) => onSelect(item.assignee);
      const result = await actionSetTaskAssignee.execForRecord(record, item.input);
      expect(result).toEqual(item.output);
    });
  });

  WidgetService.openSelectOrgstructModal = openSelectOrgstructModal;
});
