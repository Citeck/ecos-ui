import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Container } from 'reactstrap';

import { ALLOW_WIDGETS_PREVIEW, DEFAULT_TABLE_WIDGETS } from '../constants';

import { WidgetsConfigType } from './JournalsPreviewWidgets';
import LeftPositionWidgetsIcon from './icons/LeftPositionWidgetsIcon';
import RightPositionWidgetsIcon from './icons/RightPositionWidgetsIcon';

import { getJournalWidgetsConfig } from '@/actions/journals';
import { JournalsApi } from '@/api/journalsApi';
import SetWidgets from '@/components/DashboardSettings/parts/SetWidgets';
import { DndUtils } from '@/components/Drag-n-Drop';
import { Loader, Tooltip } from '@/components/common';
import { Btn } from '@/components/common/btns';
import Components from '@/components/widgets/Components';
import { Layouts, LayoutType, LayoutTypes } from '@/constants/layout';
import { t } from '@/helpers/export/util';
import { wrapArgs } from '@/helpers/redux';
import PageTabList from '@/services/pageTabs/PageTabList';
import { Dispatch, RootState } from '@/types/store';

import './style.scss';

interface WidgetSettingsProps {
  isLoading: boolean;
  modalRef?: React.RefObject<{ _dialog?: HTMLDivElement }>;
  onClose?: () => void;
  config: WidgetsConfigType | null;
  getJournalWidgetsConfig: (stateId: string, journalId: string) => void;
  stateId: string;
}

interface WidgetSettingsState {
  journalId?: string | null;
  selectedLayout?: LayoutType;
  selectedWidgets: WidgetsConfigType['widgets'];
  isLeftPositionWidgets: boolean;
  isLoading: boolean;
}

const Labels = {
  BTN_CANCEL: 'dashboard-settings.button.cancel',
  BTN_SAVE: 'dashboard-settings.button.save',
  WIDGETS_VIEW: 'widgets-settings.view.title',
  WIDGETS_PLACEMENT_PLACEHOLDER: 'widgets-settings.view.placement.placeholder',
  TOOLTIP: {
    LEFT_POSITION: 'widgets-settings.view.placement.tooltip.left-position',
    RIGHT_POSITION: 'widgets-settings.view.placement.tooltip.right-position'
  }
};

function getStateId(state: RootState) {
  const urlParams = new URLSearchParams(window.location.search);
  const journalId = urlParams.get('journalId');

  const journals = get(state, 'journals', {});
  const activeTabId = PageTabList.activeTabId;
  const keys = Object.keys(journals).filter(key => key.includes(activeTabId));
  return keys.find(key => get(journals, [key, 'journalConfig', 'id']) === journalId) || '';
}

class WidgetSettings<P extends WidgetSettingsProps, S extends WidgetSettingsState> extends Component<P, S> {
  selectedLayout = Layouts.find(layout => layout.type === LayoutTypes.ONE_COLUMN);

  constructor(props: P) {
    super(props);

    const { widgets, isLeftPositionWidgets } = props.config || {};

    const urlParams = new URLSearchParams(window.location.search);
    const journalId = urlParams.get('journalId');

    const selectedWidgets = widgets
      ? widgets
      : [
          DndUtils.setDndId(
            DEFAULT_TABLE_WIDGETS.map(name => {
              const widget = Components.components[name];
              return {
                name,
                label: widget.label
              };
            })
          )
        ];

    this.state = { journalId, selectedWidgets, isLeftPositionWidgets: isLeftPositionWidgets || false, isLoading: false } as S;
  }

  get availableWidgets() {
    const widgets = ALLOW_WIDGETS_PREVIEW.map(name => {
      const widget = Components.components[name];
      return {
        name,
        label: widget.label
      };
    });

    return DndUtils.setDndId(widgets);
  }

  getPositionOffset = () => {
    const { modalRef } = this.props;
    const defaultOffset = { left: 0, top: 0 };
    const modal = modalRef?.current?._dialog;

    if (!modal) {
      return defaultOffset;
    }

    const content = modal.querySelector('.modal-content');

    if (!content) {
      return defaultOffset;
    }

    const positions = content.getBoundingClientRect();

    return {
      left: -positions.left,
      top: -positions.top
    };
  };

  handleCloseSettings = () => {
    const { onClose } = this.props;

    if (isFunction(onClose)) {
      onClose();
    }
  };

