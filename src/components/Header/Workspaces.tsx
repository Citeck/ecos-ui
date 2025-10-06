import classNames from 'classnames';
import isBoolean from 'lodash/isBoolean';
import React, { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';

import FormManager from '../EcosForm/FormManager';
import Records from '../Records';
import { Loader } from '../common';
import { Btn } from '../common/btns';
import Cube from '../common/icons/Cube';
import WorkspaceSwitcher from '../common/icons/WorkspacesSwitcher';

import { getSidebarWorkspaces, getWorkspaces, visitedAction } from '@/actions/workspaces';
import { WorkspaceType } from '@/api/workspaces/types';
import WorkspaceCard from '@/components/WorkspaceSidebar/Card';
import WorkspaceSidebar from '@/components/WorkspaceSidebar/WorkspaceSidebar';
import CreateIcon from '@/components/common/icons/Create';
import { MAX_WORKSPACE_PREVIEW_ITEMS, SourcesId } from '@/constants';
import { getWorkspaceId, openLinkWorkspace } from '@/helpers/urls';
import { t } from '@/helpers/util';
import { selectWorkspaces, selectWorkspaceIsLoading, selectWorkspaceIsError } from '@/selectors/workspaces';
import WorkspaceService from '@/services/WorkspaceService';
import PageTabList from '@/services/pageTabs/PageTabList';
import { RootState, Dispatch } from '@/types/store';
import './style.scss';

export const documentId = 'workspace-menu-switcher';
export const element = document.getElementById(documentId);

interface WorkspacesProps {
  isLoading: boolean;
  isError: boolean;
  workspaces: WorkspaceType[];
  getWorkspaces: () => void;
  visitedAction: (id: WorkspaceType['id']) => void;
  getSidebarWorkspaces: () => void;
}

type OpenWsEventType = React.MouseEvent<HTMLDivElement | HTMLLIElement | HTMLButtonElement>;

const Labels = {
  CREATE_BUTTON: 'workspaces.create-button',
  SEE_MORE: 'workspaces.see-more'
};

const Workspaces = ({ isLoading, isError, workspaces, getWorkspaces, visitedAction, getSidebarWorkspaces }: WorkspacesProps) => {
  const [isActivePreview, setIsActivePreview] = useState(false);
  const [isOpenSidebarWorkspace, setIsOpenSidebarWorkspace] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const toggleMenu = (event: React.MouseEvent<HTMLSpanElement>) => {
    if (!wrapperRef || !wrapperRef.current || (wrapperRef.current && !wrapperRef.current.contains(event.target as Element))) {
      setIsActivePreview(prev => !prev);
    }
  };

  const closeMenu = () => {
    setIsActivePreview(false);
  };

  const toggleOpenSideBarWorkspace = (flag?: boolean) => {
    setIsOpenSidebarWorkspace(isBoolean(flag) ? flag : !isOpenSidebarWorkspace);
  };

  const openSideBarWorkspaces = () => {
    closeMenu();
    toggleOpenSideBarWorkspace();
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node) && !(event.target as Element).closest(`#${documentId}`)) {
      closeMenu();
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);

    WorkspaceService.emitter.on(WorkspaceService.Events.UPDATE_LIST, () => getWorkspaces());

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);

      WorkspaceService.emitter.off(WorkspaceService.Events.UPDATE_LIST, () => getWorkspaces());
    };
  }, []);

  const openLink = (id: WorkspaceType['id'], homePageLink: WorkspaceType['homePageLink'], openNewBrowserTab?: boolean) => {
    PageTabList.setLastActiveTabWs();
    visitedAction(id);
    openLinkWorkspace(id, homePageLink, openNewBrowserTab);
  };

  const handleClick = (event: OpenWsEventType, wsId: WorkspaceType['id'], homePageLink: WorkspaceType['homePageLink']) => {
    event.stopPropagation();
    setIsActivePreview(false);

    if (wsId !== getWorkspaceId()) {
      openLink(wsId, homePageLink);
    }
  };

  const ImageOtherWs = (
    <div className="workspace-preview_more">
      <Cube />
    </div>
  );

  // Opening in a new tab using the central button on mouse
  const onMouseDown = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    wsId: WorkspaceType['id'],
    homePageLink: WorkspaceType['homePageLink']
  ) => {
    if (event.button === 1) {
      event.preventDefault();
      openLink(wsId, homePageLink, true);
    }
  };

  return (
    <>
      <WorkspaceSidebar openLink={openLink} isOpen={isOpenSidebarWorkspace} toggleIsOpen={toggleOpenSideBarWorkspace} />
      <span
        id={documentId}
        className={classNames('ecos-header-workspaces', {
          active: isActivePreview,
          isActivePreview: !isOpenSidebarWorkspace && isActivePreview
        })}
        onClick={e => toggleMenu(e)}
      >
        {isLoading ? <Loader type="points" height={20} width={24} /> : <WorkspaceSwitcher />}

        {isActivePreview && (
          <div ref={wrapperRef} className="workspace-panel">
            {isError ? (
              <h1>error</h1>
            ) : (
              <div className="workspace-panel__wrapper">
                {workspaces.map(
                  ({ homePageLink, id: wsId, ...rest }, index) =>
                    index <= MAX_WORKSPACE_PREVIEW_ITEMS - 1 && (
                      <WorkspaceCard
                        {...rest}
                        id={wsId}
                        key={index}
                        onMouseDown={e => onMouseDown(e, wsId, homePageLink)}
                        openWorkspace={(e, id, homeLink) => handleClick(e, id || wsId, homeLink || homePageLink)}
                        homePageLink={homePageLink}
                        isSmallView
                      />
                    )
                )}
                <WorkspaceCard
                  id=""
                  hasWrite={false}
                  visibility="PRIVATE"
                  isSmallView
                  isCurrentUserMember
                  hasDelete={false}
                  isCurrentUserManager={false}
                  isCurrentUserDirectMember={false}
                  isCurrentUserLastManager={false}
                  image={null}
                  homePageLink={null}
                  description={null}
                  name={t(Labels.SEE_MORE)}
                  customImagePreview={ImageOtherWs}
                  openWorkspace={openSideBarWorkspaces}
                />
              </div>
            )}
            <div className="workspace-panel__create-button">
              <Btn
                onClick={async () => {
                  setIsActivePreview(false);

                  const variant = await Records.get(`${SourcesId.TYPE}@workspace`).load('createVariants?json');

                  FormManager.createRecordByVariant(variant, {
                    onHideModal: () => getWorkspaces(),
                    onSubmit: async (record: any) => {
                      const { id: wsId, homePageLink } = await Records.get(record).load({
                        id: 'id',
                        homePageLink: 'homePageLink?str'
                      });
                      openLink(wsId, homePageLink);
                      getSidebarWorkspaces();
                    },
                    initiator: {
                      type: 'form-component',
                      name: 'CreateVariants'
                    }
                  });
                }}
              >
                <CreateIcon width={13} height={13} />
                <span>{t(Labels.CREATE_BUTTON)}</span>
              </Btn>
            </div>
          </div>
        )}
      </span>
    </>
  );
};

const mapStateToProps = (store: RootState): Pick<WorkspacesProps, 'workspaces' | 'isLoading' | 'isError'> => ({
  workspaces: selectWorkspaces(store),
  isLoading: selectWorkspaceIsLoading(store),
  isError: selectWorkspaceIsError(store)
});

const mapDispatchToProps = (dispatch: Dispatch): Pick<WorkspacesProps, 'visitedAction' | 'getWorkspaces' | 'getSidebarWorkspaces'> => ({
  getSidebarWorkspaces: () => dispatch(getSidebarWorkspaces()),
  visitedAction: id => dispatch(visitedAction(id)),
  getWorkspaces: () => dispatch(getWorkspaces())
});

export default connect(mapStateToProps, mapDispatchToProps)(Workspaces);
