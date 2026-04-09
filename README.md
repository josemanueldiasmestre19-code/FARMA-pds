# Farmácia Agora

Plataforma digital para verificar disponibilidade de medicamentos nas farmácias de Maputo, Moçambique. Projecto académico construído com **React + Vite + Tailwind CSS + Leaflet**.

## Funcionalidades

- **Página Inicial** com hero moderno e pesquisa rápida
- **Pesquisa de medicamentos** com filtros e ordenação por distância
- **Mapa interactivo** de Maputo com marcadores das farmácias (Leaflet)
- **Página de detalhes da farmácia** com lista completa de stock
- **Dashboard** simulado para gestão de stock (actualizar quantidades e disponibilidade)
- Totalmente responsivo, mobile-first, com animações suaves

## Como correr

```bash
npm install
npm run dev
```

Abre automaticamente em `http://localhost:5173`.

## Estrutura

```
src/
 ├─ components/    # Navbar, Footer, MedicineCard, PharmacyMap
 ├─ pages/         # Home, Search, MapPage, PharmacyDetail, Dashboard
 ├─ data/          # mockData.js (farmácias e medicamentos simulados)
 ├─ App.jsx        # Rotas principais
 └─ main.jsx       # Entry point
```

## Dados simulados

Farmácias: Central Maputo, Sommerschield, Polana, Matola.
Medicamentos: Paracetamol, Amoxicilina, Losartan, Insulina, Ibuprofeno, Omeprazol, Metformina, Salbutamol.
