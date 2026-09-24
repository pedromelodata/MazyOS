set -e
curl -sS -X PUT -H "Content-Type: video/mp4" --data-binary @corte5s.mp4 "$1" -o /dev/null -w "video %{http_code}\n"
curl -sS -X PUT -H "Content-Type: image/png" --data-binary @emitir.png "$2" -o /dev/null -w "imagem %{http_code}\n"
