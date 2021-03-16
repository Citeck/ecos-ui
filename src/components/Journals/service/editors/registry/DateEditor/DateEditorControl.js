import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import get from 'lodash/get';

import { DatePicker } from '../../../../../common/form';

const EDITOR_FORMAT = 'DD.MM.YYYY';

export default class DateEditorControl extends React.Component {
  constructor(props) {
    super(props);
    this.portal = this.createDateEditorContainer();
    this.state = {
      date: props.value
    };
  }

  get dateFormat() {
    return EDITOR_FORMAT;
  }

  get extraProps() {
    return { ...get(this, 'props.extraProps', null) };
  }

  get selected() {
    return moment(this.state.date || undefined).toDate();
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
    const date = moment(value)
      .utc()
      .format();
    this.setState({ date });
  };

  onKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.onClickOutside();
    }
  };

  onClickOutside = () => {
    this.props.onUpdate && this.props.onUpdate(this.state.date);
  };

  render() {
    return (
      <DatePicker
        {...this.props}
        className="ecos-input_grid-editor"
        onChange={this.onChange}
        onClickOutside={this.onClickOutside}
        onKeyDown={this.onKeyDown}
        shouldCloseOnSelect={false}
        autoFocus
        selected={this.selected}
        value={this.state.date || null}
        dateFormat={this.dateFormat}
        popperPlacement="top"
        popperContainer={({ children }) => ReactDOM.createPortal(children, this.portal)}
        {...this.extraProps}
      />
    );
  }
}
