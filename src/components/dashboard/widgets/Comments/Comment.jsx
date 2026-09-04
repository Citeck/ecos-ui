import Records from '@citeck/records-core';
import { $generateHtmlFromNodes } from '@lexical/html';
import { $getRoot } from 'lexical';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import moment from 'moment';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import LexicalEditor from '@/components/editors/LexicalEditor';
import { Btn } from '@/components/common/btns';
import { Badge, Checkbox, Label } from '@/components/common/form';
import { Avatar, Loader, Popper } from '@/components/common/index';

import { CommentInterface } from './propsInterfaces';

import { createCommentRequest, setError, deleteCommentRequest, getComments, updateCommentRequest } from '@/actions/comments';
import { t } from '@/helpers/export/util';
import { $trimEditorContent } from '@/helpers/lexical';
import { num2str } from '@/helpers/util';
import { selectStateByRecordRef } from '@/selectors/comments';
import UploadDocsRefService from '@/services/uploadDocsRefsStore';

export const LENGTH_LIMIT = 5000;

export class Comment extends Component {
  static propTypes = {
    comment: PropTypes.shape(CommentInterface),
    userName: PropTypes.string,
    actionFailed: PropTypes.bool
  };

  state = {
    isOpenConfirmDialog: false,
    isInternalSupported: false,
    isLoading: false,
    isEdit: false,
    isMaxLength: false,
    isInternal: false,
    isEditorEmpty: true
  };

  get canSendComment() {
    const { saveIsLoading } = this.props;
    const { isMaxLength } = this.state;

    return !isMaxLength && !saveIsLoading;
  }

  constructor(props) {
    super(props);
    this._uploadDocsRefService = new UploadDocsRefService();
  }

  componentDidMount() {
    Records.get(this.props.recordRef)
      .load('_aspects._has.has-internal-comments?bool!')
      .then(hasInternal => {
        this.setState({ isInternalSupported: hasInternal });
      });
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

    this.setState({ isEdit: false });
    // the closed editor is gone with its document; a later save must not read its last state
    this._editor = null;

    isFunction(onClose) && onClose();
    this._uploadDocsRefService.clearUploadedEntityRefs();
  };

  toggleConfirmDialog = () => {
    this.setState(state => ({ isOpenConfirmDialog: !state.isOpenConfirmDialog }));
  };

  toggleLoading = () => {
    this.setState(state => ({ isLoading: !state.isLoading }));
  };

