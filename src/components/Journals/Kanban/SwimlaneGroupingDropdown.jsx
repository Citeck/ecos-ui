import React, { useMemo, useCallback } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import { IcoBtn } from '../../common/btns';
import { Dropdown } from '../../common/form';
import { t } from '@/helpers/util';

const SwimlaneGroupingDropdown = ({ groupableColumns, swimlaneGrouping, onChangeSwimlaneGrouping, isViewNewJournal }) => {
  const source = useMemo(() => {
    const items = [{ id: '', name: t('kanban.grouping.none') }];

    (groupableColumns || []).forEach(col => {
      items.push({ id: col.attribute || col.id, name: col.label || col.text || col.name || col.attribute || col.id });
    });

    return items;
  }, [groupableColumns]);

  const handleChange = useCallback(
    item => {
      if (!item || !item.id) {
        onChangeSwimlaneGrouping(null);
      } else {
        const col = (groupableColumns || []).find(c => (c.attribute || c.id) === item.id);
        onChangeSwimlaneGrouping({
          attribute: item.id,
          label: col ? col.label || col.text || col.name || item.id : item.id
        });
      }
    },
    [groupableColumns, onChangeSwimlaneGrouping]
  );

  const currentValue = swimlaneGrouping ? swimlaneGrouping.attribute : '';

  return (
    <Dropdown
      isButton
      source={source}
      value={currentValue}
      valueField="id"
      titleField="name"
      onChange={handleChange}
      menuClassName="ecos-kanban__dropdown-menu"
    >
      <IcoBtn
        invert
        icon="icon-small-down"
        className={classNames('ecos-btn_hover_blue2 ecos-btn_drop-down ecos-btn_grey3 ecos-journal__btn_new', {
          'ecos-journal__btn_new_selected': !!swimlaneGrouping
        })}
      >
        {swimlaneGrouping ? swimlaneGrouping.label : t('kanban.grouping.label')}
      </IcoBtn>
    </Dropdown>
  );
};

SwimlaneGroupingDropdown.propTypes = {
  groupableColumns: PropTypes.array,
  swimlaneGrouping: PropTypes.object,
  onChangeSwimlaneGrouping: PropTypes.func.isRequired,
  isViewNewJournal: PropTypes.bool
};

export default SwimlaneGroupingDropdown;
