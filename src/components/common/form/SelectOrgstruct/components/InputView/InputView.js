import classNames from 'classnames';
import get from 'lodash/get';
import React, { useContext } from 'react';

import { AssocLink } from '../../../AssocLink';
import { SelectOrgstructContext } from '../../SelectOrgstructContext';
import { AUTHORITY_TYPE_GROUP, AUTHORITY_TYPE_USER, ViewModes } from '../../constants';
import ViewMode from '../ViewMode';

import { Tooltip } from '@/components/common';
import { ROOT_GROUP_NAME } from '@/components/common/Orgstruct/constants';
import Tags from '@/components/common/Tags';
import { Btn } from '@/components/common/btns';
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
  const { selectedRows, setSelectedRows, onChangeValue, error, toggleSelectModal, deleteSelectedItem, controlProps, targetId } = context;
  const {
    isCompact,
    disabled,
    multiple,
    placeholder,
    viewOnly,
    renderView,
    hideInputView,
    isSelectedValueAsText,
    isInlineEditingMode,
    viewModeType
  } = controlProps;

  if (hideInputView) {
    return null;
  }

  if (typeof renderView === 'function') {
    return renderView(context);
  }

  if (viewOnly) {
    return <ViewMode />;
  }

  const placeholderText = placeholder ? placeholder : t(Labels.PLACEHOLDER);

  const onClickDelete = e => {
    deleteSelectedItem(e.target.dataset.id);
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

  const renderCompactList = () => {
    const compactValue = !!selectedRows && selectedRows.map(item => item.label).join(', ');

    return compactValue ? (
      <Tooltip showAsNeeded target={targetId} uncontrolled text={compactValue} className="select-orgstruct__values-list-tooltip">
        <div id={targetId} className="select-orgstruct__values-list_compact">
          {compactValue}
        </div>
      </Tooltip>
    ) : null;
  };

  const valuesList = isCompact ? (
    renderCompactList()
  ) : (
    <>
      {selectedRows.length > 0 ? (
        <ul className="select-orgstruct__values-list">
          {selectedRows.map((item, idx) => (
            <li key={item.id || idx}>
              {renderSelectedValue(item)}
              {disabled ? null : (
                <div className="select-orgstruct__values-list-actions">
                  {/*<span data-id={item.id} className={'icon icon-edit'} onClick={() => {}} />*/}
                  <span data-id={item.id} className="icon icon-delete" onClick={onClickDelete} />
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="select-orgstruct__value-not-selected">{placeholderText}</p>
      )}
    </>
  );

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
      />
    );
  }

  return (
    <div className={classNames('select-orgstruct__input-view', { 'select-orgstruct__input-view_compact': isCompact })}>
      {isCompact ? null : valuesList}

      {error ? (
        <p className="select-orgstruct__error">{error.message}</p>
      ) : (
        <div className="select-orgstruct__actions">
          <Btn
            className={classNames('ecos-btn_blue ecos-btn_narrow', { 'select-orgstruct__input-view-button_compact': isCompact })}
            onClick={toggleSelectModal}
            disabled={disabled}
          >
            {selectedRows.length > 0 ? (multiple ? t(Labels.BUTTON_ADD) : t(Labels.BUTTON_CHANGE)) : t(Labels.BUTTON_SELECT)}
          </Btn>
        </div>
      )}

      {isCompact ? valuesList : null}
    </div>
  );
};

InputView.propTypes = {};

export default InputView;
