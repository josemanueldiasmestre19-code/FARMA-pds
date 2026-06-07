# Vonamed

**Plataforma digital de pesquisa e reserva de medicamentos específicos nas farmácias de Maputo**

Projecto académico desenvolvido no âmbito da disciplina de Projecto de Desenvolvimento de Software — Licenciatura em Engenharia Informática, ISET/UJAC, 1.º Semestre 2026.

---

## Sobre o projecto

A Vonamed é uma Progressive Web App (PWA) que permite a cidadãos de Maputo pesquisar e reservar medicamentos específicos de uso contínuo — crónicos, cardíacos, dermatológicos — nas farmácias parceiras, e permite às farmácias publicar disponibilidade e responder a pedidos dos utilizadores.

O projecto responde a um problema documentado: doentes crónicos percorrem 3 a 4 farmácias por medicamento específico sem garantia de o encontrar. A Vonamed elimina essa incerteza antes da deslocação.

---

## Funcionalidades implementadas

### Para o utilizador (cidadão)
- Pesquisa de medicamentos por nome e categoria (crónicos, dermatológicos, cardíacos) sem registo obrigatório
- Resultados ordenados por distância com estado de disponibilidade (Em stock / Stock baixo / Indisponível)
- Mapa interactivo de Maputo com marcadores das farmácias parceiras (Leaflet / OpenStreetMap)
- Reserva de medicamento dentro da plataforma com geração de QR Code de confirmação
- Área pessoal com histórico de reservas
- Avaliações e comentários sobre farmácias

### Para a farmácia (dashboard)
- Publicação e gestão de medicamentos disponíveis com estado simples (sem exposição de quantidades exactas)
- Gestão de reservas pendentes e confirmação de levantamentos via QR Code
- Resposta a pedidos publicados por utilizadores *(parcialmente implementado)*

### Para o administrador
- Painel de aprovação de candidaturas de novas farmácias parceiras
- Gestão de farmácias na plataforma

### Geral
- Autenticação com três perfis: cidadão, pessoal de farmácia e administrador
- Rotas protegidas por perfil (ProtectedRoute, AdminRoute, PharmacyStaffRoute)
- Progressive Web App (PWA) instalável em Android e iOS
- Suporte a modo escuro e modo claro com persistência
- Interface disponível em português e inglês (I18nContext)
- Fallback com dados locais simulados quando o Supabase não está configurado

---

## Tecnologias utilizadas

| Tecnologia | Função |
|---|---|
| React 18 + Vite | Framework frontend e bundler |
| Tailwind CSS | Estilos responsivos (mobile-first) |
| React Router v6 | Navegação e rotas protegidas |
| Supabase | Backend, autenticação e base de dados PostgreSQL |
| Leaflet + React-Leaflet | Mapa interactivo de Maputo |
| qrcode.react | Geração de QR Code para reservas |
| Framer Motion | Animações de interface |
| react-hot-toast | Notificações |
| vite-plugin-pwa | Configuração de Progressive Web App |

---

## Estrutura de pastas

