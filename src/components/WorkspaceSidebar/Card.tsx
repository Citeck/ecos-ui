import classNames from 'classnames';
import React, { Component, ReactNode, RefObject } from 'react';
import { connect } from 'react-redux';

import { getSidebarWorkspaces, getWorkspaces, joinToWorkspace } from '@/actions/workspaces';
import { WorkspaceType } from '@/api/workspaces/types';
import FormManager from '@/components/EcosForm/FormManager';
import WorkspacePreview from '@/components/WorkspacePreview';
import Confirm from '@/components/WorkspaceSidebar/Confirm';
import { t } from '@/helpers/util';
import { selectWorkspaceIsLoadingJoin } from '@/selectors/workspaces';
import { Dispatch, RootState } from '@/types/store';
import './styles.scss';

interface WorkspaceCardProps extends Omit<WorkspaceType, 'id' | 'wsId' | 'homePageLink'> {
  id?: string;
  wsId?: string;
  homePageLink?: string;
  isSmallView?: boolean;
  isCurrentUserMember?: boolean;
  hasWrite?: boolean;
  className?: string;
  openWorkspace?: (e: OpenWsEventType) => void;
  customImagePreview?: ReactNode;
  onMouseDown?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  getWorkspaces: () => void;
  getSidebarWorkspaces: () => void;
  onJoinCallback?: () => void;
  joinToWorkspace: (wsId: string, cb: () => void) => void;
  isLoadingJoin: boolean;
}

interface WorkspaceCardState {
  showBtnSettings: boolean;
  showMenuSettings: boolean;
  isViewConfirmJoin: boolean;
}

interface IAction {
  onClick: (e: OpenWsEventType) => void;
  label: string;
}

type OpenWsEventType = React.MouseEvent<HTMLDivElement | HTMLLIElement | HTMLButtonElement>;

const Labels = {
  GO_TO_WORKSPACE: 'workspaces.card.go-to-workspace',
  EDIT_WORKSPACE: 'workspaces.card.edit-workspace',
  JOIN_TO_WORKSPACE: 'workspaces.card.join-workspace'
};

const MAX_WIDTH_ACTION_MENU = 170;

class WorkspaceCard extends Component<WorkspaceCardProps, WorkspaceCardState> {
  private _menuSettingsRef: RefObject<HTMLUListElement | null> = React.createRef();
  private _btnSettingsRef: RefObject<HTMLDivElement | null> = React.createRef();
  private _cardContainerRef: RefObject<HTMLDivElement | null> = React.createRef();

  constructor(props: WorkspaceCardProps) {
    super(props);
    this.state = { showBtnSettings: false, showMenuSettings: false, isViewConfirmJoin: false };
  }

  static defaultProps = {
    isSmallView: false
  };

  get actions(): IAction[] {
    const { id, hasWrite, isCurrentUserMember, wsId, openWorkspace } = this.props;
    const actions: IAction[] = [];

    if (!id) {
      return actions;
    }

    if (!isCurrentUserMember && wsId) {
      actions.push({ onClick: this.toggleViewConfirm, label: t(Labels.JOIN_TO_WORKSPACE) });
    }

    if (openWorkspace && isCurrentUserMember) {
      actions.push({ onClick: openWorkspace, label: t(Labels.GO_TO_WORKSPACE) });
    }

    if (hasWrite) {
      actions.push({ onClick: this.onEditWorkspace, label: t(Labels.EDIT_WORKSPACE) });
    }

    return actions;
  }

  toggleViewConfirm = () => {
    this.setState({ isViewConfirmJoin: !this.state.isViewConfirmJoin });
    this.setState({ showMenuSettings: false, showBtnSettings: false });
  };

  onEditWorkspace = (event: OpenWsEventType) => {
    event.stopPropagation();
    FormManager.openFormModal({ record: this.props.id, saveOnSubmit: true, onSubmit: () => this.refetchWorkspaces() });
    this.toggleMenuSettings();
  };

  refetchWorkspaces = () => {
    this.props.getWorkspaces();
    this.props.getSidebarWorkspaces();
  };

  handleClickOutside = (event: MouseEvent) => {
    if (
      (!this._menuSettingsRef?.current || (this._menuSettingsRef && !this._menuSettingsRef.current.contains(event.target as Element))) &&
      (!this._btnSettingsRef?.current || (this._btnSettingsRef && !this._btnSettingsRef.current.contains(event.target as Element)))
    ) {
      this.setState({ showMenuSettings: false });
    }
  };

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  toggleMenuSettings = () => {
    const { showMenuSettings } = this.state;
    this.setState({ showMenuSettings: !showMenuSettings, showBtnSettings: !showMenuSettings });
  };

