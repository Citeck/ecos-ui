import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isEqualWith from 'lodash/isEqualWith';
import get from 'lodash/get';

import { getBoardData, reloadBoardData, selectBoardId, selectTemplateId } from '../../../actions/kanban';
import { selectViewMode } from '../../../selectors/journals';
import { selectKanbanPageProps } from '../../../selectors/kanban';
import { JournalUrlParams as JUP, KanbanUrlParams as KUP, SourcesId } from '../../../constants';
import { t } from '../../../helpers/export/util';
import { getSearchParams } from '../../../helpers/urls';
import { Dropdown } from '../../common/form';
import { isKanban, KANBAN_SELECTOR_MODE, Labels } from '../constants';
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
    selectBoardId: boardId => dispatch(selectBoardId({ boardId, stateId })),
    selectTemplateId: template =>
      dispatch(
        selectTemplateId({
          templateId: template.id,
          stateId,
          type: KANBAN_SELECTOR_MODE.TEMPLATES,
          settings: template.settings
        })
      )
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
      urlParams[KUP.BOARD_ID] !== get(prevProps, ['urlParams', KUP.BOARD_ID]) ||
      urlParams[KUP.TEMPLATE_ID] !== get(prevProps, ['urlParams', KUP.TEMPLATE_ID])
    ) {
      this.setState({ isClose: false }, () => {
        this.props.getBoardData(this.getSelectedFromUrl(KANBAN_SELECTOR_MODE.BOARD));
      });
    }

    if (urlParams[JUP.SEARCH] !== get(prevProps, ['urlParams', JUP.SEARCH])) {
      this.props.reloadBoardData();
    }
  }

  componentWillUnmount() {
    this.setState({ isClose: true });
  }

  get boardId() {
    const id = get(this.props, 'boardConfig.id') || '';

    if (!id) {
      return id;
    }

    if (id.indexOf(SourcesId.BOARD) === 0) {
      return id;
    }

    return `${SourcesId.BOARD}@${id}`;
  }

  getSelectedFromUrl(type) {
    const { urlParams = {}, boardList, templateList } = this.props;

    switch (type) {
      case KANBAN_SELECTOR_MODE.BOARD:
        return urlParams.boardId || get(boardList, '[0].id');
      case KANBAN_SELECTOR_MODE.TEMPLATES:
        return urlParams[JUP.JOURNAL_SETTING_ID] || get(templateList, '[0].id');
      default:
        console.error('KanbanView. Invalid type');
    }
  }

  handleChangeBoard = board => {
    if (board) {
      this.props.selectBoardId(board.id);
    }
  };

  handleChangeTemplate = template => {
    if (template) {
      this.props.selectTemplateId(template);
    }
  };

  RightBarChild = () => {
    const { totalCount: count } = this.props;
    return <span className="ecos-pagination__text">{t(Labels.Kanban.BAR_TOTAL, { count })}</span>;
  };

  LeftBarChild = () => {
    const { boardList, templateList } = this.props;

    return (
      <>
        <Dropdown
          isButton
          isStatic
          source={boardList}
          value={this.getSelectedFromUrl(KANBAN_SELECTOR_MODE.BOARD)}
          valueField="id"
          titleField="name"
          onChange={this.handleChangeBoard}
          controlLabel={t(Labels.Kanban.BOARD_LIST)}
          controlClassName="ecos-btn_drop-down ecos-kanban__dropdown"
          menuClassName="ecos-kanban__dropdown-menu"
        />
        <Dropdown
          isButton
          isStatic
          source={templateList}
          value={this.getSelectedFromUrl(KANBAN_SELECTOR_MODE.TEMPLATES)}
          valueField="id"
          titleField="name"
          onChange={this.handleChangeTemplate}
          controlLabel={t(Labels.Kanban.TEMPLATE_LIST)}
          controlClassName="ecos-btn_drop-down ecos-kanban__dropdown"
          menuClassName="ecos-kanban__dropdown-menu"
        />
      </>
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
      bodyTopForwardedRef,
      bodyClassName,
      getMaxHeight,
      urlParams,
      isActivePage
    } = this.props;
    const { name } = boardConfig || {};
    const maxHeight = getMaxHeight();

    return (
      <div hidden={!isKanban(viewMode)} className={classNames('ecos-journal-view__kanban', bodyClassName)}>
        <div ref={bodyTopForwardedRef} className="ecos-journal-view__kanban-top">
          <Header title={name} config={boardConfig} configRec={this.boardId} />
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
