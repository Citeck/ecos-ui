import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import BootstrapTable from 'react-bootstrap-table-next';
import cellEditFactory from 'react-bootstrap-table2-editor';
import { Scrollbars } from 'react-custom-scrollbars';
import set from 'lodash/set';
import get from 'lodash/get';

import { closest, getId, t, trigger } from '../../../../helpers/util';
import Checkbox from '../../form/Checkbox/Checkbox';
import { COLUMN_DATA_TYPE_DATE, COLUMN_DATA_TYPE_DATETIME } from '../../form/SelectJournal/predicates';
import HeaderFormatter from '../formatters/header/HeaderFormatter/HeaderFormatter';

import './Grid.scss';

const CLOSE_FILTER_EVENT = 'closeFilterEvent';
const ECOS_GRID_HOVERED_CLASS = 'ecos-grid_hovered';
const ECOS_GRID_GRAG_CLASS = 'ecos-grid_drag';
const ECOS_GRID_ROW_CLASS = 'ecos-grid__row';
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
    this._dragTr = null;
    this._tableDom = null;
    this._ref = React.createRef();
    this._scrollRef = null;
    this._shadowHeadNode = null;
    this._shadowLeftNode = null;
    this._firstHeaderCellNode = null;
    this._inlineActionsNode = null;

    this.state = {
      tableHeight: 0
    };
  }

  componentDidMount() {
    this.createCloseFilterEvent();
    this.createColumnResizeEvents();
    this.createKeydownEvents();
    this.createDragEvents();

    const current = this._ref.current;

    if (current) {
      this._shadowHeadNode = current.getElementsByClassName(ECOS_GRID_HEAD_SHADOW)[0];
      this._shadowLeftNode = current.getElementsByClassName(ECOS_GRID_LEFT_SHADOW)[0];
      this._firstHeaderCellNode = current.querySelector(`thead > tr > th:first-child .${ECOS_GRID_CHECKBOX_DEVIDER_CLASS}`);
      this._inlineActionsNode = current.querySelector('.ecos-inline-tools-actions');
    }

    this.checkScrollPosition();
  }

  componentDidUpdate() {
    this.checkScrollPosition();
  }

  componentWillUnmount() {
    this.removeCloseFilterEvent();
    this.removeColumnResizeEvents();
    this.removeKeydownEvents();
    this.removeDragEvents();
  }

  get hasCheckboxes() {
    const { singleSelectable, multiSelectable } = this.props;

    return singleSelectable || multiSelectable;
  }

  get fixedHeader() {
    const { freezeCheckboxes, fixedHeader } = this.props;

    return (freezeCheckboxes && this.hasCheckboxes) || fixedHeader;
  }

  checkScrollPosition() {
    const { scrollPosition = {} } = this.props;
    const { scrollLeft, scrollTop } = scrollPosition;

    if (this._scrollRef && scrollLeft !== undefined) {
      this._scrollRef.scrollLeft(scrollLeft);
    }

    if (this._scrollRef && scrollTop !== undefined) {
      this._scrollRef.scrollTop(scrollTop);
    }
  }

  createKeydownEvents() {
    document.addEventListener('keydown', this.onKeydown);
  }

  removeKeydownEvents() {
    document.removeEventListener('keydown', this.onKeydown);
  }

  createDragEvents() {
    if (this.props.onRowDrop) {
      document.addEventListener('dragenter', this.onDragEnter);
    }
  }

  removeDragEvents() {
    if (this.props.onRowDrop) {
      document.removeEventListener('dragenter', this.onDragEnter);
    }
  }

  onKeydown = e => {
    if (this.props.changeTrOptionsByRowClick) {
      const tr = this._tr;

      switch (e.keyCode) {
        case 38:
          if (tr && tr.previousSibling) {
            this.getTrOptions(tr.previousSibling);
            this.onRowClick(tr.previousSibling);
          }

          break;
        case 40:
          if (tr && tr.nextSibling) {
            this.getTrOptions(tr.nextSibling);
            this.onRowClick(tr.nextSibling);
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

      if (column.customFormatter === undefined) {
        column.formatter = this.initFormatter({ editable: props.editable, className: column.className });
      } else {
        column.formatter = column.customFormatter;
      }

      if (props.editable) {
        column.editable = this.checkColumnEditable.bind(null, column);
      }

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
      onMouseLeave: e => {
        if (props.changeTrOptionsByRowClick) {
          this.setHover(e.currentTarget, ECOS_GRID_HOVERED_CLASS, true);
        }

        trigger.call(this, 'onRowMouseLeave', e);
      },
      onDragOver: this.onDragOver,
      onDrop: this.onDrop,
      ...props.rowEvents
    };

    props.rowEvents = {
      onClick: e => {
        props.changeTrOptionsByRowClick && this.getTrOptions(e.currentTarget);
        this.onRowClick(e.currentTarget);
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

  checkColumnEditable = (...data) => {
    const { editingRules } = this.props;
    const [column, , row] = data;
    const rowRules = editingRules[row.id];
    const columnEditableStatus = get(column, 'params.editable');

    /**
     * If there are rules for editing the column
     */
    if (columnEditableStatus !== undefined) {
      return columnEditableStatus;
    }

    /**
     * If there is an editing rule for the entire row
     */
    if (typeof rowRules === 'boolean') {
      return rowRules;
    }

    /**
     * Validating a rule for a single cell
     */
    if (typeof rowRules === 'object') {
      return get(rowRules, column.dataField, false);
    }

    /**
     * Editing by default is prohibited.
     */
    return false;
  };

  setHover = (tr = null, className, needRemove, nonHoveredTr) => {
    if (!tr) {
      return;
    }

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
          filterable={filterable}
          closeFilterEvent={CLOSE_FILTER_EVENT}
          filterValue={((filters || []).filter(filter => filter.att === column.dataField)[0] || {}).val || ''}
          onFilter={this.onFilter}
          sortable={sortable}
          onSort={this.onSort}
          ascending={((sortBy || []).filter(sort => sort.attribute === column.dataField)[0] || {}).ascending}
          column={column}
          colIndex={colIndex}
          onDeviderMouseDown={this.getStartDeviderPosition}
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

  toolsVisible = () => {
    return this._selected.length && this.getSelectedByPage(this.props.data, true).length;
  };

  getSelectedByPage = (records, onPage) => {
    return this._selected.filter(id => {
      const length = records.filter(record => record[this._keyField] === id).length;
      return onPage ? length : !length;
    });
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

  onRowClick = tr => {
    this.setHover(tr, ECOS_GRID_HOVERED_CLASS, true);
    trigger.call(this, 'onRowClick', this.props.data[tr.rowIndex - 1]);
  };

  onSort = e => {
    trigger.call(this, 'onSort', e);
  };

  onFilter = predicates => {
    trigger.call(this, 'onFilter', predicates);
  };

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

  onScrollStop = e => {
    trigger.call(this, 'onScrollStop', e);
  };

  onDragOver = e => {
    if (this.props.onRowDrop) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    if (!this.props.onDragOver) {
      return false;
    }

    trigger.call(this, 'onDragOver', e);
  };

  onDragEnter = e => {
    const dataTypes = get(e, 'dataTransfer.types', []);

    if (!dataTypes.includes('Files')) {
      return;
    }

    const target = e.target;
    const tr = closest(target, ECOS_GRID_ROW_CLASS);

    if (this.props.onRowDragEnter) {
      this.props.onRowDragEnter();
    }

    if (tr === null) {
      this.setHover(this._dragTr, ECOS_GRID_GRAG_CLASS, true, this._tr);
      this._dragTr = null;

      return;
    }

    if (tr === this._dragTr) {
      return;
    }

    if (this._dragTr) {
      this.setHover(this._dragTr, ECOS_GRID_GRAG_CLASS, true, this._tr);
    }

    this.setHover(tr, ECOS_GRID_GRAG_CLASS, false, this._tr);
    this._dragTr = tr;

    e.stopPropagation();
    e.preventDefault();
    return false;
  };

  onDrop = e => {
    if (!this.props.onRowDrop) {
      return false;
    }

    e.preventDefault();
    e.stopPropagation();

    const tr = e.currentTarget;

    this.setHover(tr, ECOS_GRID_GRAG_CLASS, true, this._tr);

    trigger.call(this, 'onRowDrop', {
      files: Array.from(e.dataTransfer.files),
      type: this.props.data[tr.rowIndex - 1]
    });
    e.dataTransfer.clearData();

    return false;
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

    if (props.autoHeight) {
      scrollStyle.autoHeight = props.autoHeight;
    }

    const Scroll = ({ scrollable, children, style, refCallback }) =>
      scrollable ? (
        <Scrollbars
          ref={refCallback}
          onScrollStart={this.onScrollStart}
          onScrollFrame={this.onScrollFrame}
          onScrollStop={this.onScrollStop}
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
            <div ref={this.props.forwardedRef}>
              <BootstrapTable {...props} classes="ecos-grid__table" rowClasses={classNames(ECOS_GRID_ROW_CLASS, props.rowClassName)} />
            </div>
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
  rowClassName: PropTypes.string,
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
  selected: PropTypes.array,
  editingRules: PropTypes.object,

  onRowDrop: PropTypes.func,
  onDragOver: PropTypes.func,
  onRowDragEnter: PropTypes.func,
  onRowMouseLeave: PropTypes.func
};

export default Grid;
