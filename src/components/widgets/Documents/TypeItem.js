import React, { useState, useEffect } from 'react';
import { Collapse } from 'reactstrap';
import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { Icon } from '../../common';
import { Btn } from '../../common/btns';
import { t } from '../../../helpers/export/util';
import { usePrevious } from '../../../hooks/usePrevious';

const TypeItem = props => {
  const [isOpen, setIsOpen] = useState(!isEmpty(props.children));
  const handleClickHeader = () => setIsOpen(!isOpen);
  const handleUpload = () => {
    if (typeof props.onUpload === 'function') {
      props.onUpload(props.type);
    }
  };
  const prevChildren = usePrevious(props.children);

  useEffect(() => {
    if (isEmpty(prevChildren) && !isEmpty(props.children)) {
      setIsOpen(true);
    }
  }, [props.children]);

  return (
    <div className="ecos-docs-m-type">
      <div onClick={handleClickHeader} className="ecos-docs-m-type__header">
        <Icon
          className={classNames('icon-small-down ecos-docs-m-type__i ecos-docs-m-type__i-arrow', {
            'ecos-docs-m-type__i-arrow_close': !isOpen
          })}
        />
        <div className="ecos-docs-m-type__header-title">{get(props, 'type.name')}</div>
      </div>
      <Collapse isOpen={isOpen} className="ecos-docs-m-type__body">
        {props.children}
        <div className="ecos-docs-m__panel">
          <Btn className="ecos-docs-m-type__upload ecos-btn_blue" onClick={handleUpload}>
            {t('Добавить файлы')}
          </Btn>
        </div>
      </Collapse>
    </div>
  );
};

export default TypeItem;
