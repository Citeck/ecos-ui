import React from 'react';
import ReactDOM from 'react-dom/client';
import MermaidDiagram from './MermaidDiagram';

/**
 * Debug utility for testing Mermaid diagrams in browser console
 *
 * Usage in browser console:
 *
 * // Simple flowchart
 * window.showMermaid(`
 *   graph TD
 *   A[Start] --> B[Process]
 *   B --> C[End]
 * `)
 *
 * // Sequence diagram
 * window.showMermaid(`
 *   sequenceDiagram
 *   Alice->>John: Hello John
 *   John-->>Alice: Great!
 * `)
 *
 * // Close debug window
 * window.closeMermaid()
 */

let debugRoot = null;
let debugContainer = null;

const createDebugContainer = () => {
  if (debugContainer) {
    return debugContainer;
  }

  // Create overlay container
  debugContainer = document.createElement('div');
  debugContainer.id = 'mermaid-debug-container';
  debugContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;

  // Create content wrapper
  const contentWrapper = document.createElement('div');
  contentWrapper.style.cssText = `
    background: white;
    border-radius: 8px;
    max-width: 90vw;
    max-height: 90vh;
    overflow: auto;
    position: relative;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  `;

  // Create close button
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '✕';
  closeButton.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: #f44336;
    color: white;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    font-size: 20px;
    cursor: pointer;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  `;
  closeButton.onmouseover = () => {
    closeButton.style.background = '#d32f2f';
  };
  closeButton.onmouseout = () => {
    closeButton.style.background = '#f44336';
  };
  closeButton.onclick = () => {
    window.closeMermaid();
  };

  // Create title
  const title = document.createElement('div');
  title.innerHTML = '<strong>🔍 Mermaid Debug Viewer</strong>';
  title.style.cssText = `
    font-size: 18px;
    margin-bottom: 15px;
    padding-right: 40px;
    color: #333;
  `;

  // Create diagram container
  const diagramContainer = document.createElement('div');
  diagramContainer.id = 'mermaid-debug-diagram';
  diagramContainer.style.cssText = `
    min-width: 400px;
    min-height: 300px;
  `;

  contentWrapper.appendChild(closeButton);
  contentWrapper.appendChild(title);
  contentWrapper.appendChild(diagramContainer);
  debugContainer.appendChild(contentWrapper);

  // Close on ESC key
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      window.closeMermaid();
    }
  };
  debugContainer.addEventListener('keydown', handleKeyDown);

  // Close on overlay click
  debugContainer.addEventListener('click', (e) => {
    if (e.target === debugContainer) {
      window.closeMermaid();
    }
  });

  document.body.appendChild(debugContainer);

  return diagramContainer;
};

const showMermaidDebug = (chartCode) => {
  try {
    // Close existing debug window if any
    window.closeMermaid();

    // Create new container
    const container = createDebugContainer();

    // Create React root and render
    debugRoot = ReactDOM.createRoot(container);
    debugRoot.render(
      <MermaidDiagram
        chart={chartCode}
        className="mermaid-debug"
      />
    );

    console.log('✅ Mermaid debug window opened');
    console.log('📝 Chart code:', chartCode);
    console.log('💡 Tip: Use window.closeMermaid() to close or press ESC');

  } catch (error) {
    console.error('❌ Error showing Mermaid debug:', error);
  }
};

const closeMermaidDebug = () => {
  if (debugRoot) {
    debugRoot.unmount();
    debugRoot = null;
  }

  if (debugContainer) {
    debugContainer.remove();
    debugContainer = null;
  }

  console.log('✅ Mermaid debug window closed');
};

// Initialize global debug functions
// Call this function once to set up the debug utilities
export const initMermaidDebug = () => {
  window.showMermaid = showMermaidDebug;
  window.closeMermaid = closeMermaidDebug;

  // Add helper function to show examples
  window.mermaidExamples = () => {
    console.log(`
🎨 Mermaid Debug Examples:

1️⃣ Flowchart:
window.showMermaid(\`
  graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> A
\`)

2️⃣ Sequence Diagram:
window.showMermaid(\`
  sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: Hello Bob!
    B-->>A: Hi Alice!
    A->>B: How are you?
    B-->>A: I'm good, thanks!
\`)

3️⃣ Gantt Chart:
window.showMermaid(\`
  gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Phase 1
    Task 1: 2024-01-01, 30d
    Task 2: 2024-02-01, 20d
    section Phase 2
    Task 3: 2024-03-01, 25d
\`)

4️⃣ ER Diagram:
window.showMermaid(\`
  erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses
\`)

5️⃣ Git Graph:
window.showMermaid(\`
  gitGraph
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
\`)

💡 Close with: window.closeMermaid() or press ESC
    `);
  };

  console.log(`
🎨 Mermaid Debug Utilities loaded!

Commands available:
  • window.showMermaid(code)    - Show diagram
  • window.closeMermaid()        - Close diagram
  • window.mermaidExamples()     - Show examples

Example:
  window.showMermaid(\`
    graph LR
      A[Start] --> B[End]
  \`)
  `);
};

export { showMermaidDebug, closeMermaidDebug };
