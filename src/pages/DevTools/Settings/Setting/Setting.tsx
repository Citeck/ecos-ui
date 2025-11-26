import classNames from 'classnames';
import React from 'react';

import PanelTitle, { COLOR_GRAY } from '../../../../components/common/PanelTitle/PanelTitle';

type Props = {
  children: React.ReactNode;
  className?: string;
  title: string;
};

const Setting = ({ title, children, className }: Props): React.JSX.Element => {
  return (
    <div className={classNames('dev-tools-page__setting', className)}>
      <PanelTitle narrow color={COLOR_GRAY}>
        {title}
      </PanelTitle>
      <div className="dev-tools-page__setting-body">{children}</div>
    </div>
  );
};

export default Setting;
