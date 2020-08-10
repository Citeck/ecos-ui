import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import get from 'lodash/get';
import { connect } from 'react-redux';

import { isSmallMode, t } from '../../../helpers/util';
import Dashlet from '../../Dashlet';
import DAction from '../../../services/DashletActionService';
import BaseWidget from '../BaseWidget';
import Report from './Report';
import { getStateId } from '../../../helpers/redux';
import { getReportData } from '../../../actions/report';
import { selectStateByKey } from '../../../selectors/birthdays';

import './style.scss';

const mapStateToProps = (state, ownProps) => {
  const reportState = state.report[getStateId(ownProps)];
  return {
    ...selectStateByKey(state, getStateId(ownProps)),
    reportData: get(reportState, 'reportData', {}),
    isLoading: get(reportState, 'isLoading', false),
    isMobile: get(state, 'view.isMobile', false)
  };
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  getReportData: () => dispatch(getReportData(getStateId(ownProps)))
});

class ReportDashlet extends BaseWidget {
  static propTypes = {
    id: PropTypes.string,
    record: PropTypes.string,
    title: PropTypes.string,
    classNameContent: PropTypes.string,
    classNameDashlet: PropTypes.string,
    config: PropTypes.object,
    dragHandleProps: PropTypes.object,
    canDragging: PropTypes.bool,
    maxHeightByContent: PropTypes.bool,
    reportData: PropTypes.object,
    isLoading: PropTypes.bool,
    isMobile: PropTypes.bool,
    getReportData: PropTypes.func
  };

  static defaultProps = {
    classNameContent: '',
    classNameDashlet: '',
    dragHandleProps: {},
    canDragging: false,
    maxHeightByContent: false
  };

  constructor(props) {
    super(props);

    this.stateId = getStateId(props);

    this.state = {
      ...this.state,
      isSmallMode: false
    };
  }

  onResize = width => {
    !!width && this.setState({ isSmallMode: isSmallMode(width) });
  };

  render() {
    const {
      title,
      config,
      classNameDashlet,
      classNameContent,
      record,
      dragHandleProps,
      canDragging,
      tabId,
      isActiveLayout,
      reportData,
      isLoading,
      getReportData,
      isMobile
    } = this.props;
    const { isSmallMode, userHeight, fitHeights, isCollapsed, runUpdate } = this.state;
    const actions = {
      [DAction.Actions.RELOAD]: {
        onClick: this.reload.bind(this)
      }
    };
    return (
      <Dashlet
        title={title || t('report-widget.title')}
        bodyClassName="ecos-report-dashlet__body"
        className={classNames('ecos-report-dashlet', classNameDashlet)}
        actionConfig={actions}
        resizable={true}
        contentMaxHeight={this.clientHeight}
        needGoTo={false}
        canDragging={canDragging}
        dragHandleProps={dragHandleProps}
        onChangeHeight={this.handleChangeHeight}
        getFitHeights={this.setFitHeights}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
        onResize={this.onResize}
      >
        <Report
          {...config}
          forwardedRef={this.contentRef}
          record={record}
          tabId={tabId}
          stateId={this.stateId}
          className={classNameContent}
          isSmallMode={isSmallMode}
          height={userHeight || this.fullHeight}
          minHeight={fitHeights.min}
          maxHeight={fitHeights.max}
          runUpdate={runUpdate}
          isActiveLayout={isActiveLayout}
          reportData={reportData}
          getReportData={getReportData}
          isMobile={isMobile}
          isLoading={isLoading}
        />
      </Dashlet>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ReportDashlet);
