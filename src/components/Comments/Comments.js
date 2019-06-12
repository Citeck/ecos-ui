import React from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';
import moment from 'moment';
import ReactResizeDetector from 'react-resize-detector';
import Dashlet from '../Dashlet/Dashlet';
import Btn from '../common/btns/Btn/Btn';
import { t, num2str } from '../../helpers/util';
import './style.scss';

class Comments extends React.Component {
  static propTypes = {
    comments: PropTypes.arrayOf({
      avatar: PropTypes.string,
      userName: PropTypes.string.isRequired,
      comment: PropTypes.string.isRequired,
      date: PropTypes.instanceOf(Date).isRequired
    })
  };

  static defaultProps = {
    comments: []
  };

  state = {
    isEdit: false,
    width: 291
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

  handleResize = width => {
    this.setState({ width });
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
        <Btn className="ecos-btn_blue ecos-btn_hover_light-blue ecos-comments__add-btn">{t('Добавить комментарий')}</Btn>
      </React.Fragment>
    );
  }

  renderEditor() {
    return 'Editor';
  }

  renderAvatar(avatarLink = '', userName = '') {
    if (avatarLink) {
      return <img src={avatarLink} className="ecos-comments__comment-avatar" />;
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
      <Scrollbars autoHide style={{ height: '100%', minHeight: '160px' }}>
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
