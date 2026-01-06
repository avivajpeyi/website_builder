---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Avi's Pbilby Setup Notes"
subtitle: ""
summary: "Some pbilby setup notes for myself"
authors: []
tags: []
categories: []
date: 2022-06-29T00:20:45+10:00
lastmod: 2022-06-29T00:20:45+10:00
featured: false
draft: false
show_breadcrumb: true
type: book
---

{{% toc %}}


##  Do you really need `pBilby` for your analysis?

For most analysis, `bilby_pipe` may be sufficient (and better suited!):
* `bilby_pipe` has can easily download propritary LVK data.
* `bilby_pipe` is well configured to run many jobs in parallel.
*  Cluster-wait times for a `pbilby` job can be longer than the time it takes to run `bilby_pipe`.

`pBilby` should only be used if you want to run an expensive job (e.g. lots of live points, or expensive waveform model).


## Setting up pbilby on Ozstar


### Making a `venv` for analysis 
Before installing `pBilby`, lets set up some virtual python environments.

```bash
<ssh into ozstar>
module --force purge
module load git/2.18.0 git-lfs/2.4.0 gcc/9.2.0 openmpi/4.0.2 numpy/1.19.2-python-3.8.5 mpi4py/3.0.3-python-3.8.5 && module unload zlib
python -m venv pbilby_venv
source pbilby_venv/bin/activate
```

{{% callout note %}}
**Choosing a dir for your venv**

Your `venv` will be faster to boot-up if you make it in your `/home/` directory, rather than in `/fred/` (as the latter is on a network drive).
However, `/home/` has a very small amount of storage space.
{{% /callout %}}  


You will need to load the same modules every time you want to use the `pbilby_venv` environment. I recommend adding the following to your `.bashrc` file:

```bash
alias ligo_loads='module --force purge && module load git/2.18.0 git-lfs/2.4.0 gcc/9.2.0 openmpi/4.0.2 numpy/1.19.2-python-3.8.5 mpi4py/3.0.3-python-3.8.5 && module unload zlib && source /fred/oz980/avajpeyi/envs/pbilby_venv/bin/activate'
```
Then, anytime you `ssh` onto Ozstar, you can just type `ligo_loads` to load the modules and activate the `pbilby_venv` environment.


#### Alternative partitions



If you want to use partitions other `skylake`, eg `sstar/gstar`, you'll need to `ssh sstar`/`ssh gstar` and make a new `venv` for each partiton you want to run on.
```bash
<ssh into ozstar>
ssh sstar
<same steps as above>
```
A new `venv` is needed is as each partition has custom architecture and cant use builds from other architectures.


#### Why not use `conda`?

