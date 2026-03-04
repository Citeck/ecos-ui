import classNames from 'classnames';
import get from 'lodash/get';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { getSidebarWorkspaces, onSearchWorkspaces } from '@/actions/workspaces';
import { WorkspaceType } from '@/api/workspaces/types';
import WorkspaceCard from '@/components/WorkspaceSidebar/Card';
import SearchWorkspaceSidebar from '@/components/WorkspaceSidebar/Search';
import { Tabs } from '@/components/common';
import Close from '@/components/common/icons/Close';
import CreateIcon from '@/components/common/icons/Create';
import NoDataWorkspaces from '@/components/common/icons/NoDataWorkspaces';
import { getWorkspaceId } from '@/helpers/urls';
import { t } from '@/helpers/util';
import {
  selectMyWorkspaces,
  selectPublicWorkspaces,
  selectSearchText,
  selectWorkspaceIsLoading,
  selectWorkspaceIsAllowToCreateWorkspace
} from '@/selectors/workspaces';
import WorkspaceService from '@/services/WorkspaceService';
import { Dispatch, RootState } from '@/types/store';
import './styles.scss';

type TabId = 'my-workspaces' | 'public-workspaces';

const WORKSPACE_SWITCHER_ID = 'workspace-menu-switcher';

interface WorkspaceSidebarProps {
  isOpen: boolean;
  isLoading: boolean;
  isMobile: boolean;
  searchText: string;
  isAllowToCreateWorkspace: boolean;
  toggleIsOpen: (flag?: boolean) => void;
  getSidebarWorkspaces: () => void;
  onSearch: (text: string, withoutLoading?: boolean) => void;
  openLink: (id: WorkspaceType['id'], homePageLink: WorkspaceType['homePageLink'], openNewBrowserTab?: boolean) => void;
  onCreateWorkspace: () => void;
  myWorkspaces: WorkspaceType[];
  publicWorkspaces: WorkspaceType[];
}

interface WorkspaceSidebarState {
  visible: boolean;
  shouldAnimateOpen: boolean;
  activeTab: TabId;
}

const PANEL_CLASSNAME = 'citeck-workspace-sidebar__container-panel';

const TabsId: {
  [key: string]: TabId;
} = {
  MY_WORKSPACE: 'my-workspaces',
  PUBLIC_WORKSPACE: 'public-workspaces'
};

const Labels = {
  MY_WORKSPACE: 'workspaces.card.my-workspaces',
  PUBLIC_WORKSPACE: 'workspaces.card.public-workspaces',
  NO_DATA_HEAD: 'workspaces.sidebar.no-data-workspace.head',
  CREATE_WORKSPACE: 'workspaces.create-button'
};

class WorkspaceSidebar extends Component<WorkspaceSidebarProps, WorkspaceSidebarState> {
  private _containerSidebarRef: React.RefObject<HTMLDivElement | null> = React.createRef();
  timeoutId?: NodeJS.Timeout;

  constructor(props: WorkspaceSidebarProps) {
    super(props);
    this.state = {
      visible: props.isOpen,
      shouldAnimateOpen: props.isOpen,
      activeTab: TabsId.MY_WORKSPACE
    };

    props.getSidebarWorkspaces();
  }

  get tabs() {
    const { activeTab } = this.state;
    return [
      {
        id: TabsId.MY_WORKSPACE,
        label: t(Labels.MY_WORKSPACE)
      },
      {
        id: TabsId.PUBLIC_WORKSPACE,
        label: t(Labels.PUBLIC_WORKSPACE)
      }
    ].map(tab => ({
      ...tab,
      isActive: tab.id === activeTab,
      onClick: () => this.setActiveTab(tab.id)
    }));
  }

  setActiveTab = (activeTab: TabId) => {
    this.setState({ activeTab });
  };

