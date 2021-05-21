import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import classNames from 'classnames';
import get from 'lodash/get';

import { PREDICATE_TIME_INTERVAL } from '../../../../../Records/predicates/predicates';
import { DatePicker } from '../../../../../common/form';
import EditorScope from '../../EditorScope';
import TextEditor from '../TextEditor';
import editorRegistry from '../';

export default class DateEditorControl extends React.PureComponent {
  constructor(props) {
    super(props);
    this.portal = this.createDateEditorContainer();
    this.state = {
      date: props.value
    };
  }

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
    return { ...get(this, 'props.extraProps', null) };
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

    this.setState({ date });
  };

  sendData = () => {
    this.props.onUpdate && this.props.onUpdate(this.state.date);
  };

  onKeyDown = e => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      this.sendData();
    }
  };

  render() {
    if (this.isFilter && [get(this.props, 'predicate.t'), get(this.props, 'predicate.value')].includes(PREDICATE_TIME_INTERVAL)) {
      let editorInstance = editorRegistry.getEditor(TextEditor.TYPE);
      const Control = editorInstance.getControl(this.props.config, this.props.scope);

      return <Control {...this.props} />;
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
        onChange={this.onChange}
        onBlur={this.sendData}
        onKeyDown={this.onKeyDown}
        autoFocus={this.isCell}
        showIcon={!this.isCell}
        selected={this.selected}
        dateFormat={this.dateFormat}
        popperPlacement="top"
        popperContainer={({ children }) => ReactDOM.createPortal(children, this.portal)}
        {...this.extraProps}
      />
    );
  }
}
