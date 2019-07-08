import React from 'react';
import { connect } from 'react-redux';
import { t } from '../../../helpers/util';
import { IGNORE_TABS_HANDLER_ATTR_NAME } from '../../../constants/pageTabs';
import handleControl from '../../../helpers/handleControl';

const mapDispatchToProps = dispatch => ({
  dispatch
});

const DropDownMenuItem = ({ key, data, dispatch }) => {
  const { id, targetUrl, label, target, control } = data;

  let clickHandler = null;
  if (control && control.type) {
    clickHandler = event => {
      event.preventDefault();
      handleControl(control.type, control.payload, dispatch);
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

export default connect(
  null,
  mapDispatchToProps
)(DropDownMenuItem);
