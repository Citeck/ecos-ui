import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isEqualWith from 'lodash/isEqualWith';
import get from 'lodash/get';

import { getBoardData, reloadBoardData, selectBoardId } from '../../../actions/kanban';
import { selectViewMode } from '../../../selectors/journals';
import { selectKanbanPageProps } from '../../../selectors/kanban';
import { JournalUrlParams as JUP, KanbanUrlParams as KUP } from '../../../constants';
import { t } from '../../../helpers/export/util';
import { getSearchParams } from '../../../helpers/urls';
import { Dropdown } from '../../common/form';
import { isKanban, Labels } from '../constants';
import Kanban, { Bar } from '../Kanban';

import '../style.scss';

function mapStateToProps(state, props) {
  const viewMode = selectViewMode(state, props.stateId);
  const ownProps = selectKanbanPageProps(state, props.stateId);

  return {
    urlParams: getSearchParams(),
    viewMode,
    ...ownProps
  };
}

function mapDispatchToProps(dispatch, props) {
  const stateId = props.stateId;

  return {
    getBoardData: boardId => dispatch(getBoardData({ boardId, stateId })),
    reloadBoardData: () => dispatch(reloadBoardData({ stateId })),
    selectBoardId: boardId => dispatch(selectBoardId({ boardId, stateId }))
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

    if (
      !isEqualWith(boardList, prevProps.boardList, isEqual) ||
      (!isEmpty(boardList) && this.state.isClose) ||
      urlParams[KUP.BOARD_ID] !== get(prevProps, ['urlParams', KUP.BOARD_ID])
    ) {
      this.setState({ isClose: false }, () => this.props.getBoardData(this.getSelectedBoard()));
    }

    if (urlParams[JUP.SEARCH] !== get(prevProps, ['urlParams', JUP.SEARCH])) {
      this.props.reloadBoardData();
    }
  }

  componentWillUnmount() {
    this.setState({ isClose: true });
  }

  getSelectedBoard() {
    const { urlParams = {}, boardList } = this.props;
    return urlParams.boardId || get(boardList, '[0].id');
  }

  handleChangeBoard = board => {
    this.props.selectBoardId(board.id);
  };

  RightBarChild = () => {
    const { totalCount: count } = this.props;
    return <span className="ecos-pagination__text">{t(Labels.Kanban.BAR_TOTAL, { count })}</span>;
  };

  LeftBarChild = () => {
    const { boardList } = this.props;

    return (
      <Dropdown
        isButton
        isStatic
        source={boardList}
        value={this.getSelectedBoard()}
        valueField={'id'}
        titleField={'name'}
        onChange={this.handleChangeBoard}
        controlLabel={t(Labels.Kanban.BOARD_LIST)}
        controlClassName="ecos-btn_drop-down ecos-kanban__dropdown"
        menuClassName="ecos-kanban__dropdown-menu"
      />
    );
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
      maxHeight,
      urlParams,
      isActivePage
    } = this.props;
    const { name } = boardConfig || {};

    return (
      <div hidden={!isKanban(viewMode)} ref={bodyForwardedRef} className={classNames('ecos-journal-view__kanban', bodyClassName)}>
        <div ref={bodyTopForwardedRef} className="ecos-journal-view__kanban-top">
          <Header title={name} />
          <Bar
            urlParams={urlParams}
            isActivePage={isActivePage}
            stateId={stateId}
            leftChild={<this.LeftBarChild />}
            rightChild={<this.RightBarChild />}
          />
        </div>
        {!isEnabled && !isLoading && <UnavailableView />}
        <Kanban stateId={stateId} maxHeight={maxHeight} />
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(KanbanView);
