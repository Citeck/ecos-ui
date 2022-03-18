import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import { t } from '../../../../../helpers/util';
import Select from '../../../../common/form/Select';
import EditorService from '../../../../Journals/service/editors/EditorService';
import EditorScope from '../../../../Journals/service/editors/EditorScope';
import { ALFRESCO } from '../../../../../constants/alfresco';

import './Filter.scss';

const Filter = React.memo(
  ({ idx, text, item, predicates, selectedPredicate, predicateValue, onRemove, onChangePredicate, onChangePredicateValue }) => {
    const editorType = get(item, 'newEditor.type');
    const isShow = get(selectedPredicate, 'needValue', true);
    const FilterValueComponent = React.memo(({ item, value, predicate, onUpdate }) => {
      return EditorService.getEditorControl({
        attribute: item.attribute,
        editor: item.newEditor,
        value,
        scope: EditorScope.FILTER,
        onUpdate,
        recordRef: `${ALFRESCO}/@`,
        controlProps: { predicate }
      });
    });

    return (
      <li className="select-journal-filter">
        <div className="select-journal-filter__left" title={t(text)}>
          {t(text)}
        </div>
        <div className="select-journal-filter__right">
          <div className="select-journal-filter__predicate">
            <Select
              className="select_narrow select-journal-filter__predicate-select"
              options={predicates}
              value={selectedPredicate}
              data-idx={idx}
              onChange={onChangePredicate}
            />
            <div className="select-journal-filter__predicate-control">
              {isShow && EditorService.isRegistered(editorType) && (
                <FilterValueComponent item={item} value={predicateValue} predicate={selectedPredicate} onUpdate={onChangePredicateValue} />
              )}
            </div>
          </div>
          <span data-idx={idx} className="icon icon-delete select-journal-filter__remove-btn" onClick={onRemove} />
        </div>
      </li>
    );
  }
);

Filter.propTypes = {
  text: PropTypes.string
};

export default Filter;
