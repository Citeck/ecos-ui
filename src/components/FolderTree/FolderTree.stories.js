import React from 'react';

import { demoItems, item1111 } from './__mocks__/FolderTree.mock';
import FolderTree from './FolderTree';

export default {
  title: 'Components/FolderTree',
  component: FolderTree,
  parameters: {
    actions: {
      argTypesRegex: '^on.*'
    }
  }
};

const defaultArgs = {
  items: demoItems
};

const Template = args => <FolderTree {...args} />;

export const Default = Template.bind({});
Default.args = {
  ...defaultArgs
};

export const Selected = Template.bind({});
Selected.args = {
  ...defaultArgs,
  selected: item1111.id
};
