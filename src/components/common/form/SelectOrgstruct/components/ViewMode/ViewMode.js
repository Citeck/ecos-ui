import React, { useContext } from 'react';
import classNames from 'classnames';
import get from 'lodash/get';

import { isExistValue, t } from '../../../../../../helpers/util';
import { createDocumentUrl, createProfileUrl, isNewVersionPage } from '../../../../../../helpers/urls';
import { AssocLink } from '../../../AssocLink';
import { SelectOrgstructContext } from '../../SelectOrgstructContext';
import { AUTHORITY_TYPE_GROUP, AUTHORITY_TYPE_USER } from '../../constants';

import './ViewMode.scss';

const ViewMode = () => {
  const context = useContext(SelectOrgstructContext);
  const { selectedRows, controlProps } = context;
  const { placeholder, isSelectedValueAsText, isCompactView } = controlProps;
  const placeholderText = placeholder ? placeholder : t('select-orgstruct.placeholder');
  const isCompact = isExistValue(isCompactView) ? isCompactView : true;

  const renderValue = item => {
    let url = '';

    switch (get(item, 'attributes.authorityType', '')) {
      case AUTHORITY_TYPE_USER:
        url = createProfileUrl(get(item, 'attributes.shortName', ''));
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

  return (
    <>
      {selectedRows.length > 0 ? (
        <div className={classNames('select-orgstruct-view-mode__list', { 'select-orgstruct-view-mode__list_compact': isCompact })}>
          {selectedRows.map(item => (
            <div key={item.id}>{renderValue(item)}</div>
          ))}
        </div>
      ) : (
        <p>{placeholderText}</p>
      )}
    </>
  );
};

ViewMode.propTypes = {};

export default ViewMode;
