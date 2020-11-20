import React from 'react';

import PanelTitle, { COLOR_GRAY } from './PanelTitle';

export default {
  title: 'Example/PanelTitle',
  component: PanelTitle
};

const Template = args => <PanelTitle {...args}>PanelTitle example</PanelTitle>;

export const Default = Template.bind({});
Default.args = {};

export const Gray = Template.bind({});
Gray.args = {
  color: COLOR_GRAY
};

export const narrow = Template.bind({});
narrow.args = {
  narrow: true
};
