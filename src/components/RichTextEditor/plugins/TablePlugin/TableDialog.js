import React from 'react';
import isFunction from 'lodash/isFunction';

import { INSERT_TABLE_COMMAND } from '@lexical/table';

import { EcosModal } from '../../../common';
import { Field, Input } from '../../../common/form';
import { t } from '../../../../helpers/util';
import { Btn } from '../../../common/btns';

import './TableDialog.style.scss';

const Labels = {
  INSERT_TABLE: 'table-plugin.table-dialog.insert-table-title',
  ROWS_COUNT: 'table-plugin.table-dialog.rows-count',
  COLUMNS_COUNT: 'table-plugin.table-dialog.columns-count',
  CANCEL: 'btn.cancel.label',
  SAVE: 'btn.save.label'
};

class TableDialog extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isOpen: props.isOpen,
      rowsCount: 2,
      columnsCount: 3
    };

    this.editor = props.editor;
  }

  hide = () => {
    const { onHide } = this.props;

    this.setState({ isOpen: false });

    isFunction(onHide) && onHide();
  };

  handleSave = () => {
    if (!this.editor) {
      return;
    }

    const { columnsCount, rowsCount } = this.state;

    this.editor.dispatchCommand(INSERT_TABLE_COMMAND, {
      columns: columnsCount,
      rows: rowsCount
    });

    this.hide();
  };

  render() {
    const { isOpen } = this.state;

    return (
      <EcosModal isOpen={isOpen} title={t(Labels.INSERT_TABLE)} hideModal={this.hide} size="small">
        <Field label={t(Labels.ROWS_COUNT)} labelPosition="top" isSmall>
          <Input
            min="1"
            max="100"
            type="number"
            defaultValue="2"
            onChange={event => this.setState({ rowsCount: Number(event.target.value) })}
          />
        </Field>
        <Field label={t(Labels.COLUMNS_COUNT)} labelPosition="top" isSmall>
          <Input
            min="1"
            max="100"
            type="number"
            defaultValue="3"
            onChange={event => this.setState({ columnsCount: Number(event.target.value) })}
          />
        </Field>
        <div className="table-dialog__buttons">
          <Btn className="ecos-btn_hover_light-blue" onClick={this.hide}>
            {t(Labels.CANCEL)}
          </Btn>
          <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" onClick={this.handleSave}>
            {t(Labels.SAVE)}
          </Btn>
        </div>
      </EcosModal>
    );
  }
}

export default TableDialog;
