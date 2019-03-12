import React, { Component } from 'react';
import classNames from 'classnames';
import debounce from 'lodash/debounce';
import BootstrapTable from 'react-bootstrap-table-next';
import cellEditFactory from 'react-bootstrap-table2-editor';
import Icon from '../../icons/Icon/Icon';
import Checkbox from '../../form/Checkbox/Checkbox';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Btn } from '../../btns';
import { Input } from '../../form';
import { Tooltip } from 'reactstrap';
import { t } from '../../../../helpers/util';

import 'react-perfect-scrollbar/dist/css/styles.css';
import './Grid.scss';

const CLOSE_FILTER_EVENT = 'closeFilterEvent';

function triggerEvent(name, data) {
  const callback = this.props[name];

  if (typeof callback === 'function') {
    callback.call(this, data);
  }
}

class HeaderFormatter extends Component {
  constructor(props) {
    super(props);
    this.thRef = React.createRef();
    this.state = { open: false, text: '' };
    this.onCloseFilter = this.onCloseFilter.bind(this);
  }

  toggle = () => {
    const open = !this.state.open;

    open
      ? document.addEventListener(CLOSE_FILTER_EVENT, this.onCloseFilter)
      : document.removeEventListener(CLOSE_FILTER_EVENT, this.onCloseFilter);

    this.setState({ open });
  };

  onChange = e => {
    let text = e.target.value;
    this.setState({ text });
    this.triggerPendingChange(text, this.props.column.dataField);
  };

