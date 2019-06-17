import React from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';
import moment from 'moment';
import ReactResizeDetector from 'react-resize-detector';
import { Editor, EditorState, RichUtils } from 'draft-js';
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
      comment: PropTypes.string.isRequired,
      date: PropTypes.instanceOf(Date).isRequired
    }),
    maxLength: PropTypes.number
  };

  static defaultProps = {
    comments: [],
    maxLength: 350
  };

  state = {
    isEdit: true,
    width: 291,
    editorHeight: BASE_HEIGHT,
    comment: EditorState.createEmpty()
  };

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
      return `${hours} часов назад`;
    }

    if (minutes > 0) {
      return `${minutes} минут назад`;
    }

    if (seconds > 0) {
      return `${seconds} секунд назад`;
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
    this.setState({ isEdit: true });
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

  renderEditor() {
    const { maxLength } = this.props;
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
            style={{ padding: '5px', color: this.inlineStyles.has(BUTTONS_TYPE.BOLD) ? 'blue' : 'white', cursor: 'pointer' }}
            onClick={this.handleToggleStyle.bind(this, BUTTONS_TYPE.BOLD)}
          >
            B
          </div>
          <div
            style={{ padding: '5px', color: this.inlineStyles.has(BUTTONS_TYPE.ITALIC) ? 'blue' : 'white', cursor: 'pointer' }}
            onClick={this.handleToggleStyle.bind(this, BUTTONS_TYPE.ITALIC)}
          >
            I
          </div>
          <div
            style={{ padding: '5px', color: this.inlineStyles.has(BUTTONS_TYPE.UNDERLINE) ? 'blue' : 'white', cursor: 'pointer' }}
            onClick={this.handleToggleStyle.bind(this, BUTTONS_TYPE.UNDERLINE)}
          >
            U
          </div>
          <div
            style={{ padding: '5px', color: this.blockType === BUTTONS_TYPE.LIST ? 'blue' : 'white', cursor: 'pointer' }}
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
          {this.renderCount()}
          {/*{this.renderErrorMessage()}*/}
          <div>
            <Btn className="ecos-btn_grey5 ecos-btn_hover_grey1 ecos-comments__editor-footer-btn" onClick={this.handleCloseEditor}>
              {t('Отмена')}
            </Btn>
            <Btn
              className="ecos-btn_blue ecos-btn_hover_light-blue ecos-commens__editor-footer-btn"
              onClick={this.handleCloseEditor}
              disabled={this.commentLength > maxLength}
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

  renderComment = (data, index) => {
    const { avatar = '', userName, comment, date = new Date() } = data;

    return (
      <div className="ecos-comments__comment" key={index}>
        <div className="ecos-comments__comment-header">
          {this.renderAvatar(avatar, userName)}
          <div className="ecos-comments__comment-header-column">
            <div className="ecos-comments__comment-name">{userName}</div>
            <div className="ecos-comments__comment-date">{this.getFormattedDate(date)}</div>
          </div>
        </div>
        <div className="ecos-comments__comment-text">{comment}</div>
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
