import React from 'react';
import PropTypes from 'prop-types';
import Dashlet from '../Dashlet/Dashlet';
import { t, num2str } from '../../helpers/util';
import './style.scss';
import Btn from '../common/btns/Btn/Btn';

class Comments extends React.Component {
  static propTypes = {
    comments: PropTypes.array
  };

  static defaultProps = {
    comments: []
  };

  state = {
    isEdit: false
  };

  get countComments() {
    const { comments } = this.props;

    if (!comments.length) {
      return t('Нет комментариев');
    }

    return `${comments.length} ${t(num2str(comments.length, ['комментарий', 'комментария', 'комментариев']))}`;
  }

  renderHeader() {
    const { isEdit } = this.state;

    if (isEdit) {
      return this.renderEditor();
    }

    return (
      <React.Fragment>
        <div className="ecos-comments__count">{this.countComments}</div>
        <Btn className={'ecos-btn_blue ecos-btn_hover_light-blue'}>{t('Добавить комментарий')}</Btn>
      </React.Fragment>
    );
  }

  renderEditor() {
    return 'Editor';
  }

  renderComments() {
    const { comments } = this.props;

    if (!comments.length) {
      return null;
    }

    return 'Comments list';
  }

  render() {
    return (
      <Dashlet title={t('Комментарии')} bodyClassName="ecos-comments" needGoTo={false} actionEdit={false} actionHelp={false}>
        <div className="ecos-comments__header">{this.renderHeader()}</div>

        {this.renderComments()}
      </Dashlet>
    );
  }
}

export default Comments;