```
vonamed/
├── public/
│   └── pill.svg                  # Ícone da aplicação
├── src/
│   ├── components/               # Componentes reutilizáveis
│   │   ├── ui/                   # Componentes base (Button, Modal, Skeleton, EmptyState)
│   │   ├── Navbar.jsx            # Barra de navegação com autenticação e tema
│   │   ├── Footer.jsx
│   │   ├── PharmacyMap.jsx       # Mapa interactivo com Leaflet
│   │   ├── ReserveModal.jsx      # Modal de reserva de medicamento
│   │   ├── ReservationQR.jsx     # Geração e display de QR Code
│   │   ├── MedicineCard.jsx      # Card de medicamento nos resultados
│   │   ├── PharmacyReviews.jsx   # Avaliações e comentários
│   │   ├── AdminApplications.jsx # Gestão de candidaturas (admin)
│   │   ├── AddressSearch.jsx     # Pesquisa de endereço no mapa
│   │   ├── InstallPrompt.jsx     # Prompt de instalação PWA
│   │   ├── ProtectedRoute.jsx    # Rota protegida (utilizador autenticado)
│   │   ├── AdminRoute.jsx        # Rota exclusiva para administrador
│   │   └── PharmacyStaffRoute.jsx# Rota exclusiva para pessoal de farmácia
│   ├── context/                  # Estado global com React Context
│   │   ├── AuthContext.jsx       # Autenticação e sessão de utilizador
│   │   ├── DataContext.jsx       # Dados de farmácias e medicamentos
│   │   ├── ReservationsContext.jsx # Gestão de reservas
│   │   ├── ThemeContext.jsx      # Modo escuro / claro
│   │   └── I18nContext.jsx       # Internacionalização (PT/EN)
│   ├── pages/                    # Páginas da aplicação
│   │   ├── Home.jsx              # Página inicial com pesquisa e mapa
│   │   ├── Search.jsx            # Resultados de pesquisa de medicamentos
│   │   ├── MapPage.jsx           # Página de mapa completo
│   │   ├── PharmacyDetail.jsx    # Detalhe de farmácia e stock
│   │   ├── Dashboard.jsx         # Dashboard de gestão para farmácias
│   │   ├── Admin.jsx             # Painel de administração
│   │   ├── MyReservations.jsx    # Reservas do utilizador
│   │   ├── Profile.jsx           # Perfil do utilizador
│   │   ├── Login.jsx             # Autenticação
│   │   ├── Register.jsx          # Registo de conta
│   │   ├── PharmacyRegistration.jsx # Candidatura de nova farmácia
│   │   └── NotFound.jsx          # Página 404
│   ├── hooks/
│   │   ├── useUserLocation.js    # Geolocalização do utilizador
│   │   └── useLocalStorage.js    # Persistência local
│   ├── lib/
│   │   ├── supabase.js           # Cliente Supabase (via variáveis de ambiente)
│   │   ├── translations.js       # Traduções PT/EN
│   │   └── errors.js             # Tratamento de erros
│   ├── data/
│   │   └── mockData.js           # Dados simulados para fallback local
│   ├── App.jsx                   # Rotas principais
│   └── main.jsx                  # Entry point
├── supabase/                     # Scripts SQL do esquema de base de dados
│   ├── setup.sql                 # Esquema principal
│   ├── add_pharmacy_applications.sql
│   ├── add_reviews.sql
│   ├── add_admin_policies.sql
│   ├── upgrade_pharmacies.sql
│   ├── restrict_dashboard_access.sql
│   ├── enable_realtime.sql
│   └── add_reservation_update_policy.sql
├── index.html
├── vite.config.js                # Configuração Vite + PWA
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## Perfis de utilizador e acessos

| Perfil | Acesso |
|---|---|
| **Cidadão** | Pesquisa (sem registo), reservas, histórico, avaliações |
| **Farmácia** | Dashboard de gestão de stock, reservas e pedidos |
| **Administrador** | Aprovação de candidaturas e gestão de farmácias |

---

## Estado do protótipo

| Funcionalidade | Estado |
|---|---|
| Pesquisa de medicamentos por nome e categoria | ✅ Implementado |
| Mapa interactivo de farmácias (Leaflet) | ✅ Implementado |
| Reserva com QR Code | ✅ Implementado |
| Dashboard de gestão para farmácias | ✅ Implementado |
| Painel de administração | ✅ Implementado |
| Autenticação multi-perfil | ✅ Implementado |
| PWA instalável (Android e iOS) | ✅ Implementado |
| Modo escuro / claro | ✅ Implementado |
| Suporte PT/EN | ✅ Implementado |
| Fallback com dados locais | ✅ Implementado |
| Avaliações e comentários | ✅ Implementado |
| Publicação de pedido pelo utilizador | ⚠️ Parcial |
| Resposta a pedidos no dashboard da farmácia | ⚠️ Parcial |
| Notificações push | ❌ Previsto (trabalho futuro) |

---

## Grupo

Projecto desenvolvido pelo Grupo 1:
- Judião Ricardo
- Kerry Tembe
- José Mestre
- Yuran Mussagy

Docentes: Leila Omar e Vali Issufo
Ano lectivo: 2026 | 1.º Semestre