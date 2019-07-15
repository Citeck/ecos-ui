import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { t } from '../../../helpers/util';
import { IGNORE_TABS_HANDLER_ATTR_NAME } from '../../../constants/pageTabs';
import handleControl from '../../../helpers/handleControl';

const mapDispatchToProps = dispatch => ({
  dispatch
});

const DropDownMenuItem = ({ key, data, dispatch, onClick }) => {
  const { id, targetUrl, label, target, control } = data;

  let clickHandler = null;
  if (control && control.type) {
    clickHandler = event => {
      event.preventDefault();
      handleControl(control.type, control.payload, dispatch);
    };
  } else if (onClick) {
    clickHandler = event => {
      event.preventDefault();
      onClick(data);
    };
  }

  return (
    <li className="custom-dropdown-menu__item">
      <a
        // eventKey={key}
        href={targetUrl}
        target={target}
        id={id}
        onClick={clickHandler}
        {...{ [IGNORE_TABS_HANDLER_ATTR_NAME]: true }}
      >
        <i className={'fa fa-custom fa-custom__' + id} />
        {label && t(label)}
      </a>
    </li>
  );
};

DropDownMenuItem.propTypes = {
  key: PropTypes.string,
  data: PropTypes.PropTypes.shape({
    id: PropTypes.string,
    targetUrl: PropTypes.string,
    label: PropTypes.string,
    target: PropTypes.string,
    control: PropTypes.string
  }).isRequired,
  dispatch: PropTypes.string,
  onClick: PropTypes.func
};

DropDownMenuItem.defaultProps = {};

export default connect(
  null,
  mapDispatchToProps
)(DropDownMenuItem);
