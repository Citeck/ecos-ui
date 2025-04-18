import { CommonApi } from '../common';

import { WorkspaceType } from './types';

import { PureQueryResponse } from '@/api/types';
// @ts-ignore
import Records from '@/components/Records';
import { SourcesId } from '@/constants';

export interface IWorkspaceApi {
  getMyWorkspaces: () => PureQueryResponse<WorkspaceType>;
  getPublicWorkspaces: () => PureQueryResponse<WorkspaceType>;
  getWorkspaces: () => PureQueryResponse<WorkspaceType>;
  getWorkspace: (recordRef: string) => PureQueryResponse<WorkspaceType>;
  isViewWorkspace: (wsId: WorkspaceType['id']) => PureQueryResponse<boolean>;
  visitedAction: (wsId: WorkspaceType['id']) => void;
  joinToWorkspace: (wsId: WorkspaceType['id']) => void;
  searchMyWorkspaces: (text: string) => void;
  searchPublicWorkspaces: (text: string) => void;
  removeWorkspace: (wsId: string) => void;
}

const workspaceAttributes: Partial<Record<keyof WorkspaceType, string>> = {
  id: '?localId', // this is a shortened version of the ID, there is no 'emodel/' here
  homePageLink: 'homePageLink?str',
  name: '?disp!?localId',
  description: 'description?str',
  image: 'icon.url',
  isCurrentUserMember: 'isCurrentUserMember?bool',
  isCurrentUserManager: 'isCurrentUserManager?bool',
  visibility: 'visibility.value',
  hasWrite: 'permissions._has.Write?bool'
};

export class WorkspaceApi extends CommonApi implements IWorkspaceApi {
  getWorkspaces = () => {
    // @ts-ignore
    return Records.query(
      {
        sourceId: SourcesId.WORKSPACE,
        language: 'user-workspaces'
      },
      workspaceAttributes
    );
  };

  getMyWorkspaces = () => {
    // @ts-ignore
    return Records.query(
      {
        sourceId: SourcesId.WORKSPACE,
        language: 'user-workspaces'
      },
      workspaceAttributes
    );
  };

  removeWorkspace = (wsId: string) => {
    // @ts-ignore
    return Records.remove([`${SourcesId.WORKSPACE}@${wsId}`]);
  };

  getPublicWorkspaces = () => {
    // @ts-ignore
    return Records.query(
      {
        sourceId: SourcesId.WORKSPACE,
        language: 'predicate',
        query: {
          t: 'and',
          v: [
            {
              t: 'eq',
              a: 'visibility',
              v: 'PUBLIC'
            },
            {
              t: 'eq',
              a: 'isCurrentUserMember',
              v: false
            }
          ]
        }
      },
      workspaceAttributes
    );
  };

  getWorkspace = async (recordRef: string) => {
    // @ts-ignore
    return await Records.get(recordRef).load(workspaceAttributes);
  };

  visitedAction = (wsId: WorkspaceType['id']) => {
    // @ts-ignore
    const record = Records.getRecordToEdit(`${SourcesId.WORKSPACE}-visited-action@`);

    if (wsId) {
      record.att('workspace', wsId);
    }

    return record.save();
  };

  isViewWorkspace = (wsId: WorkspaceType['id']) => {
    // @ts-ignore
    return Records.get(`${SourcesId.WORKSPACE}@${wsId}`).load('isCurrentUserMember?bool!');
  };

  joinToWorkspace = (wsId: WorkspaceType['id']) => {
    // @ts-ignore
    const record = Records.get(`${SourcesId.WORKSPACE}@${wsId}`);
    record.att('action', 'JOIN');
    return record.save();
  };

  searchPublicWorkspaces = (text: string) => {
    // @ts-ignore
    return Records.query(
      {
        sourceId: SourcesId.WORKSPACE,
        language: 'predicate',
        query: {
          t: 'and',
          v: [
            {
              t: 'eq',
              a: 'visibility',
              v: 'PUBLIC'
            },
            {
              t: 'eq',
              a: 'isCurrentUserMember',
              v: false
            },
            {
              t: 'or',
              v: [
                {
                  t: 'contains',
                  a: 'name',
                  v: text
                },
                {
                  t: 'contains',
                  a: 'description',
                  v: text
                }
              ]
            }
          ]
        }
      },
      workspaceAttributes
    );
  };

  searchMyWorkspaces = (text: string) => {
    // @ts-ignore
    return Records.query(
      {
        sourceId: SourcesId.WORKSPACE,
        language: 'predicate',
        query: {
          t: 'and',
          v: [
            {
              t: 'eq',
              a: 'isCurrentUserMember',
              v: true
            },
            {
              t: 'or',
              v: [
                {
                  t: 'contains',
                  a: 'name',
                  v: text
                },
                {
                  t: 'contains',
                  a: 'description',
                  v: text
                }
              ]
            }
          ]
        }
      },
      workspaceAttributes
    );
  };
}
