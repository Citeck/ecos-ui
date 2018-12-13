import React from 'react';
import mainStyles from '../BPMNDesigner.module.scss';
import styles from './RightMenu.module.scss';
import cn from 'classnames';

function RightMenu() {
  return (
    <div className={styles.wrapper}>
      <div className={mainStyles.whiteBlock}>
        <nav>
          <ul>
            <li className={cn(styles.item, { [styles.itemActive]: true })}>
              <a href="/share/page/bpmn-designer" className="icon-models">
                Модели процессов
              </a>
            </li>
            <li className={styles.item}>
              <a href="/share/page/bpmn-designer" className="icon-case-models">
                Case models
              </a>
            </li>
            <li className={styles.item}>
              <a href="/share/page/bpmn-designer" className="icon-forms">
                Forms
              </a>
            </li>
            <li className={styles.item}>
              <a href="/share/page/bpmn-designer" className="icon-decision-tables">
                Decision tables
              </a>
            </li>
            <li className={styles.item}>
              <a href="/share/page/bpmn-designer" className="icon-apps">
                Apps
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}

export default RightMenu;
