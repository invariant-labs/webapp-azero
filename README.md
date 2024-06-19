<div align="center">
    <h1>⚡Invariant webapp⚡</h1>
    <p>
        | <a href="https://docs.invariant.app/docs/aleph_zero">DOCS 📚</a> |
        <a href="https://invariant.app/math-spec-a0.pdf">MATH SPEC 📄</a> |
        <a href="https://discord.gg/VzS3C9wR">DISCORD 🌐</a> |
    </p>
</div>

Invariant protocol is an AMM built on [Aleph Zero](https://alephzero.org), leveraging high capital efficiency and the ability to list markets in a permissionless manner. At the core of the DEX is the Concentrated Liquidity mechanism, designed to handle tokens compatible with the [PSP22 standard](https://github.com/w3f/PSPs/blob/master/PSPs/psp-22.md). The protocol is structured around a single contract architecture.

## 🔨 Getting Started

### Prerequisites

- Node & NPM ([Node.js](https://nodejs.org/))

#### Node & NPM (with NVM)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
```

### Build protocol

- Clone repository

```bash
git clone git@github.com:invariant-labs/webapp-a0.git
```

- Install dependencies

```bash
npm i
```

- Build app

```bash
npm run build
```

- Run on local server

```bash
npm run dev
```