  handleCheckChanges = () => {
    this.saveSettings();
  };

  handleChangePositionWidgets = (checked: boolean) => {
    this.setState({ isLeftPositionWidgets: checked });
  };

  renderLoader() {
    const { isLoading } = this.state;

    if (isLoading) {
      return <Loader height={100} width={100} className="ecos-dashboard-settings__loader-wrapper" blur />;
    }

    return null;
  }

  saveSettings = () => {
    const { stateId } = this.props;
    const { journalId, selectedWidgets, isLeftPositionWidgets } = this.state;

    const JournalApi = new JournalsApi();
    this.setState({ isLoading: true });

    JournalApi.saveConfigWidgets({
      journalId: journalId || '',
      config: {
        widgets: selectedWidgets,
        isLeftPositionWidgets
      }
    })
      .then(() => {
        this.handleCloseSettings();
        if (journalId && stateId) {
          this.props.getJournalWidgetsConfig(stateId, journalId);
          this.setState({ isLoading: false });
        }
      })
      .catch(() => this.setState({ isLoading: false }));
  };

  renderWidgetsBlock = () => {
    let selectedWidgets = cloneDeep(this.state.selectedWidgets);

    const setData = (data: WidgetsConfigType['widgets']) => {
      selectedWidgets = data;
      this.setState({ selectedWidgets });
    };

    return (
      <div className="ecos-dashboard-settings__container">
        <SetWidgets
          availableWidgets={this.availableWidgets}
          activeWidgets={selectedWidgets}
          activeLayout={this.selectedLayout || {}}
          columns={this.selectedLayout?.columns || []}
          setData={setData}
          positionAdjustment={this.getPositionOffset}
          isMobile
        />
      </div>
    );
  };

  renderButtons() {
    return (
      <div className="ecos-dashboard-settings__actions">
        <Btn className="ecos-btn_x-step_10" onClick={this.handleCloseSettings}>
          {t(Labels.BTN_CANCEL)}
        </Btn>
        <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" onClick={this.handleCheckChanges}>
          {t(Labels.BTN_SAVE)}
        </Btn>
      </div>
    );
  }

  renderViews() {
    const { isLeftPositionWidgets } = this.state;
    const tooltipTargetId = (position: 'left' | 'right') => `ecos-journals-preview--${position}`;

    return (
      <div>
        <h5 className="ecos-dashboard-settings__container-title">{t(Labels.WIDGETS_VIEW)}</h5>
        <div className="ecos-journals-preview__settings-modal-view">
          <Tooltip target={tooltipTargetId('left')} text={t(Labels.TOOLTIP.LEFT_POSITION)} uncontrolled>
            <div
              id={tooltipTargetId('left')}
              onClick={() => this.handleChangePositionWidgets(true)}
              className={classNames('ecos-journals-preview__settings-modal-view_icon', {
                selected: isLeftPositionWidgets
              })}
            >
              <LeftPositionWidgetsIcon />
            </div>
          </Tooltip>
          <Tooltip target={tooltipTargetId('right')} text={t(Labels.TOOLTIP.RIGHT_POSITION)} uncontrolled>
            <div
              id={tooltipTargetId('right')}
              onClick={() => this.handleChangePositionWidgets(false)}
              className={classNames('ecos-journals-preview__settings-modal-view_icon', {
                selected: !isLeftPositionWidgets
              })}
            >
              <RightPositionWidgetsIcon />
            </div>
          </Tooltip>
        </div>
      </div>
    );
  }

  render() {
    return (
      <Container className="ecos-dashboard-settings ecos-dashboard-settings_modal ecos-journals-preview__modal">
        {this.renderLoader()}
        {this.renderViews()}
        {this.renderWidgetsBlock()}
        {this.renderButtons()}
      </Container>
    );
  }
}

export const mapStateToProps = (state: RootState): Pick<WidgetSettingsProps, 'config' | 'stateId'> => {
  const stateId = getStateId(state);
  const journalState = get(state, ['journals', stateId], {});

  return {
    config: get(journalState, 'widgetsConfig', null),
    stateId
  };
};

export const mapDispatchToProps = (dispatch: Dispatch): Pick<WidgetSettingsProps, 'getJournalWidgetsConfig'> => {
  return {
    getJournalWidgetsConfig: (stateId, journalId) => {
      const w = wrapArgs(stateId);
      dispatch(getJournalWidgetsConfig(w(journalId)));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(WidgetSettings);
