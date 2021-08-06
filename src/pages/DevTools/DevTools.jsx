import React, { useCallback, useEffect, useState } from 'react';
import { Col, Row } from 'reactstrap';
import queryString from 'query-string';
import classNames from 'classnames';
import { connect } from 'react-redux';

import PageService from '../../services/PageService';
import Well from '../../components/common/form/Well';
import { t } from '../../helpers/util';

import { URL } from '../../constants';
import api from './api';
import { TABS } from './constants';
import { DevToolsContextProvider } from './DevToolsContext';
import Tabs from './Tabs';
import TabContent from './TabContent';
import ErrorText from './ErrorText';
import Loader from './Loader';

import './DevTools.scss';

const DevTools = props => {
  const { hidden } = props;
  const [isReady, setIsReady] = useState(false);
  const [hasAccess, setAccess] = useState(false);
  const checkAccess = async () => {
    const isAccessible = await api.getIsAccessiblePage();
    setAccess(isAccessible);
    setIsReady(true);
  };

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (props.tabLink === props.cacheKey) {
      setIsReady(false);
      setAccess(false);

      checkAccess();
    }
  }, [props.tabLink, props.cacheKey]);

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
    <DevToolsContextProvider activeTab={activeTab} setActiveTab={setActiveTab}>
      <div
        className={classNames({
          'd-none': hidden
        })}
      >
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
