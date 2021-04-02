import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';

import { DatePicker } from '../../../../../common/form';

const EDITOR_FORMAT = 'dd.MM.YYYY';

export default class DateEditorControl /*extends BaseEditorControl*/ {
  constructor(props) {
    //super(props);
    this.portal = this.createDateEditorContainer();
  }

  get dateFormat() {
    return EDITOR_FORMAT;
  }

  get extraProps() {
    return {};
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

  handleChange = value => {
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
    const { extraProps, onUpdate, ...rest } = this.props;
    const { value } = extraProps;

    return (
      <DatePicker
        {...rest}
        className="ecos-input_grid-editor"
        onChange={this.handleChange}
        onSelect={this.onSelect}
        autoFocus
        selected={moment(value || undefined).toDate()}
        dateFormat={this.dateFormat}
        popperPlacement={'top'}
        popperContainer={({ children }) => ReactDOM.createPortal(children, this.portal)}
        {...this.extraProps}
      />
    );
  }
}
