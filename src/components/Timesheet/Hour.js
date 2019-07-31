import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { Input } from '../common/form';
import { PointsLoader } from '../common';

const KEYS = {
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ENTER: 'Enter'
};
const KEY_FOR_SAVE = [KEYS.ENTER];

class Hour extends Component {
  static propTypes = {
    count: PropTypes.number,
    color: PropTypes.string,
    canEdit: PropTypes.bool
  };

  static defaultProps = {
    count: 0,
    color: '#33DFD5',
    canEdit: true
  };

  constructor(props) {
    super(props);

    this.state = {
      isEdit: false,
      isLoading: false,
      value: props.count
    };
    this._loaderTimer = null;
    this._input = React.createRef();
  }

  componentWillUnmount() {
    if (this._loaderTimer) {
      window.clearTimeout(this._loaderTimer);
      this._loaderTimer = null;
    }
  }

  get isInput() {
    const { canEdit } = this.props;
    const { isEdit } = this.state;

    return canEdit && isEdit;
  }

  get isFull() {
    const { isEdit, value, isLoading } = this.state;

    return value && !(isEdit || isLoading);
  }

  get isLoader() {
    const { isLoading } = this.state;

    return isLoading;
  }

  get isEmpty() {
    const { canEdit } = this.props;
    const { value } = this.state;

    return canEdit && !value && !(this.isInput || this.isLoader);
  }

  get value() {
    const { canEdit } = this.props;
    const { value } = this.state;

    return canEdit ? value : '';
  }

  set inputRef(ref) {
    this._input = ref;
  }

  handleToggleInput = () => {
    const { canEdit } = this.props;

    if (!canEdit) {
      return;
    }

    this.setState(state => ({ isEdit: !state.isEdit }));
  };

  handleChangeValue = event => {
    let value = parseInt(event.target.value.replace(/\D/g, ''), 10);

    if (Number.isNaN(value)) {
      value = 0;
    }

    this.setState({ value });
  };

  handleInputKeyDown = event => {
    if (KEY_FOR_SAVE.includes(event.key)) {
      this.setState({ isLoading: true });
      this.handleToggleInput();

      this._loaderTimer = window.setTimeout(() => {
        this.setState({ isLoading: false });
        this._loaderTimer = null;
      }, 3000);

      return;
    }

    if (event.key === KEYS.ARROW_UP) {
      event.preventDefault();
      event.stopPropagation();

      this.setState(state => ({ value: state.value + 1 }));

      return;
    }

    if (event.key === KEYS.ARROW_DOWN) {
      this.setState(state => {
        let { value } = state;

        value -= 1;

        if (value < 0) {
          value = 0;
        }

        return { value };
      });
    }
  };

  handleDelete = event => {
    event.stopPropagation();

    this.setState({ value: 0 });
  };

  renderEmpty() {
    if (!this.isEmpty) {
      return null;
    }

    return <div className="ecos-ts-hour__empty" onClick={this.handleToggleInput} />;
  }

  renderFullTime() {
    const { color, canEdit } = this.props;

    if (!this.isFull) {
      return null;
    }

    return (
      <div
        className={classNames('ecos-ts-hour__box', {
          'ecos-ts-hour__box_disabled': !canEdit
        })}
        style={{ backgroundColor: color }}
        onClick={this.handleToggleInput}
      >
        {canEdit && <div className="ecos-ts-hour__box-delete" onClick={this.handleDelete} />}
        {this.value}
      </div>
    );
  }

  renderInput() {
    const { color } = this.props;
    const { value } = this.state;

    if (!this.isInput) {
      return null;
    }

    return (
      <Input
        className="ecos-ts-hour__input"
        style={{ borderColor: color }}
        value={value}
        autoFocus
        onChange={this.handleChangeValue}
        onKeyDown={this.handleInputKeyDown}
        getInputRef={this.inputRef}
      />
    );
  }

  renderLoader() {
    const { color } = this.props;

    if (!this.isLoader) {
      return null;
    }

    return (
      <div className="ecos-ts-hour__loading" style={{ backgroundColor: color }}>
        <PointsLoader className="ecos-ts-hour__loading-loader" />
      </div>
    );
  }

  render() {
    return (
      <div className="ecos-ts-hour">
        {this.renderEmpty()}
        {this.renderFullTime()}
        {this.renderInput()}
        {this.renderLoader()}
      </div>
    );
  }
}

export default Hour;
