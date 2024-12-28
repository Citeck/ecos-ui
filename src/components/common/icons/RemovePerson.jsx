import React from 'react';

export default ({ width = 18, height = 18, viewBox = '0 0 13 13', fill = '#B7B7B7' }) => (
  <svg width={width} height={height} viewBox={viewBox} fill={fill} xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.5 13C10.0899 13 13 10.0899 13 6.5C13 2.91015 10.0899 0 6.5 0C2.91015 0 0 2.91015 0 6.5C0 10.0899 2.91015 13 6.5 13ZM3.4404 3.44037C3.69423 3.18654 4.10579 3.18654 4.35962 3.44037L6.5 5.58079L8.64038 3.44037C8.89421 3.18654 9.30577 3.18654 9.5596 3.44037C9.81347 3.69427 9.81347 4.10576 9.5596 4.35966L7.41926 6.5L9.5596 8.64034C9.81347 8.89424 9.81347 9.30573 9.5596 9.55963C9.30577 9.81346 8.89421 9.81346 8.64038 9.55963L6.5 7.41921L4.35962 9.55963C4.10579 9.81346 3.69423 9.81346 3.4404 9.55963C3.18653 9.30573 3.18653 8.89424 3.4404 8.64034L5.58074 6.5L3.4404 4.35966C3.18653 4.10576 3.18653 3.69427 3.4404 3.44037Z"
      fill="#FF5721"
    />
  </svg>
);