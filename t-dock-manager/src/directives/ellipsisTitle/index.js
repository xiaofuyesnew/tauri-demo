/**
 * 文本超出时显示title提示
 */
export const ellipsisTitle = {
  mounted(el) {
    // 溢出检查函数
    const checkOverflow = (ele) => {
      ele = ele || el
      const isOverflow = ele.scrollWidth > ele.clientWidth;
      if (isOverflow) {
        ele.title = ele.textContent || ele.innerText;
      } else {
        const subEl = ele.querySelector('[data-title]')
        if (subEl && subEl.scrollWidth > subEl.clientWidth) {
            ele.title = ele.textContent || ele.innerText;
        } else {
          ele.removeAttribute('title');
        }
      }
    };

    // 初始检查
    checkOverflow();

    // 监听元素尺寸变化
    const resizeObserver = new ResizeObserver(() => checkOverflow());
    resizeObserver.observe(el);

    // 监听元素内容变化
    const mutationObserver = new MutationObserver(() => checkOverflow());
    mutationObserver.observe(el, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // 保存观察者实例以便卸载时清理
    el._ellipsisTitleObservers = { resizeObserver, mutationObserver };
  },
  
  unmounted(el) {
    // 清理观察者
    const observers = el._ellipsisTitleObservers;
    if (observers) {
      observers.resizeObserver.unobserve(el);
      observers.mutationObserver.disconnect();
    }
  }
};