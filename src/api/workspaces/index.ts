import { CommonApi } from '../common';

import { WorkspaceFullType, WorkspaceType } from './types';

import { PureQueryResponse } from '@/api/types';
// @ts-ignore
import Records from '@/components/Records';
import { SourcesId } from '@/constants';

export interface IWorkspaceApi {
  getMyWorkspaces: () => PureQueryResponse<WorkspaceFullType>;
  getPublicWorkspaces: () => PureQueryResponse<WorkspaceFullType>;
  getWorkspaces: () => PureQueryResponse<WorkspaceFullType>;
  getWorkspace: (recordRef: string) => PureQueryResponse<WorkspaceType>;
  isViewWorkspace: (wsId: string) => PureQueryResponse<boolean>;
  visitedAction: (wsId: string) => void;
  joinToWorkspace: (wsId: string) => void;
  searchMyWorkspaces: (text: string) => void;
  searchPublicWorkspaces: (text: string) => void;
}

const fullWorkspaceAttributes: Partial<Record<keyof WorkspaceFullType, string>> = {
  wsId: '?localId', // this is a shortened version of the ID, there is no 'emodel/' here
  wsName: '?disp!?localId',
  homePageLink: 'homePageLink?str',
  isCurrentUserManager: 'isCurrentUserManager?bool',
  hasWrite: 'permissions._has.Write?bool',
  wsDescription: 'description?str',
  wsImage: 'icon.url',
  isCurrentUserMember: 'isCurrentUserMember?bool'
};

export class WorkspaceApi extends CommonApi implements IWorkspaceApi {
  getWorkspaces = () => {
    // @ts-ignore
    return Records.query(
      {
        sourceId: SourcesId.WORKSPACE,
        language: 'user-workspaces'
      },
      {
        ...fullWorkspaceAttributes
      }
    );
  };

  getMyWorkspaces = () => {
    // @ts-ignore
    return Records.query(
      {
        sourceId: SourcesId.WORKSPACE,
        language: 'user-workspaces'
      },
      { ...fullWorkspaceAttributes }
    );
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
      { ...fullWorkspaceAttributes }
    );
  };

  getWorkspace = async (recordRef: string) => {
    // @ts-ignore
    return await Records.get(recordRef).load({
      wsId: '?localId',
      homePageLink: 'homePageLink?str',
      wsName: '?disp!?localId',
      description: 'description?json',
      icon: 'icon.url'
    });
  };

  visitedAction = (wsId: string) => {
    // @ts-ignore
    const record = Records.getRecordToEdit(`${SourcesId.WORKSPACE}-visited-action@`);

    if (wsId) {
      record.att('workspace', wsId);
    }

    return record.save();
  };

  isViewWorkspace = (wsId: string) => {
    // @ts-ignore
    return Records.get(`${SourcesId.WORKSPACE}@${wsId}`).load('isCurrentUserMember?bool!');
  };

  joinToWorkspace = (wsId: string) => {
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
      { ...fullWorkspaceAttributes }
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
      { ...fullWorkspaceAttributes }
    );
  };
}
