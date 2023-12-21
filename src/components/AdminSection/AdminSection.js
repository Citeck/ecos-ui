import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Col, Container, Row } from 'reactstrap';
import get from 'lodash/get';
import throttle from 'lodash/throttle';

import BpmAdministration from '../../pages/BPMAdministrationPage/BpmAdministration';
import { t } from '../../helpers/util';
import { SectionTypes } from '../../constants/adminSection';
import pageTabList from '../../services/pageTabs/PageTabList';
import DevTools from '../../pages/DevTools';
import { Caption } from '../common/form';
import BPMNDesigner from '../BPMNDesigner';
import DMNDesigner from '../DMNDesigner';
import { JournalPresets } from '../Journals';
import JournalViewer from './JournalViewer';
import { AdminMenu } from './';
import { showModalJson } from '../../helpers/tools';
import { IcoBtn } from '../common/btns';
import { wrapArgs } from '../../helpers/redux';
import { execJournalAction } from '../../actions/journals';
import { ActionTypes } from '../Records/actions/constants';
import { fetchGroupSectionList } from '../../actions/adminSection';
import { SourcesId } from '../../constants';

import './style.scss';

class AdminSection extends React.PureComponent {
  _setWrapperRef;

  state = {
    journalStateId: null,
    additionalHeights: 0,
    needResetJournalView: false
  };

  componentDidMount() {
    const { isAccessible, getGroupSectionList } = this.props;

    if (!isAccessible) {
      getGroupSectionList();
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { getGroupSectionList } = this.props;
    if (prevState.journalStateId !== this.state.journalStateId) {
      this.setState({ needResetJournalView: true }, () => this.setState({ needResetJournalView: false }));
    }

    if (prevProps.isAccessible !== this.props.isAccessible && !this.props.isAccessible) {
      getGroupSectionList();
    }
  }

  setWrapperRef = ref => {
    if (ref) {
      this._setWrapperRef = ref;
    }
  };

  isHidden = type => {
    const { activeSection, isAccessibleSectionType, urlParams, isAccessible } = this.props;
    const { type: typeFromUrl } = urlParams;

    if (!isAccessible) {
      if (isAccessibleSectionType) {
        return typeFromUrl !== type;
      }

      return true;
    }

    return (activeSection.type || SectionTypes.DEV_TOOLS) !== type;
  };

  isFluid = () => ![SectionTypes.DEV_TOOLS].includes(get(this.props, 'activeSection.type'));

  setJournalStateId = stateId => {
    const { journalStateId } = this.state;

    if (journalStateId === stateId) {
      return;
    }

    this.setState({ journalStateId: stateId });
  };

  handleClickCaption = event => {
    if (event.shiftKey && (event.ctrlKey || event.metaKey)) {
      const { journalStateId } = this.state;

      showModalJson(get(this.props, ['journals', journalStateId, 'journalConfig'], {}), 'Config');
    }
  };

  handleEditJournal = throttle(
    () => {
      const { execJournalAction } = this.props;
      const { journalStateId } = this.state;
      const journalId = get(this.props, ['journals', journalStateId, 'journalConfig', 'id'], {});

      if (!journalId) {
        return;
      }

      execJournalAction(`${SourcesId.JOURNAL}@${journalId}`, { type: ActionTypes.EDIT });
    },
    300,
    {
      leading: false,
      trailing: true
    }
  );

  render() {
    const { activeSection, tabId, isActivePage, isOpenMenu, isAccessible, isAccessibleSectionType } = this.props;
    const { journalStateId, additionalHeights, needResetJournalView } = this.state;

    return (
      <div className="ecos-admin-section__container" ref={this.setWrapperRef}>
        <div className={classNames('ecos-admin-section__content', { 'ecos-admin-section__content_full': !isOpenMenu || !isAccessible })}>
          <Container fluid={this.isFluid()} className="p-0">
            {(isAccessible || isAccessibleSectionType) && (
              <Row className="ecos-admin-section__header m-0 px-0">
                <Col className="m-0 p-0">
                  <div className="m-0 px-0 d-flex align-items-baseline">
                    <Caption normal onClick={this.handleClickCaption}>
                      {t(activeSection.label)}
                    </Caption>

                    <IcoBtn
                      icon="icon-settings"
                      className="ecos-btn_grey ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue ml-2 h-auto py-0"
                      onClick={this.handleEditJournal}
                    />
                  </div>
                </Col>
              </Row>
            )}
            <Row className="m-0 p-0">
              <Col className="m-0 p-0" md={12}>
                <BpmAdministration hidden={this.isHidden(SectionTypes.BPMN_ADMIN)} />
                <DMNDesigner hidden={this.isHidden(SectionTypes.DMN)} />
                <BPMNDesigner hidden={this.isHidden(SectionTypes.BPM)} />
                <JournalViewer
                  hidden={this.isHidden(SectionTypes.JOURNAL)}
                  tabId={tabId}
                  upStateId={this.setJournalStateId}
                  additionalHeights={-additionalHeights}
                  stateId={needResetJournalView ? null : journalStateId}
                />
                <DevTools hidden={this.isHidden(SectionTypes.DEV_TOOLS)} isActivePage={isActivePage} />
              </Col>
            </Row>
          </Container>
        </div>
        {isAccessible && (
          <AdminMenu>{!this.isHidden(SectionTypes.JOURNAL) && journalStateId && <JournalPresets stateId={journalStateId} />}</AdminMenu>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({
  isOpenMenu: state.adminSection.isOpenMenu,
  activeSection: state.adminSection.activeSection || {},
  groupSectionList: state.adminSection.groupSectionList,
  isActivePage: pageTabList.isActiveTab(props.tabId),
  journals: state.journals
});

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    getGroupSectionList: () => dispatch(fetchGroupSectionList()),
    execJournalAction: (records, action, context) => dispatch(execJournalAction(w({ records, action, context })))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AdminSection);
