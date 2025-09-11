import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import isNil from 'lodash/isNil';

import { getStateId } from '../../../helpers/redux';
import { getCurrentUserName, t } from '../../../helpers/util';
import plugins from '../../../plugins/index';
import DAction from '../../../services/DashletActionService';
import Dashlet from '../../Dashlet';
import BaseWidget from '../BaseWidget';
import { Labels } from './util';
import Journal from './Journal';
import Model from './Model';
import Settings from './Settings';
import { Loader } from '../../common';
import { PERMISSION_VIEW_REPORTS } from '../../../constants/bpmn';
import Records from '../../Records/Records';
import { EXTENDED_MODE, SIMPLIFIED_MODE } from './constants';
import { MAX_DEFAULT_HEIGHT_DASHLET, SourcesId, SystemJournals } from '../../../constants';

export default class Widget extends BaseWidget {
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
      isShowSetting: false,
      isAccessible: false,
      isSimpledMode: false,
      isAdmin: false,
      modelConfig: {}
    };
  }

  componentDidMount() {
    this.fetchIsAccessible();
    this.fetchIsAdmin();
    this.getIsExtendedMode();
  }

  componentDidUpdate(prevProps) {
    if (this.props.record !== prevProps.record) {
      this.fetchIsAccessible();
    }

    if (get(this.props, 'config.formMode') !== get(prevProps, 'config.formMode') || !isEqual(this.props.config, prevProps.config)) {
      this.getIsExtendedMode();
    }
  }

  fetchIsAccessible() {
    const { record } = this.props;

    Records.get(record)
      .load(PERMISSION_VIEW_REPORTS)
      .then(isAccessible => {
        this.setState({ isAccessible }, this.getIsExtendedMode);
      });
  }

  fetchIsAdmin() {
    Records.get(`${SourcesId.PERSON}@${getCurrentUserName()}`)
      .load({ isAdmin: 'isAdmin?bool' })
      .then(({ isAdmin }) => this.setState({ isAdmin }));
  }

  getIsExtendedMode() {
    const { config = {} } = this.props;
    const { isAccessible } = this.state;
    const { HeatmapWrapper } = plugins;

    const isSimpledMode = config.formMode === SIMPLIFIED_MODE || !HeatmapWrapper;
    const extendedConfig = !isSimpledMode ? { ...config } : {};
    const modelConfig = isAccessible
      ? { ...extendedConfig }
      : {
          ...extendedConfig,
          showHeatmapDefault: false,
          showCountersDefault: false
        };

    this.setState({ isSimpledMode, modelConfig }, () => {
      this.reload();
    });
  }

  get dashletActions() {
    const { isShowSetting, isAdmin } = this.state;
    const { HeatmapWrapper } = plugins;

    if (isShowSetting || !this.props.config) {
      return {};
    }

    if (!isAdmin || !HeatmapWrapper) {
      return {
        [DAction.Actions.RELOAD]: {
          onClick: this.reload.bind(this)
        }
      };
    }

    return {
      [DAction.Actions.RELOAD]: {
        onClick: this.reload.bind(this)
      },
      [DAction.Actions.SETTINGS]: {
        onClick: this.handleToggleSettings
      }
    };
  }

  handleToggleSettings = () => {
    this.setState(state => ({ isShowSetting: !state.isShowSetting }));
  };

  handleSaveConfig = config => {
    const { onSave, id } = this.props;

    isFunction(onSave) && onSave(id, { config }, this.handleToggleSettings);
  };

  render() {
    const { title, config, classNameContent, classNameDashlet, record, dragHandleProps, canDragging } = this.props;
    const { isSmallMode, runUpdate, isShowSetting, width, isAccessible, isSimpledMode, modelConfig } = this.state;

    if (isNil(isAccessible)) {
      return <Loader height={100} width={100} />;
    }

    config.selectedJournal = `${SourcesId.JOURNAL}@${SystemJournals.PROCESS_ELMS}`;

    const formMode = get(config, 'formMode', EXTENDED_MODE);

    return (
      <Dashlet
        title={title || (!isSimpledMode && isAccessible) ? t(Labels.WG_EXTENDED_TITLE) : t(Labels.WG_SIMPLIFIED_TITLE)}
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
        onResize={this.handleResize}
      >
        {isShowSetting && <Settings config={config} onCancel={this.handleToggleSettings} onSave={this.handleSaveConfig} />}
        <div className={classNames({ 'd-none': isShowSetting }, classNameContent)}>
          {config.showModelDefault && !isShowSetting && (
            <Model
              {...modelConfig}
              showModelDefault={!this.isCollapsed}
              record={record}
              stateId={this.stateId}
              width={width}
              runUpdate={runUpdate}
              isSimpledMode={isSimpledMode}
              formMode={formMode}
              withPercentCount={get(config, 'withPercentCount', false)}
            />
          )}
          {config.selectedJournal && config.showJournalDefault && formMode === EXTENDED_MODE && isAccessible && (
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
