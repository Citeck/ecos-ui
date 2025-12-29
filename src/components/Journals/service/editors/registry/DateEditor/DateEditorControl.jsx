import classNames from 'classnames';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import moment from 'moment';
import React from 'react';
import ReactDOM from 'react-dom';

import editorRegistry from '../';
import { PREDICATE_TIME_INTERVAL } from '../../../../../Records/predicates/predicates';
import { DatePicker, DateIntervalPicker } from '../../../../../common/form';
import EditorScope from '../../EditorScope';
import TextEditor from '../TextEditor';

export default class DateEditorControl extends React.Component {
  constructor(props) {
    super(props);
    this.portal = this.createDateEditorContainer();
    this.state = {
      date: props.value
    };
  }

  _control = new Map();

  get isCell() {
    const { scope } = this.props;
    return scope === EditorScope.CELL;
  }

  get isFilter() {
    const { scope } = this.props;
    return scope === EditorScope.FILTER;
  }

  dateFormat = 'dd.MM.yyyy';

  get extraProps() {
    return { ...get(this, 'props.extraProps', {}) };
  }

  get selected() {
    const date = moment(this.state.date).toISOString(true);
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
    let date = moment(value);

    if (this.extraProps.showTimeInput) {
      date = date.toISOString(true);
    } else {
      date = date.format('YYYY-MM-DD');
    }

    this.setState({ date }, this.sendData);
  };

  onChangeInterval = dates => {
    if (dates && dates.includes('/')) {
      this.setState({ date: dates }, this.sendData);
    }
  };

  sendData = () => {
    this.props.onUpdate && this.props.onUpdate(this.state.date);
  };

  onKeyDown = e => {
    if (e.key === 'Enter') {
      this.sendData();
    }

    if (isFunction(this.props.onKeyDown)) {
      e.persist();
      this.props.onKeyDown(e, this.state.date);
    }
  };

  get inputControl() {
    const key = JSON.stringify([this.props.config, this.props.scope]);

    if (this._control.has(key)) {
      return this._control.get(key);
    }

    const editorInstance = editorRegistry.getEditor(TextEditor.TYPE);
    const Control = editorInstance.getControl(this.props.config, this.props.scope);

    this._control.set(key, Control);

    return Control;
  }

  renderDateInterval() {
    const { isRelativeToParent } = this.props;
    const { date } = this.state;

    return (
      <DateIntervalPicker
        value={date}
        showTimeInput={get(this.extraProps, 'showTimeInput')}
        isRelativeToParent={isRelativeToParent}
        onChange={this.onChangeInterval}
      />
    );
  }

  render() {
    if (this.isFilter && [get(this.props, 'predicate.t'), get(this.props, 'predicate.value')].includes(PREDICATE_TIME_INTERVAL)) {
      return this.renderDateInterval();
    }

    return (
      <DatePicker
        className={classNames({
          'ecos-input_grid-editor': this.isCell,
          'ecos-input_narrow': !this.isCell
        })}
        wrapperClasses={classNames({
          'ecos-filter_width_full': !this.isCell
        })}
        onSave={this.onChange}
        onKeyDown={this.onKeyDown}
        autoFocus={this.isCell}
        showIcon={!this.isCell}
        hasSaveButton={this.isCell}
        selected={this.selected}
        onCancel={get(this.props, 'onCancel')}
        dateFormat={this.dateFormat}
        popperPlacement="top"
        popperContainer={({ children }) => ReactDOM.createPortal(children, this.portal)}
        {...this.extraProps}
      />
    );
  }
}