  handleClickOutside = (event: MouseEvent) => {
    const sidebarContainer = this._containerSidebarRef.current;
    const clickedElement = event.target as HTMLElement;

    if (!sidebarContainer) return;

    if (clickedElement.closest(`#${WORKSPACE_SWITCHER_ID}`)) return;

    const clickedInsideSidebar = sidebarContainer.contains(clickedElement);
    const clickedInPanel = clickedElement.closest(`.${PANEL_CLASSNAME}`);

    if (!clickedInsideSidebar || !clickedInPanel) {
      this.toggleOpen(false);
    }
  };

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
    WorkspaceService.emitter.on(WorkspaceService.Events.UPDATE_LIST, () => this.props.getSidebarWorkspaces());
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
    clearTimeout(this.timeoutId);
    WorkspaceService.emitter.removeListener(WorkspaceService.Events.UPDATE_LIST, () => this.props.getSidebarWorkspaces());
  }

  componentDidUpdate(prevProps: WorkspaceSidebarProps) {
    if (prevProps.isOpen !== this.props.isOpen) {
      if (this.props.isOpen) {
        clearTimeout(this.timeoutId);

        this.setState({ visible: true, shouldAnimateOpen: false, activeTab: TabsId.MY_WORKSPACE }, () => {
          requestAnimationFrame(() => {
            this.setState({ shouldAnimateOpen: true });
          });
        });
      } else {
        this.setState({ shouldAnimateOpen: false });

        this.timeoutId = setTimeout(() => {
          this.setState({ visible: false });
        }, 500);
      }
    }
  }

  openWorkspace = (
    event: React.MouseEvent<HTMLDivElement | HTMLLIElement | HTMLButtonElement>,
    wsId: WorkspaceType['id'],
    homePageLink: WorkspaceType['homePageLink']
  ) => {
    event.stopPropagation();
    this.toggleOpen();

    if (wsId !== getWorkspaceId()) {
      this.props.openLink(wsId, homePageLink);
    }
  };

  // Opening in a new tab using the central button on mouse
  onMouseDown = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    wsId: WorkspaceType['id'],
    homePageLink: WorkspaceType['homePageLink']
  ) => {
    if (event.button === 1) {
      event.preventDefault();
      this.props.openLink(wsId, homePageLink, true);
    }
  };

  NoDataWorkspaces = (
    <div className="citeck-workspace-sidebar__content-wrapper">
      <div className="citeck-workspace-sidebar__no-data">
        <NoDataWorkspaces />
        <div className="citeck-workspace-sidebar__no-data-info">
          <h3 className="citeck-workspace-sidebar__no-data-info_head">{t(Labels.NO_DATA_HEAD)}</h3>
        </div>
      </div>
    </div>
  );

  renderCreateWorkspaceCard() {
    const { isAllowToCreateWorkspace, onCreateWorkspace } = this.props;

    if (!isAllowToCreateWorkspace) {
      return null;
    }

    return (
      <div className="citeck-workspace-sidebar__create-card" onClick={onCreateWorkspace}>
        <div className="citeck-workspace-sidebar__create-card-inner">
          <div className="citeck-workspace-sidebar__create-card-icon">
            <CreateIcon width={20} height={20} />
          </div>
          <div className="citeck-workspace-sidebar__card-info">
            <h3 className="citeck-workspace-sidebar__card-info_title">{t(Labels.CREATE_WORKSPACE)}</h3>
          </div>
        </div>
      </div>
    );
  }

  renderSkeletonCards(count = 6) {
    return (
      <div className="citeck-workspace-sidebar__content-wrapper">
        <div className="citeck-workspace-sidebar__content-wrapper_wrap">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="citeck-workspace-sidebar__skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  renderMyWorkspaces() {
    const { myWorkspaces, isLoading } = this.props;

    if (isLoading) {
      return this.renderSkeletonCards();
    }

    if (!myWorkspaces.length) {
      return this.NoDataWorkspaces;
    }

    return (
      <div className="citeck-workspace-sidebar__content-wrapper">
        <div className="citeck-workspace-sidebar__content-wrapper_wrap">
          {myWorkspaces.map((workspace, idx) => (
            <WorkspaceCard
              {...workspace}
              isSmallView
              key={idx}
              onMouseDown={e => this.onMouseDown(e, workspace.id, workspace.homePageLink)}
              openWorkspace={e => this.openWorkspace(e, workspace.id, workspace.homePageLink)}
              hasAnimationOnHover
            />
          ))}
          {this.renderCreateWorkspaceCard()}
        </div>
      </div>
    );
  }

  renderPublicWorkspaces() {
    const { publicWorkspaces, isLoading } = this.props;

    if (isLoading) {
      return this.renderSkeletonCards();
    }

    if (!publicWorkspaces.length) {
      return this.NoDataWorkspaces;
    }

    return (
      <div className="citeck-workspace-sidebar__content-wrapper">
        <div className="citeck-workspace-sidebar__content-wrapper_wrap">
          {publicWorkspaces.map((workspace, idx) => (
            <WorkspaceCard
              {...workspace}
              key={idx}
              onMouseDown={e => this.onMouseDown(e, workspace.id, workspace.homePageLink)}
              openWorkspace={(e, id, homeLink) => this.openWorkspace(e, id || workspace.id, homeLink || workspace.homePageLink)}
              onJoinCallback={this.toggleOpen}
              hasAnimationOnHover
            />
          ))}
          {this.renderCreateWorkspaceCard()}
        </div>
      </div>
    );
  }

  toggleOpen = (flag?: boolean) => {
    const { toggleIsOpen, onSearch, searchText } = this.props;
    toggleIsOpen(flag);

    if (!flag && !!searchText) {
      onSearch('');
    }
  };

  render() {
    const { onSearch, isMobile, isAllowToCreateWorkspace, onCreateWorkspace } = this.props;
    const { visible, shouldAnimateOpen, activeTab } = this.state;

    if (!visible) {
      return null;
    }

    return (
      <div className="citeck-workspace-sidebar">
        <div className="citeck-workspace-sidebar__container" ref={this._containerSidebarRef}>
          <div className={classNames('citeck-workspace-sidebar__container-panel-wrapper', { mobile: isMobile })}>
            <div
              className={classNames(PANEL_CLASSNAME, {
                open: shouldAnimateOpen,
                mobile: isMobile
              })}
            >
              <div className="citeck-workspace-sidebar__search-row">
                <SearchWorkspaceSidebar onSearch={onSearch} />
                {isAllowToCreateWorkspace && (
                  <button className="citeck-workspace-sidebar__create-btn" onClick={onCreateWorkspace} title={t(Labels.CREATE_WORKSPACE)}>
                    <CreateIcon width={14} height={14} />
                  </button>
                )}
              </div>
              <Tabs items={this.tabs} narrow />
              {activeTab === TabsId.MY_WORKSPACE && this.renderMyWorkspaces()}
              {activeTab === TabsId.PUBLIC_WORKSPACE && this.renderPublicWorkspaces()}
              <button className="citeck-workspace-sidebar_btn--close" onClick={() => this.toggleOpen(false)}>
                <Close />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (
  state: RootState
): Pick<
  WorkspaceSidebarProps,
  'isLoading' | 'myWorkspaces' | 'searchText' | 'publicWorkspaces' | 'isMobile' | 'isAllowToCreateWorkspace'
> => ({
  searchText: selectSearchText(state),
  isLoading: selectWorkspaceIsLoading(state),
  myWorkspaces: selectMyWorkspaces(state),
  publicWorkspaces: selectPublicWorkspaces(state),
  isMobile: get(state, 'view.isMobile'),
  isAllowToCreateWorkspace: selectWorkspaceIsAllowToCreateWorkspace(state)
});

const mapDispatchToProps = (dispatch: Dispatch): Pick<WorkspaceSidebarProps, 'getSidebarWorkspaces' | 'onSearch'> => ({
  getSidebarWorkspaces: () => dispatch(getSidebarWorkspaces()),
  onSearch: (text, withoutLoading) => dispatch(onSearchWorkspaces({ text, withoutLoading }))
});

export default connect(mapStateToProps, mapDispatchToProps)(WorkspaceSidebar);
