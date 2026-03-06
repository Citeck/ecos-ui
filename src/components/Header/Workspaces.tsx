import classNames from 'classnames';
import isBoolean from 'lodash/isBoolean';
import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';

import { Loader } from '../common';
import WorkspaceSwitcher from '../common/icons/WorkspacesSwitcher';

import { getSidebarWorkspaces, getWorkspaces, visitedAction } from '@/actions/workspaces';
import { WorkspaceType } from '@/api/workspaces/types';
import WorkspaceSidebar from '@/components/WorkspaceSidebar/WorkspaceSidebar';
import { openCreateWorkspaceForm } from '@/helpers/workspaces';
import { getWorkspaceId, openLinkWorkspace } from '@/helpers/urls';
import { selectWorkspaceIsLoading } from '@/selectors/workspaces';
import WorkspaceService from '@/services/WorkspaceService';
import PageTabList from '@/services/pageTabs/PageTabList';
import { RootState, Dispatch } from '@/types/store';
import './style.scss';

export const documentId = 'workspace-menu-switcher';
export const element = document.getElementById(documentId);

interface WorkspacesProps {
  isLoading: boolean;
  getWorkspaces: () => void;
  visitedAction: (id: WorkspaceType['id']) => void;
  getSidebarWorkspaces: () => void;
}

const Workspaces = ({ isLoading, getWorkspaces, visitedAction, getSidebarWorkspaces }: WorkspacesProps) => {
  const [isOpenSidebarWorkspace, setIsOpenSidebarWorkspace] = useState(false);

  const toggleOpenSideBarWorkspace = (flag?: boolean) => {
    setIsOpenSidebarWorkspace(isBoolean(flag) ? flag : !isOpenSidebarWorkspace);
  };

  useEffect(() => {
    WorkspaceService.emitter.on(WorkspaceService.Events.UPDATE_LIST, () => getWorkspaces());

    return () => {
      WorkspaceService.emitter.off(WorkspaceService.Events.UPDATE_LIST, () => getWorkspaces());
    };
  }, []);

  const openLink = (id: WorkspaceType['id'], homePageLink: WorkspaceType['homePageLink'], openNewBrowserTab?: boolean) => {
    PageTabList.setLastActiveTabWs();
    visitedAction(id);
    openLinkWorkspace(id, homePageLink, openNewBrowserTab);
  };

  const handleCreateWorkspace = async () => {
    await openCreateWorkspaceForm({ getWorkspaces, getSidebarWorkspaces, openLink });
  };

  return (
    <>
      <WorkspaceSidebar
        openLink={openLink}
        isOpen={isOpenSidebarWorkspace}
        toggleIsOpen={toggleOpenSideBarWorkspace}
        onCreateWorkspace={handleCreateWorkspace}
      />
      <span
        id={documentId}
        className={classNames('ecos-header-workspaces', {
          active: isOpenSidebarWorkspace
        })}
        onClick={() => toggleOpenSideBarWorkspace()}
      >
        {isLoading ? <Loader type="points" color="white" height={20} width={24} /> : <WorkspaceSwitcher />}
      </span>
    </>
  );
};

const mapStateToProps = (store: RootState): Pick<WorkspacesProps, 'isLoading'> => ({
  isLoading: selectWorkspaceIsLoading(store)
});

const mapDispatchToProps = (dispatch: Dispatch): Pick<WorkspacesProps, 'visitedAction' | 'getWorkspaces' | 'getSidebarWorkspaces'> => ({
  getSidebarWorkspaces: () => dispatch(getSidebarWorkspaces()),
  visitedAction: id => dispatch(visitedAction(id)),
  getWorkspaces: () => dispatch(getWorkspaces())
});

export default connect(mapStateToProps, mapDispatchToProps)(Workspaces);
