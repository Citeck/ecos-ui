import { MIN_WIDTH_DASHLET_LARGE } from '@citeck/constants/index';
import PropTypes from 'prop-types';
import React from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { connect } from 'react-redux';

import Dashlet from '@/components/dashboard/Dashlet';
import { Tooltip } from '@/components/common';
import { IcoBtn } from '@/components/common/btns/index';
import NoComments from '@/components/common/icons/NoComments';
import BaseWidget, { EVENTS } from '../BaseWidget';

import Comment from './Comment';
import { CommentInterface, IdInterface } from './propsInterfaces';

import { getComments, updateComments } from '@/actions/comments';
import { BASE_HEIGHT } from '@/helpers/comments';
import { getRecordRef } from '@/helpers/urls';
import { getAdaptiveNumberStr, isMobileDevice, t } from '@/helpers/util';
import { selectStateByRecordRef } from '@/selectors/comments';
import DAction from '@/services/DashletActionService';
import { Events } from '@/services/PageService';

import './style.scss';

class Comments extends BaseWidget {
  static propTypes = {
    id: IdInterface.isRequired,
    comments: PropTypes.arrayOf(PropTypes.shape(CommentInterface)),
    dataStorageFormat: PropTypes.oneOf(['raw', 'html', 'plain-text']),
    maxLength: PropTypes.number,
    totalCount: PropTypes.number,
    errorMessage: PropTypes.string,
    record: PropTypes.string,
    saveIsLoading: PropTypes.bool,
    fetchIsLoading: PropTypes.bool,
    hasMore: PropTypes.bool,
    canDragging: PropTypes.bool,
    maxHeightByContent: PropTypes.bool,
    commentListMaxHeight: PropTypes.number,
    isMobile: PropTypes.bool,
    userName: PropTypes.string,
    onSave: PropTypes.func,
    onDelete: PropTypes.func,
    getComments: PropTypes.func,
    updateComments: PropTypes.func,
    createComment: PropTypes.func,
    updateComment: PropTypes.func,
    deleteComment: PropTypes.func,
    setErrorMessage: PropTypes.func
  };

  static defaultProps = {
    comments: [],
    maxLength: 5000,
    errorMessage: '',
    saveIsLoading: false,
    fetchIsLoading: false,
    canDragging: false,
    maxHeightByContent: false,
    commentListMaxHeight: 217,
    dataStorageFormat: 'raw',
    onSave: () => {},
    onDelete: () => {},
    getComments: () => {},
    updateComments: () => {},
    createComment: () => {},
    updateComment: () => {},
    deleteComment: () => {},
    setErrorMessage: () => {}
  };

  constructor(props) {
    super(props);

    this.contentRef = React.createRef();
    this._scroll = React.createRef();

    this.state = {
      ...this.state,
      isEdit: false,
      headerHeight: 0,
      editableComment: null,
      commentForDeletion: null,
      editorHeight: BASE_HEIGHT,
      recordRef: props.record,
      htmlComment: '',
      rawComment: '',
      isOpenLinkDialog: false,
      linkUrl: '',
      linkText: ''
    };

    this.instanceRecord.events.on(EVENTS.UPDATE_TASKS_WIDGETS, this.fetchData);
    this.instanceRecord.events.on(EVENTS.UPDATE_COMMENTS, this.fetchData);
    this.instanceRecord.events.on(EVENTS.RECORD_ACTION_COMPLETED, this.fetchDataAfterAction);
    document.addEventListener(Events.CHANGE_URL_LINK_EVENT, this.handleChangeTabLink.bind(this));
  }

  componentDidMount() {
    super.componentDidMount();

    this.fetchData();
  }

  componentWillUnmount() {
    super.componentWillUnmount();

    this.instanceRecord.events.off(EVENTS.UPDATE_TASKS_WIDGETS, this.fetchData);
    this.instanceRecord.events.off(EVENTS.UPDATE_COMMENTS, this.fetchData);
    this.instanceRecord.events.off(EVENTS.RECORD_ACTION_COMPLETED, this.fetchDataAfterAction);
    document.removeEventListener(Events.CHANGE_URL_LINK_EVENT, this.handleChangeTabLink.bind(this));
  }

  fetchDataAfterAction = () => {
    const { updateComments } = this.props;

    updateComments(this.props.comments || []);
  };

  fetchData = () => {
    const { getComments, record } = this.props;
    const newRecordRef = getRecordRef() || record;

    getComments(newRecordRef);
  };

  handleChangeTabLink = () => {
    const { updateComments, record } = this.props;
    const newRecordRef = getRecordRef() || record;

    if (newRecordRef) {
      this.setState({ recordRef: newRecordRef }, () => {
        updateComments([], newRecordRef);
      });
    }
  };

  get className() {
    const { width } = this.state;
    const classes = ['ecos-comments'];

    if (width < MIN_WIDTH_DASHLET_LARGE) {
      classes.push('ecos-comments_small');
    }

    return classes.join(' ');
  }

