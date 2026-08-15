#!/bin/bash
# Run the lidar_fe OpenROAD P&R on the Ubuntu VM.
#   bash ~/lidar_asic/pnr/run_pnr.sh
# Always writes pnr.done with the exit code so a watcher never hangs.
source ~/miniforge3/etc/profile.d/conda.sh
conda activate eda
cd ~/lidar_asic/pnr
echo "openroad: $(command -v openroad)"
openroad -no_init -exit lidar_pnr.tcl 2>&1 | tee pnr.log
echo "EXIT:${PIPESTATUS[0]}" > pnr.done
