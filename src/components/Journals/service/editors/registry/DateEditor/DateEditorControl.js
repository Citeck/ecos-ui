import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import get from 'lodash/get';

import { DatePicker } from '../../../../../common/form';

const EDITOR_FORMAT = 'dd.MM.YYYY';

export default class DateEditorControl extends React.Component {
  constructor(props) {
    super(props);
    this.portal = this.createDateEditorContainer();
  }

  get dateFormat() {
    return EDITOR_FORMAT;
  }

  get extraProps() {
    return { ...get(this, 'props.extraProps', null) };
  }

  get selected() {
    const value = get(this, 'props.value');
    return moment(value || undefined).toDate();
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

  onUpdate = value => {
    this.props.onUpdate &&
      this.props.onUpdate(
        moment(value)
          .utc()
          .format()
      );
  };

  render() {
    return (
      <DatePicker
        {...this.props}
        className="ecos-input_grid-editor"
        onChange={this.onUpdate}
        autoFocus
        selected={this.selected}
        dateFormat={this.dateFormat}
        popperPlacement={'top'}
        popperContainer={({ children }) => ReactDOM.createPortal(children, this.portal)}
        {...this.extraProps}
      />
    );
  }
}
