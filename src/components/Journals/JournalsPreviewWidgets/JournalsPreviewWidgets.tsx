import classNames from 'classnames';
import get from 'lodash/get';
import React, { Component, Suspense } from 'react';
import { connect } from 'react-redux';

import { DEFAULT_TABLE_WIDGETS } from '../constants';

import EmptyWidgetsIcon from './icons/EmptyWidgetsIcon';
import WidgetsNotSettingsIcon from './icons/WidgetsNotSettingsIcon';

import { getJournalWidgetsConfig } from '@/actions/journals';
import { WidgetErrorBoundary } from '@/components/WidgetErrorBoundary';
import { Loader } from '@/components/common';
import { Btn } from '@/components/common/btns';
import Components from '@/components/widgets/Components';
import { t } from '@/helpers/export/util';
import { wrapArgs } from '@/helpers/redux';
import WidgetService from '@/services/WidgetService';
import PageTabList from '@/services/pageTabs/PageTabList';
import { MLTextType } from '@/types/components';
import { Dispatch, RootState } from '@/types/store';

import './style.scss';

interface ComponentProps {
  stateId: string;
  recordId?: string;
  className?: string;
  isDraggingRow: boolean;
}

interface SagaProps {
  journalId: string;
  config: WidgetsConfigType;
  getJournalWidgetsConfig: (journalId: string) => void;
}

interface JournalsPreviewWidgetsState {
  isUpdate: boolean;
  clear: boolean;
}

type JournalsPreviewWidgetsProps = ComponentProps & SagaProps;
type WidgetsLoadType = {
  [key: string]: any;
};

type WidgetOfConfigType = {
  dndId: string;
  name: string;
  label: MLTextType | string;
  id?: string;
};

export type WidgetsConfigType = {
  widgets: Array<WidgetOfConfigType[]> | null;
  isLeftPositionWidgets?: boolean;
};

const Labels = {
  WIDGET_ERROR_TITLE: 'page-error-widget-loading.title',
  WIDGET_ERROR_MSG: 'page.error-loading.message',
  WIDGETS_NO_DATA: 'journals.widgets-preview.nodata',
  EMPTY_WIDGETS: 'dashboard-settings.layout.empty-layout',
  SETTING: 'web-page-widget.btn.settings'
};

const mapStateToProps = (state: RootState, props: ComponentProps): Omit<SagaProps, 'getDashboardConfig' | 'getJournalWidgetsConfig'> => {
  const newState = get(state, ['journals', props.stateId], {});

  return {
    journalId: get(newState, 'journalConfig.id', ''),
    config: get(newState, 'widgetsConfig') as WidgetsConfigType
  };
};

const mapDispatchToProps = (dispatch: Dispatch, props: ComponentProps): Pick<SagaProps, 'getJournalWidgetsConfig'> => {
  const w = wrapArgs(props.stateId);

  return {
    getJournalWidgetsConfig: journalId => dispatch(getJournalWidgetsConfig(w(journalId)))
  };
};

class JournalsPreviewWidgets<P extends JournalsPreviewWidgetsProps, S extends JournalsPreviewWidgetsState> extends Component<P, S> {
  private loadedWidgets: WidgetsLoadType = {};

  componentDidMount() {
    const urlParams = new URLSearchParams(window.location.search);
    const journalId = urlParams.get('journalId');

    if (journalId && get(this.props, 'stateId', '').includes(journalId)) {
      this.props.getJournalWidgetsConfig(journalId);
    }
  }

  getWidgets = (): React.ReactNode[] => {
    const { recordId, config, stateId, journalId, isDraggingRow } = this.props;
    const { widgets: configWidgets } = config || {};
    const components: React.ReactNode[] = [];

    const widgets =
      (configWidgets && get(configWidgets, [0]) ? configWidgets[0] : DEFAULT_TABLE_WIDGETS.map(widgetName => ({ name: widgetName }))) || [];

    widgets.forEach(({ name, ...widgetProps }) => {
      let Widget = this.loadedWidgets[name];

      const props = {
        stateId,
        journalId,
        record: recordId,
        dashboardId: null,
        tabId: PageTabList.activeTabId,
        isSameHeight: false,
        isDraggingRow,
        ...Components.getProps(name),
        ...widgetProps
      };

      const isStaticPreviewWidget = get(props, 'isStaticPreviewWidget');
      const key = isStaticPreviewWidget ? `${name}-static-widget` : `${name}-${recordId}`;

      if (!Widget) {
        Widget = Components.get(name);
        this.loadedWidgets[name] = Widget;
      }

      if (isStaticPreviewWidget || recordId) {
        if (isStaticPreviewWidget) {
          components.unshift(
            <WidgetErrorBoundary key={key} title={t(Labels.WIDGET_ERROR_TITLE)} message={t(Labels.WIDGET_ERROR_MSG)}>
              <Suspense fallback={<Loader type="points" />}>
                <Widget {...props} />
              </Suspense>
            </WidgetErrorBoundary>
          );
        } else {
          components.push(
            <WidgetErrorBoundary key={key} title={t(Labels.WIDGET_ERROR_TITLE)} message={t(Labels.WIDGET_ERROR_MSG)}>
              <Suspense fallback={<Loader type="points" />}>
                <Widget {...props} />
              </Suspense>
            </WidgetErrorBoundary>
          );
        }
      }
    });

    return components;
  };

  render() {
    const { className, recordId } = this.props;
    const components = this.getWidgets();

    return (
      <div className={classNames('ecos-journals-preview', className)}>
        <div className="ecos-journals-preview__container">
          {!components.length && !recordId && (
            <div className="ecos-journals-preview__empty-record">
              <EmptyWidgetsIcon />
              <span className="ecos-journals-preview__empty-record_text">{t(Labels.WIDGETS_NO_DATA)}</span>
            </div>
          )}

          {!components.length && recordId && (
            <div className="ecos-journals-preview__empty-widgets">
              <div className="ecos-journals-preview__empty-widgets-preview">
                <WidgetsNotSettingsIcon />
                <span className="ecos-journals-preview__empty-widgets_text">{t(Labels.EMPTY_WIDGETS)}</span>
              </div>
              <Btn className="ecos-journals-preview__empty-widgets_btn" onClick={() => WidgetService.openEditJournalWidgets()}>
                {t(Labels.SETTING)}
              </Btn>
            </div>
          )}

          {components.length > 0 && <div className="ecos-journals-preview__widgets">{components}</div>}
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(JournalsPreviewWidgets);
