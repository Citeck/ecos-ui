import React, { useState } from 'react';
import classNames from 'classnames';
import { Collapse } from 'react-collapse';

import { Icon, Loader } from '../../common';
import { Caption } from '../../common/form';
import PropTypes from 'prop-types';

const Section = ({ isLoading, title, children, opened }) => {
  const [isOpened, setOpened] = useState(opened);

  return (
    <>
      {isLoading && <Loader blur />}
      <Caption small onClick={() => setOpened(!isOpened)}>
        {title}
        <Icon className={classNames({ 'icon-small-up': !isOpened, 'icon-small-down': isOpened })} />
      </Caption>
      <Collapse isOpened={isOpened}>{children}</Collapse>
    </>
  );
};

Section.propTypes = {
  title: PropTypes.string.isRequired,
  isLoading: PropTypes.bool,
  opened: PropTypes.bool
};

export default Section;
