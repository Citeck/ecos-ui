import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Col, Container, Row } from 'reactstrap';
import get from 'lodash/get';
import throttle from 'lodash/throttle';

import { t } from '../../helpers/util';
import { SectionTypes } from '../../constants/adminSection';
import pageTabList from '../../services/pageTabs/PageTabList';
import DevTools from '../../pages/DevTools';
import { Caption } from '../common/form';
import BPMNDesigner from '../BPMNDesigner';
import { JournalPresets } from '../Journals';
import JournalViewer from './JournalViewer';
import { AdminMenu } from './';

import './style.scss';
import { showModalJson } from '../../helpers/tools';
import { IcoBtn } from '../common/btns';
import { wrapArgs } from '../../helpers/redux';
import { execJournalAction } from '../../actions/journals';
import { SourcesId } from '../../constants';
import { ActionTypes } from '../Records/actions';

class AdminSection extends React.PureComponent {
  _setWrapperRef;

  state = {
    journalStateId: null,
    additionalHeights: 0,
    needResetJournalView: false
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevState.journalStateId !== this.state.journalStateId) {
      this.setState({ needResetJournalView: true }, () => this.setState({ needResetJournalView: false }));
    }
  }

  setWrapperRef = ref => {
    if (ref) {
      this._setWrapperRef = ref;
    }
  };

  isHidden = type => {
    const { isActivePage, activeSection } = this.props;

    return !isActivePage || (activeSection.type || SectionTypes.DEV_TOOLS) !== type;
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
    if (event.ctrlKey && event.shiftKey) {
      const { journalStateId } = this.state;

      showModalJson(get(this.props, ['journals', journalStateId, 'journalConfig'], {}), 'Config');
    }
  };

  handleEditJournal = throttle(
    () => {
      const { execJournalAction } = this.props;
      const { journalStateId } = this.state;
      const journalId = get(this.props, ['journals', journalStateId, 'journalConfig', 'id'], {});

      execJournalAction(`${SourcesId.JOURNAL}@${journalId}`, { type: ActionTypes.EDIT });
    },
    300,
    {
      leading: false,
      trailing: true
    }
  );

  render() {
    const { activeSection, tabId, isActivePage, isOpenMenu } = this.props;
    const { journalStateId, additionalHeights, needResetJournalView } = this.state;

    return (
      <div className="ecos-admin-section__container" ref={this.setWrapperRef}>
        <div className={classNames('ecos-admin-section__content', { 'ecos-admin-section__content_full': !isOpenMenu })}>
          <Container fluid={this.isFluid()} className="p-0">
            <Row className="ecos-admin-section__header m-0 px-0">
              <Col className="m-0 p-0">
                <Caption normal onClick={this.handleClickCaption}>
                  {t(activeSection.label)}
                </Caption>

                <IcoBtn
                  icon="icon-settings"
                  className="journals-head__settings-btn ecos-btn_grey ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue"
                  onClick={this.handleEditJournal}
                />
              </Col>
            </Row>
            <Row className="m-0 p-0">
              <Col className="m-0 p-0" md={12}>
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
        <AdminMenu>{!this.isHidden(SectionTypes.JOURNAL) && journalStateId && <JournalPresets stateId={journalStateId} />}</AdminMenu>
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
    execJournalAction: (records, action, context) => dispatch(execJournalAction(w({ records, action, context })))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AdminSection);
