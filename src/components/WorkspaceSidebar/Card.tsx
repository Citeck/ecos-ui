import classNames from 'classnames';
import isString from 'lodash/isString';
import React, { Component, ReactNode, RefObject } from 'react';
import { connect } from 'react-redux';

import { getSidebarWorkspaces, getWorkspaces, joinToWorkspace, leaveOfWorkspace, removeWorkspace } from '@/actions/workspaces';
import { WorkspaceType } from '@/api/workspaces/types';
import FormManager from '@/components/EcosForm/FormManager';
import Records from '@/components/Records';
import WorkspacePreview from '@/components/WorkspacePreview';
import Confirm from '@/components/WorkspaceSidebar/Confirm';
import Actions from '@/components/common/icons/HorizontalActions';
import { SourcesId } from '@/constants';
import { t } from '@/helpers/util';
import { selectWorkspaceIsLoadingAction } from '@/selectors/workspaces';
import { NotificationManager } from '@/services/notifications';
import { Dispatch, RootState } from '@/types/store';
import './styles.scss';

interface WorkspaceCardProps extends WorkspaceType {
  isSmallView?: boolean;
  hasAnimationOnHover?: boolean;
  className?: string;
  openWorkspace?: (e: OpenWsEventType, wsId?: string, homePageLink?: string) => void;
  customImagePreview?: ReactNode;
  onMouseDown?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  onJoinCallback?: () => void;
  actions?: IAction[];

  joinToWorkspace: (cb?: () => void) => void;
  removeWorkspace: (cb?: () => void) => void;
  leaveOfWorkspace: () => void;
  isLoadingAction: boolean;
  getWorkspaces: () => void;
  getSidebarWorkspaces: () => void;
}

interface WorkspaceCardState {
  showBtnSettings: boolean;
  showMenuSettings: boolean;
  isViewConfirm: boolean;
  isRemovingWorkspace: boolean;
}

interface IAction {
  onClick: (e: OpenWsEventType) => void;
  label: string;
}

type OpenWsEventType = React.MouseEvent<HTMLDivElement | HTMLLIElement | HTMLButtonElement>;

const Labels = {
  GO_TO_WORKSPACE: 'workspaces.card.go-to-workspace',
  EDIT_WORKSPACE: 'workspaces.card.edit-workspace',
  REMOVE_WORKSPACE: 'workspaces.card.remove-workspace',
  LEAVE_WORKSPACE: 'workspaces.card.leave-workspace',
  LEAVE_WORKSPACE_ERROR_TITLE: 'workspaces.card.leave-workspace.error.title',
  LEAVE_WORKSPACE_ERROR_DESCRIPTION: 'workspaces.card.leave-workspace.error.description',
  JOIN_TO_WORKSPACE: 'workspaces.card.join-workspace',
  CONFIRM_JOIN_TO_WORKSPACE_BTN_LABEL: 'workspaces.card.join-workspace',
  CONFIRM_JOIN_TO_WORKSPACE_TITLE: 'workspaces.join-confirm.join.workspace',
  CONFIRM_JOIN_TO_WORKSPACE_DESCRIPTION: 'workspaces.join-confirm.join.description',
  CONFIRM_REMOVE_WORKSPACE_TITLE: 'workspaces.join-confirm.remove.workspace',
  CONFIRM_REMOVE_WORKSPACE_DESCRIPTION: 'workspaces.join-confirm.remove.description'
};

const MAX_WIDTH_ACTION_MENU = 170;

class WorkspaceCard extends Component<WorkspaceCardProps, WorkspaceCardState> {
  private _menuSettingsRef: RefObject<HTMLUListElement | null> = React.createRef();
  private _btnSettingsRef: RefObject<HTMLDivElement | null> = React.createRef();
  private _cardContainerRef: RefObject<HTMLDivElement | null> = React.createRef();

  constructor(props: WorkspaceCardProps) {
    super(props);
    this.state = { showBtnSettings: false, showMenuSettings: false, isViewConfirm: false, isRemovingWorkspace: false };
  }

  static defaultProps = {
    isSmallView: false
  };

  get actions(): IAction[] {
    const {
      id: wsId,
      hasWrite,
      isCurrentUserMember,
      isCurrentUserManager,
      isCurrentUserDirectMember,
      hasDelete,
      openWorkspace,
      actions: pActions
    } = this.props;
    const actions: IAction[] = [];

    if (!wsId) {
      return actions;
    }

    if (!isCurrentUserMember) {
      actions.push({ onClick: this.toggleViewConfirm, label: t(Labels.JOIN_TO_WORKSPACE) });
    }

    if (openWorkspace && isCurrentUserMember) {
      actions.push({ onClick: openWorkspace, label: t(Labels.GO_TO_WORKSPACE) });
    }

    if (hasWrite) {
      actions.push({ onClick: this.onEditWorkspace, label: t(Labels.EDIT_WORKSPACE) });
    }

    if (isCurrentUserDirectMember) {
      actions.push({ onClick: this.onLeaveWorkspace, label: t(Labels.LEAVE_WORKSPACE) });
    }

    if (isCurrentUserManager && hasDelete) {
      actions.push({ onClick: this.onRemoveWorkspace, label: t(Labels.REMOVE_WORKSPACE) });
    }

    if (pActions) {
      pActions.forEach(action => actions.push(action));
    }

    return actions;
  }

  toggleViewConfirm = () => {
    this.setState({ isViewConfirm: !this.state.isViewConfirm, isRemovingWorkspace: false });
    this.setState({ showMenuSettings: false, showBtnSettings: false });
  };

