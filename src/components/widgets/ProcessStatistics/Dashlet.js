import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';

import { getStateId } from '../../../helpers/redux';
import { t } from '../../../helpers/export/util';
import { MAX_DEFAULT_HEIGHT_DASHLET } from '../../../constants';
import DAction from '../../../services/DashletActionService';
import Switch from '../../common/form/Checkbox/Switch';
import Dashlet from '../../Dashlet';
import BaseWidget from '../BaseWidget';
import Journal from './Journal';
import Model from './Model';
import Settings from './Settings';
import { Labels } from './util';

export default class extends BaseWidget {
  static propTypes = {
    id: PropTypes.string.isRequired,
    record: PropTypes.string.isRequired,
    title: PropTypes.string,
    classNameContent: PropTypes.string,
    classNameDashlet: PropTypes.string,
    config: PropTypes.shape({
      height: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    })
  };

  static defaultProps = {
    classNameContent: '',
    classNameDashlet: ''
  };

  constructor(props) {
    super(props);

    this.stateId = getStateId(props);
    this.state = {
      isShowHeatmap: get(props, 'config.showHeatmapDefault'),
      isShowSetting: false
    };
  }

  get dashletActions() {
    const { isShowSetting } = this.state;

    if (isShowSetting || !this.props.config) {
      return {};
    }

    return {
      [DAction.Actions.RELOAD]: {
        onClick: this.reload.bind(this)
      },
      [DAction.Actions.SETTINGS]: {
        onClick: this.onToggleSettings
      }
    };
  }

  onToggleSettings = () => {
    this.setState(state => ({ isShowSetting: !state.isShowSetting }));
  };

  onToggleHeatmap = () => {
    this.setState(state => ({ isShowHeatmap: !state.isShowHeatmap }));
  };

  onSaveConfig = config => {
    isFunction(this.props.onSave) && this.props.onSave(this.props.id, { config });
    this.onToggleSettings();
  };

  render() {
    const { title, config, classNameContent, classNameDashlet, record, dragHandleProps, canDragging } = this.props;
    const { isSmallMode, runUpdate, isShowSetting, isShowHeatmap } = this.state;

    return (
      <Dashlet
        title={title || t(Labels.WG_TITLE)}
        className={classNames('ecos-process-statistics-dashlet', classNameDashlet)}
        bodyClassName="ecos-process-statistics-dashlet__body"
        resizable={true}
        actionConfig={this.dashletActions}
        needGoTo={false}
        canDragging={canDragging}
        dragHandleProps={dragHandleProps}
        onChangeHeight={this.handleChangeHeight}
        getFitHeights={this.setFitHeights}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={this.isCollapsed}
        setRef={this.setDashletRef}
      >
        {isShowSetting && <Settings config={config} onCancel={this.onToggleSettings} onSave={this.onSaveConfig} />}
        <div className={classNames({ 'd-none': isShowSetting }, classNameContent)}>
          <div className="ecos-process-statistics__header">
            <div className="ecos-process-statistics__heatmap-switch">
              <Switch checked={isShowHeatmap} onToggle={this.onToggleHeatmap} /> {t(Labels.PANEL_HEATMAP)}
            </div>
          </div>
          <Model {...config} record={record} stateId={this.stateId} isShowHeatmap={isShowHeatmap} />
          {config.selectedJournal && (
            <Journal
              {...config}
              forwardedRef={this.contentRef}
              className={classNames(classNameContent)}
              record={record}
              stateId={this.stateId}
              isSmallMode={isSmallMode}
              runUpdate={runUpdate}
              maxHeight={MAX_DEFAULT_HEIGHT_DASHLET - this.otherHeight}
            />
          )}
        </div>
      </Dashlet>
    );
  }
}
