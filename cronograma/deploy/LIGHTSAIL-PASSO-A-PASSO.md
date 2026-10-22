# Gestão de Marketing no AWS Lightsail: passo a passo (21/10/2026)

Objetivo: o app roda 24 horas num servidor da AWS, em https://mkt.legalizai.com.br, sem depender do computador do escritório.

Divisão: a Parte 1 é do Pedro, no console da AWS (uns 20 minutos). A Parte 2 é do Claude, pelo terminal, depois de receber o IP e a chave de acesso ao servidor. Até a troca, o link de emergência (túnel rápido) segue no ar.

## Parte 1: no console da AWS (Pedro)

### 1. Criar o servidor

1. Entre em https://lightsail.aws.amazon.com com a conta da AWS de vocês.
2. Clique em **Create instance**.
3. **Região:** escolha **São Paulo** se aparecer na lista. Se não aparecer, escolha **Virginia (us-east-1)**.
4. **Plataforma:** Linux/Unix. **Blueprint:** "OS Only" e **Ubuntu 24.04 LTS** (ou a LTS mais nova da lista).
5. **Chave SSH:** clique em "Change SSH key pair", depois "Create New", dê o nome `gestao-marketing` e clique em **Download**. Guarde o arquivo `.pem` em `C:\Users\EDIT-ADMIN\.ssh\` (crie a pasta `.ssh` se não existir). Esse arquivo é a chave do servidor: não mande por chat nem por e-mail.
6. **Plano:** o de **4 GB de memória, 2 vCPUs e 80 GB de SSD**, com IPv4 (dual-stack). Confira o preço mensal na tela antes de criar.
7. **Nome:** `gestao-marketing`. Clique em **Create instance** e espere ficar "Running".

### 2. Fixar o endereço do servidor

1. Na instância, aba **Networking**, clique em **Attach static IP**, depois **Create static IP**, e anexe à instância `gestao-marketing`. O IP fixo não cobra enquanto estiver anexado.
2. Anote o IP fixo (exemplo: 3.123.45.67).

### 3. Abrir as portas da internet

Ainda na aba **Networking**, em **IPv4 Firewall**:

1. Deixe a regra **SSH (22)** que já vem.
2. Deixe a regra **HTTP (80)** que já vem. Ela é usada pra gerar o certificado do HTTPS e pra mandar quem entrar por http pro https.
3. Clique em **Add rule** e adicione **HTTPS (443)**.

### 4. Apontar o mkt pro servidor (Route 53)

1. Entre no console do **Route 53**, em **Hosted zones**, e abra **legalizai.com.br**.
2. Clique em **Create record**.
3. **Record name:** `mkt`. **Record type:** A. **Value:** o IP fixo do passo 2. **TTL:** 300.
4. Clique em **Create records**.
5. **Não mexa em nenhum outro registro.** Site, e-mail, api e crm continuam como estão.

### 5. Me avisar

Me mande só duas coisas: o **IP fixo** e o **nome do arquivo `.pem`** que ficou em `C:\Users\EDIT-ADMIN\.ssh\`. Com isso eu começo a Parte 2.

## Parte 2: no terminal (Claude)

1. Entro no servidor com a chave que você salvou e deixo o Ubuntu atualizado.
2. Instalo o que o app usa: Node 26, git, ffmpeg, Python com o transcritor de vídeo e o Caddy, que cuida do HTTPS do mkt sozinho.
3. Baixo o repositório gestao no servidor. Pra isso você faz um passo de 1 minuto no GitHub (ver "Dois passos rápidos seus", abaixo).
4. Copio deste computador os dados do app e os arquivos de acesso (usuários, sessões, token do Instagram) por cópia direta e segura, nunca pelo git.
5. Deixo o app como serviço do servidor: sobe sozinho se o servidor reiniciar e volta sozinho se cair.
6. Ligo a sincronização com este computador pelo git, de tempos em tempos: a base contábil, as skills e os vídeos finais que a gente produz aqui chegam no servidor, e o que o app grava volta pra cá.
7. Testo tudo pelo mkt: login, cronograma, chat do Claude, radar do Instagram, análise de vídeo e a área de vídeos finais.
8. Na troca, o computador daqui para de servir o app pela internet, pra não ter duas versões gravando ao mesmo tempo. O link de emergência fica como reserva.

### Dois passos rápidos seus durante a Parte 2

- **GitHub:** eu gero uma chave de acesso no servidor e te mando o texto dela. Você cola no repositório gestao, em Settings, Deploy keys, Add deploy key, marcando "Allow write access" (o servidor também devolve o que o app grava).
- **Claude no servidor:** no servidor o chat do Claude passa a ser pago por uso. O caminho mais simples é a API da Anthropic:
  1. Entre em https://console.anthropic.com, cadastre o pagamento e defina um limite de gasto por mês (em Settings, Limits).
  2. Crie uma chave em API Keys com o nome `gestao-marketing-servidor`.
  3. Não me mande a chave. Eu te passo um comando, você abre o terminal do servidor pelo botão **Connect using SSH** do Lightsail e cola a chave lá.

  Alternativa: o Claude pelo Bedrock, na mesma fatura da AWS. Dá mais passos (liberar o modelo e criar um usuário de acesso), por isso a API é a recomendada.