  handleShowEditor = () => {
    this.setState({
      isEdit: true
    });
  };

  handleCloseEditor = () => {
    this.setState({
      isEdit: false
    });
  };

  renderAddButton = () => {
    const { id } = this.props;
    const tooltipId = `comments-add-${id}`;

    return (
      <Tooltip placement="top" target={tooltipId} text={t('comments-widget.add')} trigger="hover" off={isMobileDevice()}>
        <IcoBtn
          id={tooltipId}
          key="comments-add"
          icon="icon-small-plus"
          className="ecos-btn_i ecos-btn_i_plus-lg ecos-btn_grey2 ecos-btn_width_auto ecos-btn_hover_t-light-blue ecos-comments__add-btn"
          onClick={this.handleShowEditor}
        />
      </Tooltip>
    );
  };

  renderEditor() {
    const { isEdit, recordRef } = this.state;
    const { saveIsLoading, userName, actionFailed } = this.props;

    if (!isEdit) {
      return null;
    }

    return (
      <div className="ecos-comments__editor">
        <Comment
          comment={null}
          userName={userName}
          saveIsLoading={saveIsLoading}
          actionFailed={actionFailed}
          recordRef={recordRef}
          onClose={this.handleCloseEditor}
        />
      </div>
    );
  }

  renderSkeleton() {
    return (
      <div className="ecos-comments__skeleton">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="ecos-comments__skeleton-item">
            <div className="ecos-comments__skeleton-header">
              <div className="ecos-comments__skeleton-avatar ecos-comments__shimmer" />
              <div className="ecos-comments__skeleton-meta">
                <div className="ecos-comments__skeleton-name ecos-comments__shimmer" style={{ width: `${60 + ((i * 23) % 30)}%` }} />
                <div className="ecos-comments__skeleton-date ecos-comments__shimmer" />
              </div>
            </div>
            <div className="ecos-comments__skeleton-text ecos-comments__shimmer" style={{ width: `${70 + ((i * 17) % 25)}%` }} />
          </div>
        ))}
      </div>
    );
  }

  renderComments() {
    const { comments, isMobile, saveIsLoading, userName, actionFailed } = this.props;
    const { recordRef, isEdit } = this.state;

    if (!comments.length) {
      // While the editor is open, don't render the empty-state under it (it would push the layout).
      if (isEdit) {
        return null;
      }

      return (
        <div className="ecos-comments__no-data">
          <NoComments width={183} height={102} />
          <div className="ecos-comments__no-data-text">{t('comments-widget.no-comments')}</div>
        </div>
      );
    }

    const renderCommentList = () => (
      <div className="ecos-comments__list" ref={this.contentRef}>
        {comments.map(comment => (
          <Comment
            key={comment.id}
            comment={comment}
            userName={userName}
            saveIsLoading={saveIsLoading}
            actionFailed={actionFailed}
            recordRef={recordRef}
            onClose={this.handleCloseEditor}
          />
        ))}
      </div>
    );

    if (isMobile) {
      return renderCommentList();
    }

    return (
      <Scrollbars autoHide ref={this._scroll} {...this.scrollbarProps}>
        {renderCommentList()}
      </Scrollbars>
    );
  }

  render() {
    const { dragHandleProps, canDragging, fetchIsLoading, comments, totalCount, ...props } = this.props;
    const actions = {
      [DAction.Actions.RELOAD]: {
        onClick: this.fetchData
      }
    };

    const isFirstLoading = fetchIsLoading && !comments.length;

    return (
      <div className={this.className}>
        <Dashlet
          {...props}
          setRef={this.setDashletRef}
          title={t('comments-widget.title')}
          badgeText={totalCount ? getAdaptiveNumberStr(totalCount) : undefined}
          customActions={this.renderAddButton()}
          actionConfig={actions}
          needGoTo={false}
          canDragging={canDragging}
          dragHandleProps={dragHandleProps}
          resizable
          isLoading={fetchIsLoading && !isFirstLoading}
          onResize={this.handleResize}
          contentMaxHeight={this.clientHeight + this.otherHeight}
          onChangeHeight={this.handleChangeHeight}
          getFitHeights={this.setFitHeights}
          onToggleCollapse={this.handleToggleContent}
          isCollapsed={this.isCollapsed}
        >
          {isFirstLoading ? (
            this.renderSkeleton()
          ) : (
            <>
              {this.renderEditor()}
              {this.renderComments()}
            </>
          )}
        </Dashlet>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const recordRef = getRecordRef() || ownProps.record;

  return {
    ...selectStateByRecordRef(state, recordRef),
    isMobile: state.view.isMobile,
    userName: state.user.userName
  };
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  getComments: recordRef => dispatch(getComments(recordRef || ownProps.record)),
  updateComments: (prevComments, recordRef) => dispatch(updateComments({ record: recordRef || ownProps.record, prevComments }))
});

export default connect(mapStateToProps, mapDispatchToProps)(Comments);
