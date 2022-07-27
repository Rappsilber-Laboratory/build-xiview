#!/bin/sh
touch /home/col/annotator/command_has_run;
while true; do sleep 1; java -DBASE_URI=https://0.0.0.0:8083/xiAnnotator/ -jar ./xiAnnotator-1.4.28-jar-with-dependencies.jar; done; 
