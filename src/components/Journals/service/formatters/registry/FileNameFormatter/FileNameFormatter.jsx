import React from 'react';

import { REMOTE_TITLE_ATTR_NAME } from '../../../../../../constants/pageTabs';
import FileIcon from '../../../../../common/FileIcon';
import { detectFormat } from '../../../../../common/FileIcon/helpers';

import BaseFormatter from '../BaseFormatter';
import { URL } from '../../../../../../constants';

import './FileNameFormatter.scss';

export default class FileNameFormatter extends BaseFormatter {
  static TYPE = 'filename';

  /**
   * @param {FormatterProps} props
   * @return {React.ReactNode}
   */
  format(props = {}) {
    const { row = {}, cell } = props;

    const url = `${URL.DASHBOARD}?recordRef=${row.id}`;
    const linkProps = {
      target: '_blank',
      rel: 'noopener noreferrer',
      ...{ [REMOTE_TITLE_ATTR_NAME]: true }
    };

    return (
      <a href={url} {...linkProps} className="ecos-filename-formatter">
        <FileIcon format={detectFormat(cell)} className="ecos-filename-formatter__icon" />
        {cell}
      </a>
    );
  }
}
