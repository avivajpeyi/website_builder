#!/bin/bash
#SBATCH --job-name=0_GW150914_run_a
#SBATCH --nodes=16
#SBATCH --ntasks-per-node=14
#SBATCH --time=24:00:00
#SBATCH --output=outdir/log_data_analysis/0_GW150914_run_a.log
#SBATCH --partition=sstar
#SBATCH --dependency=singleton

source ~/.bash_profile
conda activate parallel_bilby

export MKL_NUM_THREADS="1"
export MKL_DYNAMIC="FALSE"
export OMP_NUM_THREADS=1
export MPI_PER_NODE=14

mpirun echo "Hello, World!"  $SLURM_PROCID
