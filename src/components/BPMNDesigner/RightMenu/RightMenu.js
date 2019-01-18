import React from 'react';
import mainStyles from '../BPMNDesigner.module.scss';
import styles from './RightMenu.module.scss';
import cn from 'classnames';
import { EDITOR_PAGE_CONTEXT, DESIGNER_PAGE_CONTEXT } from '../../../constants/bpmn';
import { t } from '../../../helpers/util';

function RightMenu() {
  return (
    <div className={styles.wrapper}>
      <div className={mainStyles.whiteBlock}>
        <nav>
          <ul>
            <li className={cn(styles.item, { [styles.itemActive]: true })}>
              <a href={DESIGNER_PAGE_CONTEXT} className="icon-models">
                {t('bpmn-designer.right-menu.process-models')}
              </a>
            </li>
            <li className={styles.item}>
              <a href={`${EDITOR_PAGE_CONTEXT}#/casemodels`} className="icon-case-models">
                {t('bpmn-designer.right-menu.case-models')}
              </a>
            </li>
            <li className={styles.item}>
              <a href={`${EDITOR_PAGE_CONTEXT}#/forms`} className="icon-forms">
                {t('bpmn-designer.right-menu.forms')}
              </a>
            </li>
            <li className={styles.item}>
              <a href={`${EDITOR_PAGE_CONTEXT}#/decision-tables`} className="icon-decision-tables">
                {t('bpmn-designer.right-menu.decision-tables')}
              </a>
            </li>
            <li className={styles.item}>
              <a href={`${EDITOR_PAGE_CONTEXT}#/apps`} className="icon-apps">
                {t('bpmn-designer.right-menu.apps')}
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}

export default RightMenu;
