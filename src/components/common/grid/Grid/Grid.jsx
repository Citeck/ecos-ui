import $ from 'jquery';
import React, { Component, Fragment } from 'react';
import ReactDOM from 'react-dom';
import BootstrapTable from 'react-bootstrap-table-next';
import classNames from 'classnames';
import Icon from '../../icons/Icon/Icon';
import Checkbox from '../../form/Checkbox/Checkbox';
import { IcoBtn } from '../../btns';

import './Grid.scss';

class HeaderFormatter extends Component {
  render() {
    return (
      <div className={'grid__th'}>
        <span>{this.props.column.text}</span>
        <Icon className={'grid__filter icon-filter'} />
      </div>
    );
  }
}

export default class Grid extends Component {
  constructor(props) {
    super(props);
    this.state = {
      toolsHeaderVisible: false,
      selected: []
    };
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
      return <HeaderFormatter column={column} colIndex={colIndex} />;
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
      props.selectRow = this.createCheckboxs();
    }

    return props;
  }

  createInlineTools($tr) {
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
  }

  createCheckboxs() {
    return {
      mode: 'checkbox',
      classes: 'grid__tr_selected',
      selected: this.state.selected,
      onSelect: (row, isSelect, rowIndex) => {
        let selected = this.state.selected;

        this.setState({
          selected: isSelect ? [...selected, rowIndex] : selected.filter(x => x !== rowIndex)
        });
      },
      onSelectAll: (isSelect, rows) => {
        this.setState({
          selected: isSelect ? [...Array(rows.length).keys()] : []
        });
      },
      selectionHeaderRenderer: ({ indeterminate, ...rest }) => {
        const checked = rest.checked;

        return (
          <div className={'grid__th grid__th_checkbox'}>
            <Checkbox indeterminate={indeterminate} checked={checked} />
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

  render() {
    let props = {
      ...this.props,
      bootstrap4: true,
      bordered: false,
      keyField: '_gid',
      headerClasses: 'grid__header',
      noDataIndication: () => 'Нет элементов в списке'
    };

    props = this._setAdditionalOptions(props);

    if (props.columns.length) {
      return (
        <div className={classNames('grid', props.hasCheckboxes && 'grid_checkable', this.props.className)}>
          {this.state.selected.length ? (
            <div className={'grid__tools'}>
              <div className={'grid__tools-item grid__tools-item_first'}>
                <IcoBtn icon={'icon-download'} className={'btn_i_sm btn_grey4 btn_hover_t-dark-brown'} />
              </div>
              <div className={'grid__tools-item'}>
                <IcoBtn icon={'icon-copy'} className={'btn_i_sm btn_grey4 btn_hover_t-dark-brown'} />
              </div>
              <div className={'grid__tools-item'}>
                <IcoBtn icon={'icon-big-arrow'} className={'btn_i_sm btn_grey4 btn_hover_t-dark-brown'} />
              </div>
              <div className={'grid__tools-item'}>
                <IcoBtn icon={'icon-delete'} className={'btn_i_sm btn_grey4 btn_hover_t-dark-brown'} />
              </div>
            </div>
          ) : null}

          <div className={'grid__body'}>
            <BootstrapTable {...props} />
          </div>

          {props.hasCheckboxes && <BootstrapTable {...props} classes={'grid__freeze'} />}
        </div>
      );
    }

    return null;
  }
}
