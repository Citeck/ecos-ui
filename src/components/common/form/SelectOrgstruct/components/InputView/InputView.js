import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import React, { useContext } from 'react';

import { AssocLink } from '../../../AssocLink';
import { SelectOrgstructContext } from '../../SelectOrgstructContext';
import { AUTHORITY_TYPE_GROUP, AUTHORITY_TYPE_USER, ViewModes } from '../../constants';
import ViewMode from '../ViewMode';

import { ROOT_GROUP_NAME } from '@/components/common/Orgstruct/constants';
import Tags from '@/components/common/Tags';
import ChevronRight from '@/components/common/icons/ChevronRight';
import Close from '@/components/common/icons/Close';
import Subtract from '@/components/common/icons/Subtract';
import { SourcesId } from '@/constants';
import { createDocumentUrl, createProfileUrl, isNewVersionPage } from '@/helpers/urls';
import { t } from '@/helpers/util';

import './InputView.scss';

const Labels = {
  PLACEHOLDER: 'select-orgstruct.placeholder',
  NO_LABEL_LINK: 'select-orgstruct.no-label',
  BUTTON_ADD: 'select-orgstruct.button.add',
  BUTTON_CHANGE: 'select-orgstruct.button.change',
  BUTTON_SELECT: 'select-orgstruct.button.select'
};

const InputView = () => {
  const context = useContext(SelectOrgstructContext);
  const { selectedRows, setSelectedRows, onChangeValue, error, toggleSelectModal, deleteSelectedItem, controlProps } = context;
  const { disabled, multiple, placeholder, viewOnly, renderView, hideInputView, isSelectedValueAsText, isInlineEditingMode, viewModeType } =
    controlProps;

  if (hideInputView) {
    return null;
  }

  if (typeof renderView === 'function') {
    return renderView(context);
  }

  if (viewOnly) {
    return <ViewMode />;
  }

  const onClickDelete = id => {
    deleteSelectedItem(id);
  };

  const renderSelectedValue = item => {
    const props = {};

    if (!isSelectedValueAsText) {
      switch (get(item, 'attributes.authorityType', '')) {
        case AUTHORITY_TYPE_USER:
          props.link = createProfileUrl(get(item, 'attributes.fullName', ''));
          break;
        case AUTHORITY_TYPE_GROUP:
        default:
          props.link = createDocumentUrl(get(item, 'attributes.nodeRef', ''));
          break;
      }
      props.paramsLink = { openNewBrowserTab: !isInlineEditingMode || !isNewVersionPage(props.link) };
    }

    return (
      <AssocLink
        label={item.label || t(Labels.NO_LABEL_LINK)}
        asText={isSelectedValueAsText}
        {...props}
        className="select-orgstruct__values-list-disp"
        extraData={!item.label && (get(item, 'attributes.shortName') || get(item, 'attributes.name'))}
      />
    );
  };

  if (isEmpty(selectedRows) && !multiple) {
    return (
      <div className={classNames('select-orgstruct__values-list', { multiple })}>
        <div className="select-orgstruct__values-list_text-content">
          <span>{placeholder || t(Labels.PLACEHOLDER)}</span>
          <span className="select-orgstruct__values-list-actions_item" onClick={toggleSelectModal}>
            <ChevronRight width={14} height={14} />
          </span>
        </div>
      </div>
    );
  }

  if (viewModeType === ViewModes.TAGS) {
    return (
      <Tags
        tags={selectedRows.map(row => ({ name: row.label, id: row.id }))}
        onTagsChange={remainingSelectedRows => {
          const remainingItems = {};

          remainingSelectedRows.forEach(row => {
            remainingItems[row.id] = true;
          });

          const newSelectedRows = selectedRows.filter(row => remainingItems[row.id]);

          onChangeValue(newSelectedRows);
          setSelectedRows(newSelectedRows);
        }}
        onAddTag={toggleSelectModal}
        exception={[`${SourcesId.GROUP}@${ROOT_GROUP_NAME}`]}
        disabled={disabled}
      />
    );
  }

  return (
    <div className={classNames('select-orgstruct__input-view')}>
      <ul className={classNames('select-orgstruct__values-list', { multiple, disabled })}>
        {selectedRows.map((item, idx) => (
          <li className="select-orgstruct__values-list_text-content" key={item.id || idx}>
            {renderSelectedValue(item)}
            {disabled ? null : (
              <div className="select-orgstruct__values-list-actions">
                <span className="select-orgstruct__values-list-actions_item" data-id={item.id} onClick={() => onClickDelete(item.id)}>
                  <Close width={14} height={14} />
                </span>
                {!multiple && (
                  <span className="select-orgstruct__values-list-actions_item" onClick={toggleSelectModal}>
                    <ChevronRight width={14} height={14} />
                  </span>
                )}
              </div>
            )}
          </li>
        ))}
        {!!multiple && !disabled && (
          <li onClick={toggleSelectModal} style={{ cursor: 'pointer' }}>
            <Subtract />
          </li>
        )}
      </ul>

      {error && <p className="select-orgstruct__error">{error.message}</p>}
    </div>
  );
};

InputView.propTypes = {};

export default InputView;
