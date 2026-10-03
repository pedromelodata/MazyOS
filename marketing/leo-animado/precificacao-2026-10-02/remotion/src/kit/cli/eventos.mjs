// Eventos de som de uma peça (dono K07; contrato: KIT/DESENHO.md, seções 4.3, 4.6 e 6).
// Uso: node eventos.mjs <pasta da peça> [--cena <arquivo>]
// Lê as props<sufixo>.json (gravadas pelo props.mjs), monta a timeline em Node com o mesmo código do render
// (registraEases, novaTimeline, novoEstado e montaTimeline do núcleo, com as batidas das extensões) e grava
// eventos<sufixo>.json: {versao: 1, peca, cena, duracao, perfil, modoRuido, eventos} (seção 4.6).
// transpor "trilha" sai do catálogo (trilha.tom.transporVerificado); transpor 0 fica fora do evento.
// Confere que cada som existe no catálogo de efeitos e não está reprovado. Erro: código 1 e nada gravado.

import { gravaJson } from "../lib/escrita.mjs";
import {
  ErroCli, argumentos, carregaCatalogo, carregaRuntime, lePeca, leProps, preparaGsap, principal, saidaDaPeca,
} from "./_runtime.mjs";

await principal(async () => {
  const { pos, op } = argumentos(process.argv.slice(2));
  if (pos.length !== 1) throw new ErroCli("uso: node eventos.mjs <pasta da peça> [--cena <arquivo>]", 2);
  const peca = lePeca(pos[0], op.cena);
  const { props, caminho, avisos } = leProps(peca);
  const rt = await carregaRuntime();
  const cat = rt.nucleo.normalizaCatalogo(carregaCatalogo().catalogo);
  console.log(`props: ${caminho}`);
  for (const a of rt.avisos.concat(avisos)) console.log(`AVISO: ${a}`);

  const erros = [];
  // transpor "trilha": o valor do catálogo de hoje (as props guardam o do momento em que foram feitas)
  const it = cat.trilhas[props.trilha.id];
  if (!it) erros.push(`trilha não está no catálogo: ${props.trilha.id}`);
  const doCatalogo = it && it.tom && typeof it.tom.transporVerificado === "number" ? it.tom.transporVerificado : 0;
  const usadas = JSON.parse(JSON.stringify(props));
  if (doCatalogo !== (props.trilha.transporVerificado || 0)) {
    console.log(`AVISO: transporVerificado da trilha ${props.trilha.id} mudou no catálogo (${props.trilha.transporVerificado} nas props, ${doCatalogo} hoje): uso o do catálogo; rode kit.py props de novo`);
  }
  usadas.trilha.transporVerificado = doCatalogo;

  const g = rt.gsap;
  rt.nucleo.registraEases(g, rt.CustomEase);
  const tl = rt.nucleo.novaTimeline(g);
  const st = rt.nucleo.novoEstado(usadas);
  const avisosBatidas = [];
  let eventos = [];
  try {
    eventos = rt.nucleo.montaTimeline(tl, st, usadas, rt.registro, { avisos: avisosBatidas, aoErro: (_onde, e) => erros.push(e.message) });
  } finally {
    tl.kill();
    preparaGsap(g);
  }
  for (const a of avisosBatidas) console.log(`AVISO: ${a}`);

  // cada som no catálogo de efeitos
  const vistos = {};
  for (const ev of eventos) {
    if (vistos[ev.som]) continue;
    vistos[ev.som] = true;
    const ef = cat.efeitos[ev.som];
    if (!ef) erros.push(`efeito não está no catálogo: ${ev.som} (${ev.origem})`);
    else if (ef.status === "reprovado") erros.push(`efeito reprovado: ${ev.som} (${ev.origem})`);
  }
  for (const ev of eventos) {
    if (ev.transpor === 0) delete ev.transpor; // 0 = nenhum filtro (seção 4.3)
  }
  if (erros.length) {
    console.log(`\nERRO: ${erros.length} erro(s); nada foi gravado:`);
    for (const e of erros) console.log(`  - ${e}`);
    return 1;
  }

  const doc = {
    versao: 1,
    peca: props.peca,
    cena: peca.caminhoCena.split(/[\\/]/).pop(),
    duracao: props.duracao,
    perfil: props.sons.perfil,
    modoRuido: props.sons.modoRuido,
    eventos,
  };
  const saida = saidaDaPeca(peca, "eventos", ".json");
  const gr = gravaJson(saida, doc);
  console.log(`\n${eventos.length} eventos (perfil ${doc.perfil}, ruído ${doc.modoRuido}):`);
  for (const ev of eventos) {
    const extra = [
      ev.args ? `[${ev.args.join(", ")}]` : "",
      ev.inverte ? "inverte" : "",
      ev.filtro ? `filtro ${ev.filtro}` : "",
      ev.transpor ? `transpor ${ev.transpor}` : "",
      ev.ancora ? `âncora ${ev.ancora}` : "",
    ].filter(Boolean).join(" ");
    console.log(`  ${String(ev.ordem).padStart(2)}  ${ev.t.toFixed(6).padStart(10)}  ${ev.som.padEnd(18)} ${String(ev.ganhoDb).padStart(4)} dB  ${extra.padEnd(30)} ${ev.origem}`);
  }
  console.log(`\ngravado: ${gr.caminho} (${gr.tamanho} bytes)`);
  return 0;
});
