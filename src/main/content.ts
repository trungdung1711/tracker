// Track link clicks
document.addEventListener("click", (event) => {
  const target = event.target;
  
  if (!(target instanceof Element)) return;
  
  const link = target.closest("a");
  if (link && link.href) {
    chrome.runtime.sendMessage({
      action: "link_clicked",
      url: link.href
    });
  }
});


document.addEventListener("mouseup", () => {
  const selection = window.getSelection()
  if (selection) {
    chrome.runtime.sendMessage({
      action: "text_selected",
      text: selection.toString().trim(),
    });
  }
});

let maxScroll = 0;
window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY;
  const winHeight = window.innerHeight;
  const docHeight = document.documentElement.scrollHeight;

  const percent = Math.round(((scrollTop + winHeight) / docHeight) * 100);

  if (percent > maxScroll) {
    maxScroll = percent;
    chrome.runtime.sendMessage({
      action: "scroll_depth",
      percent: maxScroll
    });
  }
});
