import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import classNames from 'classnames';
import get from 'lodash/get';
import debounce from 'lodash/debounce';

import { DatePicker } from '../../../../../common/form';
import EditorScope from '../../EditorScope';

export default class DateEditorControl extends React.Component {
  constructor(props) {
    super(props);
    this.portal = this.createDateEditorContainer();
    this.state = {
      date: props.value
    };
  }

  get dateFormat() {
    return 'dd.MM.yyyy';
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
    this.debounceUpdate.cancel();
  }

  debounceUpdate = this.props.onUpdate ? debounce(this.props.onUpdate, 3000) : _ => _;

  onChange = value => {
    const date = moment(value)
      .utc()
      .format();

    this.setState({ date });
    this.debounceUpdate(date);
  };

  onBlur = () => {
    this.props.onUpdate && this.props.onUpdate(this.state.date);
    this.debounceUpdate.cancel();
  };

  onKeyDown = e => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      this.onBlur();
    }
  };

  render() {
    const { scope } = this.props;
    const isCell = scope === EditorScope.CELL;

    return (
      <DatePicker
        className={classNames({
          'ecos-input_grid-editor': isCell,
          'ecos-input_narrow': !isCell
        })}
        wrapperClasses={classNames({
          'ecos-filter_width_full': !isCell
        })}
        onChange={this.onChange}
        onBlur={this.onBlur}
        onKeyDown={this.onKeyDown}
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
