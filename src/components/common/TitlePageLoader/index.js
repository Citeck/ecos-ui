import React from 'react';
import PropTypes from 'prop-types';
import { RectShape, RoundShape } from 'react-placeholder/lib/placeholders';
import ReactPlaceholder from 'react-placeholder';

import './style.scss';

export default class TitlePageLoader extends React.Component {
  static propTypes = {
    isReady: PropTypes.bool,
    withBadge: PropTypes.bool
  };

  render() {
    const { isReady = false, children, withBadge } = this.props;

    return (
      <ReactPlaceholder
        type="textRow"
        ready={isReady}
        showLoadingAnimation
        customPlaceholder={
          <div className="ecos-title-page-loader">
            <RectShape color="#b7b7b7" style={{ width: 150, height: 20, borderRadius: 10 }} />
            {withBadge && <RoundShape color="#b7b7b7" style={{ width: 32, height: 20 }} />}
          </div>
        }
      >
        {children}
      </ReactPlaceholder>
    );
  }
}
