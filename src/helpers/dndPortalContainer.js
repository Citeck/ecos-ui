let containerRef = null;

export function getDndPortalContainer() {
  if (!containerRef || !document.body.contains(containerRef)) {
    containerRef = document.createElement('div');
    containerRef.classList.add('dnd-portal-container');
    document.body.appendChild(containerRef);
  }

  return containerRef;
}
