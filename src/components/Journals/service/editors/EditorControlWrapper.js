import React from 'react';
import TextEditorControl from './registry/TextEditor/TextEditorControl';

export default class EditorControlWrapper extends React.Component {
  constructor(props) {
    super(props);
    const value = props.value || props.defaultValue;
    this.state = {
      value: value,
      initialValue: value,
      control: props.control || TextEditorControl
    };
  }

  _handleChange(value) {
    this.setState({ value });
    this.props.onChange(value);
  }

  getValue() {
    return this.state.value;
  }

  render() {
    const Control = this.props.control;
    return <Control value={this.state.initialValue} onChange={this._handleChange} />;
  }
}
