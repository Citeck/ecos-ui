import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import classNames from 'classnames';
import get from 'lodash/get';

import { DatePicker } from '../../../../../common/form';
import EditorScope from '../../EditorScope';

const EDITOR_FORMAT = 'dd.MM.YYYY';

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
    const date = moment(this.state.date)
      .utc()
      .format();
    return this.state.date ? moment(date).toDate() : undefined;
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
    this.props.onUpdate && this.props.onUpdate(date);
  };

  render() {
    const { scope, ...props } = this.props;
    const isCell = scope === EditorScope.CELL;

    return (
      <DatePicker
        {...props}
        className={classNames({
          'ecos-input_grid-editor': isCell,
          'ecos-input_narrow': !isCell
        })}
        wrapperClasses={classNames({
          'ecos-filter_width_full': !isCell
        })}
        onChange={this.onChange}
        autoFocus={isCell}
        showIcon={!isCell}
        selected={this.selected}
        dateFormat={this.dateFormat}
        popperPlacement="top"
        popperContainer={({ children }) => ReactDOM.createPortal(children, this.portal)}
        {...this.extraProps}
      />
    );
  }
}
