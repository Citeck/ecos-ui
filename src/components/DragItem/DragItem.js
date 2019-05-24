import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import './style.scss';
import { IcoBtn } from '../common/btns';

class DragItem extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    title: PropTypes.string
  };

  static defaultProps = {
    className: '',
    title: ''
  };

  _className = 'ecos-drag-item';

  render() {
    const { title, className } = this.props;

    return (
      <div className={classNames(this._className, className)}>
        <span className={`${this._className}__title`}>{title}</span>

        <div className={`${this._className}__actions`}>
          <IcoBtn
            icon={'icon-drag'}
            className={`ecos-btn_grey1 ecos-btn_width_auto ecos-btn_hover_grey1 ${this._className}__actions__btn-move`}
          />
        </div>
      </div>
    );
  }
}

export default DragItem;
