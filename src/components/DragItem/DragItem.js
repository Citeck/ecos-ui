import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import './style.scss';
import { IcoBtn } from '../common/btns';

class DragItem extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    title: PropTypes.string,
    selected: PropTypes.bool,
    canRemove: PropTypes.bool
  };

  static defaultProps = {
    className: '',
    title: '',
    selected: false,
    canRemove: false
  };

  _className = 'ecos-drag-item';

  renderActions() {
    const { selected, canRemove } = this.props;
    const _actions = `${this._className}__actions`;
    const _btn = `ecos-btn_width_auto ecos-btn_transparent`;

    return (
      <div className={_actions}>
        {canRemove && (
          <IcoBtn icon={'icon-close'} className={classNames(_btn, `${_actions}__btn-remove`, { 'ecos-btn_grey5': selected })} />
        )}
        <IcoBtn icon={'icon-drag'} className={classNames(_btn, `${_actions}__btn-move`, { 'ecos-btn_grey': selected })} />
      </div>
    );
  }

  render() {
    const { className, title, selected } = this.props;
    const _containerClass = classNames(this._className, className, { [`${this._className}_selected`]: selected });

    return (
      <div className={_containerClass}>
        <span className={`${this._className}__title`}>{title}</span>
        {this.renderActions()}
      </div>
    );
  }
}

export default DragItem;
