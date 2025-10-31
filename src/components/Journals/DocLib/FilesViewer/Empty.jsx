import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { t } from '../../../../helpers/export/util';
import { useDropFile } from '../../../../hooks/useDropFile';

const Empty = ({ onDrop, message }) => {
  const {
    flags: { isDragged },
    handlers
  } = useDropFile({ callback: onDrop });
  let extraProps = {};

  if (typeof onDrop === 'function') {
    extraProps = {
      ...extraProps,
      ...handlers
    };
  }
  return (
    <div
      className={classNames('ecos-doclib__fileviewer-empty', {
        'ecos-doclib__fileviewer-empty_dropzone': isDragged
      })}
      {...extraProps}
    >
      {t(message)}
    </div>
  );
};

Empty.propTypes = {
  onDrop: PropTypes.func,
  message: PropTypes.string
};

Empty.defaultProps = {
  message: 'document-library.empty-folder'
};

export default Empty;
