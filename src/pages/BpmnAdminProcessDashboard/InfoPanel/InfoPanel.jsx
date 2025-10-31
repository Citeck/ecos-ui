import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import moment from 'moment';
import React from 'react';
import { connect } from 'react-redux';

import { getMetaInfo } from '../../../actions/processAdmin';
import Dashlet from '../../../components/Dashlet';
import { Loader } from '../../../components/common';
import PanelTitle, { COLOR_GRAY } from '../../../components/common/PanelTitle/PanelTitle';
import { Btn } from '../../../components/common/btns';
import BaseWidget from '../../../components/widgets/BaseWidget';
import { createDocumentUrl } from '../../../helpers/urls';
import { t } from '../../../helpers/util';
import { selectProcessMetaInfo, selectProcessVersions } from '../../../selectors/processAdmin';
import PageService from '../../../services/PageService';
import VersionSelect from '../VersionSelect';

import ActionsButton from './components/ActionsButton';
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

  handleLinkClick = href => {
    PageService.changeUrlLink(createDocumentUrl(href), {
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
    console.log(processId, versions);
    return (
      <Dashlet title={t(Labels.INFO_TITLE)} className="info-panel" setRef={this.setDashletRef} needGoTo={false} disableCollapse>
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
                <ActionsButton processId={processId} />
              </div>

              <div className="info-panel__main-item">
                <PanelTitle narrow color={COLOR_GRAY}>
                  {t(Labels.DEFINITION_REF)}
                </PanelTitle>
                <Btn
                  className="ecos-btn_blue"
                  onClick={() => this.handleLinkClick(metaInfo.definitionRefId)}
                  disabled={!metaInfo.definitionRef}
                >
                  <p>{metaInfo.definitionRef || t(Labels.NOT_DEFINED)}</p>
                  <i className="icon-small-right" />
                </Btn>
              </div>
            </div>

            <div className="info-panel__secondary">
              <span className="info-panel__main-item info-panel__main-item_full_width">{`${t(Labels.MODIFIER)}: ${
                metaInfo.modifier || t(Labels.NOT_DEFINED)
              }`}</span>
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

export default connect(mapStateToProps, mapDispatchToProps)(InfoPanel);
