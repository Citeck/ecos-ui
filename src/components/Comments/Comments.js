import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import moment from 'moment';
import ReactResizeDetector from 'react-resize-detector';
import { Editor, EditorState, RichUtils, ContentState, convertToRaw, convertFromRaw } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import classNames from 'classnames';

import Dashlet from '../Dashlet/Dashlet';
import Btn from '../common/btns/Btn/Btn';
import Loader from '../common/Loader/Loader';
import IcoBtn from '../common/btns/IcoBtn/IcoBtn';
import { t, num2str } from '../../helpers/util';
import { selectStateByNodeRef } from '../../selectors/comments';
import { createCommentRequest, deleteCommentRequest, getComments, setError, updateCommentRequest } from '../../actions/comments';

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
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    comments: PropTypes.arrayOf(
      PropTypes.shape({
        avatar: PropTypes.string,
        firstName: PropTypes.string,
        lastName: PropTypes.string,
        middleName: PropTypes.string,
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
    onSave: () => {},
    onDelete: () => {},
    getComments: () => {},
    createComment: () => {},
    updateComment: () => {},
    deleteComment: () => {},
    setErrorMessage: () => {}
  };

  state = {
    isEdit: false,
    width: 291,
    editorHeight: BASE_HEIGHT,
    comment: EditorState.createEmpty(),
    editableComment: null,
    commentForDeletion: null
  };

  componentDidMount() {
    const { getComments, id } = this.props;

    getComments(id);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.saveIsLoading && !nextProps.saveIsLoading && !nextProps.errorMessage) {
      this.setState({
        isEdit: false,
        editorHeight: BASE_HEIGHT,
        comment: EditorState.createEmpty(),
        editableComment: null,
        commentForDeletion: null
      });
    }
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

  get countComments() {
    const { totalCount } = this.props;

    if (!totalCount) {
      return t('Нет комментариев');
    }

    return `${totalCount} ${t(num2str(totalCount, ['комментарий', 'комментария', 'комментариев']))}`;
  }

  get className() {
    const { width } = this.state;
    const classes = ['ecos-comments'];

    if (width <= 430) {
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

  handleConfirmDeletion = () => {
    this.props.deleteComment(this.state.commentForDeletion);
    this.setState({ commentForDeletion: null });
  };

  handleReloadData = () => {
    const { getComments, id } = this.props;

    getComments(id);
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
          <Btn className="ecos-btn_red ecos-comments__comment-confirm-btn" onClick={this.handleConfirmDeletion}>
            {t('Удалить')}
          </Btn>
        </div>
      </div>
    );
  }

  renderComment = data => {
    const { id, avatar = '', firstName, lastName, middleName, text, dateCreate = new Date(), canEdit = false, canDelete = false } = data;
    let convertedComment = text;

    try {
      convertedComment = convertFromRaw(JSON.parse(text));
      convertedComment = stateToHTML(convertedComment);
    } catch (e) {}

    return (
      <div className="ecos-comments__comment" key={id}>
        <div className="ecos-comments__comment-header">
          <div className="ecos-comments__comment-header-cell">
            {this.renderAvatar(avatar, lastName)}
            <div className="ecos-comments__comment-header-column">
              <div className="ecos-comments__comment-name">
                {firstName} {middleName}
              </div>
              <div className="ecos-comments__comment-name">{lastName}</div>
              <div className="ecos-comments__comment-date">{this.getFormattedDate(dateCreate)}</div>
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

  renderLoader() {
    const { fetchIsLoading } = this.props;

    if (!fetchIsLoading) {
      return null;
    }

    return <Loader blur />;
  }

  render() {
    return (
      <div className={this.className}>
        <Dashlet title={t('Комментарии')} needGoTo={false} actionEdit={false} actionHelp={false} resizable onReload={this.handleReloadData}>
          <ReactResizeDetector handleWidth handleHeight onResize={this.handleResize} />
          <div className="ecos-comments__header">{this.renderHeader()}</div>

          {this.renderComments()}
        </Dashlet>
        {this.renderLoader()}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  ...selectStateByNodeRef(state, ownProps.id)
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  getComments: nodeRef => dispatch(getComments(nodeRef)),
  createComment: comment => dispatch(createCommentRequest({ comment, nodeRef: ownProps.id })),
  updateComment: comment => dispatch(updateCommentRequest({ comment, nodeRef: ownProps.id })),
  deleteComment: id => dispatch(deleteCommentRequest({ id, nodeRef: ownProps.id })),
  setErrorMessage: message => dispatch(setError({ message, nodeRef: ownProps.id }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Comments);
