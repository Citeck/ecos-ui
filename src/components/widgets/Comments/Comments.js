import PropTypes from 'prop-types';
import React from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { connect } from 'react-redux';

import Dashlet from '../../Dashlet';
import { Btn } from '../../common/btns/index';
import BaseWidget, { EVENTS } from '../BaseWidget';

import Comment from './Comment';
import { CommentInterface, IdInterface } from './propsInterfaces';

import { getComments, updateComments } from '@/actions/comments';
import { BASE_HEIGHT } from '@/constants/comments';
import { MIN_WIDTH_DASHLET_LARGE } from '@/constants/index';
import { getRecordRef } from '@/helpers/urls';
import { num2str, t } from '@/helpers/util';
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

  get countComments() {
    const { totalCount } = this.props;

    if (!totalCount) {
      return t('comments-widget.no-comments');
    }

    return t(
      `${totalCount} ${t(
        num2str(totalCount, ['comments-widget.comment-form1', 'comments-widget.comment-form2', 'comments-widget.comment-form3'])
      )}`
    );
  }

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

  renderHeader() {
    const { isEdit } = this.state;
    const { saveIsLoading, userName, actionFailed } = this.props;
    const { recordRef } = this.state;

    return (
      <div>
        <div className="ecos-comments__header">
          {isEdit ? (
            <Comment
              comment={null}
              userName={userName}
              saveIsLoading={saveIsLoading}
              actionFailed={actionFailed}
              recordRef={recordRef}
              onClose={this.handleCloseEditor}
            />
          ) : (
            <>
              <div className="ecos-comments__count">
                <span className="ecos-comments__count-text">{this.countComments}</span>
              </div>
              <Btn className="ecos-btn_blue ecos-comments__add-btn" onClick={this.handleShowEditor}>
                {t('comments-widget.add')}
              </Btn>
            </>
          )}
        </div>

        {/* <ReactResizeDetector handleWidth handleHeight onResize={this.handleResizeHeader} /> */}
      </div>
    );
  }

  renderComments() {
    const { comments, isMobile, saveIsLoading, userName, actionFailed } = this.props;
    const { recordRef } = this.state;

    if (!comments.length) {
      return null;
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
    const { dragHandleProps, canDragging, fetchIsLoading, ...props } = this.props;
    const actions = {
      [DAction.Actions.RELOAD]: {
        onClick: this.fetchData
      }
    };

    return (
      <div className={this.className}>
        <Dashlet
          {...props}
          setRef={this.setDashletRef}
          title={t('comments-widget.title')}
          actionConfig={actions}
          needGoTo={false}
          canDragging={canDragging}
          dragHandleProps={dragHandleProps}
          resizable
          isLoading={fetchIsLoading}
          onResize={this.handleResize}
          contentMaxHeight={this.clientHeight + this.otherHeight}
          onChangeHeight={this.handleChangeHeight}
          getFitHeights={this.setFitHeights}
          onToggleCollapse={this.handleToggleContent}
          isCollapsed={this.isCollapsed}
        >
          {this.renderHeader()}
          {this.renderComments()}
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
