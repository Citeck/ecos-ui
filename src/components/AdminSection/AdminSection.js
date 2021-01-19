import React, { useState } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Col, Container, Row } from 'reactstrap';
import isEmpty from 'lodash/isEmpty';

import { t } from '../../helpers/util';
import { SectionTypes } from '../../constants/adminSection';
import { Caption } from '../common/form';
import BPMNDesigner from '../BPMNDesigner';
import { JournalSettings } from '../Journals';
import JournalViewer from './JournalViewer';
import { AdminMenu } from './';

import './style.scss';

const AdminSection = ({ activeSection = {}, tabId }) => {
  const [isOpenMenu, setOpenMenu] = useState(false);
  const [journalStateId, setJournalStateId] = useState(null);
  const displayBpm = activeSection.type === SectionTypes.BPM;
  const displayJournal = activeSection.type === SectionTypes.JOURNAL;

  const _setJournalStateId = id => id !== journalStateId && setJournalStateId(id);

  return (
    <div className="ecos-admin-section__container">
      <div className={classNames('ecos-admin-section__content', { 'ecos-admin-section__content_full': !isOpenMenu })}>
        <Container fluid className="p-0">
          <Row className="ecos-admin-section__header">
            <Col>
              <Caption normal>{t(activeSection.label)}</Caption>
            </Col>
          </Row>
          {!isEmpty(activeSection) && (
            <Row>
              <Col md={12}>
                <BPMNDesigner hidden={!displayBpm} />
                <JournalViewer hidden={!displayJournal} tabId={tabId} upStateId={_setJournalStateId} />
              </Col>
            </Row>
          )}
        </Container>
      </div>
      <AdminMenu open={isOpenMenu} toggle={setOpenMenu}>
        {displayJournal && journalStateId && <JournalSettings stateId={journalStateId} />}
      </AdminMenu>
    </div>
  );
};

const mapStateToProps = state => ({
  activeSection: state.adminSection.activeSection || {},
  groupSectionList: state.adminSection.groupSectionList
});

export default connect(mapStateToProps)(AdminSection);
