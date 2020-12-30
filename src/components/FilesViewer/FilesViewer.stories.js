import React from 'react';

import { demoItems, demoActions } from './__mocks__/FilesViewer.mock';
import FilesViewer from './FilesViewer';

export default {
  title: 'Components/FilesViewer',
  component: FilesViewer,
  parameters: {
    actions: {
      argTypesRegex: '^on.*'
    }
  }
};

const defaultArgs = {
  items: demoItems
};

const Template = args => <FilesViewer {...args} />;

export const Default = Template.bind({});
Default.args = {
  ...defaultArgs
};

export const Selected = Template.bind({});
Selected.args = {
  ...defaultArgs,
  selected: [demoItems[1].id, demoItems[4].id, demoItems[5].id]
};

export const WithActions = Template.bind({});
WithActions.args = {
  ...defaultArgs,
  items: demoItems.map(item => ({ ...item, actions: [...demoActions] })),
  selected: [demoItems[1].id, demoItems[4].id]
};
