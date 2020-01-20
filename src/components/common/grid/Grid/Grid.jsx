import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import BootstrapTable from 'react-bootstrap-table-next';
import cellEditFactory from 'react-bootstrap-table2-editor';
import { Scrollbars } from 'react-custom-scrollbars';
import set from 'lodash/set';

import { closest, getId, t, trigger } from '../../../../helpers/util';
import Checkbox from '../../form/Checkbox/Checkbox';
import { COLUMN_DATA_TYPE_DATE, COLUMN_DATA_TYPE_DATETIME } from '../../form/SelectJournal/predicates';
import HeaderFormatter from '../formatters/header/HeaderFormatter/HeaderFormatter';

import './Grid.scss';

const CLOSE_FILTER_EVENT = 'closeFilterEvent';
const ECOS_GRID_HOVERED_CLASS = 'ecos-grid_hovered';
const REACT_BOOTSTRAP_TABLE_CLASS = 'react-bootstrap-table';

const ECOS_GRID_CHECKBOX_DEVIDER_CLASS = 'ecos-grid__checkbox-devider';
const ECOS_GRID_HEAD_SHADOW = 'ecos-grid__head-shadow';
const ECOS_GRID_LEFT_SHADOW = 'ecos-grid__left-shadow';

const Selector = ({ mode, ...rest }) => (
  <div className="ecos-grid__checkbox">
    <Checkbox checked={rest.checked} />
  </div>
);

const SelectorHeader = ({ indeterminate, ...rest }) => (
  <div className="ecos-grid__checkbox">
    {rest.mode === 'checkbox' ? <Checkbox indeterminate={indeterminate} checked={rest.checked} /> : null}
    <div className={ECOS_GRID_CHECKBOX_DEVIDER_CLASS} />
  </div>
);

class Grid extends Component {
  constructor(props) {
    super(props);
    this._selected = [];
    this._id = getId();
    this._resizingTh = null;
    this._startResizingThOffset = 0;
    this._keyField = props.keyField || 'id';
    this._scrollValues = {};
    this._tr = null;
    this._tableDom = null;
    this._ref = React.createRef();
    this._scrollRef = null;
    this._shadowHeadNode = null;
    this._shadowLeftNode = null;
    this._firstHeaderCellNode = null;
    this._inlineActionsNode = null;
  }

  componentDidMount() {
    this.createCloseFilterEvent();
    this.createColumnResizeEvents();
    this.createKeydownEvents();

    const current = this._ref.current;

    if (current) {
      this._shadowHeadNode = current.getElementsByClassName(ECOS_GRID_HEAD_SHADOW)[0];
      this._shadowLeftNode = current.getElementsByClassName(ECOS_GRID_LEFT_SHADOW)[0];
      this._firstHeaderCellNode = current.querySelector(`thead > tr > th:first-child .${ECOS_GRID_CHECKBOX_DEVIDER_CLASS}`);
      this._inlineActionsNode = current.querySelector('.ecos-inline-tools-actions');
    }

    const { scrollPosition = {} } = this.props;
    const { scrollLeft, scrollTop } = scrollPosition;

    if (this._scrollRef && scrollLeft !== undefined) {
      this._scrollRef.scrollLeft(scrollLeft);
    }

    if (this._scrollRef && scrollTop !== undefined) {
      this._scrollRef.scrollTop(scrollTop);
    }
  }

  componentWillUnmount() {
    this.removeCloseFilterEvent();
    this.removeColumnResizeEvents();
    this.removeKeydownEvents();
  }

  get hasCheckboxes() {
    const { singleSelectable, multiSelectable } = this.props;

    return singleSelectable || multiSelectable;
  }

  get fixedHeader() {
    const { freezeCheckboxes, fixedHeader } = this.props;

    return (freezeCheckboxes && this.hasCheckboxes) || fixedHeader;
  }

  createKeydownEvents() {
    document.addEventListener('keydown', this.onKeydown);
  }

  removeKeydownEvents() {
    document.removeEventListener('keydown', this.onKeydown);
  }

