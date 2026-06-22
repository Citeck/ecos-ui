import { URL } from '@citeck/constants';
import classNames from 'classnames';
import queryString from 'query-string';
import React, { useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Col, Row } from 'reactstrap';

import Well from '../../components/common/form/Well';
import { t } from '../../helpers/util';
import PageService from '../../services/PageService';

import { DevToolsContextProvider } from './DevToolsContext';
import ErrorText from './ErrorText';
import Loader from './Loader';
import TabContent from './TabContent';
import Tabs from './Tabs';
import api from './api';
import { TABS } from './constants';

import './DevTools.scss';

const DevTools = props => {
  const { hidden, isActivePage } = props;
  const [isReady, setIsReady] = useState(false);
  const [hasAccess, setAccess] = useState(false);
  const [activeTab, setActiveTab] = useState();
  const checkAccess = async () => {
    const isAccessible = await api.getIsAccessiblePage();
    setAccess(isAccessible);
    setIsReady(true);
  };

  useEffect(() => {
    const query = queryString.parse(window.location.search);
    let activeTab = query.activeTab;

    if (!Object.values(TABS).includes(activeTab)) {
      activeTab = TABS.BUILD;
    }

    setActiveTab(activeTab);

    checkAccess();
  }, []);

  useEffect(() => {
    if (props.tabLink === props.cacheKey) {
      setIsReady(false);
      setAccess(false);

      checkAccess();
    }
  }, [props.tabLink, props.cacheKey]);

  useEffect(() => {
    const query = queryString.parse(window.location.search);
    let newActiveTab = query.activeTab;

    if (!Object.values(TABS).includes(newActiveTab)) {
      newActiveTab = TABS.BUILD;
    }

    if (activeTab !== newActiveTab) {
      setActiveTab(newActiveTab);
    }
  }, [window.location.search]);

  const _setActiveTab = useCallback(
    tabId => {
      if (!isActivePage) {
        return;
      }

      const query = queryString.parse(window.location.search);

      query.activeTab = tabId;

      const stringQuery = queryString.stringify(query);

      setActiveTab(tabId);
      PageService.changeUrlLink(`${URL.DEV_TOOLS}?${stringQuery}`, { updateUrl: true });
    },
    [isActivePage, window.location.search]
  );

  return (
    <DevToolsContextProvider activeTab={activeTab} setActiveTab={_setActiveTab}>
      <div className={classNames({ 'd-none': hidden })}>
        {hasAccess ? (
          <>
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
          </>
        ) : (
          <Row>
            <Col>
              <Well className="dev-tools-page__access-denied">
                {!isReady ? <Loader /> : <ErrorText>{t('dev-tools.error.access-denied')}</ErrorText>}
              </Well>
            </Col>
          </Row>
        )}
      </div>
    </DevToolsContextProvider>
  );
};

const mapStateToProps = state => ({
  isOpenMenu: state.adminSection.isOpenMenu
});

export default connect(mapStateToProps)(DevTools);
