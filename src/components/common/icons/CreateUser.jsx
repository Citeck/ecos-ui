import React from 'react';

export default ({ width = 17, height = 18, viewBox = "0 0 17 18", fill = "#B7B7B7" }) => (
  <svg width={width} height={height} viewBox={viewBox} fill={fill} xmlns="http://www.w3.org/2000/svg">
    <path d="M13.2583 11C12.975 11 12.6917 11.0708 12.4083 11.1417C12.1958 11.2125 11.9125 11.2833 11.7 11.425C11.4875 11.4958 11.3458 11.6375 11.1333 11.7792C10.425 12.3458 10 13.2667 10 14.2583C10 15.0375 10.2833 15.7458 10.7083 16.3125C10.9208 16.525 11.1333 16.7375 11.3458 16.8792C11.8417 17.2333 12.4083 17.4458 12.975 17.4458C13.0458 17.4458 13.1167 17.4458 13.1875 17.4458C14.9583 17.4458 16.4458 15.9583 16.4458 14.1875C16.5167 12.4875 15.0292 11 13.2583 11Z" />
    <path d="M14.8875 13.6916H13.8959V12.7C13.8959 12.3458 13.6125 12.1333 13.3292 12.1333C13.0459 12.1333 12.7625 12.4166 12.7625 12.7V13.6916H11.7709C11.4167 13.6916 11.2042 13.975 11.2042 14.2583C11.2042 14.6125 11.4875 14.825 11.7709 14.825H12.7625V15.8166C12.7625 16.1708 13.0459 16.3833 13.3292 16.3833C13.6125 16.3833 13.8959 16.1 13.8959 15.8166V14.825H14.8875C15.2417 14.825 15.4542 14.5416 15.4542 14.2583C15.4542 13.975 15.1709 13.6916 14.8875 13.6916Z" fill="white"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M6.66667 7.93333C4.45 7.93333 2.77778 6.22767 2.77778 3.96667C2.77778 1.70567 4.45 0 6.66667 0C8.88334 0 10.5556 1.70567 10.5556 3.96667C10.5556 6.22767 8.88334 7.93333 6.66667 7.93333ZM11.115 10.7134C10.1852 9.99858 9.02913 9.5744 7.77778 9.5744H5.55556C2.49222 9.5744 0 12.1165 0 15.2411V16C0 16.5523 0.447715 17 1 17H9.70742C9.27377 16.289 9 15.4526 9 14.5477C9 13.1636 9.59318 11.8784 10.5818 11.0875C10.6703 11.0285 10.75 10.9695 10.8262 10.9131C10.9246 10.8402 11.0171 10.7718 11.115 10.7134Z" />
  </svg>
);