  renderBtnSettings = () => {
    const { showBtnSettings, showMenuSettings } = this.state;
    if ((!showBtnSettings && !showMenuSettings) || !this.props.id) {
      return null;
    }

    return (
      <div
        ref={this._btnSettingsRef}
        onClick={this.toggleMenuSettings}
        className="workspace-panel-list_item_btn citeck-workspace-sidebar__card-settings_btn"
      >
        <div className="citeck-workspace-sidebar__card-settings_circles">
          <circle />
          <circle />
          <circle />
        </div>
      </div>
    );
  };

  handleShowBtnSettings = (flag: boolean) => {
    this.setState({ showBtnSettings: flag });
  };

  renderMenuActions() {
    const { isSmallView } = this.props;
    const widthSidebarContainer = this._cardContainerRef.current?.parentElement?.clientWidth;
    const positionXBtnMenuSettings = this._btnSettingsRef.current?.getBoundingClientRect().x;

    const isLeftPositionMenu =
      widthSidebarContainer && positionXBtnMenuSettings && widthSidebarContainer - positionXBtnMenuSettings < MAX_WIDTH_ACTION_MENU;

    return (
      this.state.showMenuSettings && (
        <ul
          ref={this._menuSettingsRef}
          className={classNames('citeck-workspace-sidebar__card-settings-menu', {
            'citeck-workspace-sidebar__card-settings-menu--left': isLeftPositionMenu,
            'citeck-workspace-sidebar__card-settings-menu--left--small': isLeftPositionMenu && isSmallView
          })}
          style={{ maxWidth: MAX_WIDTH_ACTION_MENU }}
        >
          {this.actions.map((action, idx) => (
            <li key={idx} className="citeck-workspace-sidebar__card-settings-menu_item" onClick={action.onClick}>
              {action.label}
            </li>
          ))}
        </ul>
      )
    );
  }

  onConfirmJoin = (e: OpenWsEventType) => {
    const { wsId, joinToWorkspace, onJoinCallback, openWorkspace } = this.props;

    if (!wsId) {
      return;
    }

    joinToWorkspace(wsId, () => {
      this.setState({ isViewConfirmJoin: false });

      if (openWorkspace) {
        openWorkspace(e);
      }

      if (onJoinCallback) {
        onJoinCallback();
      }
    });
  };

  render() {
    const {
      wsImage,
      wsName,
      isSmallView,
      className,
      wsDescription,
      customImagePreview,
      isCurrentUserMember,
      isLoadingJoin,
      openWorkspace,
      onMouseDown
    } = this.props;
    const { isViewConfirmJoin, showMenuSettings, showBtnSettings } = this.state;

    return (
      <div
        ref={this._cardContainerRef}
        className="citeck-workspace-sidebar__preview-container"
        onMouseEnter={() => this.handleShowBtnSettings(true)}
        onMouseLeave={() => this.handleShowBtnSettings(false)}
      >
        {isViewConfirmJoin && (
          <Confirm isLoading={isLoadingJoin} onConfirm={this.onConfirmJoin} onHide={this.toggleViewConfirm} wsName={wsName} />
        )}
        {this.renderMenuActions()}
        {this.actions.length > 0 && this.renderBtnSettings()}
        <div
          className={classNames('citeck-workspace-sidebar__card', className, {
            small: isSmallView,
            focus: showMenuSettings || showBtnSettings
          })}
          onMouseDown={onMouseDown}
          onClick={e => isCurrentUserMember && openWorkspace && openWorkspace(e)}
        >
          <WorkspacePreview url={wsImage} name={wsName} customImagePreview={customImagePreview} />
          <div className="citeck-workspace-sidebar__card-info">
            <h3 className="citeck-workspace-sidebar__card-info_title" title={wsName}>
              {wsName}
            </h3>
            {wsDescription && (
              <p className="citeck-workspace-sidebar__card-info_description" title={wsDescription}>
                {wsDescription}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  isLoadingJoin: selectWorkspaceIsLoadingJoin(state)
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  getWorkspaces: () => dispatch(getWorkspaces()),
  getSidebarWorkspaces: () => dispatch(getSidebarWorkspaces()),
  joinToWorkspace: (wsId: string, callback: () => void) => dispatch(joinToWorkspace({ wsId, callback }))
});

export default connect(mapStateToProps, mapDispatchToProps)(WorkspaceCard);
