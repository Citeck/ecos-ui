import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import moment from 'moment';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import isNil from 'lodash/isNil';
import { $generateHtmlFromNodes } from '@lexical/html';
import { Avatar, Loader, Popper } from '../../common/index';
import { t } from '../../../helpers/export/util';
import { num2str } from '../../../helpers/util';
import { Btn } from '../../common/btns';
import { Badge } from '../../common/form';
import RichTextEditor from '../../RichTextEditor';
import { CommentInterface } from './propsInterfaces';
import { selectStateByNodeRef } from '../../../selectors/comments';

import { createCommentRequest, setError, deleteCommentRequest, getComments, updateCommentRequest } from '../../../actions/comments';
import { isFunction } from 'lodash';

export const LENGTH_LIMIT = 5000;

export class Comment extends Component {
  static propTypes = {
    comment: PropTypes.shape(CommentInterface),
    userName: PropTypes.string,
    actionFailed: PropTypes.bool
  };

  state = {
    isOpenConfirmDialog: false,
    isLoading: false,
    isEdit: false,
    isMaxLength: false,
    isInternal: false
  };

  get canSendComment() {
    const { saveIsLoading } = this.props;
    const { isMaxLength } = this.state;

    return !isMaxLength && !saveIsLoading;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.actionFailed && !this.props.actionFailed && this.state.isLoading) {
      this.setState({ isLoading: false });
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

  handleEditComment = () => {
    this.setState({
      isEdit: true
    });
  };

  handleCloseEditor = () => {
    const { onClose } = this.props;

    this.setState({
      isEdit: false,
      htmlString: ''
    });

    isFunction(onClose) && onClose();
  };

  toggleConfirmDialog = () => {
    this.setState(state => ({ isOpenConfirmDialog: !state.isOpenConfirmDialog }));
  };

  toggleLoading = () => {
    this.setState(state => ({ isLoading: !state.isLoading }));
  };

  handleConfirmDeletion = () => {
    const { comment, deleteComment, nodeRef } = this.props;
    isFunction(deleteComment) && deleteComment(nodeRef, comment.id);

    this.toggleLoading();
  };

  renderCommentDate() {
    const { comment, userName } = this.props;
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

  renderConfirmDelete() {
    const { actionFailed } = this.props;
    const { isOpenConfirmDialog, isLoading } = this.state;

    if (!isOpenConfirmDialog) {
      return null;
    }

    return (
      <div className="ecos-comments__comment-confirm">
        <div className="ecos-comments__comment-confirm-group">
          <div className="ecos-comments__comment-confirm-title">{t('comments-widget.confirm.title')}?</div>

          <div className="ecos-comments__comment-confirm-btns">
            <Btn className="ecos-btn_grey5 ecos-btn_hover_color-grey ecos-comments__comment-confirm-btn" onClick={this.toggleConfirmDialog}>
              {t('comments-widget.confirm.cancel')}
            </Btn>
            <Btn className="ecos-btn_red ecos-comments__comment-confirm-btn" onClick={this.handleConfirmDeletion}>
              {t('comments-widget.confirm.delete')}
            </Btn>
          </div>
        </div>

        {!actionFailed && isLoading && <Loader blur />}
      </div>
    );
  }

  renderTags() {
    const tags = get(this.props, 'comment.tags', []);

    if (isEmpty(tags)) {
      return null;
    }

    return tags.map(tag => {
      const style = {};

      if (tag.color) {
        style.borderColor = tag.color;
      }

      return (
        <Badge
          key={tag.title}
          className="ecos-comments__comment-tag"
          popupClassName="ecos-comments__comment-tag-popper"
          text={tag.title}
          size="small"
          withPopup
          style={style}
        />
      );
    });
  }

  handleEditorStateChange = (editorState, editor) => {
    const { textContent = '' } = editor.getRootElement();

    this.setState({ isMaxLength: textContent.length > LENGTH_LIMIT });

    editor.update(() => {
      const htmlComment = $generateHtmlFromNodes(editor, null);
      if (!isNil(htmlComment)) {
        this.setState({
          htmlComment,
          rawComment: JSON.stringify(editorState)
        });
      }
    });
  };

  handleSaveComment = () => {
    const { saveIsLoading } = this.props;

    if (saveIsLoading) {
      return;
    }

    const { updateComment, createComment, comment, nodeRef, dataStorageFormat } = this.props;
    const { htmlComment, rawComment } = this.state;
    let text = '';
    switch (dataStorageFormat) {
      case 'raw':
        text = rawComment;
        break;
      case 'html':
        text = htmlComment;
        text = text.replace(/<br>\n/gim, '<br/>');
        break;
      case 'plain-text':
      default:
        text = htmlComment;
    }

    const callback = () => {
      this.handleCloseEditor();
      this.toggleLoading();
    };

    this.toggleLoading();
    comment === null ? createComment(nodeRef, text, callback) : updateComment(nodeRef, { id: comment.id, text }, callback);
  };

  renderEditor() {
    const { saveIsLoading, comment } = this.props;
    const { isLoading } = this.state;

    return (
      <div className="ecos-comments__editor">
        {isLoading && <Loader blur />}
        <RichTextEditor htmlString={comment ? comment.text : null} onChange={this.handleEditorStateChange} />
        <div className="ecos-comments__editor-footer">
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

  render() {
    const { comment } = this.props;

    if (comment === null) {
      return this.renderEditor();
    }

    const { id, avatar = '', firstName, lastName, middleName, displayName, text, canEdit = false, canDelete = false } = comment;
    const { isEdit } = this.state;

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

            <div className="ecos-comments__comment-header-column ecos-comments__comment-name-container">
              <div className="ecos-comments__comment-name">
                {firstName} {middleName}
              </div>
              <div className="ecos-comments__comment-name">{lastName}</div>
              {this.renderCommentDate()}
            </div>

            <div className="ecos-comments__comment-header-column ecos-comments__comment-tag-container">{this.renderTags()}</div>
          </div>
          {!isEdit && (
            <div className="ecos-comments__comment-header-cell ecos-comments__comment-header-cell_actions">
              {canEdit && (
                <div
                  className="ecos-comments__comment-btn ecos-comments__comment-btn-edit icon-edit"
                  title={t('comments-widget.icon.edit')}
                  onClick={this.handleEditComment}
                />
              )}
              {canDelete && (
                <div
                  className="ecos-comments__comment-btn ecos-comments__comment-btn-delete icon-delete"
                  title={t('comments-widget.icon.delete')}
                  onClick={this.toggleConfirmDialog}
                />
              )}
            </div>
          )}
        </div>
        {!isEdit && (
          <RichTextEditor readonly className="ecos-comments__comment-editor" htmlString={text} onChange={this.handleEditorStateChange} />
        )}
        {isEdit && this.renderEditor()}

        {this.renderConfirmDelete(id)}
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
  createComment: (nodeRef, comment, callback) => dispatch(createCommentRequest({ comment, nodeRef, callback })),
  updateComment: (nodeRef, comment, callback) => dispatch(updateCommentRequest({ comment, nodeRef, callback })),
  deleteComment: (nodeRef, id, callback) => dispatch(deleteCommentRequest({ id, nodeRef, callback })),
  setErrorMessage: message => dispatch(setError({ message, nodeRef: ownProps.record }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Comment);