`conda` has a large overhead compared to `venv` (e.g. `conda` takes 10s to load, while `venv` takes 1s).
![https://git.ligo.org/lscsoft/parallel_bilby/uploads/d1c1d8c6357153fdf84cd8d28873cbe1/Screen_Shot_2020-09-16_at_11.18.29_am.png](https://git.ligo.org/lscsoft/parallel_bilby/uploads/d1c1d8c6357153fdf84cd8d28873cbe1/Screen_Shot_2020-09-16_at_11.18.29_am.png)
The above `import parallel_bilby` took several minutes on `Ozstar` using `conda`!




### Installing `pBilby`

Now, we can install `pBilby` (note `sstar/gstar` dont have access to the internet, so you'll need to install `pBilby` when on `farnarkle`):

```bash 
pip install parallel_bilby
```

If you're not doing a  vanilla analysis, I would suggest the following method to install pbilby:
```bash
git clone git@git.ligo.org:lscsoft/parallel_bilby.git
cd parallel_bilby
python setup.py develop 
```

`develop` mode is useful as it allows you to edit the source code and have the changes take effect immediately. This is useful if you want to make changes to `pBilby`.



### Local
In addition to `Ozstar`, I would suggest installing `pBilby` on your local machine to help with debugging/making sure your analysis can actually start running.


## Configuring your `ini` file
The `pBilby` ini is very similar to the `bilby_pipe` ini, but with a few extra options. Here is an example ini for GW150914 analysis:
{{<gist avivajpeyi 22bc160785976a906613d3caaa4622c4>}}

You can remove the custom `pBilby` options and run the analysis with `bilby_pipe` to see if it works. 
Note that you will need to manually get the data and PSD files for the analysis to work. 

#### Data:
Here is a helper script to get the data:
{{<gist avivajpeyi b2691d830103b2218657e3f2fcdbf52d>}}

The easiest way I find to get data is 
1. On CIT: `ligo-proxy-init avi.vajpeyi && kinit`
2. Run above `py` srcipt 
3. `scp` data `CIT-->Ozstar`

#### PSD:
You can get PSDs from the [LSC PSD database](https://dcc-lho.ligo.org/LIGO-P1900011/public).
Note that the PSDs have to be formatted in the same way as those for `bilby_pipe` jobs.
For GW150914 you can get away with downloading it from the [`pBilby` examples](https://git.ligo.org/lscsoft/parallel_bilby/-/tree/master/examples/GW150914_IMRPhenomPv2/psd_data)


## Submitting jobs 


### Job setup step
Once you have your `ini` and data/PSD files, you can submit a job to `Ozstar` using the following command:
```bash
parallel_bilby_generate <ini>
```

This should generate a folder called `outdir` (or whatever you specified in the `ini` file) with a bunch of files in it.
E.g. this is what my `dir` looks like:
```tree
outdir_GW150914
├── data
│   ├── GW150914_data_dump.pickle
│   ├── GW150914_prior.json
│   ├── H1_full_frequency_domain_data.png
│   └── L1_full_frequency_domain_data.png
├── GW150914_config_complete.ini
├── log_data_analysis
├── log_data_generation
├── result
└── submit
    ├── analysis_GW150914_0.sh
    └── bash_GW150914.sh
```

The `submit` folder contains the scripts that will be submitted to the `slurm` queue. 

To test if the job will run, you can try running the `analysis_GW150914_0.sh` script locally. First, identify the execution command in the script. It should look something like this:
```bash
mpirun parallel_bilby_analysis <...data_dump.pickle> ....
````

To run this locally, copy the above line, and run it like so:
```bash
mpirun -n 2 parallel_bilby_analysis <...data_dump.pickle> ....
```

This asks `mpi` to run the `parallel_bilby_analysis` script with 2 cores on the headnode. If this reaches the sampling stage ie if you see something like:
```log
#:10|eff(%):4.744|logl*:-inf<11.8<inf|logz:7.1+/-0.1|dlogz:302.0>0.1
```
then you know that the job is configured correctly and will run on `Ozstar`! Woohoo! 

Now you can submit it on `Ozstar`.

### Starting jobs immediately: 

Before submitting your job on `OzStar`, run the following:
```bash
$ showbf
skylake
   2 nodes (32 core) free (64 cores total) for 9:01:49 to     Inf
   1 slot  for 28-core jobs free (28 cores total) for 23:59:59
   1 slot  for 26-core jobs free (26 cores total) for 41:00:46
   2 slots for 20-core jobs free (40 cores total)
   1 slot  for 18-core jobs free (18 cores total)
   1 slot  for 17-core jobs free (17 cores total) (low memory jobs only)
   3 slots for 16-core jobs free (48 cores total) for 9:01:49 to     Inf
   1 slot  for 12-core jobs free (12 cores total)
   1 slot  for 10-core jobs free (10 cores total) for 11:30:53
   2 slots for 8-core jobs free (16 cores total)
   1 slot  for 6-core jobs free (6 cores total)
   1 slot  for 2-core jobs free (2 cores total)
   2 slots for 1-core jobs free (2 cores total) for 11:30:53 to 44:11:07
sstar
   1 node  (32 core) free (32 cores total)
  47 nodes (16 core) free (752 cores total) for 48:14:50
   1 slot  for 14-core jobs free (14 cores total) for 48:14:50
gstar
knl
```
This shows you the current state of the `Ozstar` queue. If you see a lot of free slots, you may be able to submit your job immediatly!
(BTW Conrad Chan made this [nifty webtool with the same data](https://supercomputing.swin.edu.au/monitor/).)

Notice that `sstar` has `47` nodes with `16` cores each free for 48Hrs. 
This means that you can submit a job with `752` cores (if you request the runtime to be less than 48Hrs).

To do this, edit the `analysis_GW150914_0.sh` script and change the following: 
```bash
#SBATCH --time=48:00:00
#SBATCH --nodes=47
#SBATCH --ntasks-per-node=16
```

Then submit the job using 
```bash
bash outdir_GW150914/submit/bash_GW150914.sh
```
OR
```bash
sbatch outdir_GW150914/submit/bash_GW150914.sh
```


### Starting jobs with lots of cores:
If you're unlucky and see that there really arnt that many cores free, you can 
1. Submit a job with less cores
2. Look at the `Ozstar` queue to figure out which nodes will be free in the near future
3. Submit a job with more cores on those nodes

`#SBATCH --dependency=singleton` is a useful flag to use when submitting jobs. This tells `slurm` to wait for the job to finish before submitting the next one.

## Monitoring jobs

### Checking the queue
To check the status of your job, run:
```bash
scontrol show job <job_id> 
```

To check the status of all your jobs and display how long they have been running:
```bash
watch -n 1 squeue --me -o \'%.4C %.2t %.7M %j\'
```


### Checking the job output

To check the output of your job, run:
```bash
tail -f outdir_*/log_data_*/analysis_*.log
```

On completing a job, the dir will look something like this:


```tree
outdir_GW150914
├── data
│   ├── GW150914_data_dump.pickle
│   ├── GW150914_prior.json
│   ├── H1_full_frequency_domain_data.png
│   └── L1_full_frequency_domain_data.png
├── GW150914_config_complete.ini
├── log_data_analysis
│   └── 0_GW150914.log
├── log_data_generation
│   └── GW150914.log
├── result
│   ├── GW150914_0_checkpoint_resume.pickle
│   ├── GW150914_0_checkpoint_run.png
│   ├── GW150914_0_checkpoint_stats.png
│   ├── GW150914_0_checkpoint_trace.png
│   ├── GW150914_0_corner.png
│   ├── GW150914_0_result.json
│   └── GW150914_0_samples.dat
└── submit
    ├── analysis_GW150914_0.sh
    └── bash_full.sh
```

