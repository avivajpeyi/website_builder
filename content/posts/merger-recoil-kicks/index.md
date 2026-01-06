---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Merger Recoil Kicks"
subtitle: ""
summary: "Notes on recoil kicks from CBC"
authors: []
tags: []
categories: []
date: 2020-06-29T01:20:45+10:00
lastmod: 2020-06-29T01:20:45+10:00
featured: false
draft: true

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder.
# Focal points: Smart, Center, TopLeft, Top, TopRight, Left, Right, BottomLeft, Bottom, BottomRight.
image:
  caption: ""
  focal_point: ""
  preview_only: false

# Projects (optional).
#   Associate this post with one or more of your projects.
#   Simply enter your project's folder or file name without extension.
#   E.g. `projects = ["internal-project"]` references `content/project/deep-learning/index.md`.
#   Otherwise, set `projects = []`.
projects: []
---


# Recoil kick notes


S190521g's EM paper suggests v_kick ∼ 200 km/s [^1]

* non spinning BH max v_kick ~ 175 . 2 ± 11 km/s [^2] 

* precessing BH v_kick >> 1000 km/s [^3]

Systematic numerical relativity simulations provided a method to model the recoil of the final merged black hole as a function of the precursor binary, and to determine that the maximum recoil is about 5,000 km/s for maximally spinning, equal mass, holes in the hangup kick configuration. Aligned spins, on the other hand, can only reach a maximum of just above 500 km/s, in an antialigned configuration with mass ratio q ∼ 2/3. While nonspinning holes only contribute about one third of this value [^3]


0.7 is the spin you get when you merge two equal-mass, non-spinning BHs.  
The story is very different if you grow primarily through isotropically oriented extreme mass ratio mergers (see, e.g., [^4])

## From https://astrobites.org/2018/03/08/recoil-detectives-searching-for-black-hole-kicks-using-gravitational-waves/

### How big are these kicks and do they matter?
A natural question to ask is: how big are these kicks, and do they have astrophysical consequences? This precise question has been analysed in great detail using both numerical and analytic techniques. The punchline of these analyses is that the problem must be tackled relativistically, because the recoil is most significant where spacetime is strongly curved. General relativistic effects, such as gravitational redshift, have a tendency to reduce the recoil the kick velocity, in comparison with Newtonian estimates. Gonzalez and coauthors predicted the maximum kick from non-spinning black hole mergers to be ∼ 170 km/s [^2]. They accomplished this using full numerical simulations, and their result is consistent with analytic estimates (for example, the estimate calculated by Sopuerta, Yunes and Laguna, which builds on an earlier estimate by Favata, Hughes and Holz depicted in Figure 3).


Nonetheless, the size of the recoil is still likely to be of astrophysical significance. Although non-spinning black holes are likely to only experience kick velocities of order 170 km/s, rapidly rotating black holes can produce far larger recoil velocities if the progenitor black holes are spinning in nearly opposite directions before the merger. These types of kicks are called spin kicks or superkicks and can be as large as 5000 km/s. The history of superkicks is outlined in this bite. The escape velocity for a globular cluster is typically ~30 km/s while a galaxy escape velocity is typically ~1000km/s, so we can see that kicks of this size could have substantial astrophysical repercussions. Black hole ejection from globular clusters appears very likely and even the ejection of supermassive black holes from their host galaxies is possible through the mechanism of superkicks.


Electromagnetic evidence for black hole kicks
The implications of black hole kicks for galaxy dynamics is striking: even if the superkick does not entirely eject the black hole from its host galaxy (as shown in Figure 4), it would at the very least displace the black hole from the centre of the galaxy, altering galaxy core dynamics for around 10 Myrs. Surely an event of this scale would be observable electromagnetically? Indeed, a number of candidate galaxies experiencing post-merger black hole recoil have been proposed (for example, see here and here) based on characteristic electromagnetic signatures they display. However, the precise nature of the electromagnetic observations is still up for debate and by no means conclusive; it is challenging to disprove alternative interpretations.


Figure 4: Schematic of a supermassive black hole being ejected from a galaxy due to gravitational wave emission. Image from http://www.deepstuff.org/gravitational-wave-kicks-monster-black-hole-galactic-core/

Direct observation of black hole kicks using gravitational waves
After observing the gravitational waves produced by a black hole merger, it is in principle possible to indirectly infer the size of the kick that the remnant received. However, this type of indirect approach relies heavily on the accuracy of our modelling techniques. As proposed in today’s paper, a far more powerful approach is to use the gravitational wave signal to directly observe black hole kicks.

The recoil of the centre-of-mass of the system leaves a clear imprint on the gravitational wave frequency. The gravitational wave signal is Doppler shifted by the kick velocity – if the centre-of-mass is kicked towards (away from) the Earth, the gravitational waveform will be blueshifted (redshifted). Crucially, the frequency shift is not homogeneous across the entire signal: rather it is largest during the last few orbits and merger phase. This is illustrated in Figure 5: as the kick accumulates in the later stages of the inspiral and merger, the Doppler shift becomes increasingly prominent.

## References

[^1]: [S190521g EM paper](https://arxiv.org/abs/2006.14122)

[^2]: [Total recoil: the maximum kick from nonspinning black-hole binary inspiral](https://arxiv.org/abs/gr-qc/0610154)

[^3]: [Kicking gravitational wave detectors with recoiling black holes](https://arxiv.org/abs/1908.04382)

[^4]: [Spin distribution following minor mergers and the effect of spin on the detection range for low-mass-ratio inspirals](https://arxiv.org/abs/0707.0711)

[^5]: [Black hole kicks as new gravitational wave observables](https://arxiv.org/abs/1606.04226)

[^6]: [How black holes get their kicks: Radiation recoil in binary black hole mergers](https://arxiv.org/pdf/astro-ph/0408492v1.pdf)
