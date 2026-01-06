"""Demo of Matched Filtering"""
from typing import Callable, Dict, Optional

import matplotlib.pyplot as plt
import numpy as np
import plotly.graph_objects as go
import scipy.signal
from plotly.subplots import make_subplots

N_POINTS = 1000
T_START = -2
T_END = -1 * T_START

FILT_COLOR = "blue"
DATA_COLOR = "orange"
SIGNAL_COLOR = "black"
NOISE_COLOR = "red"
MATCHED_FILTER_COLOR = "green"


def get_gaussian_pulse_signal(time: np.ndarray) -> np.ndarray:
  sig = scipy.signal.gausspulse(t=time, fc=5)
  sig[np.abs(sig) < 1e-2] = 0
  return sig


def get_square_pulse_signal(time: np.ndarray) -> np.ndarray:
  idx_to_one = np.abs(time) <= 0.5
  sig = np.array([1 if one else 0 for one in idx_to_one])
  return sig


def get_noise(time: np.ndarray, noise_factor: Optional[float] = 2) -> np.ndarray:
  noise = np.random.randn(1, len(time)) * noise_factor
  return noise[0]


def move_template_to_lowest_time(t: np.ndarray) -> np.ndarray:
  return np.concatenate((t[t != 0], t[t == 0]))


def generate_data(time: np.ndarray, signal_func: Callable,
                  noise_factor: Optional[float] = 2):
  sig = signal_func(time)
  noise = get_noise(time, noise_factor)
  data = sig + noise
  return sig, noise, data


def perform_matched_filter(
  time: np.ndarray,
  data: np.ndarray,
  template_func: Callable
) -> Dict:
  match_filter_values = []
  template = move_template_to_lowest_time(t=template_func(time))

  for i in range(0, len(data), 10):
    current_template = np.roll(template, shift=i)
    matched_filter = sum(data * current_template)
    match_filter_values.append(dict(
      matched_filter=matched_filter,
      time=time[i],
      template=current_template
    ))
  return match_filter_values


def plot_matched_filter_results(filename, time, true_signal, data, match_filter_values):
  fig = make_subplots(rows=2, cols=1, shared_xaxes=True, )
  fig.add_trace(
    go.Scatter(
      visible=True,
      line=dict(color=DATA_COLOR, width=2),
      name="Data",
      x=time,
      y=data,
    ),
    row=1, col=1
  )
  fig.add_trace(
    go.Scatter(
      visible=True,
      line=dict(color=SIGNAL_COLOR, width=3, dash="dash"),
      name="Signal",
      x=time,
      y=true_signal,
    ),
    row=1, col=1
  )
  fig.add_trace(
    go.Scatter(
      visible=True,
      line=dict(color=MATCHED_FILTER_COLOR, width=1, dash='dash'),
      name="Matched Filter",
      x=[mf['time'] for mf in match_filter_values],
      y=[mf['matched_filter'] for mf in match_filter_values],
      hoverinfo="none"
    ),
    row=2, col=1
  )
  init_traces = len(fig.data)

  # Add traces, one for each slider step
  for mf in match_filter_values:
    fig.add_trace(
      go.Scatter(
        visible=False,
        line=dict(color=FILT_COLOR, width=5),
        name="Template",
        x=time,
        y=mf["template"]
      ),
      row=1, col=1
    )
  for mf in match_filter_values:
    fig.add_trace(
      go.Scatter(
        visible=False,
        name="Current MF val",
        line=dict(color=MATCHED_FILTER_COLOR, width=7, dash="dot"),
        x=[mf['time']],
        y=[mf['matched_filter']],
        text=[f"{mf['matched_filter']:.2f}"],
        mode="markers+text",
        textposition="top center"
      ),
      row=2, col=1
    )

  # Create and add slider
  steps = []

  for i in range(init_traces, len(match_filter_values) + init_traces, 1):
    step = dict(
      method="update",
      args=[{"visible": [True] * init_traces + [False] * (len(fig.data) - init_traces)},
            {
              "title": f"Matched filter val: {match_filter_values[i - init_traces]['matched_filter']:.2f}"}],
    )
    step["args"][0]["visible"][i] = True
    step["args"][0]["visible"][len(match_filter_values) + i] = True
    steps.append(step)

  active_idx = 10
  fig.data[active_idx + init_traces].visible = True
  fig.data[active_idx + init_traces + len(match_filter_values)].visible = True
  sliders = [dict(
    active=active_idx,
    currentvalue={"prefix": "Template Position: "},
    pad={"t": 50},
    steps=steps
  )]

  fig.update_xaxes(range=[T_START, T_END])
  fig.update_xaxes(title_text="time", row=2, col=1)
  fig.update_yaxes(title_text="Matched Filter", row=2, col=1)
  fig.update_yaxes(title_text="y(t)", row=1, col=1)
  fig.update_layout(
    sliders=sliders,
    title=f"Matched-Filter Value: {match_filter_values[active_idx]['matched_filter']:.2f}",
    showlegend=False
  )

  fig.write_html(filename)


def plot_signal_noise_and_data(time: np.ndarray, sig: np.ndarray, noise: np.ndarray,
                               data: np.ndarray):
  fig = plt.figure()
  signal_ax = plt.subplot(311)
  signal_ax.plot(time, sig, color=SIGNAL_COLOR)
  signal_ax.set_xlim(T_START, T_END)
  signal_ax.set_title("Signal")
  signal_ax.set_ylabel("h(t)")
  noise_ax = plt.subplot(312, sharex=signal_ax)
  noise_ax.plot(time, noise, color=NOISE_COLOR)
  noise_ax.set_title(f"Noise (down-scaled for demonstration)")
  noise_ax.set_ylabel("n(t)")
  data_ax = plt.subplot(313, sharex=signal_ax)
  data_ax.plot(time, data, color=DATA_COLOR)
  data_ax.set_title("Data")
  data_ax.set_ylabel("s(t)")
  data_ax.set_xlabel("time")
  plt.tight_layout()
  fig.savefig("data.png")


def main():
  time = np.linspace(T_START, T_END, N_POINTS)
  sig, noise, data = generate_data(time, get_gaussian_pulse_signal, noise_factor=0.1)
  plot_signal_noise_and_data(time, sig, noise, data)

  sig, noise, data = generate_data(time, get_gaussian_pulse_signal, noise_factor=1)
  match_filter_values = perform_matched_filter(time, data, get_square_pulse_signal)
  plot_matched_filter_results("square.html", time, sig, data, match_filter_values)
  match_filter_values = perform_matched_filter(time, data, get_gaussian_pulse_signal)
  plot_matched_filter_results("gaussian_pulse.html", time, sig, data, match_filter_values)
  sig, noise, data = generate_data(time, get_square_pulse_signal, noise_factor=1)
  match_filter_values = perform_matched_filter(time, data, get_gaussian_pulse_signal)
  plot_matched_filter_results("gaussian_pulse_to_find_square.html", time, sig, data, match_filter_values)

if __name__ == "__main__":
  main()
