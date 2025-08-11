import React from 'react';

import { workspaceAttributes } from '@/api/workspaces';
import { WorkspaceType } from '@/api/workspaces/types';
import Dashlet from '@/components/Dashlet';
// @ts-ignore
import Records from '@/components/Records';
import Card from '@/components/WorkspaceSidebar/Card';
import { Loader } from '@/components/common';
import BaseWidget, { BaseWidgetProps, BaseWidgetState } from '@/components/widgets/BaseWidget';
import { omit } from '@/helpers/omitObject';
import { getWorkspaceId, openLinkWorkspace } from '@/helpers/urls';
import { t } from '@/helpers/util';

import './style.scss';

interface wsItem extends WorkspaceType {
  notExists: boolean;
}

interface WelcomeState extends BaseWidgetState {
  isLoading: boolean;
  error: string | null;
  workspaces: wsItem[];
}

class WelcomeWidget<P extends BaseWidgetProps> extends BaseWidget<P, WelcomeState> {
  constructor(props: P) {
    super(props);
    this.state = {
      isLoading: false,
      error: null,
      workspaces: []
    };
  }

  componentDidMount() {
    this.setState({ isLoading: true });
    this.getWelcomeWorkspaces();
  }

  async getWelcomeWorkspaces() {
    const attributesWs = omit(workspaceAttributes, ['hasDelete', 'hasWrite']);
    try {
      // @ts-ignore
      const workspaces = await Records.get([
        'emodel/workspace@corpport-workspace',
        'emodel/workspace@data-lists-workspace',
        'emodel/workspace@contracts-workspace',
        'emodel/workspace@offers-workspace',
        'emodel/workspace@clerical-work-workspace',
        'emodel/workspace@crm-workspace',
        'emodel/workspace@service-desk-workspace',
        'emodel/workspace@admin$workspace'
      ]).load({ ...attributesWs, notExists: '_notExists?bool!' });

      this.setState({
        workspaces: workspaces.filter((ws: wsItem) => !ws.notExists)
      });
    } catch (e) {
      console.error('e: ', e);
      this.setState({
        error: t('welcome.widget.workspaces.error')
      });
    } finally {
      this.setState({
        isLoading: false
      });
    }
  }

  openWorkspace = (
    event: React.MouseEvent<HTMLDivElement | HTMLLIElement | HTMLButtonElement>,
    wsId: WorkspaceType['id'],
    homePageLink: WorkspaceType['homePageLink']
  ) => {
    event.stopPropagation();

    if (wsId !== getWorkspaceId()) {
      openLinkWorkspace(wsId, homePageLink);
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
      openLinkWorkspace(wsId, homePageLink, true);
    }
  };

  render(): React.ReactNode {
    const { workspaces, isLoading, error } = this.state;
    return (
      // @ts-ignore
      <Dashlet
        {...this.props}
        title={t('dashboard-settings.widget.welcome')}
        className="ecos-welcome-widget-dashlet"
        disableCollapse={false}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={this.isCollapsed}
        needGoTo={false}
      >
        <section className="ecos-welcome-widget">
          <div className="ecos-welcome">
            {error && <span className="ecos-welcome-workspaces-error">{error}</span>}
            {isLoading && <Loader />}
            {workspaces.map((ws: wsItem) => {
              return (
                <Card
                  {...ws}
                  key={ws.id}
                  className="ecos-welcome-card"
                  onMouseDown={e => this.onMouseDown(e, ws.id, ws.homePageLink)}
                  openWorkspace={e => this.openWorkspace(e, ws.id, ws.homePageLink)}
                />
              );
            })}
          </div>
        </section>
      </Dashlet>
    );
  }
}

export default WelcomeWidget;
