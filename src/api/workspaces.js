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

  getWorkspace = async recordRef => {
    return await Records.get(recordRef).load({
      url: 'homePageLink?str',
      description: 'description?json',
      icon: 'icon.url'
    });
  };

  visitedAction = wsId => {
    const record = Records.getRecordToEdit('emodel/workspace-visited-action@');

    if (wsId) {
      record.att('workspace', wsId);
    }

    return record.save();
  };

  isViewWorkspace = wsId => {
    return Records.get(`${SourcesId.WORKSPACE}@${wsId}`).load('isCurrentUserMember?bool!');
  };
}