  handleConfirmDeletion = callback => {
    const { comment, deleteComment, recordRef } = this.props;

    isFunction(deleteComment) && deleteComment(recordRef, comment.id);
    isFunction(callback) && callback(recordRef, comment.id);

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
      const yesterday = now.clone().subtract(1, 'days').startOf('day');

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

  renderConfirmDelete(callback, titleConfirm) {
    const { actionFailed } = this.props;
    const { isOpenConfirmDialog, isLoading } = this.state;

    if (!isOpenConfirmDialog) {
      return null;
    }

    return (
      <div className="ecos-comments__comment-confirm">
        <div className="ecos-comments__comment-confirm-group">
          <div className="ecos-comments__comment-confirm-title">{titleConfirm || t('comments-widget.confirm.title')}?</div>

          <div className="ecos-comments__comment-confirm-btns">
            <Btn className="ecos-btn_grey5 ecos-btn_hover_color-grey ecos-comments__comment-confirm-btn" onClick={this.toggleConfirmDialog}>
              {t('comments-widget.confirm.cancel')}
            </Btn>
            <Btn className="ecos-btn_red ecos-comments__comment-confirm-btn" onClick={() => this.handleConfirmDeletion(callback)}>
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

  /**
   * Only the two flags the footer needs. The document itself is not serialised here: an html export
   * (and a JSON dump of the state) of the whole comment on every keystroke is wasted work — the text
   * to send is generated from the live editor right before the save — and exporting an image node
   * builds an <img> the browser starts downloading (COREDEV-380).
   *
   * The editor is remembered here as well as in `handleEditorReady`: a subclass may wire only
   * `onChange` (the activities widget does), and the save must still read the live document. The
   * length is measured the way the editor's own limit is (`Editor.tsx`), on the document.
   */
  handleEditorStateChange = (editorState, editor, isEditorEmpty) => {
    const textLength = editorState.read(() => $getRoot().getTextContentSize());

    this._editor = editor;
    this.setState({ isMaxLength: textLength >= LENGTH_LIMIT, isEditorEmpty });
  };

  handleEditorReady = editor => {
    this._editor = editor;
  };

  /**
   * The empty lines and spaces pressed before or after the text are not part of what the author
   * wrote — they only push the comment around in the feed. Cut them off the document itself, so
   * both stored formats come out of the same trimmed content.
   */
  getContentToSave = () => {
    const editor = this._editor;

    // No editor has announced itself, so the author never touched the document: what is stored
    // stays as it is. Sending anything else here would wipe the text of an existing record whose
    // other fields alone were edited (the activities widget lets that through).
    if (!editor) {
      // a record with no text loads it as null, not undefined
      const stored = get(this.props, 'comment.text') || '';

      return { htmlComment: stored, rawComment: stored };
    }

    // merged into the current history entry: the trim is housekeeping, not an edit of the author's,
    // so if the save fails their next Ctrl+Z must still undo their last real change, not this
    editor.update(() => $trimEditorContent(), { discrete: true, tag: 'history-merge' });

    return editor.read(() => ({
      htmlComment: $generateHtmlFromNodes(editor, null),
      rawComment: JSON.stringify(editor.getEditorState())
    }));
  };

  handleTextBeforeSave = () => {
    const { dataStorageFormat } = this.props;
    const { htmlComment, rawComment } = this.getContentToSave();
    let text;
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

    return text;
  };

  handleSaveComment = () => {
    const { saveIsLoading } = this.props;

    if (saveIsLoading) {
      return;
    }

    const { updateComment, createComment, comment, recordRef } = this.props;
    const { isInternal } = this.state;

    const text = this.handleTextBeforeSave();
    const docsRefs = this._uploadDocsRefService.getUploadDocsRefsOfAttrs({ text });

    const callback = () => {
      this.handleCloseEditor();
      this.toggleLoading();
      this._uploadDocsRefService.clearUploadedEntityRefs();
    };

    this.toggleLoading();

    comment === null
      ? createComment({ recordRef, comment: text, isInternal, callback, docsRefs })
      : updateComment(
          recordRef,
          {
            id: comment.id,
            text
          },
          callback
        );
  };

  renderEditor() {
    const { saveIsLoading, comment } = this.props;
    const { isLoading, isEditorEmpty } = this.state;

    return (
      <div className="ecos-comments__editor">
        {isLoading && <Loader blur />}
        <LexicalEditor
          htmlString={comment ? comment.text : null}
          onChange={this.handleEditorStateChange}
          onEditorReady={this.handleEditorReady}
          UploadDocsService={this._uploadDocsRefService}
          recordRef={comment ? comment.id : 'emodel/comment@'}
          attribute="text"
          maxLength={LENGTH_LIMIT}
        />
        <div className="ecos-comments__editor-footer">
          {this.state.isInternalSupported && (
            <div className="ecos-comments__editor-footer-chbx-wrapper">
              <Label title={t('comments-widget.editor.internal_comment')}>
                <Checkbox
                  disabled={!!comment}
                  checked={comment ? comment.isInternal : false}
                  title={t('comments-widget.editor.internal_comment')}
                  onChange={({ checked }) => this.setState({ isInternal: checked })}
                />

                <span className="ecos-comments__editor-footer-chbx-wrapper__text">{t('comments-widget.editor.internal_comment')}</span>
              </Label>
            </div>
          )}
          <div className="ecos-comments__editor-footer-btn-wrapper">
            <Btn
              className="ecos-btn_grey5 ecos-btn_hover_color-grey ecos-comments__editor-footer-btn"
              onClick={this.handleCloseEditor}
              disabled={saveIsLoading}
            >
              {t('comments-widget.editor.cancel')}
            </Btn>
            <Btn
              className="ecos-btn_blue ecos-comments__editor-footer-btn"
              onClick={this.handleSaveComment}
              disabled={!this.canSendComment || isEditorEmpty}
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

    const { id, avatar = '', firstName, lastName, middleName, displayName, text, canEdit = false, canDelete = false, userName } = comment;
    const { isEdit } = this.state;

    let explicitFirstName = firstName;
    if (!firstName && !lastName && !middleName) {
      explicitFirstName = userName;
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

            <div className="ecos-comments__comment-header-column ecos-comments__comment-name-container">
              <div className="ecos-comments__comment-name">
                {explicitFirstName} {middleName}
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
        {!isEdit && <LexicalEditor readonly className="ecos-comments__comment-editor" htmlString={text} />}
        {isEdit && this.renderEditor()}

        {this.renderConfirmDelete(id)}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  ...selectStateByRecordRef(state, ownProps.record),
  isMobile: state.view.isMobile,
  userName: state.user.userName
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  getComments: () => dispatch(getComments(ownProps.record)),
  createComment: ({ recordRef, comment, isInternal, callback, docsRefs }) =>
    dispatch(createCommentRequest({ comment, recordRef, isInternal, callback, docsRefs })),
  updateComment: (recordRef, comment, callback) => dispatch(updateCommentRequest({ comment, recordRef, callback })),
  deleteComment: (recordRef, id, callback) => dispatch(deleteCommentRequest({ id, recordRef, callback })),
  setErrorMessage: message => dispatch(setError({ message, recordRef: ownProps.record }))
});

export default connect(mapStateToProps, mapDispatchToProps)(Comment);
