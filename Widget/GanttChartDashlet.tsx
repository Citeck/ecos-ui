import isFunction from 'lodash/isFunction';
import * as React from 'react';
import { SvelteWrapper } from 'reactify-svelte';

import GanttSettings from './GanttSettings';
import __SvelteComponent__ from './Widget.svelte';

import Dashlet from '@/components/Dashlet';
import Records from '@/components/Records/Records';
import BaseWidget, { BaseWidgetProps, BaseWidgetState } from '@/components/widgets/BaseWidget';
import { getRecordRef, getWorkspaceId } from '@/helpers/urls';
import { t } from '@/helpers/util';
import DAction from '@/services/DashletActionService';

import './style.scss';

interface GanttChartWidgetProps extends BaseWidgetProps {
  ganttSettingsRef?: string;
}

interface GanttChartWidgetState extends BaseWidgetState {
  isOpenSettings: boolean;
  ganttSettings: any;
  isLoading: boolean;
  error?: string;
}

interface GanttWidgetProps {
  ganttSettingsRef?: string;
  ganttDataRef?: string;
  currentRef?: string;
  workspace?: string;
}
// @ts-ignore
const GanttSvelteComponent = SvelteWrapper<GanttWidgetProps>(__SvelteComponent__);

class GanttChartWidget<P extends GanttChartWidgetProps, S extends GanttChartWidgetState> extends BaseWidget<P, S> {
  static TYPE = 'gantt_chart';

  constructor(props: P) {
    super(props);

    this.state = {
      isOpenSettings: false,
      ganttSettings: null
    } as S;
  }

  componentDidMount() {
    this.loadGanttSettings();
  }

  loadGanttSettings = async () => {
    const { config, ganttSettingsRef } = this.props;

    if (!ganttSettingsRef) {
      await this.handleSaveSettings({ dataType: 'STANDALONE' });

      this.loadGanttSettings();

      return;
    }

    try {
      const settingsRecord = Records.get(ganttSettingsRef);
      const settings = await settingsRecord.load({
        id: 'id',
        dataType: 'dataType?str',
        dataSourceId: 'dataSourceId?str',
        manualDataSourceId: 'manualDataSourceId?str',
        linkedWithType: 'linkedWithType?str',
        linkedWithRef: 'linkedWithRef?str',
        data: 'data?id'
      });

      this.setState({ ganttSettings: settings });
    } catch (error: any) {
      console.error('Failed to load Gantt settings:', error);
    }
  };

  handleSettings = () => {
    this.setState({ isOpenSettings: !this.state.isOpenSettings });
  };

  handleSaveSettings = async (settings: any) => {
    const { config, ganttSettingsRef, onSave } = this.props;

    try {
      if (!ganttSettingsRef) {
        // @ts-ignore
        const newSettingsRecord = Records.get('emodel/gantt-settings@');

        newSettingsRecord.att('dataType', settings.dataType);

        if (settings.dataType === 'LINKED') {
          if (settings.dataSourceId) {
            newSettingsRecord.att('dataSourceId', settings.dataSourceId);
          }
          if (settings.manualDataSourceId) {
            newSettingsRecord.att('manualDataSourceId', settings.manualDataSourceId);
          }
          if (settings.linkedWithType) {
            newSettingsRecord.att('linkedWithType', settings.linkedWithType);
          }
          if (settings.linkedWithRef) {
            newSettingsRecord.att('linkedWithRef', settings.linkedWithRef);
          }
        }

        const result = await newSettingsRecord.save();

        if (isFunction(onSave) && this.props.id) {
          onSave(
            this.props.id,
            {
              ...config,
              ganttSettingsRef: result.id
            },
            () =>
              this.setState({
                ganttSettings: { ...settings, id: result.id },
                isOpenSettings: false
              })
          );
        }
      } else {
        const settingsRecord = Records.getRecordToEdit(ganttSettingsRef);

        settingsRecord.att('dataType', settings.dataType);

        if (settings.dataType === 'LINKED') {
          settingsRecord.att('dataSourceId', settings.dataSourceId || null);
          settingsRecord.att('manualDataSourceId', settings.manualDataSourceId || null);
          settingsRecord.att('linkedWithType', settings.linkedWithType || null);
          settingsRecord.att('linkedWithRef', settings.linkedWithRef || null);
        } else {
          settingsRecord.att('dataSourceId', null);
          settingsRecord.att('manualDataSourceId', null);
          settingsRecord.att('linkedWithType', null);
          settingsRecord.att('linkedWithRef', null);
        }

        await settingsRecord.save();

        this.setState({
          ganttSettings: settings,
          isOpenSettings: false
        });
      }
    } catch (error: any) {
      console.error('Failed to save Gantt settings:', error);
    }
  };

  get dashletActions() {
    const actions: any = {};

    actions[DAction.Actions.SETTINGS] = {
      onClick: this.handleSettings,
      text: t('gantt.chart.settings')
    };

    return actions;
  }

  render() {
    const { ganttSettingsRef, record } = this.props;
    const { isOpenSettings, ganttSettings } = this.state;

    return (
      <div className="ecos-gantt-chart-widget">
        <Dashlet
          {...this.props}
          needsUpdate={false}
          title={t('gantt.chart.title')}
          needGoTo={false}
          onToggleCollapse={this.handleToggleContent}
          isCollapsed={this.isCollapsed}
          actionConfig={this.dashletActions}
        >
          {isOpenSettings && (
            <div style={{ padding: '20px' }}>
              <GanttSettings
                isOpen={isOpenSettings}
                settings={ganttSettings}
                onHide={this.handleSettings}
                onSave={this.handleSaveSettings}
              />
            </div>
          )}
          <div style={{ display: isOpenSettings ? 'none' : 'block', height: '100%' }}>
            <GanttSvelteComponent ganttSettingsRef={ganttSettingsRef} currentRef={getRecordRef() || record} workspace={getWorkspaceId()} />
          </div>
        </Dashlet>
      </div>
    );
  }
}

export default React.memo(GanttChartWidget);
