# Fontes dos modelos 3D (vídeo motion em Three.js)

Levantamento feito em 01/10/2026. São 21 modelos na pasta `modelos-3d/`, com cerca de 28 MB no total. Nenhum arquivo passa de 10 MB.

Pré-visualização de todos os modelos: `modelos-3d/_previa-modelos-3d.jpg`.

**Formato de todos os arquivos**
- GLB único, com as texturas embutidas em JPEG ou PNG.
- Sem Draco, meshopt, WebP, KTX2 ou quantização. O `GLTFLoader` abre direto, sem decoder.
- Todos passaram no Khronos glTF Validator 2.0.0-dev.3.10 com 0 erros.
- Os avisos que sobraram são inofensivos:
  - tangentes geradas em tempo de execução, nos modelos com mapa normal;
  - malha com esqueleto fora da raiz, na pasta animada.
- Não testei no After Effects. Os arquivos não usam nenhuma das extensões que costumam travar o AE.

**Licenças**
- CC0: não exige crédito.
- CC-BY: exige crédito ao autor (texto pronto na seção "Créditos prontos").

---

## Resumo

| Arquivo (em `modelos-3d/`) | O que é | Licença | Crédito? | Triângulos | Tamanho |
|---|---|---|---|---|---|
| `celular_estilo-iphone-15-pro-max_polyman_limpo.glb` | celular realista, bordas retas, ilha dinâmica | CC-BY 4.0 | sim | 63.439 | 3,93 MB |
| `smartwatch_estilo-apple-watch-ultra_alboxer2000_limpo.glb` | smartwatch realista, pulseira laranja | CC-BY 4.0 | sim | 108.030 | 9,16 MB |
| `relogio-pulso-analogico_khronos_chronograph-watch_sem-logos.glb` | relógio de pulso esportivo, analógico e digital | CC-BY 4.0 | sim | 100.002 | 6,30 MB |
| `relogio-pulso-digital_polyhaven_digital-wrist-watch.glb` | relógio digital retrô de aço | CC0 | não | 10.390 | 2,37 MB |
| `relogio-parede_polyhaven_wall-clock.glb` | relógio de parede moderno, ponteiros soltos | CC0 | não | 3.658 | 1,71 MB |
| `relogio-despertador_polyhaven_alarm-clock-01.glb` | despertador de campainha dupla, ponteiros soltos | CC0 | não | 8.985 | 1,77 MB |
| `prancheta-documento_polyhaven_clipboard.glb` | prancheta realista | CC0 | não | 6.176 | 1,99 MB |
| `blocos-papel_polyhaven_office-notepads.glb` | blocos de papel, folhas e post-its, 10 peças | CC0 | não | 666 | 0,39 MB |
| `calendario-mesa_polypizza_tomas-bayer.glb` | calendário de mesa estilizado | CC-BY 3.0 | sim | 1.916 | 146 KB |
| `calendario-parede_polypizza_jeremy.glb` | calendário de parede com grade | CC-BY 3.0 | sim | 1.582 | 55 KB |
| `moeda_polypizza_quaternius.glb` | moeda dourada lisa | CC0 | não | 396 | 22 KB |
| `moedas-pilhas_polypizza_quaternius.glb` | pilhas de moedas | CC0 | não | 2.024 | 89 KB |
| `cofrinho_polypizza_poly-by-google.glb` | cofrinho de porquinho | CC-BY 3.0 | sim | 808 | 19 KB |
| `papel-pilha-documento_polypizza_jarlan-perez.glb` | pilha de documentos com linhas de texto | CC-BY 3.0 | sim | 244 | 13 KB |
| `papel-folhas_polypizza_quaternius.glb` | duas folhas soltas, tom bege | CC0 | não | 304 | 21 KB |
| `pasta-animada_polypizza_reyshapes.glb` | pasta de arquivo com animação de abrir | CC0 | não | 124 | 41 KB |
| `envelope-fechado-selo_polypizza_isa-lousberg.glb` | envelope fechado com selo laranja | CC0 | não | 100 | 28 KB |
| `envelope-aberto_polypizza_reyshapes.glb` | envelope aberto | CC0 | não | 86 | 8 KB |
| `sino-notificacao_polypizza_quaternius.glb` | sino dourado (notificação) | CC0 | não | 779 | 20 KB |
| `sino-mesa_polypizza_jarlan-perez.glb` | campainha de balcão ("plim") | CC-BY 3.0 | sim | 604 | 34 KB |
| `carimbo_polypizza_poly-by-google.glb` | carimbo de borracha | CC-BY 3.0 | sim | 932 | 30 KB |

