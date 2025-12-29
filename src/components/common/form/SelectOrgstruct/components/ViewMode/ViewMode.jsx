import classNames from 'classnames';
import get from 'lodash/get';
import React, { useContext } from 'react';

import { AssocLink } from '../../../AssocLink';
import { SelectOrgstructContext } from '../../SelectOrgstructContext';
import { AUTHORITY_TYPE_GROUP, AUTHORITY_TYPE_USER, ViewModes } from '../../constants';

import Tags from '@/components/common/Tags';
import { createDocumentUrl, createProfileUrl, isNewVersionPage } from '@/helpers/urls';
import { t } from '@/helpers/util';

import './ViewMode.scss';

const ViewMode = () => {
  const context = useContext(SelectOrgstructContext);
  const { selectedRows, controlProps } = context;
  const { placeholder, isSelectedValueAsText, viewModeType } = controlProps;
  const placeholderText = placeholder ? placeholder : t('select-orgstruct.placeholder');

  const renderValue = item => {
    let url = '';

    switch (get(item, 'attributes.authorityType', '')) {
      case AUTHORITY_TYPE_USER:
        url = createProfileUrl(get(item, 'attributes.fullName', ''));
        break;
      case AUTHORITY_TYPE_GROUP:
      default:
        url = createDocumentUrl(get(item, 'attributes.nodeRef', ''));
        break;
    }

    const paramsLink = { openNewBrowserTab: !isNewVersionPage(url) };

    return (
      <AssocLink
        label={item.label}
        asText={isSelectedValueAsText}
        className="select-orgstruct-view-mode__list-value"
        link={url}
        paramsLink={paramsLink}
      />
    );
  };

  if (viewModeType === ViewModes.TAGS) {
    return <Tags tags={selectedRows.map(row => ({ name: row.label, id: row.id }))} />;
  }

  return (
    <>
      {selectedRows.length > 0 ? (
        <ul
          className={classNames('select-orgstruct-view-mode__list', {
            [`select-orgstruct-view-mode__list_type_${viewModeType}`]: !!viewModeType && viewModeType !== ViewModes.DEFAULT
          })}
        >
          {selectedRows.map(item => (
            <li key={item.id}>{renderValue(item)}</li>
          ))}
        </ul>
      ) : (
        <p>{placeholderText}</p>
      )}
    </>
  );
};

ViewMode.propTypes = {};

export default ViewMode;
