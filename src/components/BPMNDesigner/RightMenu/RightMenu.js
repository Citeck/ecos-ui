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
              <a href="/share/page/bpmn-designer">Модели процессов</a>
            </li>
            <li className={styles.item}>
              <a href="/share/page/bpmn-designer">Case models</a>
            </li>
            <li className={styles.item}>
              <a href="/share/page/bpmn-designer">Forms</a>
            </li>
            <li className={styles.item}>
              <a href="/share/page/bpmn-designer">Decision tables</a>
            </li>
            <li className={styles.item}>
              <a href="/share/page/bpmn-designer">Apps</a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}

export default RightMenu;
