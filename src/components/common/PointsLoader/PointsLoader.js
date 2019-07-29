import * as React from 'react';
import './style.scss';

export default class PointsLoader extends React.Component {
  render() {
    return (
      <div className="ecos-points-loader">
        <div className="ecos-points-loader-child ecos-points-loader-child-1" />
        <div className="ecos-points-loader-child ecos-points-loader-child-2" />
        <div className="ecos-points-loader-child ecos-points-loader-child-3" />
      </div>
    );
  }
}