  onEditWorkspace = (event: OpenWsEventType) => {
    const { openWorkspace } = this.props;

    event.stopPropagation();
    FormManager.openFormModal({
      record: `${SourcesId.WORKSPACE}@${this.props.id}`,
      saveOnSubmit: true,
      onSubmit: async (record: any) => {
        if (openWorkspace) {
          const { id: wsId, homePageLink } = await Records.get(record).load({
            id: 'id',
            homePageLink: 'homePageLink?str'
          });

          openWorkspace(event, wsId, homePageLink);
        }

        this.refetchWorkspaces();
      }
    });
    this.toggleMenuSettings();
  };

  onRemoveWorkspace = () => {
    this.toggleViewConfirm();
    this.setState({ isRemovingWorkspace: true });
  };

  onLeaveWorkspace = () => {
    const { isCurrentUserLastManager, leaveOfWorkspace } = this.props;
    this.setState({ showMenuSettings: false, showBtnSettings: false });

    if (isCurrentUserLastManager) {
      NotificationManager.error(t(Labels.LEAVE_WORKSPACE_ERROR_DESCRIPTION), t(Labels.LEAVE_WORKSPACE_ERROR_TITLE), 0);
      return;
    }

    leaveOfWorkspace();
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
        <Actions height={10} />
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
    const { joinToWorkspace, onJoinCallback, openWorkspace } = this.props;

    joinToWorkspace(() => {
      this.toggleViewConfirm();

      if (openWorkspace) {
        openWorkspace(e);
      }

      if (onJoinCallback) {
        onJoinCallback();
      }
    });
  };

  onConfirmRemove = () => {
    this.props.removeWorkspace(() => this.toggleViewConfirm());
  };

  renderConfirm = () => {
    const { isLoadingAction, name } = this.props;
    const { isViewConfirm, isRemovingWorkspace } = this.state;

    if (!isViewConfirm) {
      return null;
    }

    if (isRemovingWorkspace) {
      return (
        <Confirm
          title={t(Labels.CONFIRM_REMOVE_WORKSPACE_TITLE, { wsName: name })}
          description={t(Labels.CONFIRM_REMOVE_WORKSPACE_DESCRIPTION)}
          isLoading={isLoadingAction}
          onConfirm={this.onConfirmRemove}
          onHide={this.toggleViewConfirm}
        />
      );
    }

    return (
      <Confirm
        title={t(Labels.CONFIRM_JOIN_TO_WORKSPACE_TITLE, { wsName: name })}
        description={t(Labels.CONFIRM_JOIN_TO_WORKSPACE_DESCRIPTION)}
        isLoading={isLoadingAction}
        onConfirm={this.onConfirmJoin}
        onHide={this.toggleViewConfirm}
        confirmBtnLabel={t(Labels.CONFIRM_JOIN_TO_WORKSPACE_BTN_LABEL)}
      />
    );
  };

  render() {
    const {
      image,
      name,
      isSmallView,
      className,
      description: wsDescription,
      customImagePreview,
      isCurrentUserMember,
      hasAnimationOnHover,
      openWorkspace,
      onMouseDown
    } = this.props;
    const { showMenuSettings, showBtnSettings } = this.state;

    const description = (isString(wsDescription) && wsDescription.trim()) || '';

    return (
      <div
        ref={this._cardContainerRef}
        className={classNames('citeck-workspace-sidebar__preview-container', { small: isSmallView, animation: hasAnimationOnHover })}
        onMouseEnter={() => this.handleShowBtnSettings(true)}
        onMouseLeave={() => this.handleShowBtnSettings(false)}
      >
        {this.renderConfirm()}
        {this.renderMenuActions()}
        {this.actions.length > 0 && this.renderBtnSettings()}
        <div
          className={classNames('citeck-workspace-sidebar__card', className, {
            small: isSmallView,
            focus: showMenuSettings || showBtnSettings
          })}
          onMouseDown={onMouseDown}
          onClick={e => (isCurrentUserMember ? openWorkspace && openWorkspace(e) : this.toggleViewConfirm())}
        >
          <WorkspacePreview url={image} name={name} customImagePreview={customImagePreview} />
          <div className="citeck-workspace-sidebar__card-info">
            <h3 className="citeck-workspace-sidebar__card-info_title" title={name}>
              {name}
            </h3>
            <p className="citeck-workspace-sidebar__card-info_description" title={description}>
              {description}
            </p>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: RootState): Pick<WorkspaceCardProps, 'isLoadingAction'> => ({
  isLoadingAction: selectWorkspaceIsLoadingAction(state)
});

type OmitProps = 'getWorkspaces' | 'getSidebarWorkspaces' | 'joinToWorkspace' | 'removeWorkspace' | 'leaveOfWorkspace';

const mapDispatchToProps = (
  dispatch: Dispatch,
  props: Omit<WorkspaceCardProps, 'isLoadingAction' | OmitProps>
): Pick<WorkspaceCardProps, OmitProps> => ({
  getWorkspaces: () => dispatch(getWorkspaces()),
  getSidebarWorkspaces: () => dispatch(getSidebarWorkspaces()),
  removeWorkspace: callback => dispatch(removeWorkspace({ wsId: props.id, wsName: props.name, callback })),
  joinToWorkspace: callback => dispatch(joinToWorkspace({ wsId: props.id, callback })),
  leaveOfWorkspace: () => dispatch(leaveOfWorkspace({ wsId: props.id, wsName: props.name }))
});

export default connect(mapStateToProps, mapDispatchToProps)(WorkspaceCard);
