import React from 'react';
import './styles.scss';

export default class EcosProgressLoading extends React.Component {
  render() {
    return (
      <div className="ecos-progress-loading__container">
        <div className="ecos-progress-loading__progress-bar">
          <div className="ecos-progress-loading__progress" />
        </div>
      </div>
    );
  }
}
