import classNames from 'classnames';
import React, { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';

import FormManager from '../EcosForm/FormManager';
import Records from '../Records';
import { Loader } from '../common';
import { Btn } from '../common/btns';
import WorkspaceSwitcher from '../common/icons/WorkspacesSwitcher';

import { fetchCreateCaseWidgetData } from '@/actions/header';
import { getMenuConfig } from '@/actions/menu';
import { fetchSlideMenuItems } from '@/actions/slideMenu';
import { getWorkspaces, visitedAction } from '@/actions/workspaces';
import { WorkspaceCard } from '@/components/WorkspaceSidebar/Card';
import CreateIcon from '@/components/common/icons/Create';
import { getBaseUrlWorkspace, getWorkspaceId } from '@/helpers/urls';
import { t } from '@/helpers/util';
import { selectWorkspaces, selectWorkspaceIsLoading, selectWorkspaceIsError } from '@/selectors/workspaces';
import PageService from '@/services/PageService';
import WorkspaceService from '@/services/WorkspaceService';
import PageTabList from '@/services/pageTabs/PageTabList';
import './style.scss';

export const documentId = 'workspace-menu-switcher';
export const element = document.getElementById(documentId);

const Workspaces = ({ isLoading, isError, workspaces, getWorkspaces, visitedAction }) => {
  const [active, setActive] = useState(false);
  const wrapperRef = useRef(null);

  const toggleMenu = event => {
    if (!wrapperRef || !wrapperRef.current || (wrapperRef.current && !wrapperRef.current.contains(event.target))) {
      setActive(prev => !prev);
    }
  };

  const closeMenu = () => {
    setActive(false);
  };

  const handleClickOutside = event => {
    if (wrapperRef.current && !wrapperRef.current.contains(event.target) && !event.target.closest(`#${documentId}`)) {
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

  const openLink = (id, homePageLink, openNewBrowserTab = false) => {
    PageTabList.setLastActiveTabWs();

    visitedAction(id);

    const needUpdateTabsWorkspace = id !== getWorkspaceId();
    const params = {
      openNewTab: true,
      reopen: true,
      closeActiveTab: false,
      needUpdateTabs: needUpdateTabsWorkspace
    };

    const url = getBaseUrlWorkspace(id, homePageLink);

    if (!openNewBrowserTab) {
      PageService.changeUrlLink(url, params);
    } else {
      PageService.changeUrlLink(url, { openNewBrowserTab });
    }
  };

  const handleClick = (event, wsId, homePageLink) => {
    event.stopPropagation();
    setActive(false);

    if (wsId !== getWorkspaceId()) {
      openLink(wsId, homePageLink);
    }
  };

  const onEditWorkspace = (event, id) => {
    event.stopPropagation();
    FormManager.openFormModal({ record: id, saveOnSubmit: true, onSubmit: () => getWorkspaces() });
  };

  return (
    <span id={documentId} className={classNames('ecos-header-workspaces', { active })} onClick={e => toggleMenu(e)}>
      {isLoading ? <Loader type="points" height={20} width={24} /> : <WorkspaceSwitcher />}

      {active && (
        <div ref={wrapperRef} className="workspace-panel">
          {isError ? (
            <h1>error</h1>
          ) : (
            <div className="workspace-panel__wrapper">
              {workspaces.map(({ id, wsId, wsName, wsImage, homePageLink, hasWrite, description }, index) => (
                <WorkspaceCard
                  onEditWorkspace={onEditWorkspace}
                  id={id}
                  onClick={e => handleClick(e, wsId, homePageLink)}
                  key={index}
                  wsDescription={description || ''}
                  wsImage={wsImage}
                  wsName={wsName}
                  hasWrite={hasWrite}
                  isSmallView
                />
              ))}
            </div>
          )}
          <div className="workspace-panel__create-button">
            <Btn
              onClick={async () => {
                setActive(false);

                const variant = await Records.get('emodel/type@workspace').load('createVariants?json');

                FormManager.createRecordByVariant(variant, {
                  onHideModal: () => getWorkspaces(),
                  onSubmit: async record => {
                    const { id: wsId, homePageLink } = await Records.get(record).load({
                      id: 'id',
                      homePageLink: 'homePageLink?str'
                    });
                    openLink(wsId, homePageLink);
                  },
                  initiator: {
                    type: 'form-component',
                    name: 'CreateVariants'
                  }
                });
              }}
            >
              <CreateIcon width={13} height={13} />
              <span>{t('workspaces.create-button')}</span>
            </Btn>
          </div>
        </div>
      )}
    </span>
  );
};

const mapStateToProps = (store, props) => ({
  workspaces: selectWorkspaces(store, props),
  isLoading: selectWorkspaceIsLoading(store, props),
  isError: selectWorkspaceIsError(store, props)
});

const mapDispatchToProps = dispatch => ({
  fetchCreateCaseWidgetData: () => dispatch(fetchCreateCaseWidgetData()),
  fetchSlideMenuItems: () => dispatch(fetchSlideMenuItems()),
  getMenuConfig: () => dispatch(getMenuConfig()),
  visitedAction: id => dispatch(visitedAction(id)),
  getWorkspaces: () => dispatch(getWorkspaces())
});

export default connect(mapStateToProps, mapDispatchToProps)(Workspaces);
