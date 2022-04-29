import React, { useCallback, useState } from 'react';
import classNames from 'classnames';
import { Collapse } from 'react-collapse';

import { Icon, Loader } from '../../common';
import { Caption } from '../../common/form';
import PropTypes from 'prop-types';
import isFunction from 'lodash/isFunction';

const Section = ({ isLoading, title, children, opened, onChange }) => {
  const [isOpened, setOpened] = useState(!!opened);
  const handleChange = useCallback(() => {
    setOpened(!isOpened);
    isFunction(onChange) && onChange(!isOpened);
  }, [onChange, isOpened]);

  return (
    <>
      {isLoading && <Loader blur />}
      <Caption small onClick={handleChange}>
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
