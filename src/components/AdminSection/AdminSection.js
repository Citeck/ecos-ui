import React, { useEffect, useRef, useState } from 'react';
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
import { usePrevious } from '../../hooks/usePrevious';

import './style.scss';

const AdminSection = ({ activeSection = {}, tabId, isActivePage }) => {
  const wrapperRef = useRef(null);
  const [isOpenMenu, setOpenMenu] = useState(false);
  const [journalStateId, setJournalStateId] = useState(null);
  const [additionalHeights, setAdditionalHeights] = useState(0);
  const prevJournalStateId = usePrevious(journalStateId);

  const _setJournalStateId = id => {
    if (id !== journalStateId) {
      setJournalStateId(id);
    }
  };
  const isHidden = type => !isActivePage || activeSection.type !== type;

  useEffect(() => {
    if (wrapperRef.current) {
      const wrap = wrapperRef.current;
      const header = wrap.querySelector('.ecos-admin-section__header');
      const { paddingTop, paddingBottom } = window.getComputedStyle(wrap);
      let heights = 0;

      heights += parseInt(paddingTop, 10) + parseInt(paddingBottom, 10) - 2;

      if (header) {
        heights += header.offsetTop;
      }

      setAdditionalHeights(heights);
    }
  }, [wrapperRef, isOpenMenu, activeSection]);

  return (
    <div className="ecos-admin-section__container" ref={wrapperRef}>
      <div className={classNames('ecos-admin-section__content', { 'ecos-admin-section__content_full': !isOpenMenu })}>
        <Container fluid className="p-0">
          <Row className="ecos-admin-section__header m-0 px-0">
            <Col className="m-0 p-0">
              <Caption normal>{t(activeSection.label)}</Caption>
            </Col>
          </Row>
          <Row className="m-0 p-0">
            <Col className="m-0 p-0" md={12}>
              <BPMNDesigner hidden={isHidden(SectionTypes.BPM)} />
              <JournalViewer
                hidden={isHidden(SectionTypes.JOURNAL)}
                tabId={tabId}
                upStateId={_setJournalStateId}
                additionalHeights={-additionalHeights}
                stateId={prevJournalStateId && prevJournalStateId !== journalStateId ? null : journalStateId}
              />
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