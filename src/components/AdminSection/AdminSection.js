import React, { useState } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Col, Container, Row } from 'reactstrap';

import { t } from '../../helpers/util';
import { SectionTypes } from '../../constants/adminSection';
import pageTabList from '../../services/pageTabs/PageTabList';
import { Caption } from '../common/form';
import BPMNDesigner from '../BPMNDesigner';
import { JournalSettings } from '../Journals';
import JournalViewer from './JournalViewer';
import { AdminMenu } from './';

import './style.scss';

const AdminSection = ({ activeSection = {}, tabId, isActivePage }) => {
  const [isOpenMenu, setOpenMenu] = useState(false);
  const [journalStateId, setJournalStateId] = useState(null);

  const _setJournalStateId = id => id !== journalStateId && setJournalStateId(id);
  const isHidden = type => !isActivePage || activeSection.type !== type;

  return (
    <div className="ecos-admin-section__container">
      <div className={classNames('ecos-admin-section__content', { 'ecos-admin-section__content_full': !isOpenMenu })}>
        <Container fluid className="p-0">
          <Row className="ecos-admin-section__header">
            <Col>
              <Caption normal>{t(activeSection.label)}</Caption>
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <BPMNDesigner hidden={isHidden(SectionTypes.BPM)} />
              <JournalViewer hidden={isHidden(SectionTypes.JOURNAL)} tabId={tabId} upStateId={_setJournalStateId} />
            </Col>
          </Row>
        </Container>
      </div>
      <AdminMenu open={isOpenMenu} toggle={setOpenMenu}>
        {!isHidden(SectionTypes.JOURNAL) && journalStateId && <JournalSettings stateId={journalStateId} />}
      </AdminMenu>
    </div>
  );
};

const mapStateToProps = (state, props) => ({
  activeSection: state.adminSection.activeSection || {},
  groupSectionList: state.adminSection.groupSectionList,
  isActivePage: pageTabList.isActiveTab(props.tabId)
});

export default connect(mapStateToProps)(AdminSection);
