import React from 'react';
import isFunction from 'lodash/isFunction';

import { t } from '../../../helpers/util';
import Columns from '../../common/templates/Columns/Columns';
import { DndList } from '../../common/List';
import { PanelBar } from '../../common';

import '../../ColumnsSetup/ColumnsSetup.scss';

class KanbanColumnsSettings extends React.Component {
  onChangeVisible = ({ column, checked }) => {
    const { onChange } = this.props;

    const columns = this.setColumnVisible(column, checked);

    isFunction(onChange) && onChange(columns);
  };

  onChangeOrder = columns => {
    const { onChange } = this.props;

    isFunction(onChange) && onChange([...columns]);
  };

  setColumnVisible = (column, checked) => {
    return this.props.columns.map(c => {
      if (c.id === column.id) {
        c.default = checked;
      }

      return c;
    });
  };

  render() {
    const { columns } = this.props;

    return (
      <PanelBar header={t('journals.kanban-columns-setup.header')} css={{ headerClassName: 'panel-bar__header_upper' }}>
        <div className="columns-setup">
          <div className="ecos-journals-columns-setup__toolbar columns-setup__toolbar">
            <Columns cols={[<span className={'columns-setup__desc'}>{t('columns-setup.order')}</span>]} />
          </div>
          <div className={'columns-setup__content'}>
            <DndList
              noScroll
              data={columns}
              titleField="name"
              classNameItem="columns-setup__item fitnesse-columns-setup__item"
              draggableClassName={'ecos-dnd-list__item_draggable'}
              onOrder={this.onChangeOrder}
              onChangeVisible={this.onChangeVisible}
            />
          </div>
        </div>
      </PanelBar>
    );
  }
}

export default KanbanColumnsSettings;
