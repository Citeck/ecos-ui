import React, { useMemo, useState } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { DESIGNER_PAGE_CONTEXT } from '../../../constants/bpmn';
import { BPMNDesignerService } from '../../../services/BPMNDesignerService';

import styles from './RightMenu.module.scss';
import '../style.scss';

const mapStateToProps = state => ({
  isAdmin: state.user.isAdmin,
  isBpmAdmin: state.user.isBpmAdmin
});

function RightMenu({ isAdmin, isBpmAdmin }) {
  const menuItems = useMemo(() => BPMNDesignerService.getMenuItems({ isAdmin, isBpmAdmin }), [isBpmAdmin, isAdmin]);
  const [activeLink, setActiveLink] = useState(DESIGNER_PAGE_CONTEXT);

  return (
    <div>
      <div className="common-container_white">
        {menuItems.map(item => (
          <div
            className={classNames(styles.item, { [styles.itemActive]: item.href === activeLink })}
            key={item.label}
            onClick={() => setActiveLink(item.href)}
          >
            <a href={item.href}>{item.label}</a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default connect(mapStateToProps)(RightMenu);
