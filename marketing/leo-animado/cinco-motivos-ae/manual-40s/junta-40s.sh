#!/usr/bin/env bash
# Reel de 40 s: cola o iPhone 3D do Remotion (saida/celular-40s.webm, quadros 843 a 1006) na base do AE
# (saida/base-40s.mp4, render pelo MCP) e põe o som do AE (saida/som-40s.aif) com loudnorm em duas passadas pra -14 LUFS.
# Uso: bash junta-40s.sh
set -eu
cd "$(dirname "$0")"
Q0=843
J=$(ffmpeg -hide_banner -i saida/som-40s.aif -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
v() { echo "$J" | grep "\"$1\"" | sed -E 's/.*: "(.*)".*/\1/'; }
ffmpeg -v error -y -i saida/base-40s.mp4 -c:v libvpx -i saida/celular-40s.webm -i saida/som-40s.aif \
  -filter_complex "[1:v]setpts=PTS+$Q0/30/TB[c];[0:v][c]overlay=eof_action=pass:format=yuv420,format=yuv420p[v];[2:a]loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(v input_i):measured_TP=$(v input_tp):measured_LRA=$(v input_lra):measured_thresh=$(v input_thresh):offset=$(v target_offset):linear=true,aresample=48000[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -profile:v high -preset slow -tune grain -crf 23 -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart saida/CINCO-40S.mp4
ffprobe -v error -count_frames -show_entries stream=codec_name,width,height,r_frame_rate,nb_read_frames:format=duration,size -of compact saida/CINCO-40S.mp4
ffmpeg -hide_banner -i saida/CINCO-40S.mp4 -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1
