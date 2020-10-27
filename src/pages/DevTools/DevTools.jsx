import React, { useCallback } from 'react';
import { Container, Row, Col } from 'reactstrap';
import queryString from 'query-string';

import PageService from '../../services/PageService';
import Caption from '../../components/common/form/Caption';
import { t } from '../../helpers/util';
import { URL } from '../../constants';

import { TABS } from './constants';
import { DevToolsContextProvider } from './DevToolsContext';
import Tabs from './Tabs';
import TabContent from './TabContent';

import './DevTools.scss';

export default () => {
  const query = queryString.parse(window.location.search);
  let activeTab = query.activeTab;
  if (!Object.values(TABS).includes(activeTab)) {
    activeTab = TABS.BUILD;
  }

  const setActiveTab = useCallback(
    tabId => {
      const query = queryString.parse(window.location.search);
      query.activeTab = tabId;
      const stringQuery = queryString.stringify(query);
      PageService.changeUrlLink(`${URL.DEV_TOOLS}?${stringQuery}`, { updateUrl: true });
    },
    [window.location.search]
  );

  return (
    <div className="dev-tools-page">
      <DevToolsContextProvider activeTab={activeTab} setActiveTab={setActiveTab}>
        <Container>
          <Row>
            <Col>
              <Caption normal className="dev-tools-page__title">
                {t('page-tabs.dev-tools')}
              </Caption>
            </Col>
          </Row>
          <Row>
            <Col>
              <Tabs />
            </Col>
          </Row>
          <Row>
            <Col>
              <TabContent />
            </Col>
          </Row>
        </Container>
      </DevToolsContextProvider>
    </div>
  );
};
