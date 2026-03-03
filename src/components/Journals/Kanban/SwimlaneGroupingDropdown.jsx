import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';

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
      isStatic
      source={source}
      value={currentValue}
      valueField="id"
      titleField="name"
      onChange={handleChange}
      controlLabel={t('kanban.grouping.label')}
      controlClassName={`ecos-btn_drop-down ${isViewNewJournal ? 'ecos-btn_hover_blue2 ecos-journal__btn_new ecos-btn_grey3' : 'ecos-kanban__dropdown'}`}
      menuClassName="ecos-kanban__dropdown-menu"
    />
  );
};

SwimlaneGroupingDropdown.propTypes = {
  groupableColumns: PropTypes.array,
  swimlaneGrouping: PropTypes.object,
  onChangeSwimlaneGrouping: PropTypes.func.isRequired,
  isViewNewJournal: PropTypes.bool
};

export default SwimlaneGroupingDropdown;
