import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import {
  ContentState,
  convertFromRaw,
  convertToRaw,
  Editor,
  EditorState,
  getDefaultKeyBinding,
  Modifier,
  RichUtils,
  convertFromHTML,
  CompositeDecorator
} from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import debounce from 'lodash/debounce';
import ReactResizeDetector from 'react-resize-detector';

import BaseWidget from '../BaseWidget';
import { deepClone, num2str, t } from '../../../helpers/util';
import { BUTTONS_TYPE, KEY_COMMANDS } from '../../../helpers/draft';
import { MIN_WIDTH_DASHLET_LARGE } from '../../../constants/index';
import DAction from '../../../services/DashletActionService';
import { selectStateByNodeRef } from '../../../selectors/comments';
import { createCommentRequest, deleteCommentRequest, getComments, setError, updateCommentRequest } from '../../../actions/comments';
import { Btn, IcoBtn } from '../../common/btns/index';
import Dashlet from '../../Dashlet';
import LinkEditor from './Editor/LinkEditor';
import linkDecorator from './Editor/LinkDecorator';
import Comment from './Comment';
import { CommentInterface, IdInterface } from './propsInterfaces';
import { BASE_HEIGHT } from '../../../constants/comments';

import 'draft-js/dist/Draft.css';
import './style.scss';

class Comments extends BaseWidget {
  static propTypes = {
    id: IdInterface.isRequired,
    comments: PropTypes.arrayOf(PropTypes.shape(CommentInterface)),
    dataStorageFormat: PropTypes.oneOf(['raw', 'html', 'plain-text']),
    maxLength: PropTypes.number,
    totalCount: PropTypes.number,
    errorMessage: PropTypes.string,
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
    createComment: () => {},
    updateComment: () => {},
    deleteComment: () => {},
    setErrorMessage: () => {}
  };

  #decorators = [];

  constructor(props) {
    super(props);

    this.contentRef = React.createRef();
    this._scroll = React.createRef();

    this.#decorators.push(linkDecorator);

    this.state = {
      ...this.state,
      isEdit: false,
      headerHeight: 0,
      editableComment: null,
      commentForDeletion: null,
      editorHeight: BASE_HEIGHT,
      comment: EditorState.createEmpty(this.decorators),
      isOpenLinkDialog: false,
      linkUrl: '',
      linkText: ''
    };
  }

