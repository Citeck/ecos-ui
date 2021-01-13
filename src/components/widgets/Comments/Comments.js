import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import moment from 'moment';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import {
  ContentState,
  SelectionState,
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
import { MIN_WIDTH_DASHLET_LARGE } from '../../../constants/index';
import DAction from '../../../services/DashletActionService';
import { selectStateByNodeRef } from '../../../selectors/comments';
import { createCommentRequest, deleteCommentRequest, getComments, setError, updateCommentRequest } from '../../../actions/comments';
import { Avatar, Loader, Popper } from '../../common/index';
import { Input } from '../../common/form';
import { Btn, IcoBtn } from '../../common/btns/index';
import Dashlet from '../../Dashlet';
import ClickOutside from '../../ClickOutside';

import 'draft-js/dist/Draft.css';
import './style.scss';

const BASE_HEIGHT = 21;
const BUTTONS_TYPE = {
  BOLD: 'BOLD',
  ITALIC: 'ITALIC',
  UNDERLINE: 'UNDERLINE',
  LIST: 'unordered-list-item',
  LINK: 'LINK'
};
const KEY_COMMANDS = {
  SEND: 'comment-send'
};

function findLinkEntities(contentBlock, callback, contentState) {
  return contentBlock.findEntityRanges(character => {
    const entityKey = character.getEntity();

    return entityKey !== null && contentState.getEntity(entityKey).getType() === BUTTONS_TYPE.LINK;
  }, callback);
}

const Link = props => {
  const { url, title } = props.contentState.getEntity(props.entityKey).getData();

  return (
    <a href={url} style={{ color: '#3b5998', textDecoration: 'underline' }} title={title}>
      {props.children}
    </a>
  );
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
        editorName: PropTypes.string,
        editorUserName: PropTypes.string,
        text: PropTypes.string.isRequired,
        dateCreate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]).isRequired,
        dateModify: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        canEdit: PropTypes.bool,
        canDelete: PropTypes.bool,
        edited: PropTypes.bool
      })
    ),
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

    this.#decorators.push({
      strategy: findLinkEntities,
      component: Link
    });

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

  get isContainsLink() {
    const { comment } = this.state;
    const isLink = RichUtils.currentBlockContainsLink(comment);

    if (isLink) {
      return true;
    }

    const selection = comment.getSelection();
    const contentState = comment.getCurrentContent();
    const block = contentState.getBlockForKey(selection.getStartKey());
    const entityAt = block.getEntityAt(selection.getStartOffset());

    if (entityAt !== null) {
      return contentState.getEntity(entityAt).getType() === BUTTONS_TYPE.LINK;
    }

    return false;
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

    // console.warn({ dataStorageFormat })

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

    console.warn({ text });

    editableComment ? updateComment({ text, id: editableComment }) : createComment(text);
  };

  handleCloseEditor = () => {
    this.setState({
      isEdit: false,
      comment: EditorState.createEmpty(this.decorators),
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

  handleToggleLinkEditor = () => {
    this.setState(state => ({ isOpenLinkDialog: !state.isOpenLinkDialog }));
  };

  handleSaveLink = event => {
    const { comment, linkText, linkUrl } = this.state;
    const originSelectionState = comment.getSelection();
    const selectionState = new SelectionState({
      anchorKey: originSelectionState.getAnchorKey(),
      anchorOffset: originSelectionState.getAnchorOffset(),
      focusKey: originSelectionState.getAnchorKey(),
      focusOffset: originSelectionState.getAnchorOffset() + linkText.length,
      isBackward: false
    });
    let contentState = comment.getCurrentContent();

    contentState = Modifier.replaceText(contentState, comment.getSelection(), linkText);

    const contentStateWithEntity = contentState.createEntity(BUTTONS_TYPE.LINK, 'MUTABLE', { url: linkUrl, title: linkText });
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    let newEditorState = EditorState.set(comment, { currentContent: contentStateWithEntity });

    newEditorState = EditorState.acceptSelection(newEditorState, selectionState);

    const newComment = RichUtils.toggleLink(newEditorState, newEditorState.getSelection(), entityKey);

    event.preventDefault();
    this.handleChangeComment(newComment, true);

    this.setState({
      linkText: '',
      linkUrl: '',
      isOpenLinkDialog: false
    });
  };

  get selectedText() {
    const { comment } = this.state;
    const selection = comment.getSelection();
    const isCollapsed = selection.isCollapsed();

    const contentState = comment.getCurrentContent();
    const startKey = selection.getStartKey();
    const startOffset = selection.getStartOffset();
    const endOffset = selection.getEndOffset();
    const blockWithLinkAtBeginning = contentState.getBlockForKey(startKey);

    // console.warn({ isCollapsed, text: blockWithLinkAtBeginning.getText().slice(startOffset, endOffset) });

    if (isCollapsed) {
      return '';
    }

    // const contentState = comment.getCurrentContent();
    // const startKey = selection.getStartKey();
    // const startOffset = selection.getStartOffset();
    // const endOffset = selection.getEndOffset();
    // const blockWithLinkAtBeginning = contentState.getBlockForKey(startKey);

    return blockWithLinkAtBeginning.getText().slice(startOffset, endOffset);
  }

  handleToggleLink = event => {
    const { comment } = this.state;
    const selection = comment.getSelection();

    if (!selection.isCollapsed()) {
      const contentState = comment.getCurrentContent();
      const startKey = selection.getStartKey();
      const startOffset = selection.getStartOffset();
      const endOffset = selection.getEndOffset();
      const blockWithLinkAtBeginning = contentState.getBlockForKey(startKey);
      const linkKey = blockWithLinkAtBeginning.getEntityAt(startOffset);

      let url = '';

      if (linkKey) {
        const linkInstance = contentState.getEntity(linkKey);

        url = linkInstance.getData().url;
      }

      // console.warn({ linkKey, url, text: blockWithLinkAtBeginning.getText().slice(startOffset, endOffset) });
    }

    // console.warn({ selection });

    this.setState({ isOpenLinkDialog: true });
  };

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

  handleDeleteComment = commentForDeletion => {
    this.setState({ commentForDeletion });
  };

  handleCancelDeletion = () => {
    this.setState({ commentForDeletion: null });
  };

  handleConfirmDeletion = () => {
    this.props.deleteComment(this.state.commentForDeletion, () => this.setState({ commentForDeletion: null }));
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

  handleChangeLinkUrl = event => {
    this.setState({ linkUrl: event.target.value });
  };

  handleChangeLinkText = event => {
    this.setState({ linkText: event.target.value });
  };

  renderLinkEditor() {
    const { isOpenLinkDialog } = this.state;

    if (!isOpenLinkDialog) {
      return null;
    }

    return (
      <ClickOutside className="ecos-comments__editor-link-editor" handleClickOutside={this.handleToggleLinkEditor}>
        <Input className="ecos-comments__editor-link-editor-input" placeholder="Ссылка" onChange={this.handleChangeLinkUrl} />
        <Input
          className="ecos-comments__editor-link-editor-input"
          placeholder="Текст"
          defaultValue={this.selectedText}
          onChange={this.handleChangeLinkText}
        />

        <div className="ecos-comments__editor-link-editor-btns">
          <Btn onClick={this.handleToggleLinkEditor}>Отмена</Btn>
          <Btn className="ecos-btn_blue" onClick={this.handleSaveLink}>
            Сохранить
          </Btn>
        </div>
      </ClickOutside>
    );
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

  renderLinkButton() {
    return (
      <div className="ecos-comments__editor-link-editor-container">
        <IcoBtn
          onMouseDown={this.handleToggleLinkEditor}
          className={classNames('icon-link', 'ecos-comments__editor-button', 'ecos-comments__editor-button_link', {
            'ecos-comments__editor-button_active': this.isContainsLink
          })}
        />

        {this.renderLinkEditor()}
      </div>
    );
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

          {this.renderLinkButton()}
        </div>
        <div className="ecos-comments__editor-body" onClick={this.handleFocusEditor}>
          <Scrollbars style={{ height: '100%', minHeight }}>
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

  renderConfirmDelete(id) {
    const { saveIsLoading } = this.props;
    const { commentForDeletion } = this.state;

    if (!commentForDeletion || commentForDeletion !== id) {
      return null;
    }

    return (
      <div className="ecos-comments__comment-confirm">
        <div className="ecos-comments__comment-confirm-group">
          <div className="ecos-comments__comment-confirm-title">{t('comments-widget.confirm.title')}?</div>

          <div className="ecos-comments__comment-confirm-btns">
            <Btn
              className="ecos-btn_grey5 ecos-btn_hover_color-grey ecos-comments__comment-confirm-btn"
              onClick={this.handleCancelDeletion}
            >
              {t('comments-widget.confirm.cancel')}
            </Btn>
            <Btn className="ecos-btn_red ecos-comments__comment-confirm-btn" onClick={this.handleConfirmDeletion}>
              {t('comments-widget.confirm.delete')}
            </Btn>
          </div>
        </div>

        {saveIsLoading && <Loader blur />}
      </div>
    );
  }

  renderCommentDate(comment) {
    const { userName } = this.props;
    const { dateCreate = new Date(), edited = false, dateModify, editorName, editorUserName } = comment;

    if (!edited) {
      return <div className="ecos-comments__comment-date">{this.formatDate(dateCreate)}</div>;
    }

    const inMoment = moment(dateModify);
    let title = t('comments-widget.edited-by');

    if (userName === editorUserName) {
      const now = moment();
      const yesterday = now
        .clone()
        .subtract(1, 'days')
        .startOf('day');

      if (inMoment.isSame(yesterday, 'd')) {
        title += ` ${inMoment.format('DD.MM.YYYY')}`;
      }

      title += ` ${t('comments-widget.edited-in')} ${inMoment.format('HH:mm')}`;

      return <div className="ecos-comments__comment-date">{title}</div>;
    }

    const displayText = `${editorName} / ${inMoment.format('DD.MM.YYYY HH:mm')}`;
    const popperContent = <div className="ecos-comments__comment-date-popper">{displayText}</div>;

    return (
      <div className="ecos-comments__comment-date">
        <Popper text={title} className="ecos-comments__comment-date-pseudo-link" contentComponent={popperContent} />
      </div>
    );
  }

  renderComment = data => {
    const { id, avatar = '', firstName, lastName, middleName, displayName, text, canEdit = false, canDelete = false } = data;
    let convertedComment;

    try {
      convertedComment = stateToHTML(convertFromRaw(JSON.parse(text)));
    } catch (e) {
      convertedComment = text;
    }

    return (
      <div className="ecos-comments__comment" key={id}>
        <div className="ecos-comments__comment-header">
          <div className="ecos-comments__comment-header-cell">
            <Avatar
              url={avatar}
              userName={displayName}
              noBorder
              className="ecos-comments__comment-avatar"
              classNameEmpty="ecos-comments__comment-avatar_empty"
            />
            <div className="ecos-comments__comment-header-column">
              <div className="ecos-comments__comment-name">
                {firstName} {middleName}
              </div>
              <div className="ecos-comments__comment-name">{lastName}</div>
              {this.renderCommentDate(data)}
            </div>
          </div>
          <div className="ecos-comments__comment-header-cell ecos-comments__comment-header-cell_actions">
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

    const renderCommentList = () => (
      <div className="ecos-comments__list" ref={this.contentRef}>
        {comments.map(this.renderComment)}
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
    const { isCollapsed } = this.state;
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
          isCollapsed={isCollapsed}
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
