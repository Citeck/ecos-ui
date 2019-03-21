import React, { Component } from 'react';
import classNames from 'classnames';
import debounce from 'lodash/debounce';
import { Tooltip } from 'reactstrap';
import Icon from '../../../../icons/Icon/Icon';
import { Input } from '../../../../form';

import './HeaderFormatter.scss';

function triggerEvent(name, data) {
  const callback = this.props[name];

  if (typeof callback === 'function') {
    callback.call(this, data);
  }
}

export default class HeaderFormatter extends Component {
  constructor(props) {
    super(props);
    this.thRef = React.createRef();
    this.state = { open: false, text: props.filterValue };
    this.onCloseFilter = this.onCloseFilter.bind(this);
  }

  toggle = () => {
    const open = !this.state.open;

    open
      ? document.addEventListener(this.props.closeFilterEvent, this.onCloseFilter)
      : document.removeEventListener(this.props.closeFilterEvent, this.onCloseFilter);

    this.setState({ open });
  };

  onChange = e => {
    let text = e.target.value;
    this.setState({ text });
    this.triggerPendingChange(text, this.props.column.dataField);
  };

  clear = () => {
    this.setState({ text: '' });
    this.triggerPendingChange('', this.props.column.dataField);
  };

  triggerPendingChange = debounce((text, dataField) => {
    this.toggle();
    triggerEvent.call(this, 'onFilter', {
      field: dataField,
      predicate: 'string-contains',
      value: text.trim()
    });
  }, 500);

  onCloseFilter(e) {
    const tooltip = document.getElementById(this.tooltipId);
    const filter = document.getElementById(this.id);

    if (filter.contains(e.target) || tooltip.contains(e.target)) {
      return;
    }

    this.toggle();
  }

  onDeviderMouseDown = e => {
    const current = this.thRef.current;
    triggerEvent.call(this, 'onDeviderMouseDown', {
      e: e,
      th: current.parentElement
    });
  };

  filter = columnText => {
    const state = this.state;

    return (
      <div className={state.text && 'ecos-th__filter'}>
        {columnText}

        <Icon id={this.id} className={'ecos-th__filter-icon icon-filter'} onClick={this.toggle} />

        <Tooltip
          id={this.tooltipId}
          target={this.id}
          isOpen={state.open}
          trigger={'click'}
          placement="top"
          className={'ecos-th__filter-tooltip'}
          innerClassName={'ecos-th__filter-tooltip-body'}
          arrowClassName={'ecos-th__filter-tooltip-marker'}
        >
          <Input autoFocus type="text" className={'ecos-th__filter-tooltip-input'} onChange={this.onChange} value={state.text} />

          <Icon className={'ecos-th__filter-tooltip-close icon-close icon_small'} onClick={this.clear} />
        </Tooltip>
      </div>
    );
  };

  render() {
    const { column, filterable } = this.props;
    const state = this.state;

    this.id = `filter-${column.dataField.replace(':', '_')}`;
    this.tooltipId = `tooltip-${this.id}`;

    return (
      <div ref={this.thRef} className={classNames('ecos-th', state.text && 'ecos-th_filtered')}>
        {filterable ? this.filter(column.text) : column.text}

        <div className={'ecos-th__devider'} onMouseDown={this.onDeviderMouseDown} />
      </div>
    );
  }
}
