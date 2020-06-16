import React from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';
import isEmpty from 'lodash/isEmpty';
import classNames from 'classnames';

import { DefineHeight, Loader } from '../../common';
import AnalyticsBlock from '../../common/AnalyticsBlock';
import EcosProgressBar from '../../common/EcosProgressBar';
import { t } from '../../../helpers/util';

import './style.scss';

export default class Report extends React.Component {
  static propTypes = {
    reportData: PropTypes.object,
    record: PropTypes.string,
    stateId: PropTypes.string,
    className: PropTypes.string,
    isLoading: PropTypes.bool,
    isMobile: PropTypes.bool,
    runUpdate: PropTypes.bool,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
    getReportData: PropTypes.func
  };

  static defaultProps = {
    className: ''
  };

  state = {
    contentHeight: 0
  };

  componentDidMount() {
    this.props.getReportData();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.runUpdate && this.props.runUpdate) {
      this.props.getReportData();
    }
  }

  gridRef = null;

  setHeight = contentHeight => {
    this.setState({ contentHeight });
  };

  renderAnalytics = () => {
    const { reportData, isLoading } = this.props;
    if (isLoading || !Object.keys(reportData).length) {
      return;
    }

    const gridWidth = this.gridRef ? this.gridRef.offsetWidth : 0;
    return (
      <div ref={this.props.forwardedRef}>
        <div
          className={classNames('ecos-report__grid', { 'ecos-report__grid-small': gridWidth && gridWidth < 911 })}
          ref={ref => {
            this.gridRef = ref;
          }}
        >
          <AnalyticsBlock
            max={reportData.totalCount}
            value={reportData.urgent.count}
            title={t('report-widget.urgent')}
            data={reportData.urgent.records}
            renderChart={params => <EcosProgressBar {...params} />}
            color="#FF5721"
          />
          <AnalyticsBlock
            max={reportData.totalCount}
            value={reportData.today.count}
            title={t('report-widget.today')}
            data={reportData.today.records}
            renderChart={params => <EcosProgressBar {...params} />}
            color="#FFC700"
          />
          <AnalyticsBlock
            max={reportData.totalCount}
            value={reportData.later.count}
            title={t('report-widget.later')}
            data={reportData.later.records}
            renderChart={params => <EcosProgressBar {...params} />}
            color="#00C308"
          />
        </div>
      </div>
    );
  };

  renderLoader() {
    const { isLoading } = this.props;

    if (!isLoading) {
      return null;
    }

    return <Loader blur />;
  }

  render() {
    const { height, minHeight, isMobile, reportData, isLoading } = this.props;
    const { contentHeight } = this.state;

    if (isMobile) {
      return this.renderAnalytics();
    }

    return (
      <Scrollbars
        style={{ height: contentHeight || '100%' }}
        className="ecos-report__scroll"
        renderTrackVertical={props => <div {...props} className="ecos-report__v-scroll" />}
      >
        <DefineHeight fixHeight={height} minHeight={minHeight} isMin={isLoading || isEmpty(reportData)} getOptimalHeight={this.setHeight}>
          {this.renderLoader()}
          {this.renderAnalytics()}
        </DefineHeight>
      </Scrollbars>
    );
  }
}
