import React, { useContext } from 'react';
import get from 'lodash/get';

import { t } from '../../../../../../helpers/util';
import { createProfileUrl, isNewVersionPage } from '../../../../../../helpers/urls';
import { AssocLink } from '../../../AssocLink';
import { SelectOrgstructContext } from '../../SelectOrgstructContext';

import './ViewMode.scss';

const ViewMode = () => {
  const context = useContext(SelectOrgstructContext);
  const { selectedRows, controlProps } = context;
  const { placeholder, isSelectedValueAsText } = controlProps;
  const placeholderText = placeholder ? placeholder : t('select-orgstruct.placeholder');

  const renderValue = item => {
    const url = createProfileUrl(get(item, 'attributes.shortName', ''));
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
        <ul className="select-orgstruct-view-mode__list">
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
