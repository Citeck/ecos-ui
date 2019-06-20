import React from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';
import moment from 'moment';
import ReactResizeDetector from 'react-resize-detector';
import { Editor, EditorState, RichUtils, ContentState, convertToRaw, convertFromRaw } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';

import Dashlet from '../Dashlet/Dashlet';
import Btn from '../common/btns/Btn/Btn';
import { t, num2str } from '../../helpers/util';

import 'draft-js/dist/Draft.css';
import './style.scss';

const BASE_HEIGHT = 21;
const BUTTONS_TYPE = {
  BOLD: 'BOLD',
  ITALIC: 'ITALIC',
  UNDERLINE: 'UNDERLINE',
  LIST: 'unordered-list-item'
};

class Comments extends React.Component {
  static propTypes = {
    comments: PropTypes.arrayOf({
      avatar: PropTypes.string,
      userName: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
      date: PropTypes.instanceOf(Date).isRequired,
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      canEdit: PropTypes.bool.isRequired,
      canDelete: PropTypes.bool.isRequired
    }),
    maxLength: PropTypes.number,
    errorMessage: PropTypes.string,
    saveIsLoading: PropTypes.bool,
    onSave: PropTypes.func,
    onDelete: PropTypes.func
  };

  static defaultProps = {
    comments: [],
    maxLength: 350,
    errorMessage: '',
    saveIsLoading: false,
    onSave: () => {},
    onDelete: () => {}
  };

  state = {
    isEdit: true,
    width: 291,
    editorHeight: BASE_HEIGHT,
    comment: EditorState.createEmpty(),
    editableComment: null,
    commentForDeletion: null
  };

  componentWillReceiveProps(nextProps) {
    if (this.props.saveIsLoading && !nextProps.saveIsLoading) {
      this.setState({
        isEdit: false,
        editorHeight: BASE_HEIGHT,
        comment: EditorState.createEmpty(),
        editableComment: null,
        commentForDeletion: null
      });
    }
  }

  get countComments() {
    const { comments } = this.props;

    if (!comments.length) {
      return t('Нет комментариев');
    }

    return `${comments.length} ${t(num2str(comments.length, ['комментарий', 'комментария', 'комментариев']))}`;
  }

  get className() {
    const { width } = this.state;
    const classes = ['ecos-comments'];

    if (width <= 430) {
      classes.push('ecos-comments_small');
    }

    return classes.join(' ');
  }

  getFormattedDate(date = new Date()) {
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
      return `${hours} ${num2str(hours, ['час', 'часа', 'часов'])} назад`;
    }

    if (minutes > 0) {
      return `${minutes} ${num2str(minutes, ['минуту', 'минуты', 'минут'])} назад`;
    }

    if (seconds > 0) {
      return `${seconds} ${num2str(seconds, ['секунду', 'секунды', 'секунд'])} назад`;
    }

    return 'Только что';
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

  handleResize = width => {
    this.setState({ width });
  };

  handleShowEditor = () => {
    this.setState({
      isEdit: true,
      comment: EditorState.createEmpty(),
      editorHeight: BASE_HEIGHT
    });
  };

