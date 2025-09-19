import isFunction from 'lodash/isFunction';
import * as React from 'react';
// @ts-ignore
import { Willow } from 'wx-react-gantt';

import GanttSettings from './GanttSettings';
import GanttWithStore from './GanttWithStore';

import Dashlet from '@/components/Dashlet';
// @ts-ignore
import Records from '@/components/Records/Records';
import BaseWidget, { BaseWidgetProps, BaseWidgetState } from '@/components/widgets/BaseWidget';
import { getRecordRef, getWorkspaceId } from '@/helpers/urls';
import DAction from '@/services/DashletActionService';

import 'wx-react-gantt/dist/gantt.css';
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

class GanttChartWidget<P extends GanttChartWidgetProps, S extends GanttChartWidgetState> extends BaseWidget<P, S> {
  static TYPE = 'gantt_chart';

  constructor(props: P) {
    super(props);

    this.state = {
      isOpenSettings: false,
      ganttSettings: null,
      isLoading: true,
      error: undefined
    } as S;
  }

  componentDidMount() {
    this.loadGanttSettings();
  }

  loadGanttSettings = async () => {
    const { config, ganttSettingsRef } = this.props;

    if (!ganttSettingsRef) {
      this.setState({
        ganttSettings: { dataType: 'STANDALONE' },
        isLoading: false
      });
      return;
    }

    try {
      this.setState({ isLoading: true, error: undefined });

      // @ts-ignore
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

      this.setState({
        ganttSettings: settings,
        isLoading: false
      });
    } catch (error: any) {
      console.error('Failed to load Gantt settings:', error);
      this.setState({
        isLoading: false,
        error: error.message || 'Failed to load Gantt settings'
      });
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
        // @ts-ignore
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
      this.setState({
        error: error.message || 'Failed to save Gantt settings'
      });
    }
  };

  get dashletActions() {
    const actions: any = {};

    actions[DAction.Actions.SETTINGS] = {
      onClick: this.handleSettings,
      text: 'Gantt Settings'
    };

    return actions;
  }

  render() {
    const { ganttSettingsRef, record } = this.props;
    const { isOpenSettings, ganttSettings, error } = this.state;

    return (
      <div className="ecos-gantt-chart-widget">
        {/* @ts-ignore */}
        <Dashlet
          {...this.props}
          needsUpdate={false}
          title="Gantt Chart"
          needGoTo={false}
          onToggleCollapse={this.handleToggleContent}
          isCollapsed={this.isCollapsed}
          actionConfig={this.dashletActions}
        >
          {isOpenSettings ? (
            <div style={{ padding: '20px' }}>
              <GanttSettings
                isOpen={isOpenSettings}
                settings={ganttSettings}
                onHide={this.handleSettings}
                onSave={this.handleSaveSettings}
              />
            </div>
          ) : (
            <Willow>
              <div className="gtcell pb-4">
                {error ? (
                  <div
                    className="gantt-error"
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '300px',
                      color: 'red',
                      padding: '20px',
                      textAlign: 'center'
                    }}
                  >
                    Error: {error}
                    <button
                      onClick={this.loadGanttSettings}
                      style={{
                        marginLeft: '10px',
                        padding: '5px 10px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <GanttWithStore ganttSettingsRef={ganttSettingsRef} currentRef={getRecordRef() || record} workspace={getWorkspaceId()} />
                )}
              </div>
            </Willow>
          )}
        </Dashlet>
      </div>
    );
  }
}

export default React.memo(GanttChartWidget);