  get decorators() {
    return new CompositeDecorator(this.#decorators);
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
        comment: EditorState.createEmpty(this.decorators),
        editableComment: null,
        commentForDeletion: null
      });
    }

    if (id !== nextProps.id) {
      getComments();
    }
  }

  get editorPlaceholder() {
    const { maxLength } = this.props;
    const start = t('comments-widget.editor.placeholder.part-1');
    const end = t('comments-widget.editor.placeholder.part-2');

    return `${start} ${maxLength} ${end}`;
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
      return height;
    }

    const { clientHeight } = this.contentRef.current;

    height = clientHeight > height ? height : clientHeight;

    return height;
  }

  get otherHeight() {
    return this.state.headerHeight + this.dashletOtherHeight;
  }

  get scrollHeight() {
    const {
      userHeight,
      contentHeight = 0,
      fitHeights: { max }
    } = this.state;
    let height = 0;

    if (userHeight === undefined) {
      if (contentHeight + this.otherHeight >= max) {
        return max - this.otherHeight;
      }

      return contentHeight;
    }

    if (userHeight <= 0) {
      return 0;
    }

    height = userHeight - this.otherHeight;

    return height < 0 ? 0 : height;
  }

  get canSendComment() {
    const { maxLength, saveIsLoading } = this.props;

    return this.commentLength && this.commentLength <= maxLength && !saveIsLoading;
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

  setFitHeights = data => {
    const fitHeights = deepClone(data);
    const fitHeightsState = this.state.fitHeights;

    if (JSON.stringify(fitHeightsState) !== JSON.stringify(fitHeights)) {
      this.setState({ fitHeights });
    }
  };

  handleCommentSend = event => {
    if (this.canSendComment && event.ctrlKey && event.key === 'Enter') {
      return KEY_COMMANDS.SEND;
    }

    return getDefaultKeyBinding(event);
  };

  handleShowEditor = () => {
    this.setState({
      isEdit: true,
      comment: EditorState.createEmpty(this.decorators),
      editorHeight: BASE_HEIGHT
    });
  };

  handleSaveComment = () => {
    const { saveIsLoading } = this.props;

    if (saveIsLoading) {
      return;
    }

    const { updateComment, createComment, dataStorageFormat } = this.props;
    const { editableComment, comment } = this.state;
    let text = '';

    switch (dataStorageFormat) {
      case 'raw':
        text = JSON.stringify(convertToRaw(comment.getCurrentContent()));
        break;
      case 'html':
        text = stateToHTML(comment.getCurrentContent());
        text = text.replace(/<br>\n/gim, '<br/>');
        break;
      case 'plain-text':
      default:
        text = comment.getCurrentContent().getPlainText();
    }

    editableComment ? updateComment({ text, id: editableComment }) : createComment(text);
  };

  handleCloseEditor = () => {
    this.setState({
      isEdit: false,
      comment: EditorState.createEmpty(this.decorators),
      editableComment: null,
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

    if (command === KEY_COMMANDS.SEND) {
      return this.handleSaveComment();
    }

    if (newComment) {
      this.handleChangeComment(newComment);

      return true;
    }

    return false;
  };

  handlePastedText = text => {
    const { comment } = this.state;
    const pastedBlocks = ContentState.createFromText(text).blockMap;
    const newState = Modifier.replaceWithFragment(comment.getCurrentContent(), comment.getSelection(), pastedBlocks);
    const newCommentState = EditorState.push(comment, newState, 'insert-fragment');

    this.setState({ comment: newCommentState }, this.updateEditorHeight);

    return true;
  };

  handleReturn = event => {
    if (!(event.keyCode === 13 && event.shiftKey)) {
      return 'not-handled';
    }

    const { comment } = this.state;
    const newState = RichUtils.insertSoftNewline(comment);

    this.setState({ comment: newState }, this.updateEditorHeight);
    return 'handled';
  };

  handleEditComment = id => {
    const { comments } = this.props;
    const comment = comments.find(comment => comment.id === id);
    let convertedComment = ContentState.createFromText(comment.text);

    if (!comment) {
      return;
    }

    try {
      convertedComment = JSON.parse(comment.text);

      if (typeof convertedComment === 'object') {
        convertedComment = convertFromRaw(convertedComment);
      }
    } catch (e) {
      const blocksFromHTML = convertFromHTML(comment.text);

      convertedComment = ContentState.createFromBlockArray(blocksFromHTML.contentBlocks, blocksFromHTML.entityMap);
    }

    this.setState(
      {
        editableComment: id,
        isEdit: true,
        comment: EditorState.moveFocusToEnd(EditorState.createWithContent(convertedComment, this.decorators))
      },
      this.updateEditorHeight
    );
  };

  handleDeleteComment = id => {
    this.props.deleteComment(id, () => this.setState({ commentForDeletion: null }));
  };

  handleReloadData = () => {
    const { getComments } = this.props;

    getComments();
  };

  handleResizeHeader = debounce((width, headerHeight) => {
    if (this.state.headerHeight !== headerHeight) {
      this.setState({ headerHeight });
    }
  }, 400);

  handleUpdate() {
    super.handleUpdate();
    this.handleReloadData();
  }

  renderHeader() {
    const { isEdit } = this.state;

    return (
      <div>
        <div className="ecos-comments__header">
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

        <ReactResizeDetector handleWidth handleHeight onResize={this.handleResizeHeader} />
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
    const { errorMessage, saveIsLoading } = this.props;
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
            className={classNames('icon-items', 'ecos-comments__editor-button', 'ecos-comments__editor-button_list', {
              'ecos-comments__editor-button_active': this.blockType === BUTTONS_TYPE.LIST
            })}
          />

          <LinkEditor editorState={comment} onChangeState={this.handleChangeComment} />
        </div>
        <div className="ecos-comments__editor-body" onClick={this.handleFocusEditor}>
          <Scrollbars hideTracksWhenNotNeeded style={{ height: '100%', minHeight }}>
            <Editor
              spellCheck
              ref={this.setEditor}
              editorState={comment}
              keyBindingFn={this.handleCommentSend}
              onChange={this.handleChangeComment}
              handleKeyCommand={this.handleKeyCommand}
              handlePastedText={this.handlePastedText}
              handleReturn={this.handleReturn}
              placeholder={this.editorPlaceholder}
            />
          </Scrollbars>
        </div>
        <div className="ecos-comments__editor-footer">
          {errorMessage ? this.renderErrorMessage() : this.renderCount()}

          <div className="ecos-comments__editor-footer-btn-wrapper">
            <Btn
              className="ecos-btn_grey5 ecos-btn_hover_color-grey ecos-comments__editor-footer-btn"
              onClick={this.handleCloseEditor}
              disabled={saveIsLoading}
            >
              {t('comments-widget.editor.cancel')}
            </Btn>
            <Btn
              className="ecos-btn_blue ecos-btn_hover_light-blue ecos-comments__editor-footer-btn"
              onClick={this.handleSaveComment}
              disabled={!this.canSendComment}
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

  renderComments() {
    const { comments, isMobile, saveIsLoading, userName, actionFailed } = this.props;

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
            onEdit={this.handleEditComment}
            onDelete={this.handleDeleteComment}
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
    const { dragHandleProps, canDragging, fetchIsLoading } = this.props;
    const actions = {
      [DAction.Actions.RELOAD]: {
        onClick: this.handleReloadData
      }
    };

    return (
      <div className={this.className}>
        <Dashlet
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

const mapStateToProps = (state, ownProps) => ({
  ...selectStateByNodeRef(state, ownProps.record),
  isMobile: state.view.isMobile,
  userName: state.user.userName
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  getComments: () => dispatch(getComments(ownProps.record)),
  createComment: comment => dispatch(createCommentRequest({ comment, nodeRef: ownProps.record })),
  updateComment: comment => dispatch(updateCommentRequest({ comment, nodeRef: ownProps.record })),
  deleteComment: (id, callback) => dispatch(deleteCommentRequest({ id, nodeRef: ownProps.record, callback })),
  setErrorMessage: message => dispatch(setError({ message, nodeRef: ownProps.record }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Comments);