---

## iPhone livre: achei e está bom

**Achei um modelo livre e de qualidade alta:** "Apple iPhone 15 Pro Max Black", do polyman Studio, em CC-BY 4.0. É o mesmo modelo usado em vários tutoriais de React Three Fiber.
- Tem as bordas retas e a ilha dinâmica.
- A tela é uma malha separada.

**O que limpei antes de salvar:**
- tirei o logo da Apple da traseira;
- tirei o papel de parede original da tela, que é arte da Apple;
- dei nomes legíveis às peças.

O desenho continua sendo o de um iPhone real. Para não sugerir parceria com a Apple, não citar a marca na peça.

**Se quiser um aparelho 100% genérico**, dá para construir um procedural (pela skill img2threejs ou direto em three.js):
- caixa com `RoundedBoxGeometry`;
- plano de tela com `CanvasTexture`;
- pílula da ilha dinâmica;
- módulo de câmera.

Para o vídeo, recomendo o modelo limpo, que é bem mais rico que um procedural.

---

## Detalhes por modelo

### 1. Celular estilo iPhone 15 Pro Max (limpo)
- **Arquivo:** `modelos-3d/celular_estilo-iphone-15-pro-max_polyman_limpo.glb`
- **Fonte original:** Sketchfab, "Apple iPhone 15 Pro Max Black", https://sketchfab.com/3d-models/apple-iphone-15-pro-max-black-df17520841214c1792fb8a44c6783ee7
- **Autor:** polyman Studio (usuário Polyman_3D, https://sketchfab.com/Polyman_3D)
- **Licença:** Creative Commons Attribution 4.0 (CC BY 4.0), https://creativecommons.org/licenses/by/4.0/. Uso comercial permitido. Conferi na API pública do Sketchfab em 01/10/2026.
- **Como baixei:** o Sketchfab exige login para baixar. Peguei a cópia CC-BY redistribuída no GitHub, em https://github.com/adrianhajdin/iphone, arquivo `public/models/scene.glb` (0,89 MB, com Draco e WebP). Os metadados do GLB confirmam autor, licença e link de origem.
- **Formato:** GLB 3,93 MB. 31 nós, 30 malhas, 30 materiais, texturas JPEG/PNG de até 1024 px.
- **Triângulos:** 63.439.
- **Tamanho real:** 7,8 x 16,0 x 1,2 cm, em metros.
- **Tela separada:** sim, nó `Tela` com material próprio `Tela`.
  - Vem preta, com cara de tela apagada.
  - O UV 0..1 cobre a tela inteira.
  - Use textura com `flipY = true`, que é o padrão do `TextureLoader` e do `useTexture`. Com `flipY = false` a imagem sai de cabeça para baixo (testado).
  - A proporção da tela é 0,463. Use imagens de 1290 x 2796.
  - A malha `IlhaDinamica` fica por cima, nos 4% de cima da tela.
- **Outros nós renomeados:**
  - `IlhaDinamica`, `BordaPretaTela`, `Moldura` (aro de titânio);
  - `VidroTraseiro`, `TraseiraInterna`;
  - `PlatoCamera`, `PlacaCamera`, `Flash`.
- **Orientação:** a tela olha para -Z. Para encarar uma câmera em +Z, use `rotation.y = Math.PI`.
- **Mudanças feitas** (exigência da CC-BY indicar):
  - removi da geometria o logo da Apple (395 triângulos fundidos na placa da câmera) e uma cópia plana dele;
  - troquei o papel de parede de fábrica por material preto;
  - tirei o Draco e converti WebP para JPEG/PNG;
  - renomeei os nós.

### 2. Smartwatch estilo Apple Watch Ultra (limpo)
- **Arquivo:** `modelos-3d/smartwatch_estilo-apple-watch-ultra_alboxer2000_limpo.glb`
- **Fonte original:** Sketchfab, "Apple Watch Ultra - Orange", https://sketchfab.com/3d-models/apple-watch-ultra-orange-4656191de2e94767a8c16003fca1f268
- **Autor:** alboxer2000_ (https://sketchfab.com/alboxer2000_)
- **Licença:** CC BY 4.0, https://creativecommons.org/licenses/by/4.0/. Uso comercial permitido. Conferi na API pública do Sketchfab em 01/10/2026.
- **Como baixei:** cópia redistribuída com o `license.txt` original em https://github.com/Omar-Ayman-Ali/Apple-Ultra-Website, pasta `public/models/apple_watch_ultra_orange/`. Era glTF, bin e 24 texturas, com 21,8 MB.
- **Formato:** GLB 9,16 MB. 44 malhas, 30 materiais, texturas de até 2048 px.
- **Triângulos:** 108.030.
- **Tamanho:** 4,4 x 7,5 x 7,8 cm, com a pulseira em laço.
- **Tela separada:** sim, nó `Tela` com material `Tela`.
  - Vem preta. A tela tem cerca de 32,7 x 39,9 mm, proporção 0,82. Use imagens de 820 x 1004.
  - Use `flipY = true` (testado). Com `false` sai invertida.
- **Pulseira:** nós `Pulseira_A` e `Pulseira_B`. Dá para tingir pelo material.
- **Orientação:** a caixa vem inclinada 35° para cima, numa pose de vitrine. Para a tela encarar +Z de frente, use `rotation.x = +35°` (0,611 rad).
- **Marcas:** não há logo visível. O mostrador original era o "Wayfinder", interface da Apple, e eu o removi.
- **Mudanças feitas:** removi a textura do mostrador; empacotei tudo em GLB único com texturas reencodadas; renomeei os nós.

### 3. Relógio de pulso analógico (Chronograph Watch, sem logos)
- **Arquivo:** `modelos-3d/relogio-pulso-analogico_khronos_chronograph-watch_sem-logos.glb`
- **Fonte:** KhronosGroup/glTF-Sample-Assets, https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/ChronographWatch
- **Autor:** Eric Chadwick e Darmstadt Graphics Group GmbH (2025). Baseado em "Chronograph Watch Mudmaster", de graphiccompressor (https://skfb.ly/oAsPA), também CC BY 4.0.
- **Licença:** CC BY 4.0. Os logos e marcas ficam fora da licença.
- **Formato:** GLB 6,30 MB. 13 malhas com nomes claros, texturas PNG/JPEG de 2048 px.
- **Triângulos:** 100.002.
- **Escala:** as unidades são centímetros (o relógio mede cerca de 5,8). Use `scale 0.01` para metros.
- **Variantes de material** (KHR_materials_variants): Gold (padrão), Green e Red.
- **Ponteiros soltos:**
  - nós `Hand Hours`, `Hand Minutes`, `Hand Seconds` e `Hand Setting`;
  - giram no eixo Y local, com valor positivo no sentido horário;
  - a animação `Anim_0` já faz o tique do ponteiro de segundos: 60 s, 1 passo por segundo.
- **Mudanças feitas:**
  - removi os logos Khronos (fundo), DGG (fecho) e 3D Commerce (mostrador), apagando as texturas de cor e de rugosidade;
  - renomeei `Backplate Khronos` para `Backplate` e `Clasp DGG` para `Clasp`;
  - tirei o KHR_texture_transform, que só servia aos logos.
- **Observação:** o desenho é de relógio esportivo robusto, dourado e cheio de detalhe.

### 4. Relógio de pulso digital (Poly Haven)
- **Arquivo:** `modelos-3d/relogio-pulso-digital_polyhaven_digital-wrist-watch.glb`
- **Fonte:** Poly Haven, "Digital Wrist Watch", https://polyhaven.com/a/digital_wrist_watch
- **Autor:** Adrian C. **Licença:** CC0, https://polyhaven.com/license.
- **Formato:** GLB 2,37 MB, texturas 2k.
- **Triângulos:** 10.390.
- **Tamanho:** 3,6 x 0,8 x 21,7 cm. Vem deitado, com o visor virado para +Y.
- **Tela separada:** não. O visor LCD ("16:08") está pintado na textura de cor. O vidro é um material separado.
- **Partes:** caixa, fecho, pulseira A e pulseira B são nós separados.
- **Marca:** a caixa traz "RISTO", que é fictícia, além de "WATER RESIST", "LIGHT" e "MODE". É inspirado no estilo Casio, sem o nome.
- **Mudança feita:** refiz o vidro como transparente. No glTF do Poly Haven o vidro sai opaco, porque usa JPEG sem alfa.

### 5. Relógio de parede (Poly Haven)
- **Arquivo:** `modelos-3d/relogio-parede_polyhaven_wall-clock.glb`
- **Fonte:** Poly Haven, "Wall Clock", https://polyhaven.com/a/wall_clock
- **Autor:** PierreB3D. **Licença:** CC0.
- **Formato:** GLB 1,71 MB, texturas 2k. O vidro usa KHR_materials_transmission.
- **Triângulos:** 3.658.
- **Tamanho:** 32 cm de diâmetro. O mostrador olha para +Z e o centro fica na origem.
- **Ponteiros soltos:** `wall_clock_hours_hand`, `wall_clock_minute_hand` e `wall_clock_second_hand` (o eixo central com o ponteiro vermelho). Para girar no sentido horário, use `rotation.z = -ângulo`.
- **Mudança feita:** apaguei do mostrador o texto "URBAN quartz", marca fictícia, por clonagem na textura de cor.

### 6. Despertador (Poly Haven)
- **Arquivo:** `modelos-3d/relogio-despertador_polyhaven_alarm-clock-01.glb`
- **Fonte:** Poly Haven, "Alarm Clock 01", https://polyhaven.com/a/alarm_clock_01
- **Autor:** James Ray Cock (modelagem e textura) e Yann Kervran (rig). **Licença:** CC0.
- **Formato:** GLB 1,77 MB, texturas 2k.
- **Triângulos:** 8.985.
- **Tamanho:** 13,2 x 17,4 x 6,7 cm. O mostrador olha para +Z.
- **Ponteiros soltos:** `houd_hand` (o nome original tem esse erro de digitação; é o das horas), `minute_hand` e `second_hand`.
  - O pivô fica no centro do mostrador.
  - Para girar no sentido horário, use `hand.rotateOnWorldAxis(new Vector3(0,0,1), -ângulo)`.
- **Marca:** nenhuma.
- **Mudança feita:** refiz o vidro como transparente, pelo mesmo motivo do relógio digital.

### 7. Prancheta (Poly Haven)
- **Arquivo:** `modelos-3d/prancheta-documento_polyhaven_clipboard.glb`
- **Fonte:** Poly Haven, "Clipboard", https://polyhaven.com/a/clipboard
- **Autor:** ProgrammerOnCoffee. **Licença:** CC0.
- **Formato:** GLB 1,99 MB, texturas 2k.
- **Triângulos:** 6.176.
- **Tamanho:** 22,9 x 33,7 cm. Vem deitada (face para +Y).
- **Folha:** a prancheta vem sem folha. Para o documento, ponha um plano com textura própria por cima.
- **Marca:** a presilha tem um texto miúdo em relevo, ilegível em vídeo.

### 8. Blocos de papel (Poly Haven)
- **Arquivo:** `modelos-3d/blocos-papel_polyhaven_office-notepads.glb`
- **Fonte:** Poly Haven, "Office Notepads", https://polyhaven.com/a/office_notepads
- **Autor:** Ulan Cabanilla. **Licença:** CC0.
- **Formato:** GLB 0,39 MB, texturas reduzidas a 1024 px.
- **Triângulos:** 666.
- **Peças:** 10 nós separados (folhas brancas, blocos pautados amarelos e post-its), todos deitados.

### 9. Calendário de mesa (Poly Pizza)
- **Arquivo:** `modelos-3d/calendario-mesa_polypizza_tomas-bayer.glb`
- **Fonte:** Poly Pizza, https://poly.pizza/m/8GqQAqxi3qk
- **Autor:** Tomáš Bayer. **Licença:** CC BY 3.0, https://creativecommons.org/licenses/by/3.0/.
- **Formato:** GLB 146 KB.
- **Triângulos:** 1.916.
- **Escala:** arbitrária, cerca de 23 unidades de largura. Normalize pelo bounding box.
- **Faixa de datas:** é o material `Calendar_Texture` (512 px).
  - Mostra os dias 7 a 13 com os nomes em inglês (SUN, MON...).
  - Para o português ou para o "dia 20", troque essa textura por uma `CanvasTexture`.
- **Cores:** azul e água-marinha, nos materiais `Calendar_Aquamarine` e `Calendar_Ivory`, que dá para tingir.

### 10. Calendário de parede (Poly Pizza)
- **Arquivo:** `modelos-3d/calendario-parede_polypizza_jeremy.glb`
- **Fonte:** Poly Pizza, https://poly.pizza/m/2yHE0n1ahjp
- **Autor:** jeremy. **Licença:** CC BY 3.0.
- **Formato:** GLB 55 KB.
- **Triângulos:** 1.582.
- **Escala:** arbitrária (cerca de 19 unidades de altura).
- **Visual:** grade de dias sem números e paisagem de montanha no topo.
- **Cores:** só cores chapadas, em 4 materiais com nome de cor hex. Não tem textura.
- **Números:** vão por cima, em plano ou texto.

### 11. Moeda (Poly Pizza)
- **Arquivo:** `modelos-3d/moeda_polypizza_quaternius.glb`
- **Fonte:** Poly Pizza, https://poly.pizza/m/7IrL01B97W
- **Autor:** Quaternius. **Licença:** CC0.
- **Formato:** GLB 22 KB.
- **Triângulos:** 396.
- **Visual:** dourada e lisa, sem cifrão nem símbolo, boa para receber "R$" por decal.

### 12. Pilhas de moedas (Poly Pizza)
- **Arquivo:** `modelos-3d/moedas-pilhas_polypizza_quaternius.glb`
- **Fonte:** Poly Pizza, https://poly.pizza/m/VaGFKE0n0F
- **Autor:** Quaternius. **Licença:** CC0.
- **Formato:** GLB 89 KB.
- **Triângulos:** 2.024.

### 13. Cofrinho (Poly Pizza)
- **Arquivo:** `modelos-3d/cofrinho_polypizza_poly-by-google.glb`
- **Fonte:** Poly Pizza, https://poly.pizza/m/dpvS2kdW6I9
- **Autor:** Poly by Google, do acervo do antigo Google Poly. **Licença:** CC BY 3.0.
- **Formato:** GLB 19 KB.
- **Triângulos:** 808.
- **Visual:** porquinho rosa low-poly.

### 14. Pilha de documentos (Poly Pizza)
- **Arquivo:** `modelos-3d/papel-pilha-documento_polypizza_jarlan-perez.glb`
- **Fonte:** Poly Pizza, https://poly.pizza/m/aiBozYlPe--
- **Autor:** Jarlan Perez. **Licença:** CC BY 3.0.
- **Formato:** GLB 13 KB.
- **Triângulos:** 244.
- **Visual:** folhas com linhas de texto desenhadas na geometria.

### 15. Folhas soltas (Poly Pizza)
- **Arquivo:** `modelos-3d/papel-folhas_polypizza_quaternius.glb`
- **Fonte:** Poly Pizza, https://poly.pizza/m/4qDtAbPYnT
- **Autor:** Quaternius. **Licença:** CC0.
- **Formato:** GLB 21 KB.
- **Triângulos:** 304.
- **Visual:** papel bege meio amassado, mais "papelada" que documento novo.

### 16. Pasta animada (Poly Pizza)
- **Arquivo:** `modelos-3d/pasta-animada_polypizza_reyshapes.glb`
- **Fonte:** Poly Pizza, https://poly.pizza/m/emdPCRNhTX
- **Autor:** reyshapes. **Licença:** CC0.
- **Formato:** GLB 41 KB, com esqueleto.
- **Triângulos:** 124.
- **Animações:** `idle` e `opening` (a pasta abre). Serve para o "comprovante entra na pasta". Toque com `useAnimations` do drei ou com `AnimationMixer`.

### 17. Envelope fechado com selo (Poly Pizza)
- **Arquivo:** `modelos-3d/envelope-fechado-selo_polypizza_isa-lousberg.glb`
- **Fonte:** Poly Pizza, https://poly.pizza/m/BJS8VvgPkQ
- **Autor:** Isa Lousberg. **Licença:** CC0.
- **Formato:** GLB 28 KB.
- **Triângulos:** 100.
- **Visual:** branco, com selo laranja e linhas de endereço. Tudo vem de uma textura pequena, e dá para recolorir o selo para coral.

### 18. Envelope aberto (Poly Pizza)
- **Arquivo:** `modelos-3d/envelope-aberto_polypizza_reyshapes.glb`
- **Fonte:** Poly Pizza, https://poly.pizza/m/M9mVmRXHif
- **Autor:** reyshapes. **Licença:** CC0.
- **Formato:** GLB 8 KB.
- **Triângulos:** 86.
- **Escala:** arbitrária (cerca de 8 unidades).

### 19. Sino de notificação (Poly Pizza)
- **Arquivo:** `modelos-3d/sino-notificacao_polypizza_quaternius.glb`
- **Fonte:** Poly Pizza, https://poly.pizza/m/cILuaO115Y
- **Autor:** Quaternius. **Licença:** CC0.
- **Formato:** GLB 20 KB.
- **Triângulos:** 779.
- **Visual:** sino dourado clássico, a silhueta do ícone de notificação.

### 20. Campainha de balcão (Poly Pizza)
- **Arquivo:** `modelos-3d/sino-mesa_polypizza_jarlan-perez.glb`
- **Fonte:** Poly Pizza, https://poly.pizza/m/1BXI7wJyaG8
- **Autor:** Jarlan Perez. **Licença:** CC BY 3.0.
- **Formato:** GLB 34 KB.
- **Triângulos:** 604.

### 21. Carimbo (Poly Pizza)
- **Arquivo:** `modelos-3d/carimbo_polypizza_poly-by-google.glb`
- **Fonte:** Poly Pizza, https://poly.pizza/m/3RdawRyAWKx
- **Autor:** Poly by Google. **Licença:** CC BY 3.0.
- **Formato:** GLB 30 KB.
- **Triângulos:** 932.
- **Escala:** arbitrária (cerca de 200 unidades de altura).
- **Uso:** dá para usar no "selo carimba".

Todos os GLB levam no `asset.extras` o título, o autor, a licença, o link de origem e as mudanças feitas.

---

## Dicas rápidas de uso (three.js e R3F no Remotion)

- **Carregar:** `useGLTF(staticFile('modelos-3d/arquivo.glb'))`. Nenhum arquivo precisa de DRACOLoader. Dentro do Remotion, segure o quadro com `delayRender` até o load terminar, como já foi feito com as texturas.
- **Escala dos modelos do Poly Pizza:** é arbitrária. Normalize assim:

  ```js
  const s = alvo / new Box3().setFromObject(scene).getSize(new Vector3()).y
  ```

  Os do Poly Haven e os dois aparelhos limpos estão em metros reais. O relógio Khronos está em centímetros.
- **Tela do celular e do smartwatch:**

  ```js
  nodes.Tela.material = new MeshBasicMaterial({ map: textura, toneMapped: false })
  ```

  Use `textura.flipY = true` e `textura.colorSpace = SRGBColorSpace`. Serve imagem, vídeo (`VideoTexture`) ou `CanvasTexture`.
- **Tingir:** dá para tingir na hora pelos nomes de material, por exemplo a `Moldura` do celular (material `eShKpuMNVJTRrgg`), as pulseiras do smartwatch e os materiais `Calendar_*`.

---

## Créditos prontos (só para os CC-BY)

Texto curto, para legenda, comentário fixado ou descrição:

> Modelos 3D (CC BY): "Apple iPhone 15 Pro Max Black" por polyman Studio; "Apple Watch Ultra - Orange" por alboxer2000_ (Sketchfab, CC BY 4.0); "Chronograph Watch" por Eric Chadwick / DGG, a partir de graphiccompressor (Khronos glTF Sample Assets, CC BY 4.0); calendários por Tomáš Bayer e jeremy; documentos e campainha por Jarlan Perez; cofrinho e carimbo por Poly by Google (Poly Pizza, CC BY 3.0). Modelos modificados.

Só entra no crédito quem aparecer no vídeo. Os CC0 dispensam crédito: Poly Haven, Quaternius, reyshapes e Isa Lousberg.

---

## O que olhei e não usei

- **Sketchfab direto:** exige login para baixar. Usei só cópias CC-BY redistribuídas no GitHub, com a licença conferida na API pública do Sketchfab.
- **three.js examples, `rolex.glb`:**
  - é da marca Rolex;
  - o exemplo `webgl_watch` não declara licença nem autor do modelo.
- **pmndrs market (market.pmnd.rs):**
  - o site está fora do ar (DEPLOYMENT_NOT_FOUND na Vercel);
  - o repositório `pmndrs/market-assets` não tem celular, relógio, moeda, envelope, sino nem calendário.
- **3dassets.dev:**
  - todos os resultados são modelos gerados por IA e bem simples (o smartphone tem 426 triângulos, quase uma caixa);
  - um procedural nosso fica igual ou melhor.
- **Kenney:** não tem celular nem relógio. Os itens dele aparecem no Poly Pizza e nada era mais útil que os escolhidos.
- **Celulares low-poly do Poly Pizza:** são estilizados e sem UV na tela. O melhor deles é "Phone", de Alex Safayan (CC BY 3.0), em https://poly.pizza/m/1L9oJAw6nY2, se um dia precisar de um celular estilizado.
- **Smartwatches low-poly do Poly Pizza:** a pulseira fitness "TIME HOTEL 1.19", de S. Paul Michael (CC BY 3.0), e os "Watch" do Poly by Google. Ficaram abaixo do Apple Watch Ultra.
- **Poly Haven:** os relógios de bolso `pocket_watch` e `vintage_pocket_watch` e o `postcard_set_01` são bons, mas fogem do pedido.
- **Arquivos originais com marca:**
  - o iPhone com logo e papel de parede da Apple;
  - o Watch Ultra com o mostrador Wayfinder;
  - o Chronograph com os logos Khronos, DGG e 3D Commerce.

  Não guardei esses arquivos, para ninguém usar por engano. Para baixar de novo:
  - https://github.com/adrianhajdin/iphone (`public/models/scene.glb`)
  - https://github.com/Omar-Ayman-Ali/Apple-Ultra-Website (`public/models/apple_watch_ultra_orange/`)
  - https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/ChronographWatch
