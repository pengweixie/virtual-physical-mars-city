#!/bin/bash
export LD_LIBRARY_PATH=~/openroad-new/opt/or-tools/lib:~/tclreadline-pkg/usr/lib/x86_64-linux-gnu:~/qt5-pkg/usr/lib/x86_64-linux-gnu
cd ~/lidar_asic/pnr
rm -f pnr_sram.done
echo "openroad: $(~/openroad-new/usr/bin/openroad -version 2>&1 | head -1)"
~/openroad-new/usr/bin/openroad -no_init -exit lidar_sram_pnr.tcl 2>&1 | tee pnr_sram.log
echo "EXIT:${PIPESTATUS[0]}" > pnr_sram.done
