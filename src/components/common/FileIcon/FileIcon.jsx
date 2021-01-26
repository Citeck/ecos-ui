import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import formats from './font/icons/high-contrast/catalog';
import './font/file-icon-high-contrast.css';
import './FileIcon.scss';

const FileIcon = ({ format, className }) => {
  const isCorrectFormat = Array.from(formats).includes(format);
  return (
    <span
      className={classNames('ecos-file-icon', 'fiv-hct', className, {
        [`fiv-icon-${format}`]: isCorrectFormat,
        'fiv-icon-blank': !isCorrectFormat || format === 'blank'
      })}
    />
  );
};

FileIcon.propTypes = {
  className: PropTypes.string,
  format: PropTypes.oneOf(Array.from(formats))
};

export default FileIcon;
