import React from 'react';
import isEqual from 'lodash/isEqual';

import { normalizeEditorValue, getEditorValue } from './editorUtils';

export default class EditorControlWrapper extends React.Component {
  constructor(props) {
    super(props);

    const editorValue = getEditorValue(props.value, props.multiple);

    this.state = {
      richValue: props.value,
      editorValue,
      initEditorValue: editorValue,
      control: props.control
    };
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    const editorValue = getEditorValue(nextProps.value, nextProps.multiple);
    return !isEqual(nextState.initEditorValue, this.state.initEditorValue) || !isEqual(editorValue, nextState.editorValue);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const editorValue = getEditorValue(this.props.value, this.props.multiple);
    !isEqual(editorValue, this.state.editorValue) && this.setState({ editorValue });
  }

  _setRichValue(value, changeTime, resolve) {
    this.setState(
      {
        richValue: value,
        changeTime
      },
      () => {
        if (changeTime === this.state.changeTime) {
          this.props.onUpdate(this.state.richValue);
        } else {
          console.warn('CHANGED TIME IS NOT MATCH', this.state, changeTime, value);
        }
        resolve();
      }
    );
  }

  _handleChange(value, state, resolve) {
    this.setState({
      editorValue: value
    });

    const changedTime = Date.now();
    const correctValue = normalizeEditorValue(value, this.props.multiple);

    if (!this.props.getDisplayName) {
      this._setRichValue(correctValue, changedTime, resolve);
      return;
    }

    if (correctValue == null) {
      this._setRichValue(correctValue, changedTime, resolve);
    }

    let richValue;
    if (Array.isArray(correctValue)) {
      richValue = Promise.all(correctValue.map(v => this._enrichSingleValue(v, state)));
    } else {
      richValue = this._enrichSingleValue(correctValue, state);
    }

    if (richValue == null) {
      console.error('Incorrect rich value for input:', correctValue);
      return;
    }

    if (richValue.then) {
      richValue.then(res => {
        this._setRichValue(res, changedTime, resolve);
      });
    } else {
      this._setRichValue(richValue, changedTime, resolve);
    }
  }

  _enrichSingleValue(value, state) {
    const dispValue = this.props.getDisplayName(value, state);
    if (dispValue == null) {
      return value;
    }

    if (dispValue.then) {
      return dispValue.then(disp => {
        return { disp, value };
      });
    }
    return {
      value,
      disp: dispValue
    };
  }

  getValue() {
    return this.state.richValue;
  }

  render() {
    const { onKeyDown = () => {}, multiple, attribute, recordRef } = this.props;

    const onBlur = () => {
      if (this.props.onBlur != null) {
        this.props.onBlur();
      }
    };

    let onCancel = this.props.onCancel;
    if (onCancel == null) {
      onCancel = () => {
        onBlur();
      };
    }

    const onUpdate = (v, state) => {
      return new Promise(resolve => {
        this._handleChange(v, state, resolve);
      });
    };

    const Control = this.props.control;
    const value = this.state.editorValue;
    console.log(2, value);
    return (
      <Control
        recordRef={recordRef}
        attribute={attribute}
        value={value}
        multiple={multiple === true}
        onCancel={onCancel}
        onUpdate={onUpdate}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      />
    );
  }
}
