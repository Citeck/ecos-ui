import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import moment from 'moment';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import { ContentState, convertFromRaw, convertToRaw, Editor, EditorState, RichUtils } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import get from 'lodash/get';

import BaseWidget from '../BaseWidget';
import { num2str, t } from '../../../helpers/util';
import { MIN_WIDTH_DASHLET_LARGE, MIN_WIDTH_DASHLET_SMALL } from '../../../constants/index';
import UserLocalSettingsService, { DashletProps } from '../../../services/userLocalSettings';
import { selectStateByNodeRef } from '../../../selectors/comments';
import { createCommentRequest, deleteCommentRequest, getComments, setError, updateCommentRequest } from '../../../actions/comments';

import { Avatar, DefineHeight, Loader } from '../../common/index';
import { Btn, IcoBtn } from '../../common/btns/index';
import Dashlet, { BaseActions } from '../../Dashlet';

import 'draft-js/dist/Draft.css';
import './style.scss';

const BASE_HEIGHT = 21;
const BUTTONS_TYPE = {
  BOLD: 'BOLD',
  ITALIC: 'ITALIC',
  UNDERLINE: 'UNDERLINE',
  LIST: 'unordered-list-item'
};

class Comments extends BaseWidget {
  static propTypes = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    comments: PropTypes.arrayOf(
      PropTypes.shape({
        avatar: PropTypes.string,
        firstName: PropTypes.string,
        lastName: PropTypes.string,
        middleName: PropTypes.string,
        displayName: PropTypes.string,
        text: PropTypes.string.isRequired,
        dateCreate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]).isRequired,
        dateModify: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        canEdit: PropTypes.bool,
        canDelete: PropTypes.bool
      })
    ),
    maxLength: PropTypes.number,
    totalCount: PropTypes.number,
    errorMessage: PropTypes.string,
    saveIsLoading: PropTypes.bool,
    fetchIsLoading: PropTypes.bool,
    hasMore: PropTypes.bool,
    canDragging: PropTypes.bool,
    maxHeightByContent: PropTypes.bool,
    commentListMaxHeight: PropTypes.number,
    onSave: PropTypes.func,
    onDelete: PropTypes.func,
    getComments: PropTypes.func,
    createComment: PropTypes.func,
    updateComment: PropTypes.func,
    deleteComment: PropTypes.func,
    setErrorMessage: PropTypes.func
  };

  static defaultProps = {
    comments: [],
    maxLength: 350,
    errorMessage: '',
    saveIsLoading: false,
    fetchIsLoading: false,
    canDragging: false,
    maxHeightByContent: true,
    commentListMaxHeight: 217,
    onSave: () => {},
    onDelete: () => {},
    getComments: () => {},
    createComment: () => {},
    updateComment: () => {},
    deleteComment: () => {},
    setErrorMessage: () => {}
  };

  constructor(props) {
    super(props);

    this.contentRef = React.createRef();
    this._scroll = React.createRef();
    this._header = React.createRef();

    UserLocalSettingsService.checkOldData(props.id);

    this.state = {
      isEdit: false,
      fitHeights: {},
      contentHeight: null,
      editableComment: null,
      commentForDeletion: null,
      editorHeight: BASE_HEIGHT,
      width: MIN_WIDTH_DASHLET_SMALL,
      comment: EditorState.createEmpty(),
      userHeight: UserLocalSettingsService.getDashletHeight(props.id),
      isCollapsed: UserLocalSettingsService.getDashletProperty(props.id, DashletProps.IS_COLLAPSED)
    };
  }

  componentDidMount() {
    super.componentDidMount();

    const { getComments } = this.props;

    getComments();
  }

  componentWillReceiveProps(nextProps) {
    const { saveIsLoading, id } = this.props;

    if (saveIsLoading && !nextProps.saveIsLoading && !nextProps.errorMessage) {
      this.setState({
        isEdit: false,
        editorHeight: BASE_HEIGHT,
        comment: EditorState.createEmpty(),
        editableComment: null,
        commentForDeletion: null
      });
    }

    if (id !== nextProps.id) {
      getComments();
    }
  }

  formatDate(date = new Date()) {
    const inMoment = moment(date);
    const now = moment();
    const duration = moment.duration(now.diff(inMoment));
    const seconds = Math.floor(duration.asSeconds());
    const minutes = Math.floor(duration.asMinutes());
    const hours = Math.floor(duration.asHours());
    const days = Math.floor(duration.asDays());

    if (days > 0) {
      return inMoment.format('DD.MM.YYYY HH:mm');
    }

    if (hours > 0) {
      return `${hours} ${t(num2str(hours, ['comments-widget.hour-form1', 'comments-widget.hour-form2', 'comments-widget.hour-form3']))} ${t(
        'comments-widget.time-ago'
      )}`;
    }

    if (minutes > 0) {
      return `${minutes} ${t(
        num2str(minutes, ['comments-widget.minute-form1', 'comments-widget.minute-form2', 'comments-widget.minute-form3'])
      )} ${t('comments-widget.time-ago')}`;
    }

    if (seconds > 0) {
      return `${seconds} ${t(
        num2str(seconds, ['comments-widget.second-form1', 'comments-widget.second-form2', 'comments-widget.second-form3'])
      )} ${t('comments-widget.time-ago')}`;
    }

    return t('comments-widget.now');
  }

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

  get commentLength() {
    const { comment } = this.state;

    return comment.getCurrentContent().getPlainText().length || 0;
  }

  get counterClassName() {
    const { maxLength } = this.props;
    const classes = ['ecos-comments__counter-item'];

    if (this.commentLength > maxLength) {
      classes.push('ecos-comments__counter-item_warning');
    }

    return classes.join(' ');
  }

  get inlineStyles() {
    const { comment } = this.state;

    return comment.getCurrentInlineStyle();
  }

  get blockType() {
    const { comment } = this.state;
    const selection = comment.getSelection();

    return comment
      .getCurrentContent()
      .getBlockForKey(selection.getStartKey())
      .getType();
  }

  get scrollbarHeight() {
    let height = this.props.commentListMaxHeight;

    if (!this.contentRef.current) {
      return `${height}px`;
    }

    const { clientHeight } = this.contentRef.current;

    height = clientHeight > height ? height : clientHeight;

    return `${height}px`;
  }

  get otherHeight() {
    return get(this._header, 'current.offsetHeight', 0);
  }

  updateEditorHeight = () => {
    if (this.editor) {
      this.setState({ editorHeight: this.editor.editor.clientHeight || 0 });
    }
  };

  setEditor = editor => {
    this.editor = editor;

    if (editor) {
      editor.focus();
    }
  };

  recalculateScrollbarHeight = () => {
    if (this._scroll.current) {
      this._scroll.current.container.style.minHeight = this.scrollbarHeight;
    }
  };

  handleShowEditor = () => {
    this.setState({
      isEdit: true,
      comment: EditorState.createEmpty(),
      editorHeight: BASE_HEIGHT
    });
  };

  handleSaveComment = () => {
    const { saveIsLoading, updateComment, createComment } = this.props;
    const { editableComment } = this.state;
    const text = JSON.stringify(convertToRaw(this.state.comment.getCurrentContent()));

    if (saveIsLoading) {
      return;
    }

    editableComment ? updateComment({ text, id: editableComment }) : createComment(text);
  };

  handleCloseEditor = () => {
    this.setState({
      isEdit: false,
      comment: EditorState.createEmpty(),
      editorHeight: BASE_HEIGHT
    });
  };

  handleChangeComment = (comment, setFocus = false) => {
    this.setState({ comment }, () => {
      this.updateEditorHeight();

      if (setFocus) {
        this.handleFocusEditor();
      }

      if (this.props.errorMessage) {
        this.props.setErrorMessage('');
      }
    });
  };

  handleFocusEditor = () => {
    if (this.editor) {
      this.editor.focus();
    }
  };

  handleToggleStyle(type, event) {
    const { comment } = this.state;
    const newComment = RichUtils.toggleInlineStyle(comment, type);

    event.preventDefault();
    this.handleChangeComment(newComment, true);
  }

  handleToggleBlockType(type, event) {
    const { comment } = this.state;
    const newComment = RichUtils.toggleBlockType(comment, type);

    event.preventDefault();
    this.handleChangeComment(newComment, true);
  }

  handleKeyCommand = (command, editorState) => {
    const newComment = RichUtils.handleKeyCommand(editorState, command);

    if (newComment) {
      this.handleChangeComment(newComment);

      return true;
    }

    return false;
  };

  handlePastedText = text => {
    this.setState(
      {
        comment: EditorState.moveFocusToEnd(EditorState.createWithContent(ContentState.createFromText(text)))
      },
      this.updateEditorHeight
    );

    return true;
  };

  handleEditComment = id => {
    const { comments } = this.props;
    const comment = comments.find(comment => comment.id === id);
    let convertedComment = ContentState.createFromText(comment.text);

    if (!comment) {
      console.warn('Comment not found');

      return;
    }

    try {
      convertedComment = JSON.parse(comment.text);

      if (typeof convertedComment === 'object') {
        convertedComment = convertFromRaw(convertedComment);
      }
    } catch (e) {}

    this.setState(
      {
        editableComment: id,
        isEdit: true,
        comment: EditorState.moveFocusToEnd(EditorState.createWithContent(convertedComment))
      },
      this.updateEditorHeight
    );
  };

  handleDeleteComment = commentForDeletion => {
    this.setState({ commentForDeletion });
  };

  handleCancelDeletion = () => {
    this.setState({ commentForDeletion: null });
  };

  handleConfirmDeletion = () => {
    this.props.deleteComment(this.state.commentForDeletion);
    this.setState({ commentForDeletion: null });
  };

  handleReloadData = () => {
    const { getComments } = this.props;

    getComments();
  };

  renderHeader() {
    const { isEdit } = this.state;

    return (
      <div className="ecos-comments__header" ref={this._header}>
        {isEdit ? (
          this.renderEditor()
        ) : (
          <>
            <div className="ecos-comments__count">
              <span className="ecos-comments__count-text">{this.countComments}</span>
            </div>
            <Btn className="ecos-btn_blue ecos-btn_hover_light-blue ecos-comments__add-btn" onClick={this.handleShowEditor}>
              {t('comments-widget.add')}
            </Btn>
          </>
        )}
      </div>
    );
  }

  renderErrorMessage() {
    const { errorMessage } = this.props;

    if (!errorMessage) {
      return null;
    }

    return <div className="ecos-comments__editor-footer-error">{errorMessage}</div>;
  }

  renderEditor() {
    const { maxLength, errorMessage, saveIsLoading } = this.props;
    const { comment, editorHeight } = this.state;
    let minHeight = '1em';

    if (isNaN(editorHeight)) {
      minHeight = editorHeight;
    } else {
      minHeight = `${editorHeight}px`;
    }

    if (editorHeight > 88) {
      minHeight = '88px';
    }

    return (
      <div className="ecos-comments__editor">
        <div className="ecos-comments__editor-header">
          <IcoBtn
            onMouseDown={this.handleToggleStyle.bind(this, BUTTONS_TYPE.BOLD)}
            className={classNames('icon-bold', 'ecos-comments__editor-button', {
              'ecos-comments__editor-button_active': this.inlineStyles.has(BUTTONS_TYPE.BOLD)
            })}
          />
          <IcoBtn
            onMouseDown={this.handleToggleStyle.bind(this, BUTTONS_TYPE.ITALIC)}
            className={classNames('icon-italic', 'ecos-comments__editor-button', {
              'ecos-comments__editor-button_active': this.inlineStyles.has(BUTTONS_TYPE.ITALIC)
            })}
          />
          <IcoBtn
            onMouseDown={this.handleToggleStyle.bind(this, BUTTONS_TYPE.UNDERLINE)}
            className={classNames('icon-underline', 'ecos-comments__editor-button', {
              'ecos-comments__editor-button_active': this.inlineStyles.has(BUTTONS_TYPE.UNDERLINE)
            })}
          />
          <IcoBtn
            onMouseDown={this.handleToggleBlockType.bind(this, BUTTONS_TYPE.LIST)}
            className={classNames('icon-list3', 'ecos-comments__editor-button', 'ecos-comments__editor-button_list', {
              'ecos-comments__editor-button_active': this.blockType === BUTTONS_TYPE.LIST
            })}
          />
        </div>
        <div className="ecos-comments__editor-body" onClick={this.handleFocusEditor}>
          <Scrollbars autoHide style={{ height: '100%', minHeight }}>
            <Editor
              spellCheck
              ref={this.setEditor}
              editorState={comment}
              onChange={this.handleChangeComment}
              handleKeyCommand={this.handleKeyCommand}
              handlePastedText={this.handlePastedText}
              placeholder={t('comments-widget.editor.placeholder')}
            />
          </Scrollbars>
        </div>
        <div className="ecos-comments__editor-footer">
          {errorMessage ? this.renderErrorMessage() : this.renderCount()}

          <div className="ecos-comments__editor-footer-btn-wrapper">
            <Btn
              className="ecos-btn_grey5 ecos-btn_hover_grey1 ecos-comments__editor-footer-btn"
              onClick={this.handleCloseEditor}
              disabled={saveIsLoading}
            >
              {t('comments-widget.editor.cancel')}
            </Btn>
            <Btn
              className="ecos-btn_blue ecos-btn_hover_light-blue ecos-comments__editor-footer-btn"
              onClick={this.handleSaveComment}
              disabled={!this.commentLength || this.commentLength > maxLength || saveIsLoading}
              loading={saveIsLoading}
            >
              {t('comments-widget.editor.save')}
            </Btn>
          </div>
        </div>
      </div>
    );
  }

  renderCount() {
    const { maxLength } = this.props;

    return (
      <div className="ecos-comments__counter">
        <span className={this.counterClassName}>{this.commentLength}</span>
        <span className="ecos-comments__counter-separator">/</span>
        <span className="ecos-comments__counter-item">{maxLength}</span>
      </div>
    );
  }

  renderConfirmDelete(id) {
    const { commentForDeletion } = this.state;

    if (!commentForDeletion || commentForDeletion !== id) {
      return null;
    }

    return (
      <div className="ecos-comments__comment-confirm">
        <div className="ecos-comments__comment-confirm-title">{t('comments-widget.confirm.title')}?</div>

        <div className="ecos-comments__comment-confirm-btns">
          <Btn className="ecos-btn_grey5 ecos-btn_hover_grey1 ecos-comments__comment-confirm-btn" onClick={this.handleCancelDeletion}>
            {t('comments-widget.confirm.cancel')}
          </Btn>
          <Btn className="ecos-btn_red ecos-comments__comment-confirm-btn" onClick={this.handleConfirmDeletion}>
            {t('comments-widget.confirm.delete')}
          </Btn>
        </div>
      </div>
    );
  }

  renderComment = data => {
    const {
      id,
      avatar = '',
      firstName,
      lastName,
      middleName,
      displayName,
      text,
      dateCreate = new Date(),
      canEdit = false,
      canDelete = false
    } = data;
    let convertedComment = text;

    try {
      convertedComment = stateToHTML(convertFromRaw(JSON.parse(text)));
    } catch (e) {
      console.error('convert comment error: ', e.message);
    }

    return (
      <div className="ecos-comments__comment" key={id}>
        <div className="ecos-comments__comment-header">
          <div className="ecos-comments__comment-header-cell">
            <Avatar
              url={avatar}
              userName={displayName}
              className={'ecos-comments__comment-avatar'}
              classNameEmpty={'ecos-comments__comment-avatar_empty'}
            />
            <div className="ecos-comments__comment-header-column">
              <div className="ecos-comments__comment-name">
                {firstName} {middleName}
              </div>
              <div className="ecos-comments__comment-name">{lastName}</div>
              <div className="ecos-comments__comment-date">{this.formatDate(dateCreate)}</div>
            </div>
          </div>
          <div className="ecos-comments__comment-header-cell">
            {canEdit && (
              <div
                className="ecos-comments__comment-btn ecos-comments__comment-btn-edit icon-edit"
                title={t('comments-widget.icon.edit')}
                onClick={this.handleEditComment.bind(null, id)}
              />
            )}
            {canDelete && (
              <div
                className="ecos-comments__comment-btn ecos-comments__comment-btn-delete icon-delete"
                title={t('comments-widget.icon.delete')}
                onClick={this.handleDeleteComment.bind(null, id)}
              />
            )}
          </div>
        </div>
        <div className="ecos-comments__comment-text" dangerouslySetInnerHTML={{ __html: convertedComment }} />

        {this.renderConfirmDelete(id)}
      </div>
    );
  };

  renderComments() {
    const { comments, isMobile } = this.props;

    if (!comments.length) {
      return null;
    }

    const { userHeight = 0, contentHeight, fitHeights } = this.state;
    const _commentsHeader = this._header.current || {};
    const headerHeight = _commentsHeader.offsetHeight || 0;
    const fixHeight = userHeight ? userHeight - headerHeight : null;

    const renderCommentList = () => (
      <div className="ecos-comments__list" ref={this.contentRef}>
        {comments.map(this.renderComment)}
      </div>
    );

    if (isMobile) {
      return renderCommentList();
    }

    return (
      <Scrollbars autoHide ref={this._scroll} style={{ height: contentHeight || '100%' }}>
        <DefineHeight
          fixHeight={fixHeight}
          maxHeight={fitHeights.max - headerHeight}
          minHeight={1}
          getOptimalHeight={this.setContentHeight}
        >
          {renderCommentList()}
        </DefineHeight>
      </Scrollbars>
    );
  }

  renderLoader() {
    const { fetchIsLoading } = this.props;

    if (!fetchIsLoading) {
      return null;
    }

    return <Loader blur />;
  }

  render() {
    const { dragHandleProps, canDragging } = this.props;
    const { isCollapsed } = this.state;
    const actions = {
      [BaseActions.RELOAD]: {
        onClick: this.handleReloadData
      }
    };

    return (
      <div className={this.className}>
        <Dashlet
          title={t('comments-widget.title')}
          actionConfig={actions}
          needGoTo={false}
          canDragging={canDragging}
          dragHandleProps={dragHandleProps}
          resizable
          onResize={this.handleResize}
          contentMaxHeight={this.clientHeight + this.otherHeight}
          onChangeHeight={this.handleChangeHeight}
          getFitHeights={this.setFitHeights}
          onToggleCollapse={this.handleToggleContent}
          isCollapsed={isCollapsed}
        >
          {this.renderHeader()}
          {this.renderComments()}
        </Dashlet>
        {this.renderLoader()}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  ...selectStateByNodeRef(state, ownProps.record),
  isMobile: state.view.isMobile
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  getComments: () => dispatch(getComments(ownProps.record)),
  createComment: comment => dispatch(createCommentRequest({ comment, nodeRef: ownProps.record })),
  updateComment: comment => dispatch(updateCommentRequest({ comment, nodeRef: ownProps.record })),
  deleteComment: id => dispatch(deleteCommentRequest({ id, nodeRef: ownProps.record })),
  setErrorMessage: message => dispatch(setError({ message, nodeRef: ownProps.record }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Comments);
