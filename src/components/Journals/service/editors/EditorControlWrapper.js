import React from 'react';
import TextEditorControl from './registry/TextEditor/TextEditorControl';

import { normalizeEditorValue, getEditorValue } from './editorUtils';

export default class EditorControlWrapper extends React.Component {
  constructor(props) {
    super(props);

    const editorValue = getEditorValue(props.value, props.multiple);

    this.state = {
      richValue: props.value,
      editorValue,
      initEditorValue: editorValue,
      control: props.control || TextEditorControl
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.statelessControl) {
      return nextState.editorValue !== this.state.editorValue;
    } else {
      return nextState.initEditorValue !== this.state.initEditorValue;
    }
  }

  _setRichValue(value, changeTime) {
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
      }
    );
  }

  _handleChange(value) {
    this.setState({
      editorValue: value
    });

    const changedTime = Date.now();
    const correctValue = normalizeEditorValue(value, this.props.multiple);

    if (!this.props.getDisplayName) {
      this._setRichValue(correctValue, changedTime);
      return;
    }

    if (correctValue == null) {
      this._setRichValue(correctValue, changedTime);
    }

    let richValue;
    if (Array.isArray(correctValue)) {
      richValue = Promise.all(correctValue.map(v => this._enrichSingleValue(v)));
    } else {
      richValue = this._enrichSingleValue(correctValue);
    }

    if (richValue == null) {
      console.error('Incorrect rich value for input:', correctValue);
      return;
    }

    if (richValue.then) {
      richValue.then(res => {
        this._setRichValue(res, changedTime);
      });
    } else {
      this._setRichValue(richValue, changedTime);
    }
  }

  _enrichSingleValue(value) {
    const dispValue = this.props.getDisplayName(value);
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
    const { onKeyDown = () => {}, onBlur = () => {}, statelessControl, multiple } = this.props;

    let onCancel = this.props.onCancel;
    if (onCancel == null) {
      onCancel = () => {
        onBlur();
      };
    }

    const onUpdate = v => {
      this._handleChange(v);
    };

    const Control = this.props.control;
    const value = statelessControl === true ? this.state.editorValue : this.state.initEditorValue;
    return (
      <Control value={value} multiple={multiple === true} onCancel={onCancel} onUpdate={onUpdate} onKeyDown={onKeyDown} onBlur={onBlur} />
    );
  }
}
