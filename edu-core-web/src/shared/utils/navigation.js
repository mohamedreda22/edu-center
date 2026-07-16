let navigateFn = null;

export const setGlobalNavigate = (fn) => {
  navigateFn = fn;
};

export const globalNavigate = (path, options) => {
  if (navigateFn) {
    navigateFn(path, options);
  } else {
    // Fallback if router navigate is not yet initialized
    window.location.href = path;
  }
};
