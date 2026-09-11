(() => {
  const root = document.documentElement;
  if (!root.classList.contains('intro-pending')) return;

  const page = document.querySelector('.site-frame');
  const target = document.querySelector('.brand-logo');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!page || !target || reduced.matches) {
    clearTimeout(window.azukiIntroFallback);
    root.classList.remove('intro-pending', 'intro-revealing');
    return;
  }

  const tempo = .8;
  const scaleTime = milliseconds => milliseconds * tempo;
  const activeAnimations = new Set();
  const overlay = document.createElement('div');
  overlay.className = 'azuki-intro';
  overlay.id = 'azukiIntro';
  overlay.setAttribute('aria-hidden', 'true');

  const exitHint = document.createElement('p');
  exitHint.className = 'azuki-intro-hint';
  exitHint.textContent = '按[Esc]退出动画';

  let stopped = false;
  const initialWidth = innerWidth;
  const initialHeight = innerHeight;

  const startAnimation = (element, keyframes, options) => {
    const timing = {...options, fill: options.fill ?? 'forwards'};
    if (timing.duration != null) timing.duration = scaleTime(timing.duration);
    if (timing.delay != null) timing.delay = scaleTime(timing.delay);
    const animation = element.animate(keyframes, timing);
    activeAnimations.add(animation);
    animation.finished.then(
      () => activeAnimations.delete(animation),
      () => activeAnimations.delete(animation),
    );
    return animation;
  };

  const waitFor = animations => Promise.all(animations.map(animation => animation.finished));

  const onResize = () => {
    if (Math.abs(innerWidth - initialWidth) > 30 || Math.abs(innerHeight - initialHeight) > 80) finish();
  };

  const finish = () => {
    if (stopped) return;
    stopped = true;
    clearTimeout(window.azukiIntroFallback);
    root.classList.remove('intro-pending', 'intro-revealing');
    page.inert = false;
    overlay.remove();
    activeAnimations.forEach(animation => animation.cancel());
    window.removeEventListener('resize', onResize);
    window.removeEventListener('keydown', onKey);
    reduced.removeEventListener('change', finish);
  };

  const onKey = event => {
    if (event.key === 'Escape') finish();
  };

  async function play() {
    try {
      if (!window.azukiLogoDrawing) throw new Error('Logo drawing asset unavailable');
      const drawing = new DOMParser().parseFromString(window.azukiLogoDrawing, 'image/svg+xml');
      if (drawing.querySelector('parsererror')) throw new Error('Invalid logo drawing asset');

      const svg = document.importNode(drawing.documentElement, true);
      svg.classList.add('azuki-intro-logo');
      overlay.append(svg, exitHint);
      const paths = [...svg.querySelectorAll('.write-guide')];
      if (stopped || !root.classList.contains('intro-pending')) return finish();

      const width = Math.min(innerWidth * .78, 760);
      const height = width * 294 / 1125;
      const left = (innerWidth - width) / 2;
      const top = (innerHeight - height) / 2;
      Object.assign(svg.style, {
        width: `${width}px`,
        height: `${height}px`,
        left: `${left}px`,
        top: `${top}px`,
      });
      page.inert = true;
      document.body.append(overlay);

      startAnimation(
        exitHint,
        [
          {opacity: 0, transform: 'translateY(-3px)'},
          {opacity: 1, transform: 'translateY(0)'},
        ],
        {duration: 520, delay: 260, easing: 'ease-out'},
      );

      paths.forEach(path => {
        const revealLength = path.getTotalLength() + 32;
        path.dataset.revealLength = revealLength;
        path.style.strokeDasharray = `${revealLength} ${revealLength}`;
        path.style.strokeDashoffset = revealLength;
      });

      // All strokes share one timeline origin, avoiding gaps between pen segments.
      let delay = 180;
      const startTime = document.timeline.currentTime;
      const writing = paths.map(path => {
        const duration = Number(path.dataset.duration);
        const revealLength = Number(path.dataset.revealLength);
        const animation = startAnimation(
          path,
          [{strokeDashoffset: revealLength}, {strokeDashoffset: 0}],
          {duration, delay, easing: 'linear'},
        );
        if (startTime !== null) animation.startTime = startTime;
        delay += duration;
        return animation;
      });
      await waitFor(writing);
      if (stopped) return;

      const drawnLogo = svg.querySelector('.drawn-logo');
      const exactLogo = svg.querySelector('.exact-logo');
      const rect = target.getBoundingClientRect();
      const settle = startAnimation(
        exactLogo,
        [{opacity: 0}, {opacity: 1}],
        {duration: 720, delay: 140, easing: 'cubic-bezier(.22,1,.36,1)'},
      );
      const clearDrawing = startAnimation(
        drawnLogo,
        [{opacity: 1, offset: 0}, {opacity: 1, offset: .78}, {opacity: 0, offset: 1}],
        {duration: 980, delay: 140, easing: 'ease-in-out'},
      );
      const flight = startAnimation(
        svg,
        [
          {transform: 'translate(0,0) scale(1)'},
          {transform: `translate(${rect.left - left}px,${rect.top - top}px) scale(${rect.width / width})`},
        ],
        {duration: 1080, delay: 260, easing: 'cubic-bezier(.65,0,.25,1)'},
      );
      const hideHint = startAnimation(
        exitHint,
        [
          {opacity: 1, transform: 'translateY(0)'},
          {opacity: 0, transform: 'translateY(-4px)'},
        ],
        {duration: 420, delay: 100, easing: 'ease-in'},
      );

      await waitFor([settle, clearDrawing, flight, hideHint]);
      if (stopped) return;

      root.classList.add('intro-revealing');
      await startAnimation(
        overlay,
        [{backgroundColor: '#fff'}, {backgroundColor: 'rgba(255,255,255,0)'}],
        {duration: 950, easing: 'ease-out'},
      ).finished;
      finish();
    } catch (error) {
      if (stopped) return;
      window.azukiIntroError = String(error?.stack || error);
      console.warn('Azuki intro skipped:', error);
      finish();
    }
  }

  window.addEventListener('resize', onResize);
  window.addEventListener('keydown', onKey);
  reduced.addEventListener('change', finish);
  requestAnimationFrame(play);
})();
