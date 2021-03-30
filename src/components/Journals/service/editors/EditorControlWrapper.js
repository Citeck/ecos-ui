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

    this.exist = true;
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return !isEqual(nextProps.deps, this.props.deps);
  }

  componentWillUnmount() {
    this.exist = false;
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

  _handleChange(editorValue, state, resolve) {
    this.setState({ editorValue });

    const changedTime = Date.now();
    const correctValue = normalizeEditorValue(editorValue, this.props.multiple);

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
        if (this.exist) {
          this._setRichValue(res, changedTime, resolve);
        }
      });
    } else {
      this._setRichValue(richValue, changedTime, resolve);
    }
  }

  _enrichSingleValue(value, state) {
    const disp = this.props.getDisplayName(value, state);

    if (disp == null) {
      return value;
    }

    if (disp.then) {
      return disp.then(disp => ({ disp, value }));
    }

    return { disp, value };
  }

  getValue() {
    return this.state.richValue;
  }

  render() {
    const { onKeyDown = _ => _, multiple, attribute, recordRef } = this.props;

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
        if (this.exist) {
          this._handleChange(v, state, resolve);
        }
      });
    };

    const Control = this.props.control;
    const value = this.state.editorValue;

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
