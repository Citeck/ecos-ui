import { NODE_TYPES } from '../../../constants/docLib';

export const folder1 = {
  id: 'folder1',
  title: 'Folder 1',
  type: NODE_TYPES.DIR,
  modified: '2020-10-26T08:31:00Z'
};

export const file1 = {
  id: 'file1',
  title: 'File 1',
  type: NODE_TYPES.FILE,
  modified: '2020-12-10T15:29:00Z'
};

export const demoActions = [
  {
    id: 'edit',
    name: 'Edit',
    icon: 'icon-edit',
    type: 'edit',
    onClick: () => {
      window.alert('Edit item');
    }
  },
  {
    id: 'view',
    name: 'View',
    icon: 'icon-small-eye-show',
    type: 'view',
    onClick: () => {
      window.alert('View item');
    }
  },
  {
    id: 'delete',
    name: 'Delete',
    icon: 'icon-delete',
    type: 'delete',
    onClick: () => {
      window.confirm('Delete item?');
    }
  }
];

export const demoItems = [
  folder1,
  {
    id: 'folder2',
    title: 'Folder 2',
    type: NODE_TYPES.DIR,
    modified: null
  },
  {
    id: 'folder3',
    title: 'Folder 3',
    type: NODE_TYPES.DIR,
    modified: '2020-12-11T18:30:00Z'
  },
  file1,
  {
    id: 'file2',
    title: 'File 2',
    type: NODE_TYPES.FILE,
    modified: '2020-12-10T15:29:45Z'
  },
  {
    id: 'file3',
    title: 'File 3',
    type: NODE_TYPES.FILE,
    modified: '2020-12-10T15:29:57Z'
  },
  {
    id: 'file4',
    title: 'File 4 with a veeeeeeeeeeery looooooooong name',
    type: NODE_TYPES.FILE,
    modified: '2020-12-10T15:29:57Z'
  }
];
