import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { stateToHTML } from 'draft-js-export-html';
import { convertFromRaw } from 'draft-js';
import moment from 'moment';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';

import { Avatar, Loader, Popper } from '../../common/index';
import { t } from '../../../helpers/export/util';
import { num2str } from '../../../helpers/util';
import { Btn } from '../../common/btns';
import { Badge } from '../../common/form';
import { CommentInterface } from './propsInterfaces';

class Comment extends Component {
  static propTypes = {
    comment: PropTypes.shape(CommentInterface),
    userName: PropTypes.string,
    actionFailed: PropTypes.bool,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func
  };

  state = {
    isOpenConfirmDialog: false,
    isLoading: false
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.actionFailed && !this.props.actionFailed && this.state.isLoading) {
      this.setState({ isLoading: false });
    }
  }

  get convertedComment() {
    const { comment } = this.props;
    let convertedComment;

    try {
      convertedComment = stateToHTML(convertFromRaw(JSON.parse(comment.text)));
    } catch (e) {
      convertedComment = comment.text;
    }

    return convertedComment;
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
    const { comment, onEdit } = this.props;

    if (typeof onEdit === 'function') {
      onEdit(comment.id);
    }
  };

  toggleConfirmDialog = () => {
    this.setState(state => ({ isOpenConfirmDialog: !state.isOpenConfirmDialog }));
  };

  toggleLoading = () => {
    this.setState(state => ({ isLoading: !state.isLoading }));
  };

  handleConfirmDeletion = () => {
    const { comment, onDelete } = this.props;

    if (typeof onDelete === 'function') {
      onDelete(comment.id);
    }

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

    return tags.map(tag => (
      <Badge
        key={tag}
        className="ecos-comments__comment-tag"
        popupClassName="ecos-comments__comment-tag-popper"
        text={tag}
        size="small"
        withPopup
      />
    ));
  }

  render() {
    const { comment } = this.props;
    const { id, avatar = '', firstName, lastName, middleName, displayName, canEdit = false, canDelete = false } = comment;

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
        </div>
        <div className="ecos-comments__comment-text" dangerouslySetInnerHTML={{ __html: this.convertedComment }} />

        {this.renderConfirmDelete(id)}
      </div>
    );
  }
}

export default Comment;
