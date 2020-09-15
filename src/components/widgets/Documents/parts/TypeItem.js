import React, { useState, useEffect } from 'react';
import { Collapse, Progress } from 'reactstrap';
import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import uuidV4 from 'uuid/v4';

import { Icon, Popper } from '../../../common';
import { Btn } from '../../../common/btns';
import { t } from '../../../../helpers/export/util';
import { usePrevious } from '../../../../hooks/usePrevious';
import { typesStatuses } from '../../../../constants/documents';
import { selectTypeStatus } from '../../../../selectors/documents';
import { prepareTooltipId } from '../../../../helpers/util';
import Badge from './Badge';

const TypeItem = props => {
  const [isOpen, setIsOpen] = useState(!isEmpty(props.children));
  const [status, setStatus] = useState('');
  const handleClickHeader = () => setIsOpen(!isOpen);
  const handleToggleTooltip = event => {
    event.stopPropagation();
  };
  const handleUpload = () => {
    if (typeof props.onUpload === 'function') {
      props.onUpload(props.type);
    }
  };
  const prevChildren = usePrevious(props.children);
  const id = prepareTooltipId(`type-count-${props.type.type}-${uuidV4()}`);

  useEffect(() => {
    const status = typesStatuses[selectTypeStatus(props.type)];

    setStatus(status);
  }, [props.type]);

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

        <Popper text={t(status)} className="ecos-docs-m-type__popper" popupClassName="ecos-docs-m-type__popper-popup">
          <Badge type={props.type} target={id} onClick={handleToggleTooltip} />
        </Popper>
      </div>
      <Collapse isOpen={isOpen} className="ecos-docs-m-type__body">
        {props.children}
        <div className="ecos-docs-m__panel">
          {props.uploadPercent === null && (
            <Btn disabled={!props.canUploaded} className="ecos-docs-m-type__upload ecos-btn_blue" onClick={handleUpload}>
              {t('Добавить файлы')}
            </Btn>
          )}
          {props.uploadPercent !== null && <Progress className="ecos-docs-m-type__progress" value={props.uploadPercent} />}
        </div>
      </Collapse>
    </div>
  );
};

export default TypeItem;
