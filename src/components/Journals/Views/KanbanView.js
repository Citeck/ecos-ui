import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isEqualWith from 'lodash/isEqualWith';
import get from 'lodash/get';

import { getBoardConfig } from '../../../actions/kanban';
import { selectViewMode } from '../../../selectors/journals';
import { selectKanbanPageProps } from '../../../selectors/kanban';
import { t } from '../../../helpers/export/util';
import { isKanban, Labels } from '../constants';
import Kanban, { Bar } from '../Kanban';

import '../style.scss';

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

  RightBarChild = () => {
    const { totalCount: count } = this.props;
    return <span className="ecos-pagination__text">{t(Labels.KB_BAR_TOTAL, { count })}</span>;
  };

  LeftBarChild = () => {
    const { boardList } = this.props;
    return boardList.length;
    // return <Dropdown
    //   hasEmpty
    //   isStatic
    //   className={step}
    //   source={createVariants}
    //   keyFields={['id']}
    //   valueField="name"
    //   titleField="title"
    //   onChange={onAddRecord}
    //   controlIcon="icon-small-plus"
    //   controlClassName="ecos-journal__add-record ecos-btn_settings-down ecos-btn_white ecos-btn_hover_blue2"
    // />
  };

  render() {
    const { isClose } = this.state;

    if (isClose) {
      return null;
    }

    const {
      Header,
      UnavailableView,
      boardConfig,
      stateId,
      isLoading,
      isEnabled,
      viewMode,
      bodyForwardedRef,
      bodyTopForwardedRef,
      bodyClassName,
      maxHeight
    } = this.props;
    const { name } = boardConfig || {};

    return (
      <div hidden={!isKanban(viewMode)} ref={bodyForwardedRef} className={classNames('ecos-journal-view__kanban', bodyClassName)}>
        <div ref={bodyTopForwardedRef} className="ecos-journal-view__kanban-top">
          <Header title={name} />
          <Bar stateId={stateId} leftChild={<this.LeftBarChild />} rightChild={<this.RightBarChild />} />
        </div>

        <div>
          {!isEnabled && !isLoading && <UnavailableView />}
          <Kanban stateId={stateId} maxHeight={maxHeight} />
        </div>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(KanbanView);
