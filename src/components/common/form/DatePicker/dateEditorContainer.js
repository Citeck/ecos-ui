let containerRef = null;

export function getDateEditorContainer() {
  if (!containerRef || !document.body.contains(containerRef)) {
    containerRef = document.createElement('div');
    containerRef.classList.add('date-editor-container');
    document.body.appendChild(containerRef);
  }

  return containerRef;
}
