---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Installing LalSuite from Source"
subtitle: ""
summary: "Source installing LalSuite can be tough. Here are instructions that have worked for me."
authors: []
tags: []
categories: []
date: 2019-09-19T00:20:45+10:00
lastmod: 2019-09-19T00:20:45+10:00
featured: false
draft: false

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

## Steps
### Step 0: Requirements  
Module loads/things you might need:
```bash
module load git/2.18.0
module load git-lfs/2.4.0
module load anaconda3/5.1.0
module load gcc/6.4.0
module load openmpi/3.0.0
module load fftw/3.3.7
module load swig/3.0.12-python-3.6.4
module load framel/8.30
module load metaio/8.4.0
module load gsl/2.4
```
### Step 1: Install lal
```bash
git clone git@git.ligo.org:lscsoft/lalsuite.git
mkdir lal_install_dir
cd lalsuite/lal
./00boot && ./configure --prefix=/<path to>/lal_install_dir/ && make && make install
. <path to>/lal_install_dir/etc/lal-user-env.sh
```
### Step 2: Install lalsimulation
```bash
cd ../lalsimulation
./00boot && ./configure --prefix=/<path to>/lal_install_dir/ && make && make install
<path to>/lal_install_dir/etc/lalsimulation-user-env.sh
```
At this point, the installation _should(?)_ work. Test it out in python:
```bash
cd ~
python
>>> import lalsimulation
```

### Step 3: Get waveform data

```bash
cd ~/ & mkdir waveform_data
echo "export LAL_DATA_PATH=/<path_to_wave_data_dir>" >> .bash_profile
````
Copy the waveform data files and place them into this the `waveform_data/` dir

{{% callout warning %}}
Where do we get the waveform datafiles from again?
{{% /callout %}}

## Test installation steps with the following script

{{< gist avivajpeyi 030a544b097fcb4508055d73fa3fa895>}}
