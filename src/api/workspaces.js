import Records from '../components/Records';
import { CommonApi } from './common';
import { SourcesId } from '../constants';

export class WorkspaceApi extends CommonApi {
  getWorkspaces = () => {
    return Records.query(
      {
        sourceId: SourcesId.WORKSPACE,
        language: 'user-workspaces'
      },
      {
        wsId: '?localId',
        wsName: '?disp!?localId',
        homePageLink: 'homePageLink?str',
        isCurrentUserManager: 'isCurrentUserManager?bool',
        hasWrite: 'permissions._has.Write?bool',
        wsImage: 'icon.url'
      }
    );
  };

  visitedAction = wsId => {
    const record = Records.getRecordToEdit('emodel/workspace-visited-action@');

    if (wsId) {
      record.att('workspace', wsId);
    }

    return record.save();
  };
}
