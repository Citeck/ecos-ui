jest.mock('@/components/common/form/SelectJournal', () => ({
  __esModule: true,
  default: () => null
}));

import AssocFormatter from '../AssocFormatter';

describe('AssocFormatter.getEditor', () => {
  it('passes the row ref to the assoc cell editor', () => {
    const editor = AssocFormatter.getEditor({}, 'emodel/release@rel-1', { id: 'emodel/task@task-1' }, { type: 'assoc' });

    expect(editor.props.recordRef).toBe('emodel/task@task-1');
  });

  it('does not blow up when there is no row', () => {
    const editor = AssocFormatter.getEditor({}, null, undefined, { type: 'assoc' });

    expect(editor.props.recordRef).toBeUndefined();
  });

  it('leaves the editor unchanged for an orgstruct column', () => {
    const editor = AssocFormatter.getEditor({}, null, { id: 'emodel/task@task-1' }, { type: 'authorityGroup' });

    expect(editor.props.recordRef).toBeUndefined();
  });
});