  onKeydown = e => {
    if (this.props.changeTrOptionsByRowClick) {
      const tr = this._tr;

      switch (e.keyCode) {
        case 38:
          if (tr && tr.previousSibling) {
            this.getTrOptions(tr.previousSibling);
            this.triggerRowClick(tr.previousSibling);
          }

          break;
        case 40:
          if (tr && tr.nextSibling) {
            this.getTrOptions(tr.nextSibling);
            this.triggerRowClick(tr.nextSibling);
          }
          break;
        default:
          break;
      }
    }
  };

  setAdditionalOptions(props) {
    props.columns = props.columns.map(column => {
      if (column.width) {
        column = this.setWidth(column);
      }

      if (column.default !== undefined) {
        column.hidden = !column.default;
      }

      const filterable = column.type === COLUMN_DATA_TYPE_DATE || column.type === COLUMN_DATA_TYPE_DATETIME ? false : props.filterable;

      column = this.setHeaderFormatter(column, filterable, column.sortable);

      column.formatter = this.initFormatter({ editable: props.editable, className: column.className });

      return column;
    });

    if (props.editable) {
      props.cellEdit = this.setEditable(props.editable);
    } else {
      props.cellEdit = undefined;
    }

    props.rowEvents = props.rowEvents || {};

    props.rowEvents = {
      onMouseEnter: e => {
        const tr = e.currentTarget;

        if (props.changeTrOptionsByRowClick) {
          this.setHover(tr, ECOS_GRID_HOVERED_CLASS, false, this._tr);
        } else {
          this.getTrOptions(tr);
        }

        trigger.call(this, 'onMouseEnter', e);
      },
      onMouseLeave: e => props.changeTrOptionsByRowClick && this.setHover(e.currentTarget, ECOS_GRID_HOVERED_CLASS, true),
      ...props.rowEvents
    };

    props.rowEvents = {
      onClick: e => {
        props.changeTrOptionsByRowClick && this.getTrOptions(e.currentTarget);
        this.triggerRowClick(e.currentTarget);
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

  setHover = (tr, className, needRemove, nonHoveredTr) => {
    const trClassList = tr.classList;
    const checkboxGridTrClassList = this.getCheckboxGridTrClassList(tr);

    if (needRemove) {
      checkboxGridTrClassList && checkboxGridTrClassList.remove(className);
      trClassList.remove(className);
    } else if (!nonHoveredTr || nonHoveredTr.rowIndex !== tr.rowIndex) {
      checkboxGridTrClassList && checkboxGridTrClassList.add(className);
      trClassList.add(className);
    }
  };

  getCheckboxGridTrClassList = tr => {
    const rowIndex = tr.rowIndex;
    const parent = closest(tr, REACT_BOOTSTRAP_TABLE_CLASS);
    let node;
    let classList = null;

    if (
      parent &&
      parent.nextSibling &&
      parent.nextSibling.getElementsByTagName('tr') &&
      parent.nextSibling.getElementsByTagName('tr').item(rowIndex) &&
      (node = parent.nextSibling
        .getElementsByTagName('tr')
        .item(rowIndex)
        .getElementsByClassName('ecos-grid__checkbox')[0])
    ) {
      classList = node.classList;
    }

    return classList;
  };

  triggerRowClick = tr => {
    this.setHover(tr, ECOS_GRID_HOVERED_CLASS, true);
    trigger.call(this, 'onRowClick', this.props.data[tr.rowIndex - 1]);
  };

  getTrOptions = tr => {
    const { scrollLeft = 0 } = this._scrollValues;
    const height = tr.offsetHeight - 2;
    const top = tr.offsetTop - 1;
    const row = this.props.data[tr.rowIndex - 1];

    this._tr = tr;

    trigger.call(this, 'onChangeTrOptions', { height, top, row, left: scrollLeft });
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

  initFormatter = ({ editable, className }) => {
    return (cell, row, rowIndex, formatExtraData) => {
      formatExtraData = formatExtraData || {};
      const Formatter = formatExtraData.formatter;
      const errorAttribute = row.error;

      return (
        <div
          className={classNames('ecos-grid__td', {
            'ecos-grid__td_editable': editable,
            'ecos-grid__td_error': errorAttribute && row[errorAttribute] === cell,
            [className]: !!className
          })}
        >
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
          [column.attribute]: column.formatExtraData.formatter.getId(newValue)
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
    window.addEventListener('DOMMouseScroll', this.triggerCloseFilterEvent, false);
  };

  removeCloseFilterEvent = () => {
    document.removeEventListener('mousedown', this.triggerCloseFilterEvent, false);
    window.removeEventListener('DOMMouseScroll', this.triggerCloseFilterEvent, false);
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
    this._tableDom = closest(options.th, 'table');
    this._startResizingThOffset = this._resizingTh.offsetWidth - options.e.pageX;
  };

  resizeColumn = e => {
    let th = this._resizingTh;

    if (th && this._tableDom) {
      const width = this._startResizingThOffset + e.pageX + 'px';
      const rows = this._tableDom.rows;

      for (let i = 0; i < rows.length; i++) {
        let firstCol = rows[i].cells[th.cellIndex];

        firstCol.style.width = width;
        firstCol.firstChild.style.width = width;
      }
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

  tools = selected => {
    const tools = this.props.tools;
    if (typeof tools === 'function') {
      return tools(selected);
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
    this._scrollValues = e;

    if (this.fixedHeader) {
      if (this.hasCheckboxes) {
        set(this._shadowLeftNode, 'style.display', e.scrollLeft > 0 ? 'block' : 'none');
      }
      set(this._shadowHeadNode, 'style.display', e.scrollTop > 0 ? 'block' : 'none');
      set(this._firstHeaderCellNode, 'style.display', e.scrollLeft > 0 ? 'block' : 'none');
    }

    trigger.call(this, 'onScrolling', e);
  };

  scrollRefCallback = scroll => {
    this._scrollRef = scroll;
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

    const Scroll = ({ scrollable, children, style, refCallback }) =>
      scrollable ? (
        <Scrollbars
          ref={refCallback}
          onScrollStart={this.onScrollStart}
          onScrollFrame={this.onScrollFrame}
          style={style}
          hideTracksWhenNotNeeded={true}
          renderTrackVertical={props => <div {...props} className="ecos-grid__v-scroll" />}
          renderTrackHorizontal={props => <div {...props} className="ecos-grid__h-scroll" />}
        >
          {children}
        </Scrollbars>
      ) : (
        <>{children}</>
      );

    if (props.columns.length) {
      return (
        <div
          ref={this._ref}
          key={this._id}
          style={gridStyle}
          className={classNames(
            'ecos-grid',
            {
              'ecos-grid_freeze': this.fixedHeader,
              'ecos-grid_checkable': this.hasCheckboxes
            },
            this.props.className
          )}
          onMouseLeave={this.onMouseLeave}
        >
          {toolsVisible ? this.tools(props.selected) : null}

          <Scroll scrollable={props.scrollable} style={scrollStyle} refCallback={this.scrollRefCallback}>
            <BootstrapTable {...props} classes="ecos-grid__table" />
            {this.inlineTools()}
          </Scroll>
          {this.fixedHeader ? (
            <>
              <div className={ECOS_GRID_HEAD_SHADOW} />
              <div className={ECOS_GRID_LEFT_SHADOW} />
            </>
          ) : null}
        </div>
      );
    }

    return null;
  }
}

Grid.propTypes = {
  className: PropTypes.string,
  keyField: PropTypes.string,
  dataField: PropTypes.string,

  filterable: PropTypes.bool,
  editable: PropTypes.bool,
  multiSelectable: PropTypes.bool,
  singleSelectable: PropTypes.bool,
  freezeCheckboxes: PropTypes.bool,
  selectAll: PropTypes.bool,
  scrollable: PropTypes.bool,
  fixedHeader: PropTypes.bool,

  columns: PropTypes.array,
  data: PropTypes.array,
  filters: PropTypes.array,
  sortBy: PropTypes.array,
  selected: PropTypes.array
};

export default Grid;
