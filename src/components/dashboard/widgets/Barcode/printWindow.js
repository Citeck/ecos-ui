// A successful PDF tab owns its URL until it closes, even after the widget unmounts.
export function showPrintPdf(tab, blob) {
  const url = URL.createObjectURL(blob);
  try {
    tab.location.replace(url);
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
  const timer = setInterval(() => {
    if (tab.closed) {
      clearInterval(timer);
      URL.revokeObjectURL(url);
    }
  }, 1000);
}

export function reservePrintWindow(message) {
  const tab = window.open('', '_blank');
  if (tab) {
    try {
      tab.opener = null;
      tab.document.title = message;
      const status = tab.document.createElement('p');
      status.setAttribute('role', 'status');
      status.textContent = message;
      tab.document.body.replaceChildren(status);
    } catch (error) {
      tab.close();
      throw error;
    }
  }
  return tab;
}
