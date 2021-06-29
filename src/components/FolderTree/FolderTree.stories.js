import React from 'react';

import { demoItems, item111, item1111 } from './__fixtures__/FolderTree.fixtures';
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

export const LoadingChildren = Template.bind({});
LoadingChildren.args = {
  ...defaultArgs,
  items: defaultArgs.items.map(item => {
    if (item.id === item111.id) {
      return { ...item, isUnfolded: true, isChildrenLoading: true };
    }
    return item;
  })
};