  handleSaveComment = () => {
    const { saveIsLoading, onSave } = this.props;
    const { editableComment } = this.state;

    if (saveIsLoading) {
      return;
    }

    onSave({
      id: editableComment,
      message: JSON.stringify(convertToRaw(this.state.comment.getCurrentContent()))
    });
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
    });
  };

  updateEditorHeight = () => {
    if (this.editor) {
      this.setState({ editorHeight: this.editor.editor.clientHeight || 0 });
    }
  };

  setEditor = editor => {
    this.editor = editor;
  };

  handleFocusEditor = () => {
    if (this.editor) {
      this.editor.focus();
    }
  };

  handleToggleStyle(type) {
    const { comment } = this.state;
    const newComment = RichUtils.toggleInlineStyle(comment, type);

    this.handleChangeComment(newComment, true);
  }

  handleToggleBlockType(type) {
    const { comment } = this.state;
    const newComment = RichUtils.toggleBlockType(comment, type);

    this.handleChangeComment(newComment);
  }

  handleKeyCommand = (command, editorState) => {
    const newComment = RichUtils.handleKeyCommand(editorState, command);

    if (newComment) {
      this.handleChangeComment(newComment);

      return true;
    }

    return false;
  };

  handleEditComment = id => {
    const { comments } = this.props;
    const comment = comments.find(comment => comment.id === id);
    let convertedComment = ContentState.createFromText(comment.text);

    if (!comment) {
      console.warn(t('Комментарий не найден'));

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

  handleDelete = () => {
    this.props.onDelete(this.state.commentForDeletion);
    this.setState({ commentForDeletion: null });
  };

  renderHeader() {
    const { isEdit } = this.state;

    if (isEdit) {
      return this.renderEditor();
    }

    return (
      <React.Fragment>
        <div className="ecos-comments__count">
          <span className="ecos-comments__count-text">{this.countComments}</span>
        </div>
        <Btn className="ecos-btn_blue ecos-btn_hover_light-blue ecos-comments__add-btn" onClick={this.handleShowEditor}>
          {t('Добавить комментарий')}
        </Btn>
      </React.Fragment>
    );
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
          <div
            style={{ padding: '5px', color: this.inlineStyles.has(BUTTONS_TYPE.BOLD) ? '#7396CD' : 'white', cursor: 'pointer' }}
            onClick={this.handleToggleStyle.bind(this, BUTTONS_TYPE.BOLD)}
          >
            B
          </div>
          <div
            style={{ padding: '5px', color: this.inlineStyles.has(BUTTONS_TYPE.ITALIC) ? '#7396CD' : 'white', cursor: 'pointer' }}
            onClick={this.handleToggleStyle.bind(this, BUTTONS_TYPE.ITALIC)}
          >
            I
          </div>
          <div
            style={{ padding: '5px', color: this.inlineStyles.has(BUTTONS_TYPE.UNDERLINE) ? '#7396CD' : 'white', cursor: 'pointer' }}
            onClick={this.handleToggleStyle.bind(this, BUTTONS_TYPE.UNDERLINE)}
          >
            U
          </div>
          <div
            style={{ padding: '5px', color: this.blockType === BUTTONS_TYPE.LIST ? '#7396CD' : 'white', cursor: 'pointer' }}
            onClick={this.handleToggleBlockType.bind(this, BUTTONS_TYPE.LIST)}
          >
            List
          </div>
        </div>
        <div className="ecos-comments__editor-body" onClick={this.handleFocusEditor}>
          <Scrollbars
            autoHide
            style={{
              height: '100%',
              minHeight
            }}
          >
            <Editor
              spellCheck
              ref={this.setEditor}
              editorState={comment}
              onChange={this.handleChangeComment}
              handleKeyCommand={this.handleKeyCommand}
              placeholder="Напишите комментарий не более 350 символов..."
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
              {t('Отмена')}
            </Btn>
            <Btn
              className="ecos-btn_blue ecos-btn_hover_light-blue ecos-comments__editor-footer-btn"
              onClick={this.handleSaveComment}
              disabled={!this.commentLength || this.commentLength > maxLength || saveIsLoading}
              loading={saveIsLoading}
            >
              {t('Отправить')}
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

  renderAvatar(avatarLink = '', userName = '') {
    if (avatarLink) {
      return <img alt="avatar" src={avatarLink} className="ecos-comments__comment-avatar" />;
    }

    if (userName) {
      return (
        <div className="ecos-comments__comment-avatar ecos-comments__comment-avatar_empty">
          <div className="ecos-comments__comment-avatar-name">
            {userName
              .split(' ')
              .map(word => word[0])
              .join(' ')
              .toUpperCase()}
          </div>
        </div>
      );
    }

    return <div className="ecos-comments__comment-avatar ecos-comments__comment-avatar_empty" />;
  }

  renderConfirmDelete(id) {
    const { commentForDeletion } = this.state;

    if (!commentForDeletion || commentForDeletion !== id) {
      return null;
    }

    return (
      <div className="ecos-comments__comment-confirm">
        <div className="ecos-comments__comment-confirm-title">{t('Удалить этот комментарий')}?</div>

        <div className="ecos-comments__comment-confirm-btns">
          <Btn className="ecos-btn_grey5 ecos-btn_hover_grey1 ecos-comments__comment-confirm-btn" onClick={this.handleCancelDeletion}>
            {t('Отмена')}
          </Btn>
          <Btn className="ecos-btn_red ecos-comments__comment-confirm-btn" onClick={this.handleDelete}>
            {t('Удалить')}
          </Btn>
        </div>
      </div>
    );
  }

  renderComment = data => {
    const { id, avatar = '', userName, text, date = new Date(), canEdit = false, canDelete = false } = data;
    let convertedComment = text;

    try {
      convertedComment = convertFromRaw(JSON.parse(text));
      convertedComment = stateToHTML(convertedComment);
    } catch (e) {}

    return (
      <div className="ecos-comments__comment" key={id}>
        <div className="ecos-comments__comment-header">
          <div className="ecos-comments__comment-header-cell">
            {this.renderAvatar(avatar, userName)}
            <div className="ecos-comments__comment-header-column">
              <div className="ecos-comments__comment-name">{userName}</div>
              <div className="ecos-comments__comment-date">{this.getFormattedDate(date)}</div>
            </div>
          </div>
          <div className="ecos-comments__comment-header-cell">
            {canEdit && (
              <div
                className="ecos-comments__comment-btn ecos-comments__comment-btn-edit icon-edit"
                title={t('Редактировать')}
                onClick={this.handleEditComment.bind(null, id)}
              />
            )}
            {canDelete && (
              <div
                className="ecos-comments__comment-btn ecos-comments__comment-btn-delete icon-delete"
                title={t('Удалить')}
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
    const { comments } = this.props;

    if (!comments.length) {
      return null;
    }

    return (
      <Scrollbars
        autoHide
        style={{
          height: '100%',
          minHeight: '360px'
          // minHeight: '160px'
        }}
      >
        <div className="ecos-comments__list">{comments.map(this.renderComment)}</div>
      </Scrollbars>
    );
  }

  render() {
    return (
      <div className={this.className}>
        <Dashlet title={t('Комментарии')} needGoTo={false} actionEdit={false} actionHelp={false} resizable>
          <ReactResizeDetector handleWidth handleHeight onResize={this.handleResize} />
          <div className="ecos-comments__header">{this.renderHeader()}</div>

          {this.renderComments()}
        </Dashlet>
      </div>
    );
  }
}

export default Comments;
