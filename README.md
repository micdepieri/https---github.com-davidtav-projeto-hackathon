# 🌎 Cool Cities — IA para Gestão Climática Pública

**Hackathon Devs de Impacto 2025 — Clima | NewHack x ApplyBrasil**

## 🧩 Sobre o Projeto

O **Cool Cities** é uma solução desenvolvida para apoiar **gestores públicos** na tomada de decisão climática com base em dados reais de território.  
Usando **Inteligência Artificial**, **Google Earth Engine** e dados de fontes públicas como **MapBiomas**, **INPE** e **IBGE**, o sistema identifica áreas críticas de calor urbano e propõe ações de **infraestrutura verde**, como plantio de árvores e aumento de áreas permeáveis.

Nosso objetivo é tornar as cidades **mais resilientes**, **verdes** e **inteligentes**, fornecendo ferramentas acessíveis e transparentes para a **gestão pública ambiental**.

---

## 🧠 Contexto

O Brasil enfrenta uma crise climática sem precedentes. De enchentes a ilhas de calor, gestores municipais carecem de dados e ferramentas para agir com precisão e agilidade.

Com mais de **8,5 milhões de km²** para monitorar e uma rede pública sobrecarregada, é inviável realizar inspeções in loco em larga escala.  
A IA surge como uma aliada, atuando como um **analista incansável**, capaz de processar grandes volumes de dados e traduzir informações complexas em **insights práticos e visualizáveis**.

---

## 🚀 Solução

O **Cool Cities** combina imagens de satélite e dados abertos para gerar **mapas de densidade verde e temperatura superficial**, permitindo:

- 🏙️ Visualização da **distribuição de vegetação e áreas urbanizadas**;  
- 🔥 Identificação automática de **ilhas de calor**;  
- 🌳 Simulação de impacto de **novos plantios de árvores** sobre a temperatura local;  
- 🗺️ Comparação entre **micro-regiões, bairros e zonas urbanas**;  
- 💼 Relatórios personalizáveis para **gestores públicos** no modelo de **cobrança por área analisada**.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React + Tailwind  
- **Backend:** Firebase + Node.js  
- **Banco de Dados:** Firestore  
- **Processamento Geoespacial:** Google Earth Engine  
- **Fontes de Dados:**
  - MapBiomas (uso e cobertura do solo)
  - INPE/DETER (alertas de desmatamento)
  - IBGE (demografia e setores censitários)
  - INMET (dados meteorológicos)
  - CEMADEN (mapas de risco)
  - ANA (bacias hidrográficas)

---

## 📊 Modelo de Negócio (Lucro Real)

O plano de cobrança é baseado em **tamanho da área analisada**, adaptando-se à capacidade orçamentária do município:

| Categoria | Tamanho médio da área | Valor estimado (R$) |
|------------|----------------------|----------------------|
| Pequenos municípios (média 10 menores) | até 100 km² | 2.500 / mês |
| Grandes municípios (média 10 maiores) | acima de 1.000 km² | 8.000 / mês |

---

## 🧩 Impacto Esperado

- 🌡️ Redução de até **3°C** em micro-regiões urbanas com manejo de vegetação adequado;  
- 🌳 Aumento da **cobertura verde urbana** em até **20%** em 3 anos;  
- 🏛️ Apoio direto a políticas públicas ambientais e planos municipais de arborização;  
- 📈 Base de dados para construção de **indicadores de sustentabilidade urbana**.

---

## 🤖 Alinhamento com os 7 Princípios da IA Responsável

1. **Sem vieses:** uso de dados públicos e diversos;  
2. **Foco humano:** apoio à decisão, não substituição;  
3. **Transparência:** dados e modelos abertos;  
4. **Soberania de dados locais:** controle e privacidade municipal;  
5. **Responsabilidade:** rastreabilidade das decisões;  
6. **Colaboração:** integração entre sociedade civil e governos;  
7. **Empoderamento humano:** IA a serviço da cidadania e do clima.

---

## 🌐 Equipe

**Equipe Cool Cities** — Hackathon Devs de Impacto 2025  
- [Michael Pieri](https://github.com/) — Desenvolvimento e Gestão Pública  
- [David Tavares](https://github.com/) — Desenvolvimento.
- Luan Sanches. — Gestão Financeira
- João Madureira.— Gestão de Negócios 

---

## 🏁 Como Executar o Projeto

```bash
# Clone o repositório
git clone https://github.com/seuusuario/cool-cities.git

# Acesse a pasta do projeto
cd cool-cities

# Instale as dependências
npm install

# Configure as credenciais do Google Earth Engine e Firebase

# Execute o servidor local
npm run dev
