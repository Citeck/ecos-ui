import $ from 'jquery';
import ReactDOM from 'react-dom';
import React, { Component, Fragment } from 'react';
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

import 'react-perfect-scrollbar/dist/css/styles.css';
import './Grid.scss';

const KEY_FIELD = 'id';
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
    this.state = {
      open: false,
      text: ''
    };

    this.id = `filter-${props.column.dataField.replace(':', '_')}`;
    this.tooltipId = `tooltip-${this.id}`;

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

  render() {
    const state = this.state;

    return (
      <div className={classNames('grid__th', state.text && 'grid__th_filtered')}>
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
            <Input
              type="text"
              placeholder={'Фильтровать'}
              className={'grid__filter-tooltip-input'}
              onChange={this.onChange}
              value={state.text}
            />

            <Icon className={'grid__filter-tooltip-close icon-close icon_small'} onClick={this.clear} />
          </Tooltip>
        </div>
      </div>
    );
  }
}

export default class Grid extends Component {
  constructor(props) {
    super(props);
    this.createCloseFilterEvent();
  }

  _setWidth = column => {
    column.style = {
      ...column.style,
      width: column.width
    };

    return column;
  };

  _setHeaderFormatter = column => {
    column.headerFormatter = (column, colIndex) => {
      return <HeaderFormatter column={column} colIndex={colIndex} onFilter={this.onFilter} />;
    };

    return column;
  };

  _setAdditionalOptions(props) {
    props.columns = props.columns.map(column => {
      if (column.width) {
        column = this._setWidth(column);
      }

      column = this._setHeaderFormatter(column);

      return column;
    });

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

  createInlineTools = $tr => {
    const inlineToolsClass = 'grid__inline-tools';
    const inlineToolsClassContainerClass = 'grid__inline-tools-container';
    const inlineToolsBtnClass = 'grid__inline-tools-btn btn_i btn_brown btn_width_auto btn_hover_t-dark-brown btn_x-step_10';

    const $currentTr = $tr.addClass(inlineToolsClassContainerClass).mouseleave(function() {
      // $(this).removeClass(inlineToolsClassContainerClass);
      // $(this).find(`div.${inlineToolsClass}`).remove();
    });
    const $inlineTools = $(`<div class='${inlineToolsClass}'></div>`).appendTo($currentTr)[0];

    let pos = $currentTr.position();

    $('#test-test').css('top', pos.top + 'px');

    ReactDOM.render(
      <Fragment>
        <IcoBtn icon={'icon-download'} className={inlineToolsBtnClass} />
        <IcoBtn icon={'icon-on'} className={inlineToolsBtnClass} />
        <IcoBtn icon={'icon-edit'} className={inlineToolsBtnClass} />
        <IcoBtn icon={'icon-delete'} className={inlineToolsBtnClass} />
      </Fragment>,
      $inlineTools
    );
  };

  createCheckboxs(props) {
    this._selected = props.selectAllRecords ? props.data.map(row => row[props.keyField || KEY_FIELD]) : props.selected || [];

    return {
      mode: 'checkbox',
      classes: 'grid__tr_selected',
      selected: this._selected,
      onSelect: (row, isSelect) => {
        const selected = this._selected;
        const keyField = row[props.keyField || KEY_FIELD];

        this._selected = isSelect ? [...selected, keyField] : selected.filter(x => x !== keyField);

        triggerEvent.call(this, 'onSelect', {
          selected: this._selected,
          all: false
        });
      },
      onSelectAll: (isSelect, rows) => {
        const keyField = props.keyField || KEY_FIELD;

        this._selected = isSelect ? [...this._selected, ...rows.map(row => row[keyField])] : this.getSelectedByPage(this.props.data, false);

        triggerEvent.call(this, 'onSelect', {
          selected: this._selected,
          all: isSelect
        });
      },
      selectionHeaderRenderer: ({ indeterminate, ...rest }) => {
        return (
          <div className={'grid__th grid__th_checkbox'}>
            <Checkbox indeterminate={indeterminate} checked={rest.checked} />
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

  toolsVisible = () => {
    return this._selected.length && this.getSelectedByPage(this.props.data, true).length;
  };

  getSelectedByPage = (records, onPage) => {
    const keyField = this.props.keyField || KEY_FIELD;

    return this._selected.filter(id => {
      const length = records.filter(record => record[keyField] === id).length;
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

  triggerCloseFilterEvent = e => {
    (e.target || e).dispatchEvent(this.closeFilterEvent);
  };

  render() {
    let props = {
      keyField: KEY_FIELD,
      bootstrap4: true,
      bordered: false,
      headerClasses: 'grid__header',
      noDataIndication: () => 'Нет элементов в списке',
      cellEdit: cellEditFactory({ mode: 'click', blurToSave: true }),
      ...this.props
    };

    props = this._setAdditionalOptions(props);

    if (props.columns.length) {
      return (
        <div className={classNames('grid', props.hasCheckboxes && 'grid_checkable', this.props.className)}>
          {this.toolsVisible() ? (
            <div className={'grid__tools'}>
              {props.selectAllRecordsVisible ? (
                <div className={'grid__tools-item grid__tools-item_first'}>
                  <Btn
                    className={`btn_extra-narrow ${props.selectAllRecords ? 'btn_blue' : 'btn_grey5'} btn_hover_light-blue2`}
                    title={'Выбрать все'}
                    onClick={this.selectAll}
                  >
                    Выбрать все {props.total}
                  </Btn>
                </div>
              ) : null}
              <div className={'grid__tools-item grid__tools-item_first'}>
                <IcoBtn
                  icon={'icon-download'}
                  className={'btn_i_sm btn_grey4 btn_hover_t-dark-brown'}
                  title={'Скачать как Zip'}
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
                  title={'Удалить'}
                  onClick={this.onDelete}
                />
              </div>
            </div>
          ) : null}

          <PerfectScrollbar onScrollX={this.triggerCloseFilterEvent} onScrollY={this.triggerCloseFilterEvent}>
            <BootstrapTable {...props} />
          </PerfectScrollbar>

          {props.hasCheckboxes && <BootstrapTable {...props} classes={'grid__freeze'} />}
        </div>
      );
    }

    return null;
  }
}
