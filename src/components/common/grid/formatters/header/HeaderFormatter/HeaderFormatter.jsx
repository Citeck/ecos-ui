import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import replace from 'lodash/replace';
import get from 'lodash/get';
import { Tooltip } from 'reactstrap';

import { getId, isExistValue, trigger } from '../../../../../../helpers/util';
import { Icon, Tooltip as EcosTooltip } from '../../../../';
import { Input } from '../../../../form';

import './HeaderFormatter.scss';

export default class HeaderFormatter extends Component {
  constructor(props) {
    super(props);

    this.thRef = React.createRef();
    this._id = getId();
    this.fetchValue = false;
    this.state = { open: false };

    this.onCloseFilter = this.onCloseFilter.bind(this);
  }

  componentDidMount() {
    const { column, filterValue } = this.props;
    const formatter = get(column, 'formatExtraData.formatter.getDisplayText', null);
    const value = formatter && formatter(filterValue);

    if (value instanceof Promise) {
      this.fetchValue = true;
      value.then(text => {
        if (this.fetchValue) {
          this.setState({ text, first: text });
          this.fetchValue = false;
        }
      });
    } else {
      this.setState({ text: filterValue, first: filterValue });
    }
  }

  componentWillUnmount() {
    this.fetchValue = false;
  }

  get activeFilter() {
    const { text, open } = this.state;
    return text || open;
  }

  get indentation() {
    const { filterable, sortable } = this.props;
    const actions = [filterable, sortable].filter(act => act);

    return actions.length * 30;
  }

  onToggle = e => {
    const open = !this.state.open;

    open
      ? document.addEventListener(this.props.closeFilterEvent, this.onCloseFilter)
      : document.removeEventListener(this.props.closeFilterEvent, this.onCloseFilter);

    this.setState({ open });
    e && e.stopPropagation();
  };

  onChange = e => {
    const text = e.target.value;

    this.setState({ text });
  };

  onKeyDown = e => {
    const { text, first } = this.state;

    if (e.key === 'Enter' && text !== first) {
      this.triggerPendingChange(text, this.props.column.dataField);
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

  onDividerMouseDown = e => {
    const { colIndex } = this.props;
    const current = this.thRef.current;

    trigger.call(this, 'onDividerMouseDown', {
      e: e,
      th: current.parentElement,
      colIndex,
      minW: this.indentation ? this.indentation + 20 : undefined
    });
  };

  onSort = () => {
    const { ascending, column, sortable } = this.props;

    if (sortable) {
      trigger.call(this, 'onSort', { ascending, column });
    }
  };

  renderFilter = () => {
    const { text, open } = this.state;
    return (
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
    );
  };

  renderActions = () => {
    const { filterable, ascending, sortable } = this.props;

    return (
      <div className="ecos-th__actions">
        {filterable && (
          <Icon
            id={this.id}
            className={classNames('ecos-th__filter-icon ecos-th__action-icon icon-filter', {
              'ecos-th__action-icon_active': this.activeFilter
            })}
            onClick={this.onToggle}
          />
        )}
        {sortable && (
          <Icon
            className={classNames('ecos-th__order ecos-th__action-icon', {
              'ecos-th__action-icon_active': isExistValue(ascending),
              'icon-up': ascending,
              'icon-down': !ascending
            })}
          />
        )}
      </div>
    );
  };

  render() {
    const { column = {}, filterable, sortable } = this.props;
    const { text, open } = this.state;

    this.id = `filter-${replace(column.dataField, /[\W]*/g, '_')}-${this._id}`;
    this.tooltipId = `tooltip-${this.id}`;
    this.tooltipTextId = `tooltip-text-${this.id}`;

    return (
      <div ref={this.thRef} className={classNames('ecos-th', { 'ecos-th_filtered': this.activeFilter })}>
        <EcosTooltip target={this.tooltipTextId} text={column.text} placement="bottom" trigger="hover" uncontrolled autohide showAsNeeded>
          <div id={this.tooltipTextId} className="ecos-th__content" onClick={this.onSort} style={{ paddingRight: this.indentation }}>
            <div className="ecos-th__content-text">{column.text}</div>
            {this.renderActions()}
          </div>
        </EcosTooltip>
        {filterable && this.renderFilter()}
        <div className="ecos-th__divider" onMouseDown={this.onDividerMouseDown} />
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
  onDividerMouseDown: PropTypes.func
};
