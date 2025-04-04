import classNames from 'classnames';
import isFunction from 'lodash/isFunction';
import React, { Component } from 'react';

import EditIcon from '../common/icons/Edit';

import WorkspacePreview from '@/components/WorkspacePreview';

import './styles.scss';

interface WorkspaceCardProps {
  isSmallView?: boolean;
  hasWrite?: boolean;
  className?: string;
  wsImage: string;
  id: string;
  wsName: string;
  wsDescription: string;
  onEditWorkspace?: (event: React.MouseEvent<HTMLDivElement>, id: string) => void;
}

export class WorkspaceCard extends Component<WorkspaceCardProps> {
  state = { showBtnSettings: false };

  static defaultProps = {
    isSmallView: false
  };

  renderBtnSettings = () => {
    const { hasWrite, id, onEditWorkspace } = this.props;
    const { showBtnSettings } = this.state;

    if (!showBtnSettings || !hasWrite) {
      return null;
    }

    return (
      <div
        className="workspace-panel-list_item_btn citek-workspace-sidebar__card-settings_btn"
        onClick={e => isFunction(onEditWorkspace) && onEditWorkspace(e, id)}
      >
        <EditIcon />
      </div>
    );
  };

  handleShowBtnSettings = (flag: boolean) => {
    this.setState({ showBtnSettings: flag });
  };

  render() {
    const { wsImage, wsName, isSmallView, className, wsDescription, ...rest } = this.props;

    return (
      <div
        className="citek-workspace-sidebar__container"
        onMouseEnter={() => this.handleShowBtnSettings(true)}
        onMouseLeave={() => this.handleShowBtnSettings(false)}
      >
        {this.renderBtnSettings()}
        <div className={classNames('citek-workspace-sidebar__card', className, { small: isSmallView })} {...rest}>
          <WorkspacePreview url={wsImage} name={wsName} />
          <div className="citek-workspace-sidebar__card-info">
            <h3 className="citek-workspace-sidebar__card-info_title" title={wsName}>
              {wsName}
            </h3>
            <p className="citek-workspace-sidebar__card-info_description">{wsDescription}</p>
          </div>
        </div>
      </div>
    );
  }
}
