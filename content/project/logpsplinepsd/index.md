---
title: 'LogPSplinePSD: from a statistical method to a usable API'
summary: Bayesian noise-spectrum estimation with Python, JAX and NumPyro, with examples and tests.
toc: true
---

Noise is part of the model in time-series inference. A useful analysis needs to estimate how noise varies with frequency, how channels are correlated, and how uncertain those estimates are.

[LogPSplinePSD](https://github.com/nz-gravity/LogPSplinePSD/) implements Bayesian log-P-spline models for this problem. It supports univariate spectra and multivariate spectral matrices using JAX and NumPyro, and provides posterior summaries and diagnostic plots.

## My contribution

I contribute software to this collaborative research project, building on statistical work by the research team and earlier P-spline methods.

- **Clearer API naming:** I revised the fitting module and configuration names around the public `fit()` interface, updating examples and tests together. [API change](https://github.com/nz-gravity/LogPSplinePSD/commit/b89008d8a327ca73029991d248860c76be905736).
- **Inference and controls:** I added scalar variational inference, sampler controls, and tests for stationary and time-varying power models. [Implementation and tests](https://github.com/nz-gravity/LogPSplinePSD/commit/0e5c087fef211a7a89765b77220c651e83bb5f8e).
- **Outputs and examples:** the same contribution updates `PSDResult` handling and adds worked multivariate and time-varying notebooks, so users can follow inputs through to posterior results. [Code and notebooks](https://github.com/nz-gravity/LogPSplinePSD/commit/0e5c087fef211a7a89765b77220c651e83bb5f8e).

## How the software fits together

Time-series data → spectral preprocessing → spline model → Bayesian inference → posterior spectra and diagnostics.

The interface separates configuration from execution. Results include posterior spectra and ArviZ-compatible `xarray.DataTree` outputs. The repository keeps reusable models and inference code separate from application-specific research studies.

This is the engineering thread I enjoy: translating a statistical method into a coherent interface, checking its behaviour, and documenting a path that another researcher can follow.

## Evidence and limits

The repository contains tests for variational inference, sampler controls and time-varying power fits, alongside example notebooks. Those are inspectable implementation and validation artifacts; they do not establish performance for every dataset.

The package supports scalar time-varying fits. **Multivariate time-varying inference is not yet implemented**, as recorded in the [project scope](https://github.com/nz-gravity/LogPSplinePSD/#architecture).

There is no single comparable benchmark or verified adoption measure attached to this case study. Runtime, accuracy and usage metrics need a defined dataset, hardware, baseline and measurement before they can support a quantitative claim.

[Browse the source and examples](https://github.com/nz-gravity/LogPSplinePSD/) · [Back to software & projects](/software/)
