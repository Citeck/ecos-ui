import React, { Component, Fragment } from 'react';
import classNames from 'classnames';
import BootstrapTable from 'react-bootstrap-table-next';
import cellEditFactory from 'react-bootstrap-table2-editor';
import Checkbox from '../../form/Checkbox/Checkbox';
import { Scrollbars } from 'react-custom-scrollbars';
import HeaderFormatter from '../formatters/header/HeaderFormatter/HeaderFormatter';
import { t, getId, trigger } from '../../../../helpers/util';

import 'react-perfect-scrollbar/dist/css/styles.css';
import './Grid.scss';

const CLOSE_FILTER_EVENT = 'closeFilterEvent';

const Selector = ({ mode, ...rest }) => (
  <div className={'ecos-grid__checkbox'}>
    <Checkbox checked={rest.checked} />
  </div>
);

const SelectorHeader = ({ indeterminate, ...rest }) => (
  <Fragment>
    <div className={'ecos-grid__checkbox'}>
      {rest.mode === 'checkbox' ? <Checkbox indeterminate={indeterminate} checked={rest.checked} /> : null}
      <div className={'ecos-grid__checkbox-devider'} />
    </div>
  </Fragment>
);

export default class Grid extends Component {
  constructor(props) {
    super(props);
    this._selected = [];
    this._id = getId();
    this._resizingTh = null;
    this._startResizingThOffset = 0;
    this._keyField = props.keyField || 'id';
    this.scrollValues = {};
  }

  componentDidMount() {
    this.createCloseFilterEvent();
    this.createColumnResizeEvents();
    this.createKeydownEvents();
  }

  componentWillUnmount() {
    this.removeCloseFilterEvent();
    this.removeColumnResizeEvents();
    this.removeKeydownEvents();
  }

  createKeydownEvents() {
    document.addEventListener('keydown', this.onKeydown.bind(this));
  }

  removeKeydownEvents() {
    document.removeEventListener('keydown', this.onKeydown.bind(this));
  }

  onKeydown(e) {
    const props = this.props;

    switch (e.keyCode) {
      case 38:
        if (this._byRowClickSelectedRow && this._byRowClickSelectedRow.previousSibling) {
          this._byRowClickSelectedRow = this._byRowClickSelectedRow.previousSibling;

          if (typeof props.onPrevRowSelected === 'function') {
            props.onPrevRowSelected.call(
              this,
              e,
              this.getTrOffsets(this._byRowClickSelectedRow),
              props.data[this._byRowClickSelectedRow.rowIndex - 1]
            );
          }
        }

        break;
      case 40:
        if (this._byRowClickSelectedRow && this._byRowClickSelectedRow.nextSibling) {
          this._byRowClickSelectedRow = this._byRowClickSelectedRow.nextSibling;

          if (typeof props.onNextRowSelected === 'function') {
            props.onNextRowSelected.call(
              this,
              e,
              this.getTrOffsets(this._byRowClickSelectedRow),
              props.data[this._byRowClickSelectedRow.rowIndex - 1]
            );
          }
        }
        break;
      default:
        break;
    }
  }

  setAdditionalOptions(props) {
    props.columns = props.columns.map(column => {
      if (column.width) {
        column = this.setWidth(column);
      }

      if (column.default !== undefined) {
        column.hidden = !column.default;
      }

      column = this.setHeaderFormatter(column, props.filterable, column.sortable);

      column.formatter = this.initFormatter(props.editable);

      return column;
    });

    if (props.editable) {
      props.cellEdit = this.setEditable(props.editable);
    }

    props.rowEvents = props.rowEvents || {};

    if (typeof props.onMouseEnter === 'function') {
      props.rowEvents = { onMouseEnter: e => props.onMouseEnter.call(this, e, this.getTrOffsets(e.currentTarget)), ...props.rowEvents };
    }

    this._byRowClickSelectedRow = null;
    props.rowEvents = {
      onClick: e => {
        if (typeof props.onRowClick === 'function') {
          this._byRowClickSelectedRow = e.currentTarget;
          props.onRowClick.call(this, e, this.getTrOffsets(e.currentTarget), props.data[e.currentTarget.rowIndex - 1]);
        }
      },
      ...props.rowEvents
    };

    if (props.multiSelectable) {
      props.selectRow = this.createMultiSelectioCheckboxs(props);
    }

    if (props.singleSelectable) {
      props.selectRow = this.createSingleSelectionCheckboxs(props);
    }

    return props;
  }

  getTrOffsets = tr => {
    const { scrollLeft = 0 } = this.scrollValues;
    const height = tr.offsetHeight - 2;
    const top = tr.offsetTop - 1;
    const row = this.props.data[tr.rowIndex - 1];

    return { height, top, row, left: scrollLeft };
  };

  setEditable = () => {
    return cellEditFactory({
      mode: 'dbclick',
      blurToSave: true,
      afterSaveCell: this.onEdit
    });
  };

  sort = e => {
    trigger.call(this, 'onSort', e);
  };

