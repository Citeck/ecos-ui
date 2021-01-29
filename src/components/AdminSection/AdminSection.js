import React, { useEffect, useRef, useState } from 'react';
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
  const wrapperRef = useRef(null);
  const [isOpenMenu, setOpenMenu] = useState(false);
  const [journalStateId, setJournalStateId] = useState(null);
  const [additionalHeights, setAdditionalHeights] = useState(0);
  const displayBpm = activeSection.type === SectionTypes.BPM;
  const displayJournal = activeSection.type === SectionTypes.JOURNAL;

  const _setJournalStateId = id => id !== journalStateId && setJournalStateId(id);

  useEffect(() => {
    if (wrapperRef.current) {
      const wrap = wrapperRef.current;
      const header = wrap.querySelector('.ecos-admin-section__header');
      const { paddingTop, paddingBottom } = window.getComputedStyle(wrap);
      let heights = 0;

      heights += parseInt(paddingTop, 10) + parseInt(paddingBottom, 10);

      if (header) {
        heights += header.offsetTop;
      }

      setAdditionalHeights(heights);
    }
  }, [wrapperRef, isOpenMenu, activeSection]);

  return (
    <div className="ecos-admin-section__container" ref={wrapperRef}>
      <div className={classNames('ecos-admin-section__content', { 'ecos-admin-section__content_full': !isOpenMenu })}>
        <Container fluid className="px-4">
          <Row className="ecos-admin-section__header m-0 px-0">
            <Col className="m-0 p-0">
              <Caption normal>{t(activeSection.label)}</Caption>
            </Col>
          </Row>
          {!isEmpty(activeSection) && (
            <Row className="m-0 p-0">
              <Col className="m-0 p-0" md={12}>
                <BPMNDesigner hidden={!displayBpm} />
                <JournalViewer
                  hidden={!displayJournal}
                  tabId={tabId}
                  upStateId={_setJournalStateId}
                  additionalHeights={-additionalHeights}
                />
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
