import $ from 'jquery';
import React, { Component } from 'react';
import classNames from 'classnames';
import debounce from 'lodash/debounce';
import BootstrapTable from 'react-bootstrap-table-next';
import cellEditFactory from 'react-bootstrap-table2-editor';
import Icon from '../../icons/Icon/Icon';
import Checkbox from '../../form/Checkbox/Checkbox';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { IcoBtn, Btn } from '../../btns';
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
    const state = this.state;

    this.id = `filter-${this.props.column.dataField.replace(':', '_')}`;
    this.tooltipId = `tooltip-${this.id}`;

    return (
      <div ref={this.thRef} className={classNames('grid__th', state.text && 'grid__th_filtered')}>
        <div className={state.text && 'grid__filter'}>
          {this.props.column.text}

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

        <div className={'grid__header-devider'} onMouseDown={this.onDeviderMouseDown} />
      </div>
    );
  }
}

export default class Grid extends Component {
  constructor(props) {
    super(props);
    this.inlineToolsRef = React.createRef();
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

      column = this.setHeaderFormatter(column);

      column.formatter = this.initFormatter();

      return column;
    });

    if (props.defaultSortBy) {
      props.data = this.sortByDefault(props);
    }

    if (props.hasInlineTools) {
      props.rowEvents = {
        onMouseEnter: e => this.createInlineTools($(e.target).closest('tr'))
      };
    }

    if (props.hasCheckboxes) {
      props.selectRow = this.createCheckboxs(props);
    }

    return props;
  }

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

  initFormatter = () => {
    return (cell, row, rowIndex, formatExtraData) => {
      const Formatter = (formatExtraData || {}).formatter;
      return (
        <div className={'grid__td grid__td_editable'}>
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

  setHeaderFormatter = column => {
    column.headerFormatter = (column, colIndex) => {
      return (
        <HeaderFormatter column={column} colIndex={colIndex} onFilter={this.onFilter} onDeviderMouseDown={this.getStartDeviderPosition} />
      );
    };

    return column;
  };

  createInlineTools = $tr => {
    const $inlineTools = $(this.inlineToolsRef.current);
    const $currentTr = $tr.mouseleave(() => $inlineTools.hide());
    const top = $currentTr.position().top + 'px';
    const height = $currentTr.height() - 2 + 'px';

    $inlineTools
      .show()
      .css('top', top)
      .children()
      .each((idx, child) => (idx < 2 ? $(child).css('height', height) : null));
  };

  getId = () => {
    return Math.random()
      .toString(36)
      .substr(2, 9);
  };

  createCheckboxs(props) {
    this._selected = props.selectAllRecords ? props.data.map(row => row[this._keyField]) : props.selected || [];

    return {
      mode: 'checkbox',
      classes: 'grid__tr_selected',
      selected: this._selected,
      onSelect: (row, isSelect) => {
        const selected = this._selected;
        const keyField = row[this._keyField];

        this._selected = isSelect ? [...selected, keyField] : selected.filter(x => x !== keyField);

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

  onDelete = () => {
    triggerEvent.call(this, 'onDelete', this._selected);
  };

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
      this._resizingThBody.style.width = this._startResizingThOffset + e.pageX + 'px';
    }
  };

  clearResizingColumn = () => {
    this._resizingTh = null;
  };

  triggerCloseFilterEvent = e => {
    (e.target || e).dispatchEvent(this.closeFilterEvent);
  };

  render() {
    let props = {
      id: this._id,
      keyField: this._keyField,
      bootstrap4: true,
      bordered: false,
      headerClasses: 'grid__header',
      cellEdit: cellEditFactory({
        mode: 'dbclick',
        blurToSave: true,
        afterSaveCell: this.onEdit
      }),
      noDataIndication: () => t('grid.no-data-indication'),
      ...this.props
    };

    props = this.setAdditionalOptions(props);

    const toolsVisible = this.toolsVisible();

    if (props.columns.length) {
      return (
        <div
          style={{ minHeight: props.minHeight }}
          className={classNames('grid', props.hasCheckboxes && 'grid_checkable', this.props.className)}
        >
          {toolsVisible ? (
            <div className={'grid__tools'}>
              {props.selectAllRecordsVisible ? (
                <div className={'grid__tools-item grid__tools-item_first'}>
                  <Btn
                    className={`btn_extra-narrow ${props.selectAllRecords ? 'btn_blue' : 'btn_grey5'} btn_hover_light-blue2`}
                    title={t('grid.tools.select-all')}
                    onClick={this.selectAll}
                  >
                    {t('grid.tools.select-all')} {props.total}
                  </Btn>
                </div>
              ) : null}
              <div className={'grid__tools-item grid__tools-item_first'}>
                <IcoBtn
                  icon={'icon-download'}
                  className={'btn_i_sm btn_grey4 btn_hover_t-dark-brown'}
                  title={t('grid.tools.zip')}
                  onClick={this.zipDownload}
                />
              </div>
              <div className={'grid__tools-item'}>
                <IcoBtn icon={'icon-copy'} className={'btn_i_sm btn_grey4 btn_hover_t-dark-brown'} />
              </div>
              <div className={'grid__tools-item'}>
                <IcoBtn icon={'icon-big-arrow'} className={'btn_i_sm btn_grey4 btn_hover_t-dark-brown'} />
              </div>
              <div className={'grid__tools-item'}>
                <IcoBtn
                  icon={'icon-delete'}
                  className={'btn_i_sm btn_grey4 btn_hover_t-dark-brown'}
                  title={t('grid.tools.delete')}
                  onClick={this.onDelete}
                />
              </div>
            </div>
          ) : null}
          {toolsVisible ? null : (
            <div ref={this.inlineToolsRef} className={'grid__inline-tools'}>
              <div className="grid__inline-tools-border-left" />
              <div className="grid__inline-tools-actions">
                <IcoBtn
                  icon={'icon-download'}
                  className={'grid__inline-tools-btn btn_i btn_brown btn_width_auto btn_hover_t-dark-brown btn_x-step_10'}
                />
                <IcoBtn
                  icon={'icon-on'}
                  className={'grid__inline-tools-btn btn_i btn_brown btn_width_auto btn_hover_t-dark-brown btn_x-step_10'}
                />
                <IcoBtn
                  icon={'icon-edit'}
                  className={'grid__inline-tools-btn btn_i btn_brown btn_width_auto btn_hover_t-dark-brown btn_x-step_10'}
                />
                <IcoBtn
                  icon={'icon-delete'}
                  className={'grid__inline-tools-btn btn_i btn_brown btn_width_auto btn_hover_t-dark-brown btn_x-step_10'}
                />
              </div>
              <div className="grid__inline-tools-border-bottom" />
            </div>
          )}

          <PerfectScrollbar
            style={{ minHeight: props.minHeight }}
            onScrollX={this.triggerCloseFilterEvent}
            onScrollY={this.triggerCloseFilterEvent}
          >
            <BootstrapTable {...props} />
          </PerfectScrollbar>

          {props.hasCheckboxes && <BootstrapTable {...props} classes={'grid__freeze'} />}
        </div>
      );
    }

    return null;
  }
}
