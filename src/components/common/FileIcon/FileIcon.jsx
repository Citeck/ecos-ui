import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import formats from './font/icons/high-contrast/catalog';
import './font/file-icon-high-contrast.css';
import './FileIcon.scss';

const FileIcon = ({ format, className }) => {
  let isCorrectFormat = false;
  let lowerCaseFormat = format || '';
  if (format && typeof format.toLowerCase === 'function') {
    lowerCaseFormat = format.toLowerCase();
    isCorrectFormat = Array.from(formats).includes(lowerCaseFormat);
  }

  return (
    <span
      className={classNames('ecos-file-icon', 'fiv-hct', className, {
        [`fiv-icon-${lowerCaseFormat}`]: isCorrectFormat,
        'fiv-icon-blank': !isCorrectFormat || lowerCaseFormat === 'blank'
      })}
    />
  );
};

FileIcon.propTypes = {
  className: PropTypes.string,
  format: PropTypes.oneOf(Array.from(formats))
};

export default FileIcon;
