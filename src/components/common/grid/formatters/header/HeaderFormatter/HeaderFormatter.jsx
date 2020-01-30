import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { debounce, replace } from 'lodash';
import { Tooltip } from 'reactstrap';

import { getId, trigger } from '../../../../../../helpers/util';
import { Input } from '../../../../form';
import { Icon } from '../../../../';

import './HeaderFormatter.scss';

export default class HeaderFormatter extends Component {
  constructor(props) {
    super(props);

    this.thRef = React.createRef();
    this._id = getId();
    this.state = { open: false, text: props.filterValue };

    this.onCloseFilter = this.onCloseFilter.bind(this);
  }

  onToggle = () => {
    const open = !this.state.open;

    open
      ? document.addEventListener(this.props.closeFilterEvent, this.onCloseFilter)
      : document.removeEventListener(this.props.closeFilterEvent, this.onCloseFilter);

    this.setState({ open });
  };

  onChange = e => {
    const text = e.target.value;

    this.setState({ text });
  };

  onKeyDown = e => {
    if (e.key === 'Enter') {
      this.triggerPendingChange(this.state.text, this.props.column.dataField);
    }
  };

  onClear = () => {
    this.setState({ text: '' });
    this.triggerPendingChange('', this.props.column.dataField);
  };

  triggerPendingChange = debounce((text, dataField) => {
    this.onToggle();
    trigger.call(this, 'onFilter', [
      {
        att: dataField,
        t: 'contains',
        val: text.trim()
      }
    ]);
  }, 0);

  onCloseFilter(e) {
    const tooltip = document.getElementById(this.tooltipId);

    if (tooltip.contains(e.target)) {
      return;
    }

    this.onToggle();
  }

  onDeviderMouseDown = e => {
    const current = this.thRef.current;

    trigger.call(this, 'onDeviderMouseDown', {
      e: e,
      th: current.parentElement
    });
  };

  onSort = () => {
    const { ascending, column, sortable } = this.props;

    if (sortable) {
      trigger.call(this, 'onSort', { ascending, column });
    }
  };

  renderFilter = columnText => {
    const { text, open } = this.state;

    return (
      <div className={classNames({ 'ecos-th__filter': text })}>
        {columnText}

        <Icon id={this.id} className="ecos-th__filter-icon icon-filter" onClick={this.onToggle} />

        <Tooltip
          id={this.tooltipId}
          target={this.id}
          isOpen={open}
          trigger={'click'}
          placement="top"
          boundariesElement={'window'}
          className="ecos-th__filter-tooltip"
          innerClassName="ecos-th__filter-tooltip-body"
          arrowClassName="ecos-th__filter-tooltip-marker"
        >
          <Input
            autoFocus
            type="text"
            className="ecos-th__filter-tooltip-input"
            onChange={this.onChange}
            onKeyDown={this.onKeyDown}
            value={text}
          />

          <Icon className="ecos-th__filter-tooltip-close icon-close icon_small" onClick={this.onClear} />
        </Tooltip>
      </div>
    );
  };

  render() {
    const { column = {}, filterable, ascending, sortable } = this.props;
    const state = this.state;

    this.id = `filter-${replace(column.dataField, ':', '_')}-${this._id}`;
    this.tooltipId = `tooltip-${this.id}`;

    const text = (
      <span className={classNames({ 'ecos-th__pointer': sortable })} onClick={this.onSort}>
        {column.text}
        {ascending !== undefined && <Icon className={classNames('ecos-th__order', { 'icon-up': ascending, 'icon-down': !ascending })} />}
      </span>
    );

    return (
      <div ref={this.thRef} className={classNames('ecos-th', { 'ecos-th_filtered': state.text })}>
        {filterable ? this.renderFilter(text) : text}
        <div className="ecos-th__devider" onMouseDown={this.onDeviderMouseDown} />
      </div>
    );
  }
}

HeaderFormatter.propTypes = {
  filterable: PropTypes.bool,
  closeFilterEvent: PropTypes.string,
  filterValue: PropTypes.string,
  onFilter: PropTypes.func,

  ascending: PropTypes.bool,
  sortable: PropTypes.bool,
  onSort: PropTypes.func,

  column: PropTypes.object,
  colIndex: PropTypes.number,
  onDeviderMouseDown: PropTypes.func
};
