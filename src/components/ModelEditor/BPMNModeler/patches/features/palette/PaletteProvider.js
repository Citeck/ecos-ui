import PaletteProvider from 'bpmn-js/lib/features/palette/PaletteProvider';

const originGetPaletteEntries = PaletteProvider.prototype.getPaletteEntries;
const disabledPaletteElements = [
  'create.group', // Create-a-group
  'create.data-store', // Data Store
  'create.data-object' // Data Store
];

PaletteProvider.prototype.getPaletteEntries = function() {
  const entries = originGetPaletteEntries.apply(this);

  disabledPaletteElements.forEach(key => {
    delete entries[key];
  });

  return entries;
};
