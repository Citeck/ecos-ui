import React from 'react';
import { connect } from 'react-redux';
import mainStyles from '../BPMNDesigner.module.scss';
import styles from './RightMenu.module.scss';
import cn from 'classnames';
import { EDITOR_PAGE_CONTEXT, DESIGNER_PAGE_CONTEXT } from '../../../constants/bpmn';
import { IGNORE_TABS_HANDLER_ATTR_NAME } from '../../../constants/pageTabs';
import { t } from '../../../helpers/util';

const mapStateToProps = state => ({
  isAdmin: state.user.isAdmin,
  isBpmAdmin: state.user.isBpmAdmin
});

function RightMenu({ isAdmin, isBpmAdmin }) {
  const menuItems = [
    {
      className: cn(styles.item, { [styles.itemActive]: true }),
      href: DESIGNER_PAGE_CONTEXT,
      iconClassName: 'icon-models',
      label: t('bpmn-designer.right-menu.process-models')
    }
  ];

  if (isAdmin || isBpmAdmin) {
    menuItems.push({
      className: styles.item,
      href: `${EDITOR_PAGE_CONTEXT}#/casemodels`,
      iconClassName: 'icon-case-models',
      label: t('bpmn-designer.right-menu.case-models')
    });
  }

  menuItems.push({
    className: styles.item,
    href: `${EDITOR_PAGE_CONTEXT}#/forms`,
    iconClassName: 'icon-forms',
    label: t('bpmn-designer.right-menu.forms')
  });

  if (isAdmin || isBpmAdmin) {
    menuItems.push(
      {
        className: styles.item,
        href: `${EDITOR_PAGE_CONTEXT}#/decision-tables`,
        iconClassName: 'icon-decision-tables',
        label: t('bpmn-designer.right-menu.decision-tables')
      },
      {
        className: styles.item,
        href: `${EDITOR_PAGE_CONTEXT}#/apps`,
        iconClassName: 'icon-apps',
        label: t('bpmn-designer.right-menu.apps')
      }
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={mainStyles.whiteBlock}>
        <nav>
          <ul>
            {menuItems.map(item => (
              <li className={item.className} key={item.label}>
                <a href={item.href} className={item.iconClassName} {...{ [IGNORE_TABS_HANDLER_ATTR_NAME]: true }}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

export default connect(mapStateToProps)(RightMenu);
