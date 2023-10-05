import React from 'react';
import { connect } from 'react-redux';

import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import moment from 'moment';

import PanelTitle, { COLOR_GRAY } from '../../../components/common/PanelTitle/PanelTitle';
import { Loader } from '../../../components/common';
import Dashlet from '../../../components/Dashlet';
import BaseWidget from '../../../components/widgets/BaseWidget';
import { selectProcessMetaInfo, selectProcessVersions } from '../../../selectors/processAdmin';
import { getMetaInfo } from '../../../actions/processAdmin';
import { createDocumentUrl } from '../../../helpers/urls';
import { Btn } from '../../../components/common/btns';
import PageService from '../../../services/PageService';
import { t } from '../../../helpers/util';
import VersionSelect from '../VersionSelect';
import { Labels } from './constants';

import './style.scss';

class InfoPanel extends BaseWidget {
  componentDidMount() {
    const { processId, getMetaInfo } = this.props;

    isFunction(getMetaInfo) && getMetaInfo(processId);
  }

  componentDidUpdate(prevProps) {
    const { processId, getMetaInfo } = this.props;

    if (processId !== prevProps.processId) {
      isFunction(getMetaInfo) && getMetaInfo(processId);
    }
  }

  handleDefClick = () => {
    const { processId } = this.props;
    PageService.changeUrlLink(createDocumentUrl(processId), {
      openNewTab: true
    });
  };

  renderInfo = attribute => {
    const { metaInfo } = this.props;

    return metaInfo[attribute] || t(Labels.NOT_DEFINED);
  };

  render() {
    const { versions, metaInfo, processId } = this.props;

    const showLoader = !metaInfo || metaInfo.loading;
    const showVersionsLoading = get(versions, 'loading');

    return (
      <Dashlet
        title={t(Labels.INFO_TITLE)}
        className="info-panel"
        needGoTo={false}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={this.isCollapsed}
        setRef={this.setDashletRef}
      >
        {showLoader && <Loader />}
        {!showLoader && (
          <div className="info-panel__body">
            <div className="info-panel__main">
              <div className="info-panel__main-item">
                <PanelTitle narrow color={COLOR_GRAY}>
                  {t(Labels.VERSION)}
                </PanelTitle>
                <VersionSelect processId={processId} />
              </div>
              <div className="info-panel__main-item">
                <PanelTitle narrow color={COLOR_GRAY}>
                  {t(Labels.DEFINITION_REF)}
                </PanelTitle>
                <Btn className="ecos-btn_blue" onClick={this.handleDefClick} disabled={!metaInfo.definitionRef}>
                  {metaInfo.definitionRef || t(Labels.NOT_DEFINED)}
                  <i className="icon-small-right" />
                </Btn>
              </div>
            </div>

            <div className="info-panel__secondary">
              <span className="info-panel__main-item info-panel__main-item_full_width">{`${t(Labels.MODIFIER)}: ${metaInfo.modifier ||
                t(Labels.NOT_DEFINED)}`}</span>
              <span className="info-panel__main-item info-panel__main-item_full_width">{`${t(Labels.MODIFIED)}: ${
                metaInfo.modified ? moment(metaInfo.modified).format('LLL') : t(Labels.NOT_DEFINED)
              }`}</span>
            </div>

            <div className="info-panel__statistic">
              <div className="info-panel__statistic-item">
                <h5>{`${t(Labels.INSTANCES_COUNT)}:`}</h5>
                <div className="info-panel__statistic-count">{get(metaInfo, 'statistics.instancesCount')}</div>
              </div>
              <div className="info-panel__statistic-item">
                <h5>{`${t(Labels.INCIDENT_COUNT)}:`}</h5>
                <div className="info-panel__statistic-count">{get(metaInfo, 'statistics.incidentCount')}</div>
              </div>
              <div className="info-panel__statistic-item">
                <h5>{`${t(Labels.VERSIONS_COUNT)}:`}</h5>
                <div className="info-panel__statistic-count">
                  {showVersionsLoading ? <Loader type="points" /> : get(versions, 'data.length')}
                </div>
              </div>
              <div className="info-panel__statistic-item">
                <h5>{`${t(Labels.INSTANCES_COUNT)}:`}</h5>
                <span className="info-panel__statistic-item_text_gray">{t(Labels.BY_ALL_VERSIONS)}</span>
                <div className="info-panel__statistic-count">{metaInfo.allRunningInstancesCount}</div>
              </div>
            </div>
          </div>
        )}
      </Dashlet>
    );
  }
}

const mapStateToProps = (store, props) => {
  return {
    metaInfo: selectProcessMetaInfo(store, props),
    versions: selectProcessVersions(store, props)
  };
};

const mapDispatchToProps = dispatch => ({
  getMetaInfo: processId => dispatch(getMetaInfo({ processId }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(InfoPanel);
