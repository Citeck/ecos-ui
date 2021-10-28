import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';

import { initDocLib } from '../../../actions/docLib';
import { selectViewMode } from '../../../selectors/journals';
import { selectDocLibPageProps } from '../../../selectors/docLib';
import { t } from '../../../helpers/export/util';
import { wrapArgs } from '../../../helpers/redux';
import { isDocLib, Labels } from '../constants';
import DocLibBreadcrumbs from '../DocLib/DocLibBreadcrumbs/DocLibBreadcrumbsContainer';
import DocLibSettingsBar from '../DocLib/DocLibSettingsBar/DocLibSettingsBarContainer';
import DocLibGroupActions from '../DocLib/DocLibGroupActions/DocLibGroupActionsContainer';
import DocLibPagination from '../DocLib/DocLibPagination/DocLibPaginationContainer';
import FilesViewer from '../DocLib/FilesViewer/FilesViewerContainer';

const mapStateToProps = (state, props) => {
  const viewMode = selectViewMode(state, props.stateId);
  const ownProps = selectDocLibPageProps(state, props.stateId);

  return {
    isMobile: get(state, 'view.isMobile'),
    pageTabsIsShow: get(state, 'pageTabs.isShow'),
    viewMode,
    ...ownProps
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    initDocLib: () => dispatch(initDocLib(w({})))
  };
};

class DocLibView extends React.Component {
  state = {
    isClose: true
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { viewMode, typeRef, isActivePage } = this.props;

    if (!isActivePage || !isDocLib(viewMode)) {
      return;
    }

    if (typeRef !== prevProps.typeRef || (typeRef && this.state.isClose)) {
      this.setState({ isClose: false }, () => this.props.initDocLib());
    }
  }

  componentWillUnmount() {
    this.setState({ isClose: true });
  }

  render() {
    const { isClose } = this.state;

    if (isClose) {
      return null;
    }

    const { viewMode, folderTitle, stateId, isMobile, isEnabled, isLoading, bodyClassName, Header, UnavailableView } = this.props;

    return (
      <div hidden={!isDocLib(viewMode)} className={classNames('ecos-journal-view__doc-lib', bodyClassName)}>
        <div className="ecos-journal__body-top">
          <Header title={folderTitle} labelBtnMenu={isMobile ? t(Labels.DocLib.SHOW_MENU_SM) : t(Labels.DocLib.SHOW_MENU)} />
          <DocLibBreadcrumbs stateId={stateId} />
          <DocLibSettingsBar stateId={stateId} />
          <DocLibGroupActions stateId={stateId} />
        </div>

        {!isEnabled && !isLoading && <UnavailableView />}
        {(isEnabled || isLoading) && <FilesViewer stateId={stateId} />}

        <div className="ecos-journal__footer">
          <DocLibPagination stateId={stateId} hasPageSize />
        </div>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DocLibView);
