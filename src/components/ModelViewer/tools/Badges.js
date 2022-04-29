import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import './style.scss';

const getMedium = (p, k) => p[0][k] + (p[1][k] - p[0][k]) / 2;

const getCoords = elm => {
  if (!elm) {
    return {};
  }

  const { x, y, waypoints, height, type } = elm;
  const intend = 5;

  switch (!!type) {
    case type.includes('Task'): {
      return { left: `${x}px`, top: `${y + height + intend}px` };
    }
    case type.includes('Flow'): {
      if (waypoints) {
        const left = `${getMedium(waypoints, 'x')}px`;
        const top = `${left === waypoints[0].x ? getMedium(waypoints, 'y') : waypoints[1].y + intend}px`;
        return { left, top };
      }
      break;
    }
    default:
      return { left: `${x}px`, top: `${y}px` };
  }
};

const Badges = ({ data = {}, keys = [], getElm }) => {
  return (
    <>
      {data.map(item => {
        const elm = getElm(item.id);
        const style = getCoords(elm);
        //console.log(elm);
        return (
          <div key={item.id} className="model-badges__item-wrap" style={style}>
            {keys.map(k => (
              <span key={item.id + k} className={classNames('model-badges__item', `model-badges__item_${k}`)}>
                {item[k]}
              </span>
            ))}
          </div>
        );
      })}
    </>
  );
};

Badges.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  keys: PropTypes.arrayOf(PropTypes.string),
  getElm: PropTypes.func
};

class PortalBadges {
  created = false;
  #overlays;
  #wrapper;

  create = overlays => {
    if (!overlays) {
      console.error('need object Overlays', overlays);
    }

    this.created = true;
    this.#overlays = overlays;
    this.#wrapper = document.createElement('div');
    this.#wrapper.classList.add('model-badges__wrap');
    overlays._overlayRoot.appendChild(this.#wrapper);
  };

  draw = props => {
    const getElm = id => this.#overlays._elementRegistry.get(id);
    ReactDOM.render(<Badges {...props} getElm={getElm} />, this.#wrapper);
  };

  destroy = () => {
    this.#wrapper && this.#wrapper.remove();
    this.created = false;
  };
}

export default PortalBadges;
