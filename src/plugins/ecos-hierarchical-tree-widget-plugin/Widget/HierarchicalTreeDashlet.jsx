import React, { useState, useEffect } from 'react';
import { SortableContainer, SortableElement, arrayMove } from 'react-sortable-hoc';

const SortableItem = SortableElement(({ record }) => <li>{record.name}</li>);

const SortableList = SortableContainer(({ items }) => {
  return (
    <ul>
      {items.map((record, index) => (
        <SortableItem key={record.id} index={index} record={record} />
      ))}
    </ul>
  );
});

const TreeNode = ({ node, children }) => (
  <div>
    <div>{node.name}</div>
    {children && <div style={{ marginLeft: 20 }}>{children}</div>}
  </div>
);

// eslint-disable-next-line no-unused-vars
const buildTree = records => {
  const recordMap = new Map(records.map(record => [record.id, { ...record, children: [] }]));
  const rootNodes = [];

  records.forEach(record => {
    if (record.parentId) {
      recordMap.get(record.parentId).children.push(recordMap.get(record.id));
    } else {
      rootNodes.push(recordMap.get(record.id));
    }
  });

  return rootNodes;
};

const HierarchicalTreeWidget = () => {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    // fetchRecords().then(fetchedRecords => {
    //   setRecords(buildTree(fetchedRecords));
    // });
  }, []);

  const onSortEnd = ({ oldIndex, newIndex }) => {
    setRecords(arrayMove(records, oldIndex, newIndex));
  };

  return (
    <div>
      <h3>Hierarchical Tree</h3>
      <SortableList items={records} onSortEnd={onSortEnd} />
      {records.map(record => (
        <TreeNode key={record.id} node={record}>
          {record.children.length > 0 && record.children.map(child => <TreeNode key={child.id} node={child} />)}
        </TreeNode>
      ))}
    </div>
  );
};

export default HierarchicalTreeWidget;
