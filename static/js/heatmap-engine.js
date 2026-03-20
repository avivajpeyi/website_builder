(() => {
  const SOURCE_CACHE = new Map();
  const GITHUB_PALETTE = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
  const LEVEL_BY_COLOR = new Map(GITHUB_PALETTE.map((color, index) => [color.toLowerCase(), index]));
  const APPROXIMATE_COUNT_BY_LEVEL = [0, 1, 4, 8, 12];
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

  function parseContributionDays(metrics) {
    const weeks = metrics?.user?.calendar?.contributionCalendar?.weeks;
    if (!Array.isArray(weeks)) {
      return [];
    }

    return weeks.flatMap((week) =>
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
  }

  function buildCalendar(daysToShow, sourceDays) {
    const today = new Date();
    const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const startDate = new Date(todayUtc);
    startDate.setUTCDate(startDate.getUTCDate() - (daysToShow - 1));

    const sourceByDate = new Map(sourceDays.filter((day) => day.date).map((day) => [day.date, day]));
    const fallbackDays = sourceDays.filter((day) => !day.date);
    let fallbackIndex = Math.max(0, fallbackDays.length - daysToShow);

    return Array.from({ length: daysToShow }, (_, index) => {
      const currentDate = new Date(startDate);
      currentDate.setUTCDate(startDate.getUTCDate() + index);
      const isoDate = currentDate.toISOString().slice(0, 10);
      const weekday = currentDate.getUTCDay();
      const matched = sourceByDate.get(isoDate) || fallbackDays[fallbackIndex++] || null;
      const level = matched?.level ?? 0;
      const count = matched?.count ?? 0;
      const exactCount = Boolean(matched?.exactCount && matched?.date === isoDate);

      return {
        date: isoDate,
        weekday,
        weekIndex: Math.floor(index / 7),
        level,
        color: GITHUB_PALETTE[level],
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

  function renderCells(component, days, sourceDayCount) {
    const grid = component.querySelector('.github-heatmap-grid');
    const status = component.querySelector('.github-heatmap-status');
    const tooltip = component.querySelector('.github-heatmap-tooltip');
    const months = component.querySelector('.github-heatmap-months');

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
      ? ' The current metrics.json payload exposes fewer than 365 dated entries, so older cells are padded and color-only entries are shown as estimated contribution bands.'
      : ' Hover a square to inspect the exact date and contribution count.';

    status.textContent = `Showing the last ${days.length} days of GitHub activity.${inferredMessage}`;
  }

  function renderError(component, error) {
    const status = component.querySelector('.github-heatmap-status');
    status.textContent = `Unable to load GitHub activity right now. ${error.message}`;
  }

  async function initialiseHeatmap(component) {
    const source = component.dataset.source;
    const daysToShow = Number.parseInt(component.dataset.days || '365', 10);

    try {
      const metrics = await fetchMetrics(source);
      const sourceDays = parseContributionDays(metrics);
      const days = buildCalendar(daysToShow, sourceDays);
      renderCells(component, days, sourceDays.length);
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
