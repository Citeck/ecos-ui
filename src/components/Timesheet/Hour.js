import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import get from 'lodash/get';

import { Icon, PointsLoader } from '../common';
import { Input } from '../common/form';

const KEYS = {
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ENTER: 'Enter',
  ESC: 'Escape'
};
const KEY_FOR_SAVE = [KEYS.ENTER];
const DELIMITERS = [',', '.'];

class Hour extends React.PureComponent {
  static propTypes = {
    count: PropTypes.number,
    color: PropTypes.string,
    settings: PropTypes.shape({
      editable: PropTypes.bool,
      hidden: PropTypes.bool,
      max: PropTypes.number,
      eq: PropTypes.number
    }),
    updatingInfo: PropTypes.object,
    halfHour: PropTypes.bool,
    onChange: PropTypes.func,
    onReset: PropTypes.func
  };

  static defaultProps = {
    count: 0,
    halfHour: false,
    color: '#b7b7b7',
    settings: {}
  };

  constructor(props) {
    super(props);

    this.state = {
      isEdit: false,
      isChanged: false,
      value: props.count
    };
    this._input = React.createRef();
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (get(nextProps, 'updatingInfo.hasError', false) && !get(this.props, 'updatingInfo.hasError', false)) {
      this.resetValue();
    }
  }

  get isInput() {
    const { editable } = this.settings;
    const { isEdit } = this.state;

    return editable && isEdit;
  }

  get isFull() {
    const { isEdit, value } = this.state;

    return value && !(isEdit || this.isLoader);
  }

  get isLoader() {
    const { updatingInfo } = this.props;

    return updatingInfo !== null;
  }

  get isEmpty() {
    const { editable } = this.settings;
    const { value } = this.state;

    return editable && !value && !(this.isInput || this.isLoader);
  }

  get value() {
    const { editable, hidden } = this.settings;
    const { value } = this.state;

    return !editable || hidden ? '' : value;
  }

  set inputRef(ref) {
    this._input = ref;
  }

  get inputRef() {
    return this._input;
  }

  get settings() {
    return { ...(this.props.settings || {}) };
  }

  saveValue(value) {
    this.props.onChange && this.props.onChange(value);
  }

  resetValue() {
    const value = this.props.count;

    this.props.onReset && this.props.onReset(value);
    this.setState({ value });
  }

  setDefValue() {
    const { eq } = this.settings;
    const { value } = this.state;

    if (!value) {
      this.setState({ value: eq });
      this.saveValue(eq);
    }
  }

  handleToggleInput = () => {
    const { editable, hidden } = this.settings;

    if (!editable) {
      return;
    }

    if (hidden) {
      this.setDefValue();
      return;
    }

    this.setState(state => ({
      isEdit: !state.isEdit,
      isChanged: state.isEdit ? false : state.isChanged
    }));
  };

  handleChangeValue = event => {
    const { halfHour } = this.props;
    let value = event.target.value;

    if (halfHour) {
      value = event.target.value.replace(/[^0-9.,]/g, '');
      value = value.replace(DELIMITERS[0], DELIMITERS[1]);

      if (value === DELIMITERS[1]) {
        value = '0.';
      } else {
        const parts = value.split(DELIMITERS[1]);

        if (parts.length === 1) {
          value = parseInt(value.replace(/\D/g, ''), 10);
        }

        if (parts.length > 1 && parts[1] !== '') {
          value = parseFloat(value);
          value = parseFloat((Math.round(value * 2) / 2).toFixed(value % 1 === 0 ? 0 : 1));
        }
      }
    } else {
      value = parseInt(value.replace(/\D/g, ''), 10);
    }

    if (Number.isNaN(value)) {
      value = 0;
    }

    this.setState({ value, isChanged: true });
  };

  handleInputKeyDown = event => {
    const { halfHour } = this.props;
    const { key } = event;
    let { value } = this.state;

    if (halfHour) {
      value = parseFloat(value);
    }

    if (KEY_FOR_SAVE.includes(key)) {
      event.preventDefault();
      event.stopPropagation();

      if (this.state.isChanged) {
        this.saveValue(this.state.value);
      }

      this.handleToggleInput();

      return;
    }

    if (key === KEYS.ARROW_UP) {
      event.preventDefault();
      event.stopPropagation();

      this.setState({ value: ++value, isChanged: true });

      return;
    }

    if (key === KEYS.ARROW_DOWN) {
      event.preventDefault();
      event.stopPropagation();

      this.setState(state => {
        let { value } = state;

        value -= 1;

        if (value < 0) {
          value = 0;
        }

        return { value, isChanged: true };
      });

      return;
    }

    if (key === KEYS.ESC) {
      event.preventDefault();
      event.stopPropagation();

      this.setState((state, props) => ({
        isEdit: false,
        isChanged: false,
        value: props.count
      }));
    }
  };

  handleDelete = event => {
    event.stopPropagation();

    this.setState({ value: 0 });
    this.saveValue(0);
  };

  handleInputBlur = event => {
    event.preventDefault();
    event.stopPropagation();

    if (this.state.isChanged) {
      this.saveValue(this.state.value);
    }

    this.handleToggleInput();
  };

  renderEmpty() {
    if (!this.isEmpty) {
      return null;
    }

    return <Icon className="icon-small-plus ecos-ts-hour__empty" onClick={this.handleToggleInput} />;
  }

  renderFullTime() {
    const { color } = this.props;
    const { editable } = this.settings;

    if (!this.isFull) {
      return null;
    }

    return (
      <div
        className={classNames('ecos-ts-hour__box', {
          'ecos-ts-hour__box_disabled': !editable
        })}
        style={{ backgroundColor: color }}
        onClick={this.handleToggleInput}
      >
        {editable && <Icon className="icon-small-close ecos-ts-hour__box-delete" onClick={this.handleDelete} />}
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
        onBlur={this.handleInputBlur}
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