  triggerPendingChange = debounce((text, dataField) => {
    triggerEvent.call(this, 'onFilter', {
      field: dataField,
      predicate: 'string-contains',
      value: text
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

  clear = () => {
    this.setState({ text: '' });
    this.triggerPendingChange('', this.props.column.dataField);
  };

  onDeviderMouseDown = e => {
    const current = this.thRef.current;
    triggerEvent.call(this, 'onDeviderMouseDown', {
      e: e,
      th: current.parentElement,
      thBody: current
    });
  };

  render() {
    const { column, filterable } = this.props;
    const state = this.state;

    this.id = `filter-${column.dataField.replace(':', '_')}`;
    this.tooltipId = `tooltip-${this.id}`;

    return (
      <div ref={this.thRef} className={classNames('grid__th', state.text && 'grid__th_filtered')}>
        {filterable ? (
          <div className={state.text && 'grid__filter'}>
            {column.text}

            <Icon id={this.id} className={'grid__filter-icon icon-filter'} onClick={this.toggle} />

            <Tooltip
              id={this.tooltipId}
              target={this.id}
              isOpen={state.open}
              trigger={'click'}
              placement="top"
              className={'grid__filter-tooltip'}
              innerClassName={'grid__filter-tooltip-body'}
              arrowClassName={'grid__filter-tooltip-marker'}
            >
              <Input autoFocus type="text" className={'grid__filter-tooltip-input'} onChange={this.onChange} value={state.text} />

              <Icon className={'grid__filter-tooltip-close icon-close icon_small'} onClick={this.clear} />
            </Tooltip>
          </div>
        ) : (
          column.text
        )}

        <div className={'grid__header-devider'} onMouseDown={this.onDeviderMouseDown} />
      </div>
    );
  }
}

export default class Grid extends Component {
  constructor(props) {
    super(props);
    this._selected = [];
    this._id = this.getId();
    this._resizingTh = null;
    this._resizingThBody = null;
    this._startResizingThOffset = 0;
    this._keyField = props.keyField || 'id';
  }

  componentDidMount() {
    this.createCloseFilterEvent();
    this.createColumnResizeEvents();
  }

  componentWillUnmount() {
    this.removeCloseFilterEvent();
    this.removeColumnResizeEvents();
  }

  setAdditionalOptions(props) {
    props.columns = props.columns.map(column => {
      if (column.width) {
        column = this.setWidth(column);
      }

      if (column.default !== undefined) {
        column.hidden = !column.default;
      }

      column = this.setHeaderFormatter(column, props.filterable);

      column.formatter = this.initFormatter(props.editable);

      return column;
    });

    if (props.editable) {
      props.cellEdit = this.setEditable(props.editable);
    }

    if (props.defaultSortBy) {
      props.data = this.sortByDefault(props);
    }

    if (typeof props.onMouseEnter === 'function') {
      props.rowEvents = { onMouseEnter: e => props.onMouseEnter.call(this, e, this.getTrOffsets(e)) };
    }

    if (props.multiSelectable) {
      props.selectRow = this.createMultiSelectioCheckboxs(props);
    }

    if (props.singleSelectable) {
      props.selectRow = this.createSingleSelectionCheckboxs(props);
    }

    return props;
  }

  getTrOffsets = e => {
    const tr = e.currentTarget;
    const height = tr.offsetHeight - 2;
    const top = tr.offsetTop - 1;

    return { height, top };
  };

  setEditable = () => {
    return cellEditFactory({
      mode: 'dbclick',
      blurToSave: true,
      afterSaveCell: this.onEdit
    });
  };

  sortByDefault = props => {
    const defaultSortBy = props.defaultSortBy;
    const data = props.data.slice();

    defaultSortBy.forEach(item => {
      const { id, order } = item;

      data.sort(function(a, b) {
        return order ? a[id] < b[id] : a[id] > b[id];
      });
    });

    return data;
  };

  initFormatter = editable => {
    return (cell, row, rowIndex, formatExtraData) => {
      const Formatter = (formatExtraData || {}).formatter;
      return (
        <div className={`grid__td ${editable ? 'grid__td_editable' : ''}`}>
          {Formatter ? <Formatter row={row} cell={cell} params={formatExtraData.params} /> : null}
        </div>
      );
    };
  };

  setWidth = column => {
    column.style = {
      ...column.style,
      width: column.width
    };

    return column;
  };

  setHeaderFormatter = (column, filterable) => {
    column.headerFormatter = (column, colIndex) => {
      return (
        <HeaderFormatter
          filterable={filterable}
          column={column}
          colIndex={colIndex}
          onFilter={this.onFilter}
          onDeviderMouseDown={this.getStartDeviderPosition}
        />
      );
    };

    return column;
  };

  getId = () => {
    return Math.random()
      .toString(36)
      .substr(2, 9);
  };

  createSingleSelectionCheckboxs(props) {
    this._selected = props.selectAllRecords ? props.data.map(row => row[this._keyField]) : props.selected || [];

    return {
      mode: 'radio',
      classes: 'grid__tr_selected',
      selected: this._selected,
      onSelect: row => {
        const selected = this._selected[0];
        const keyValue = row[this._keyField];

        this._selected = selected !== keyValue ? [keyValue] : [];

        triggerEvent.call(this, 'onSelect', {
          selected: this._selected,
          all: false
        });
      },
      selectionHeaderRenderer: ({ indeterminate, ...rest }) => {
        return (
          <div className={'grid__th grid__th_checkbox'}>
            <div className={'grid__header-devider'} />
          </div>
        );
      },
      selectionRenderer: ({ mode, ...rest }) => {
        return (
          <div className={'grid__td_checkbox'}>
            <Checkbox checked={rest.checked} />
          </div>
        );
      }
    };
  }

  createMultiSelectioCheckboxs(props) {
    this._selected = props.selectAllRecords ? props.data.map(row => row[this._keyField]) : props.selected || [];

    return {
      mode: 'checkbox',
      classes: 'grid__tr_selected',
      selected: this._selected,
      onSelect: (row, isSelect) => {
        const selected = this._selected;
        const keyValue = row[this._keyField];

        this._selected = isSelect ? [...selected, keyValue] : selected.filter(x => x !== keyValue);

        triggerEvent.call(this, 'onSelect', {
          selected: this._selected,
          all: false
        });
      },
      onSelectAll: (isSelect, rows) => {
        this._selected = isSelect
          ? [...this._selected, ...rows.map(row => row[this._keyField])]
          : this.getSelectedByPage(this.props.data, false);

        triggerEvent.call(this, 'onSelect', {
          selected: this._selected,
          all: isSelect
        });
      },
      selectionHeaderRenderer: ({ indeterminate, ...rest }) => {
        return (
          <div className={'grid__th grid__th_checkbox'}>
            <Checkbox indeterminate={indeterminate} checked={rest.checked} />
            <div className={'grid__header-devider'} />
          </div>
        );
      },
      selectionRenderer: ({ mode, ...rest }) => {
        return (
          <div className={'grid__td_checkbox'}>
            <Checkbox checked={rest.checked} />
          </div>
        );
      }
    };
  }

  onEdit = (oldValue, newValue, row, column) => {
    if (oldValue !== newValue) {
      triggerEvent.call(this, 'onEdit', {
        id: row[this._keyField],
        attributes: {
          [column.attribute]: newValue
        }
      });
    }
  };

  toolsVisible = () => {
    return this._selected.length && this.getSelectedByPage(this.props.data, true).length;
  };

  getSelectedByPage = (records, onPage) => {
    return this._selected.filter(id => {
      const length = records.filter(record => record[this._keyField] === id).length;
      return onPage ? length : !length;
    });
  };

  selectAll = () => {
    triggerEvent.call(this, 'onSelectAll');
  };

  onFilter = criteria => {
    triggerEvent.call(this, 'onFilter', [criteria]);
  };

  createCloseFilterEvent = () => {
    this.closeFilterEvent = document.createEvent('Event');
    this.closeFilterEvent.initEvent(CLOSE_FILTER_EVENT, true, true);
    document.addEventListener('mousedown', this.triggerCloseFilterEvent, false);
  };

  removeCloseFilterEvent = () => {
    document.removeEventListener('mousedown', this.triggerCloseFilterEvent, false);
  };

  createColumnResizeEvents = () => {
    document.addEventListener('mousemove', this.resizeColumn);
    document.addEventListener('mouseup', this.clearResizingColumn);
  };

  removeColumnResizeEvents = () => {
    document.removeEventListener('mousemove', this.resizeColumn);
    document.removeEventListener('mouseup', this.clearResizingColumn);
  };

  getStartDeviderPosition = options => {
    this._resizingTh = options.th;
    this._resizingThBody = options.thBody;
    this._startResizingThOffset = this._resizingTh.offsetWidth - options.e.pageX;
  };

  resizeColumn = e => {
    let th = this._resizingTh;
    if (th) {
      th.style.width = this._startResizingThOffset + e.pageX + 'px';
      this._resizingThBody.style.width = th.style.width;
    }
  };

  clearResizingColumn = () => {
    this._resizingTh = null;
  };

  triggerCloseFilterEvent = e => {
    (e.target || e).dispatchEvent(this.closeFilterEvent);
  };

  createToolsActions = () => {
    return this.props.tools.map((action, idx) => (
      <div key={idx} className={`grid__tools-item`}>
        {React.cloneElement(action)}
      </div>
    ));
  };

  tools = () => {
    const props = this.props;

    if (props.tools) {
      return (
        <div className={'grid__tools'}>
          {props.selectAllRecordsVisible ? (
            <div className={'grid__tools-item grid__tools-item_select-all-btn'}>
              <Btn
                className={`btn_extra-narrow ${props.selectAllRecords ? 'btn_blue' : 'btn_grey5'} btn_hover_light-blue2`}
                title={t('grid.tools.select-all')}
                onClick={this.selectAll}
              >
                {t('grid.tools.select-all')} {props.total}
              </Btn>
            </div>
          ) : null}

          {this.createToolsActions()}
        </div>
      );
    }

    return null;
  };

  render() {
    let props = {
      id: this._id,
      keyField: this._keyField,
      bootstrap4: true,
      bordered: false,
      headerClasses: 'grid__header',
      noDataIndication: () => t('grid.no-data-indication'),
      ...this.props
    };

    props = this.setAdditionalOptions(props);

    const toolsVisible = this.toolsVisible();

    if (props.columns.length) {
      return (
        <div
          style={{ minHeight: props.minHeight }}
          className={classNames('grid', (props.singleSelectable || props.multiSelectable) && 'grid_checkable', this.props.className)}
        >
          {toolsVisible ? this.tools() : null}

          <PerfectScrollbar
            style={{ minHeight: props.minHeight }}
            onScrollX={this.triggerCloseFilterEvent}
            onScrollY={this.triggerCloseFilterEvent}
          >
            <BootstrapTable {...props} />
          </PerfectScrollbar>

          {props.freezeCheckboxes && (props.singleSelectable || props.multiSelectable) ? (
            <BootstrapTable {...props} classes={'grid__freeze'} />
          ) : null}
        </div>
      );
    }

    return null;
  }
}
