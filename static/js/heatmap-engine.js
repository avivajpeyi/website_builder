(() => {
  const SOURCE_CACHE = new Map();
  const GITHUB_PALETTE = ['#161b22', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
  const LEVEL_BY_COLOR = new Map(GITHUB_PALETTE.map((color, index) => [color.toLowerCase(), index]));
  const LEVEL_BY_NAME = new Map([
    ['NONE', 0],
    ['FIRST_QUARTILE', 1],
    ['SECOND_QUARTILE', 2],
    ['THIRD_QUARTILE', 3],
    ['FOURTH_QUARTILE', 4],
  ]);
  const APPROXIMATE_COUNT_BY_LEVEL = [0, 1, 4, 8, 12];
  const SONIFY_SCALE = [55, 65.41, 73.42, 82.41, 98, 110, 130.81, 146.83];
  const ROW_VOICES = [
    { label: 'Sun', instrument: 'kick', octaveShift: 0 },
    { label: 'Mon', instrument: 'bass', octaveShift: -1 },
    { label: 'Tue', instrument: 'pad', octaveShift: 0 },
    { label: 'Wed', instrument: 'pad', octaveShift: 0.5 },
    { label: 'Thu', instrument: 'pad', octaveShift: 1 },
    { label: 'Fri', instrument: 'pad', octaveShift: 1.5 },
    { label: 'Sat', instrument: 'hatlead', octaveShift: 2 },
  ];
  const DATE_FORMATTER = new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const MONTH_FORMATTER = new Intl.DateTimeFormat('en', {
    month: 'short',
    timeZone: 'UTC',
  });

  class HeatmapSonifier {
    constructor(component, weeks) {
      this.component = component;
      this.weeks = weeks;
      this.audioContext = null;
      this.masterGain = null;
      this.noiseBuffer = null;
      this.timerId = null;
      this.isPlaying = false;
      this.currentStep = -1;
      this.tempo = 120;
      this.mutedRows = new Set();

      this.playButton = component.querySelector('[data-action="toggle-play"]');
      this.tempoInput = component.querySelector('[data-role="tempo"]');
      this.tempoValue = component.querySelector('[data-role="tempo-value"]');
      this.trackButtons = Array.from(component.querySelectorAll('.github-heatmap-sonify__track'));

      this.bindEvents();
      this.setTempo(Number(this.tempoInput?.value || this.tempo));
      this.setReady(weeks.length > 0);
    }

    bindEvents() {
      this.playButton?.addEventListener('click', async () => {
        if (this.isPlaying) {
          this.stop();
          return;
        }

        try {
          await this.start();
          const status = this.component.querySelector('.github-heatmap-status');
          status?.classList.remove('is-visible');
        } catch (error) {
          renderError(this.component, error instanceof Error ? error : new Error('Audio playback failed.'));
        }
      });

      this.tempoInput?.addEventListener('input', (event) => {
        const nextTempo = Number(event.currentTarget.value);
        this.setTempo(nextTempo);
      });

      this.trackButtons.forEach((button) => {
        button.addEventListener('click', () => {
          const row = Number(button.dataset.row);
          if (this.mutedRows.has(row)) {
            this.mutedRows.delete(row);
            button.setAttribute('aria-pressed', 'true');
          } else {
            this.mutedRows.add(row);
            button.setAttribute('aria-pressed', 'false');
          }
        });
      });
    }

    setReady(isReady) {
      const sonifyPanel = this.component.querySelector('.github-heatmap-sonify');
      if (sonifyPanel) {
        sonifyPanel.dataset.ready = String(isReady);
      }
      if (this.playButton) {
        this.playButton.disabled = !isReady;
      }
    }

    setTempo(nextTempo) {
      this.tempo = Number.isFinite(nextTempo) ? nextTempo : 120;
      if (this.tempoValue) {
        this.tempoValue.textContent = `${this.tempo} BPM`;
      }

      if (this.isPlaying) {
        this.restartLoop();
      }
    }

    async start() {
      if (!this.weeks.length) {
        return;
      }

      this.ensureAudioGraph();
      await this.audioContext.resume();

      this.isPlaying = true;
      if (this.playButton) {
        this.playButton.textContent = 'Pause';
        this.playButton.dataset.playing = 'true';
      }

      this.tick();
      this.restartLoop();
    }

    stop() {
      this.isPlaying = false;
      if (this.timerId) {
        window.clearInterval(this.timerId);
        this.timerId = null;
      }

      if (this.playButton) {
        this.playButton.textContent = 'Play';
        this.playButton.dataset.playing = 'false';
      }

      this.highlightWeek(null);
    }

    restartLoop() {
      if (this.timerId) {
        window.clearInterval(this.timerId);
        this.timerId = null;
      }

      if (!this.isPlaying) {
        return;
      }

      const intervalMs = Math.max(120, (60 / this.tempo) * 1000);
      this.timerId = window.setInterval(() => this.tick(), intervalMs);
    }

    tick() {
      this.currentStep = (this.currentStep + 1) % this.weeks.length;
      this.highlightWeek(this.currentStep);
      const week = this.weeks[this.currentStep];
      if (!week) {
        return;
      }

      const now = this.audioContext.currentTime;
      week.forEach((day, row) => {
        if (!day || day.level <= 0 || this.mutedRows.has(row)) {
          return;
        }

        const voice = ROW_VOICES[row] || ROW_VOICES[2];
        this.triggerVoice(voice, day, row, this.currentStep, now);
      });
    }

    highlightWeek(weekIndex) {
      this.component.querySelectorAll('.github-heatmap-cell.is-playing').forEach((cell) => {
        cell.classList.remove('is-playing');
      });

      if (weekIndex === null) {
        return;
      }

      this.component.querySelectorAll(`.github-heatmap-cell[data-week="${weekIndex}"]`).forEach((cell) => {
        cell.classList.add('is-playing');
      });
    }

    ensureAudioGraph() {
      if (this.audioContext) {
        return;
      }

      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) {
        throw new Error('Web Audio is not supported in this browser.');
      }

      this.audioContext = new AudioCtor();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.45;

      const compressor = this.audioContext.createDynamicsCompressor();
      compressor.threshold.value = -20;
      compressor.knee.value = 12;
      compressor.ratio.value = 8;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.2;

      this.masterGain.connect(compressor);
      compressor.connect(this.audioContext.destination);
      this.noiseBuffer = this.createNoiseBuffer();
    }

    createNoiseBuffer() {
      const frameCount = this.audioContext.sampleRate;
      const buffer = this.audioContext.createBuffer(1, frameCount, this.audioContext.sampleRate);
      const channel = buffer.getChannelData(0);

      for (let index = 0; index < frameCount; index += 1) {
        channel[index] = (Math.random() * 2) - 1;
      }

      return buffer;
    }

    triggerVoice(voice, day, row, step, time) {
      const intensity = Math.max(0.18, day.level / 4);
      switch (voice.instrument) {
        case 'kick':
          this.playKick(intensity, time);
          break;
        case 'bass':
          this.playBass(this.noteFrequency(day, step, voice.octaveShift), intensity, time);
          break;
        case 'pad':
          this.playPad(this.noteFrequency(day, step + row, voice.octaveShift), intensity, time);
          break;
        case 'hatlead':
          this.playHat(intensity, time);
          this.playLead(this.noteFrequency(day, step + (row * 2), voice.octaveShift), intensity, time + 0.02);
          break;
        default:
          this.playPad(this.noteFrequency(day, step, 0), intensity, time);
      }
    }

    noteFrequency(day, step, octaveShift) {
      const scaleIndex = (step + day.level + day.count) % SONIFY_SCALE.length;
      return SONIFY_SCALE[scaleIndex] * Math.pow(2, octaveShift);
    }

    playKick(intensity, time) {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(140, time);
      oscillator.frequency.exponentialRampToValueAtTime(42, time + 0.16);

      gainNode.gain.setValueAtTime(0.001, time);
      gainNode.gain.exponentialRampToValueAtTime(0.9 * intensity, time + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);
      oscillator.start(time);
      oscillator.stop(time + 0.2);
    }

    playBass(frequency, intensity, time) {
      const oscillator = this.audioContext.createOscillator();
      const filter = this.audioContext.createBiquadFilter();
      const gainNode = this.audioContext.createGain();

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, time);
      filter.Q.value = 1.2;

      gainNode.gain.setValueAtTime(0.001, time);
      gainNode.gain.linearRampToValueAtTime(0.28 * intensity, time + 0.02);
      gainNode.gain.linearRampToValueAtTime(0.14 * intensity, time + 0.18);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.42);

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      oscillator.start(time);
      oscillator.stop(time + 0.46);
    }

    playPad(frequency, intensity, time) {
      const gainNode = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      const oscillatorA = this.audioContext.createOscillator();
      const oscillatorB = this.audioContext.createOscillator();

      oscillatorA.type = 'sine';
      oscillatorB.type = 'sawtooth';
      oscillatorA.frequency.setValueAtTime(frequency, time);
      oscillatorB.frequency.setValueAtTime(frequency * 1.005, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200 + (intensity * 500), time);
      filter.Q.value = 0.7;

      gainNode.gain.setValueAtTime(0.001, time);
      gainNode.gain.linearRampToValueAtTime(0.12 * intensity, time + 0.08);
      gainNode.gain.linearRampToValueAtTime(0.07 * intensity, time + 0.28);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.72);

      oscillatorA.connect(filter);
      oscillatorB.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.masterGain);

      oscillatorA.start(time);
      oscillatorB.start(time);
      oscillatorA.stop(time + 0.76);
      oscillatorB.stop(time + 0.76);
    }

    playHat(intensity, time) {
      const source = this.audioContext.createBufferSource();
      const filter = this.audioContext.createBiquadFilter();
      const gainNode = this.audioContext.createGain();

      source.buffer = this.noiseBuffer;
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(6000, time);
      gainNode.gain.setValueAtTime(0.001, time);
      gainNode.gain.exponentialRampToValueAtTime(0.16 * intensity, time + 0.004);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.07);

      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      source.start(time);
      source.stop(time + 0.08);
    }

    playLead(frequency, intensity, time) {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(frequency * 2, time);
      gainNode.gain.setValueAtTime(0.001, time);
      gainNode.gain.linearRampToValueAtTime(0.1 * intensity, time + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);
      oscillator.start(time);
      oscillator.stop(time + 0.24);
    }
  }

  function fetchMetrics(url) {
    if (!SOURCE_CACHE.has(url)) {
      SOURCE_CACHE.set(
        url,
        fetch(url, { headers: { Accept: 'application/json' } }).then((response) => {
          if (!response.ok) {
            throw new Error(`Request failed with ${response.status}`);
          }
          return response.json();
        })
      );
    }

    return SOURCE_CACHE.get(url);
  }

  function toIsoDate(value) {
    if (typeof value !== 'string' || value.length === 0) {
      return null;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString().slice(0, 10);
  }

  function normalizeDayFromSimplePayload(day) {
    const levelName = typeof day?.level === 'string' ? day.level.toUpperCase() : 'NONE';
    const color = (typeof day?.color === 'string' ? day.color : null)?.toLowerCase();
    const resolvedLevel = LEVEL_BY_NAME.get(levelName)
      ?? LEVEL_BY_COLOR.get(color)
      ?? 0;
    const count = typeof day?.count === 'number'
      ? day.count
      : APPROXIMATE_COUNT_BY_LEVEL[resolvedLevel];
    const isoDate = toIsoDate(day?.date);

    return {
      date: isoDate,
      count,
      exactCount: typeof day?.count === 'number',
      color: color || GITHUB_PALETTE[resolvedLevel],
      level: resolvedLevel,
      weekday: typeof day?.weekday === 'number' ? day.weekday : null,
    };
  }

  function parseContributionData(metrics) {
    const directDays = metrics?.days;
    if (Array.isArray(directDays)) {
      const normalizedDays = directDays.map(normalizeDayFromSimplePayload).filter((day) => day.date);
      const endDate = toIsoDate(metrics?.to) || normalizedDays.at(-1)?.date || null;

      return {
        days: normalizedDays,
        endDate,
        totalContributions: typeof metrics?.totalContributions === 'number' ? metrics.totalContributions : null,
      };
    }

    const weeks = metrics?.user?.calendar?.contributionCalendar?.weeks;
    if (!Array.isArray(weeks)) {
      return {
        days: [],
        endDate: null,
        totalContributions: null,
      };
    }

    const normalizedDays = weeks.flatMap((week) =>
      (week?.contributionDays || []).map((day) => {
        const color = (day?.color || GITHUB_PALETTE[0]).toLowerCase();
        const level = LEVEL_BY_COLOR.get(color) ?? 0;
        const count = typeof day?.contributionCount === 'number'
          ? day.contributionCount
          : APPROXIMATE_COUNT_BY_LEVEL[level];

        return {
          date: day?.date || null,
          count,
          exactCount: typeof day?.contributionCount === 'number',
          color,
          level,
        };
      })
    );

    return {
      days: normalizedDays,
      endDate: normalizedDays.at(-1)?.date || null,
      totalContributions: null,
    };
  }

  function buildCalendar(daysToShow, sourceDays, endDateValue) {
    const endDate = endDateValue ? new Date(`${endDateValue}T00:00:00Z`) : new Date();
    const endUtc = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));
    const endWeekday = endUtc.getUTCDay();
    const startDate = new Date(endUtc);
    startDate.setUTCDate(startDate.getUTCDate() - (daysToShow - 1));

    const sourceByDate = new Map(sourceDays.filter((day) => day.date).map((day) => [day.date, day]));
    const fallbackDays = sourceDays.filter((day) => !day.date);
    let fallbackIndex = Math.max(0, fallbackDays.length - daysToShow);

    return Array.from({ length: daysToShow }, (_, index) => {
      const currentDate = new Date(startDate);
      currentDate.setUTCDate(startDate.getUTCDate() + index);
      const isoDate = currentDate.toISOString().slice(0, 10);
      const matched = sourceByDate.get(isoDate) || fallbackDays[fallbackIndex++] || null;
      const level = matched?.level ?? 0;
      const count = matched?.count ?? 0;
      const exactCount = Boolean(matched?.exactCount && matched?.date === isoDate);
      const daysFromEnd = daysToShow - 1 - index;
      const weekday = matched?.weekday ?? currentDate.getUTCDay();

      return {
        date: isoDate,
        weekday,
        weekIndex: 52 - Math.ceil(Math.max(0, daysFromEnd - endWeekday) / 7),
        level,
        color: matched?.color || GITHUB_PALETTE[level],
        count,
        exactCount,
        inferred: !exactCount,
      };
    });
  }

  function renderMonthLabels(container, days) {
    container.innerHTML = '';
    const seenMonths = new Set();
    const firstOfWeek = new Map();

    days.forEach((day) => {
      const date = new Date(`${day.date}T00:00:00Z`);
      const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
      if (date.getUTCDate() <= 7 && !seenMonths.has(key)) {
        seenMonths.add(key);
        firstOfWeek.set(day.weekIndex, MONTH_FORMATTER.format(date));
      }
    });

    const totalWeeks = Math.max(...days.map((day) => day.weekIndex), 0) + 1;

    for (let week = 0; week < totalWeeks; week += 1) {
      const label = document.createElement('span');
      label.textContent = firstOfWeek.get(week) || '';
      label.style.gridColumn = `${week + 1}`;
      container.appendChild(label);
    }
  }

  function tooltipText(day) {
    const dateLabel = DATE_FORMATTER.format(new Date(`${day.date}T00:00:00Z`));
    if (day.exactCount) {
      const noun = day.count === 1 ? 'contribution' : 'contributions';
      return `${dateLabel}: ${day.count} ${noun}`;
    }

    if (day.count === 0) {
      return `${dateLabel}: no public contributions recorded`;
    }

    const noun = day.count === 1 ? 'contribution' : 'contributions';
    return `${dateLabel}: ~${day.count} ${noun} (inferred from palette level)`;
  }

  function positionTooltip(tooltip, point, host) {
    const hostRect = host.getBoundingClientRect();
    const x = point.x - hostRect.left;
    const y = point.y - hostRect.top;

    tooltip.style.left = `${Math.min(Math.max(x + 14, 16), hostRect.width - 16)}px`;
    tooltip.style.top = `${Math.max(y - 18, 12)}px`;
  }

  function renderCells(component, days, sourceDayCount, totalContributions) {
    const grid = component.querySelector('.github-heatmap-grid');
    const status = component.querySelector('.github-heatmap-status');
    const tooltip = component.querySelector('.github-heatmap-tooltip');
    const months = component.querySelector('.github-heatmap-months');

    status.classList.remove('is-visible');
    grid.innerHTML = '';
    renderMonthLabels(months, days);

    days.forEach((day) => {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'github-heatmap-cell';
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', tooltipText(day));
      cell.dataset.date = day.date;
      cell.dataset.count = String(day.count);
      cell.dataset.level = String(day.level);
      cell.dataset.inferred = String(day.inferred);
      cell.dataset.week = String(day.weekIndex);
      cell.style.gridColumn = `${day.weekIndex + 1}`;
      cell.style.gridRow = `${day.weekday + 1}`;
      cell.style.backgroundColor = day.color;

      const showTooltip = (point) => {
        tooltip.hidden = false;
        tooltip.textContent = tooltipText(day);
        positionTooltip(tooltip, point, component);
      };

      cell.addEventListener('mouseenter', (event) => {
        showTooltip({ x: event.clientX, y: event.clientY });
      });
      cell.addEventListener('focus', () => {
        const rect = cell.getBoundingClientRect();
        showTooltip({ x: rect.left + rect.width / 2, y: rect.top });
      });
      cell.addEventListener('mousemove', (event) => positionTooltip(tooltip, { x: event.clientX, y: event.clientY }, component));
      cell.addEventListener('mouseleave', () => {
        tooltip.hidden = true;
      });
      cell.addEventListener('blur', () => {
        tooltip.hidden = true;
      });

      grid.appendChild(cell);
    });

    const inferredMessage = sourceDayCount < days.length
      ? ' The current contribution payload exposes fewer than 365 dated entries, so older cells are padded and color-only entries are shown as estimated contribution bands.'
      : ' Hover a square to inspect the exact date and contribution count.';

    const totalMessage = typeof totalContributions === 'number'
      ? `${totalContributions.toLocaleString('en-US')} contributions in this window.`
      : `Showing the last ${days.length} days of GitHub activity.`;

    status.textContent = `${totalMessage}${inferredMessage}`;
  }

  function buildWeeks(days) {
    const totalWeeks = Math.max(...days.map((day) => day.weekIndex), 0) + 1;
    const weeks = Array.from({ length: totalWeeks }, () => Array.from({ length: 7 }, () => null));

    days.forEach((day) => {
      if (!weeks[day.weekIndex]) {
        return;
      }
      weeks[day.weekIndex][day.weekday] = day;
    });

    return weeks;
  }

  function renderError(component, error) {
    const status = component.querySelector('.github-heatmap-status');
    status.classList.add('is-visible');
    status.textContent = `Unable to load GitHub activity right now. ${error.message}`;
  }

  async function initialiseHeatmap(component) {
    const source = component.dataset.source;
    const daysToShow = Number.parseInt(component.dataset.days || '365', 10);

    try {
      const metrics = await fetchMetrics(source);
      const { days: sourceDays, endDate, totalContributions } = parseContributionData(metrics);
      const days = buildCalendar(daysToShow, sourceDays, endDate);
      renderCells(component, days, sourceDays.length, totalContributions);
      component.sonifier = new HeatmapSonifier(component, buildWeeks(days));
    } catch (error) {
      renderError(component, error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  function boot() {
    document.querySelectorAll('.js-github-heatmap').forEach((component) => {
      if (component.dataset.initialised === 'true') {
        return;
      }
      component.dataset.initialised = 'true';
      initialiseHeatmap(component);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