  initFormatter = editable => {
    return (cell, row, rowIndex, formatExtraData) => {
      formatExtraData = formatExtraData || {};
      const Formatter = formatExtraData.formatter;
      return (
        <div className={`ecos-grid__td ${editable ? 'ecos-grid__td_editable' : ''}`}>
          {Formatter ? <Formatter row={row} cell={cell} rowIndex={rowIndex} {...formatExtraData} /> : cell}
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

  setHeaderFormatter = (column, filterable, sortable) => {
    const { filters, sortBy } = this.props;

    column.headerFormatter = (column, colIndex) => {
      return (
        <HeaderFormatter
          closeFilterEvent={CLOSE_FILTER_EVENT}
          filterable={filterable}
          filterValue={((filters || []).filter(filter => filter.att === column.dataField)[0] || {}).val || ''}
          ascending={((sortBy || []).filter(sort => sort.attribute === column.dataField)[0] || {}).ascending}
          column={column}
          colIndex={colIndex}
          onFilter={this.onFilter}
          onDeviderMouseDown={this.getStartDeviderPosition}
          onTextClick={sortable && this.sort}
        />
      );
    };

    return column;
  };

  createSingleSelectionCheckboxs(props) {
    this._selected = props.selected || [];

    return {
      mode: 'radio',
      classes: 'ecos-grid__tr_selected',
      selected: this._selected,
      onSelect: row => {
        const selected = this._selected[0];
        const keyValue = row[this._keyField];

        this._selected = selected !== keyValue ? [keyValue] : [];

        trigger.call(this, 'onSelect', {
          selected: this._selected,
          all: false
        });
      },
      selectionHeaderRenderer: ({ indeterminate, ...rest }) => SelectorHeader({ indeterminate, ...rest }),
      selectionRenderer: ({ mode, ...rest }) => Selector({ mode, ...rest })
    };
  }

  createMultiSelectioCheckboxs(props) {
    this._selected = props.selectAll ? props.data.map(row => row[this._keyField]) : props.selected || [];

    return {
      mode: 'checkbox',
      classes: 'ecos-grid__tr_selected',
      selected: this._selected,
      onSelect: (row, isSelect) => {
        const selected = this._selected;
        const keyValue = row[this._keyField];

        this._selected = isSelect ? [...selected, keyValue] : selected.filter(x => x !== keyValue);

        trigger.call(this, 'onSelect', {
          selected: this._selected,
          all: false
        });
      },
      onSelectAll: (isSelect, rows) => {
        this._selected = isSelect
          ? [...this._selected, ...rows.map(row => row[this._keyField])]
          : this.getSelectedByPage(this.props.data, false);

        trigger.call(this, 'onSelect', {
          selected: this._selected,
          all: isSelect
        });
      },
      selectionHeaderRenderer: ({ indeterminate, ...rest }) => SelectorHeader({ indeterminate, ...rest }),
      selectionRenderer: ({ mode, ...rest }) => Selector({ mode, ...rest })
    };
  }

  onEdit = (oldValue, newValue, row, column) => {
    if (oldValue !== newValue) {
      trigger.call(this, 'onEdit', {
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

  onFilter = predicates => {
    trigger.call(this, 'onFilter', predicates);
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
    this._startResizingThOffset = this._resizingTh.offsetWidth - options.e.pageX;
  };

  resizeColumn = e => {
    let th = this._resizingTh;
    if (th) {
      th.style.width = this._startResizingThOffset + e.pageX + 'px';
      th.firstChild.style.width = this._startResizingThOffset + e.pageX + 'px';
    }
  };

  clearResizingColumn = () => {
    this._resizingTh = null;
  };

  triggerCloseFilterEvent = e => {
    (e.target || e).dispatchEvent(this.closeFilterEvent);
  };

  inlineTools = () => {
    const inlineTools = this.props.inlineTools;
    if (typeof inlineTools === 'function') {
      return inlineTools();
    }
    return null;
  };

  tools = () => {
    const tools = this.props.tools;
    if (typeof tools === 'function') {
      return tools();
    }
    return null;
  };

  onMouseLeave = e => {
    trigger.call(this, 'onMouseLeave', e);
  };

  onScrollStart = e => {
    this.triggerCloseFilterEvent(document.body);
    trigger.call(this, 'onScrollStart', e);
  };

  onScrollFrame = e => {
    this.scrollValues = e;
  };

  render() {
    let props = {
      keyField: this._keyField,
      bootstrap4: true,
      bordered: false,
      scrollable: true,
      headerClasses: 'ecos-grid__header',
      noDataIndication: () => t('grid.no-data-indication'),
      ...this.props
    };

    props = this.setAdditionalOptions(props);

    const toolsVisible = this.toolsVisible();

    const gridStyle = props.minHeight ? { minHeight: props.minHeight } : { height: '100%' };
    const scrollStyle = props.minHeight ? { height: props.minHeight } : { autoHeight: true };

    const Scroll = ({ scrollable, children, style }) =>
      scrollable ? (
        <Scrollbars
          onScrollStart={this.onScrollStart}
          onScrollFrame={this.onScrollFrame}
          style={style}
          hideTracksWhenNotNeeded={true}
          renderTrackVertical={props => <div {...props} className="ecos-grid__v-scroll" />}
        >
          {children}
        </Scrollbars>
      ) : (
        <Fragment>{children}</Fragment>
      );

    if (props.columns.length) {
      return (
        <div
          key={this._id}
          style={gridStyle}
          className={classNames(
            'ecos-grid',
            (props.singleSelectable || props.multiSelectable) && 'ecos-grid_checkable',
            this.props.className
          )}
          onMouseLeave={this.onMouseLeave}
        >
          {toolsVisible ? this.tools() : null}

          <Scroll scrollable={props.scrollable} style={scrollStyle}>
            <BootstrapTable {...props} />

            {props.freezeCheckboxes && (props.singleSelectable || props.multiSelectable) ? (
              <BootstrapTable {...props} classes={'ecos-grid__freeze'} />
            ) : null}

            {this.inlineTools()}
          </Scroll>
        </div>
      );
    }

    return null;
  }
}
