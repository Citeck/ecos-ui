import React, { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';

import WorkspaceSwitcher from '../common/icons/WorkspacesSwitcher';
import WorkspacePreview from '../WorkspacePreview';
import { getWorkspaces, visitedAction } from '../../actions/workspaces';
import { selectWorkspaces, selectWorkspaceIsLoading, selectWorkspaceIsError } from '../../selectors/workspaces';
import { Loader } from '../common';
import { Btn } from '../common/btns';
import FormManager from '../EcosForm/FormManager';
import { t } from '../../helpers/util';
import Records from '../Records';
import PageService from '../../services/PageService';
import { URL as Urls } from '../../constants';
import { fetchSlideMenuItems } from '../../actions/slideMenu';
import { getMenuConfig } from '../../actions/menu';
import { fetchCreateCaseWidgetData } from '../../actions/header';
import { getWorkspaceId } from '../../helpers/urls';
import EditIcon from '../common/icons/Edit';
import PageTabList from '../../services/pageTabs/PageTabList';
import './style.scss';

export const documentId = 'workspace-menu-switcher';
export const element = document.getElementById(documentId);

const Workspaces = ({
  isLoading,
  isError,
  workspaces,
  getWorkspaces,
  fetchSlideMenuItems,
  getMenuConfig,
  visitedAction,
  fetchCreateCaseWidgetData
}) => {
  const [active, setActive] = useState(false);
  const wrapperRef = useRef(null);

  const toggleMenu = () => {
    setActive(prev => !prev);
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const openLink = (id, homePageLink, openNewBrowserTab = false) => {
    PageTabList.setLastActiveTabWs();
    const lastActiveTabWs = PageTabList.getLastActiveTabWs(id);

    visitedAction(id);

    const needUpdateTabsWorkspace = id !== getWorkspaceId();
    const params = {
      openNewTab: true,
      reopen: true,
      closeActiveTab: false,
      needUpdateTabs: needUpdateTabsWorkspace
    };

    const url = new URL(get(lastActiveTabWs, 'link') || homePageLink || Urls.DASHBOARD, window.location.origin);
    url.searchParams.set('ws', id);

    if (!openNewBrowserTab) {
      PageService.changeUrlLink(url.toString(), params);
    } else {
      PageService.changeUrlLink(url.toString(), { openNewBrowserTab });
    }
  };

  const handleMouseDown = (event, id, link) => {
    event.preventDefault();

    if (event.button === 1) {
      openLink(id, link, true);
    }
  };

  const handleClickLi = (event, wsId, homePageLink) => {
    event.stopPropagation();
    setActive(false);

    if (wsId !== getWorkspaceId()) {
      openLink(wsId, homePageLink);
    }
  };

  const onEditWorkspace = (event, { id }) => {
    event.stopPropagation();
    FormManager.openFormModal({ record: id, saveOnSubmit: true, onSubmit: () => getWorkspaces() });
  };

  return (
    <span id={documentId} className={classNames('ecos-header-workspaces', { active })} onClick={toggleMenu}>
      {isLoading ? <Loader type="points" height={20} width={24} /> : <WorkspaceSwitcher />}

      {active && (
        <div ref={wrapperRef} className="workspace-panel">
          {isError ? (
            <h1>error</h1>
          ) : (
            <ul className="workspace-panel-list">
              {workspaces.map(({ id, wsId, wsName, wsImage, homePageLink, hasWrite, isCurrentUserManager }, index) => (
                <li
                  className="workspace-panel-list_item"
                  key={index}
                  onClick={e => handleClickLi(e, wsId, homePageLink)}
                  onMouseDown={e => handleMouseDown(e, wsId, homePageLink)}
                >
                  <WorkspacePreview url={wsImage} name={wsName} />
                  <p className="workspace-panel-list_item-info" title={wsName}>
                    {wsName}
                  </p>
                  {hasWrite && (
                    <div className="workspace-panel-list_item_btn" onClick={e => onEditWorkspace(e, { id })}>
                      <EditIcon />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          <hr />
          <div className="workspace-panel-create-button">
            <Btn
              onClick={async () => {
                setActive(false);

                const variant = await Records.get('emodel/type@workspace').load('createVariants?json');

                FormManager.createRecordByVariant(variant, {
                  onAfterHideModal: () => getWorkspaces(),
                  initiator: {
                    type: 'form-component',
                    name: 'CreateVariants'
                  }
                });
              }}
            >
              + {t('workspaces.create-button')}
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

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Workspaces);
