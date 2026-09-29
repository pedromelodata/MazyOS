# Transcrição do áudio de um reel pra análise "Por que esse reel funcionou" (server/analise.mjs).
# Roda no Python do venv da skill corte-viral (tem o faster-whisper). Uso:
#   python transcrever.py <audio.wav> <saida.json> [modelo=small] [idioma=pt]
# Saída: {"idioma", "duracao", "segmentos": [{"inicio", "fim", "texto", "palavras": [{"inicio", "fim", "palavra"}]}]}
import json
import sys


def main():
    if len(sys.argv) < 3:
        print('uso: transcrever.py <audio> <saida.json> [modelo] [idioma]', file=sys.stderr)
        return 2
    audio, saida = sys.argv[1], sys.argv[2]
    modelo = sys.argv[3] if len(sys.argv) > 3 else 'small'
    idioma = sys.argv[4] if len(sys.argv) > 4 else 'pt'

    from faster_whisper import WhisperModel

    try:
        m = WhisperModel(modelo, device='cpu', compute_type='int8', local_files_only=True)
    except Exception:
        # modelo ainda não baixado nesta máquina: baixa uma vez (fica no cache do Hugging Face)
        m = WhisperModel(modelo, device='cpu', compute_type='int8')

    segs, info = m.transcribe(audio, language=idioma, word_timestamps=True, vad_filter=True, beam_size=5)
    out = []
    for s in segs:
        out.append({
            'inicio': round(s.start, 2),
            'fim': round(s.end, 2),
            'texto': s.text.strip(),
            'palavras': [{'inicio': round(w.start, 2), 'fim': round(w.end, 2), 'palavra': w.word.strip()} for w in (s.words or [])],
        })
    with open(saida, 'w', encoding='utf-8') as f:
        json.dump({'idioma': info.language, 'duracao': round(info.duration, 2), 'segmentos': out}, f, ensure_ascii=False)
    return 0


if __name__ == '__main__':
    sys.exit(main())
