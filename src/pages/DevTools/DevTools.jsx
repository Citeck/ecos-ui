import React, { useCallback, useEffect, useState } from 'react';
import { Col, Container, Row } from 'reactstrap';
import queryString from 'query-string';
import classNames from 'classnames';

import PageService from '../../services/PageService';
import Caption from '../../components/common/form/Caption';
import Well from '../../components/common/form/Well';
import { AdminMenu } from '../../components/AdminSection';
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
import { connect } from 'react-redux';
import pageTabList from '../../services/pageTabs/PageTabList';

const DevTools = props => {
  const { isOpenMenu } = props;
  const [isReady, setIsReady] = useState(false);
  const [hasAccess, setAccess] = useState(false);
  // const [isOpenMenu, setOpenMenu] = useState(false);
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
    <div className="dev-tools-page">
      <div className={classNames('dev-tools-page__content', { 'dev-tools-page__content_full': !isOpenMenu })}>
        <DevToolsContextProvider activeTab={activeTab} setActiveTab={setActiveTab}>
          <Container className="p-0">
            <Row>
              <Col>
                <Caption normal className="dev-tools-page__title">
                  {t('page-tabs.dev-tools')}
                </Caption>
              </Col>
            </Row>
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
          </Container>
        </DevToolsContextProvider>
      </div>
      {hasAccess && (
        <AdminMenu
        // open={isOpenMenu}
        // toggle={setOpenMenu}
        />
      )}
    </div>
  );
};

const mapStateToProps = state => ({
  isOpenMenu: state.adminSection.isOpenMenu
});

export default connect(mapStateToProps)(DevTools);

// export default props => {
//   const [isReady, setIsReady] = useState(false);
//   const [hasAccess, setAccess] = useState(false);
//   const [isOpenMenu, setOpenMenu] = useState(false);
//   const checkAccess = async () => {
//     const isAccessible = await api.getIsAccessiblePage();
//     setAccess(isAccessible);
//     setIsReady(true);
//   };
//
//   useEffect(() => {
//     checkAccess();
//   }, []);
//
//   useEffect(() => {
//     if (props.tabLink === props.cacheKey) {
//       setIsReady(false);
//       setAccess(false);
//
//       checkAccess();
//     }
//   }, [props.tabLink, props.cacheKey]);
//
//   const query = queryString.parse(window.location.search);
//   let activeTab = query.activeTab;
//
//   if (!Object.values(TABS).includes(activeTab)) {
//     activeTab = TABS.BUILD;
//   }
//
//   const setActiveTab = useCallback(
//     tabId => {
//       const query = queryString.parse(window.location.search);
//       query.activeTab = tabId;
//       const stringQuery = queryString.stringify(query);
//       PageService.changeUrlLink(`${URL.DEV_TOOLS}?${stringQuery}`, { updateUrl: true });
//     },
//     [window.location.search]
//   );
//
//   return (
//     <div className="dev-tools-page">
//       <div className={classNames('dev-tools-page__content', { 'dev-tools-page__content_full': !isOpenMenu })}>
//         <DevToolsContextProvider activeTab={activeTab} setActiveTab={setActiveTab}>
//           <Container className="p-0">
//             <Row>
//               <Col>
//                 <Caption normal className="dev-tools-page__title">
//                   {t('page-tabs.dev-tools')}
//                 </Caption>
//               </Col>
//             </Row>
//             {hasAccess ? (
//               <>
//                 <Row>
//                   <Col>
//                     <Tabs />
//                   </Col>
//                 </Row>
//                 <Row>
//                   <Col>
//                     <TabContent />
//                   </Col>
//                 </Row>
//               </>
//             ) : (
//               <Row>
//                 <Col>
//                   <Well className="dev-tools-page__access-denied">
//                     {!isReady ? <Loader /> : <ErrorText>{t('dev-tools.error.access-denied')}</ErrorText>}
//                   </Well>
//                 </Col>
//               </Row>
//             )}
//           </Container>
//         </DevToolsContextProvider>
//       </div>
//       {hasAccess && <AdminMenu open={isOpenMenu} toggle={setOpenMenu} />}
//     </div>
//   );
// };
