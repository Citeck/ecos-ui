import React, { useState, useEffect } from 'react';
import classNames from 'classnames';

import { CANCELED_TIME, UNDOABLE_ACTIONS, documentFields } from '../../../constants/documents';
import { t } from '../../../helpers/export/util';
import { Icon } from '../../common';
import { Btn } from '../../common/btns';

const DocumentItem = props => {
  const [countDown, setCountDown] = useState(0);
  const [action, setAction] = useState(null);
  const [timer, setTimer] = useState(null);
  const {
    [documentFields.id]: id,
    [documentFields.name]: title,
    [documentFields.modified]: modified,
    [documentFields.loadedBy]: loadedBy,
    actions,
    onClick
  } = props;
  const handleAction = action => {
    if (UNDOABLE_ACTIONS.includes(action.id)) {
      setCountDown(CANCELED_TIME);
      setAction(action);
    } else {
      onClick(id, action);
    }
  };
  const handleCancelAction = () => {
    clearTimer(timer);
    setCountDown(0);
  };
  const clearTimer = timer => {
    window.clearTimeout(timer);
    setTimer(null);
  };

  useEffect(() => {
    if (!countDown && !timer) {
      return;
    }

    const timerId = window.setTimeout(() => {
      if (countDown <= 0) {
        clearTimer(timer);
        return;
      }

      const count = countDown - 1;

      setCountDown(count);

      if (count <= 0) {
        onClick(id, action);
        setAction(null);
        clearTimer(timer);
      }
    }, 1000);

    setTimer(timerId);

    return () => {
      clearTimer(timer);
    };
  }, [action, countDown]);

  useEffect(() => {
    return () => {
      clearTimer(timer);
    };
  }, []);

  return (
    <div className="ecos-docs-m__panel ecos-docs-m-document">
      <div className="ecos-docs-m-document__title">{title}</div>
      <div className="ecos-docs-m-document__info">{`${t('Загрузил')}: ${loadedBy}, ${modified}`}</div>
      <div className="ecos-docs-m-document__actions">
        {countDown > 0 && (
          <Btn className="ecos-docs-m-document__actions-cancel" onClick={handleCancelAction}>
            {`${t('Вернуть')} (${countDown})`}
          </Btn>
        )}
        {countDown <= 0 &&
          actions.map(action => (
            <div key={action.id} className="ecos-docs-m-document__actions-item" onClick={() => handleAction(action)}>
              <Icon className={classNames(action.icon, 'ecos-docs-m-document__actions-item-icon')} />
            </div>
          ))}
      </div>
    </div>
  );
};

export default DocumentItem;
