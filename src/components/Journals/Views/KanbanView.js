import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isEqualWith from 'lodash/isEqualWith';
import get from 'lodash/get';

import { selectViewMode } from '../../../selectors/journals';
import { isKanban } from '../constants';
import ViewTabs from '../ViewTabs';
import { selectKanbanPageProps } from '../../../selectors/kanban';
import { getBoardConfig } from '../../../actions/kanban';
import { Loader } from '../../common';
import Kanban from '../Kanban';

function mapStateToProps(state, props) {
  const viewMode = selectViewMode(state, props.stateId);
  const ownProps = selectKanbanPageProps(state, props.stateId);

  return {
    viewMode,
    ...ownProps
  };
}

function mapDispatchToProps(dispatch, props) {
  const stateId = props.stateId;

  return {
    getBoardConfig: boardId => dispatch(getBoardConfig({ boardId, stateId }))
  };
}

class KanbanView extends React.Component {
  state = {
    isClose: true
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { isActivePage, viewMode, urlParams = {}, boardList } = this.props;

    if (!isActivePage || !isKanban(viewMode)) {
      return;
    }

    if (!isEqualWith(boardList, prevProps.boardList, isEqual) || (!isEmpty(boardList) && this.state.isClose)) {
      const { boardId } = urlParams || get(boardList, '[0].id');
      this.setState({ isClose: false }, () => this.props.getBoardConfig(boardId));
    }
  }

  componentWillUnmount() {
    this.setState({ isClose: true });
  }

  render() {
    const { Header, boardConfig, isLoading, stateId, viewMode, bodyForwardedRef, bodyClassName } = this.props;
    const { name } = boardConfig || {};

    return (
      <div hidden={!isKanban(viewMode)} ref={bodyForwardedRef} className={classNames('ecos-journal-view__kanban', bodyClassName)}>
        <Header title={name} />
        <div>
          <ViewTabs stateId={stateId} />
        </div>
        <div>
          {isLoading && <Loader />}
          <Kanban stateId={stateId} />
        </div>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(KanbanView);
