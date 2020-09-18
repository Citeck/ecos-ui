import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import { DatePicker } from '../../form';
import BaseEditor from './BaseEditor';

export default class DateEditor extends BaseEditor {
  constructor(props) {
    super(props);
    this.portal = this.createDateEditorContainer();
  }

  createDateEditorContainer = () => {
    let div = document.createElement('div');
    div.classList.add('date-editor-container');
    document.body.appendChild(div);

    return div;
  };

  removeDateEditorContainer = () => {
    document.body.removeChild(this.portal);
  };

  componentWillUnmount() {
    this.removeDateEditorContainer();
  }

  onChange = value => {
    this.setValue(
      moment(value)
        .utc()
        .format()
    );
  };

  onSelect = () => {
    this.props.onBlur && this.props.onBlur();
  };

  render() {
    const { value, dateFormat, onUpdate, ...rest } = this.props;

    return (
      <DatePicker
        {...rest}
        className="ecos-input_grid-editor"
        onChange={this.onChange}
        onSelect={this.onSelect}
        autoFocus
        selected={moment(value || undefined).toDate()}
        dateFormat={dateFormat}
        popperPlacement={'top'}
        popperContainer={({ children }) => ReactDOM.createPortal(children, this.portal)}
      />
    );
  }
}
