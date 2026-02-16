// Main content script — initializes all modules
(async () => {
  await SPT.checkPro();

  // Free features — always init
  SPT.InlineEditor.init();
  SPT.SEOScore.init();
  SPT.ImageOptimizer.init();

  // Pro features — init (they gate themselves)
  SPT.BulkPrice.init();
  SPT.BulkInventory.init();
  SPT.OrderDashboard.init();
  SPT.CLVCalculator.init();

  // Re-init on SPA navigation
  let lastUrl = location.href;
  const navObserver = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(() => {
        SPT.InlineEditor.init();
        SPT.SEOScore.init();
        SPT.ImageOptimizer.init();
        SPT.BulkPrice.init();
        SPT.BulkInventory.init();
        SPT.OrderDashboard.init();
        SPT.CLVCalculator.init();
      }, 500);
    }
  });
  navObserver.observe(document.body, { childList: true, subtree: true });
})();
