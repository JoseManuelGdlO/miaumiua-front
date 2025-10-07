# Miau Miau Center

Sistema de gestión integral para la distribución de arena aglutinante para gatos. Administra pedidos, rutas, conductores, inventario y clientes de manera eficiente.

## Características principales

- 🚚 **Gestión de Rutas**: Optimización automática de rutas de entrega
- 📦 **Control de Inventario**: Seguimiento en tiempo real del stock
- 👥 **Gestión de Conductores**: Administración completa del personal de entrega
- 🛒 **Gestión de Pedidos**: Procesamiento y seguimiento de órdenes
- 👤 **Gestión de Clientes**: Base de datos completa de clientes
- 📊 **Dashboard Analítico**: Métricas y reportes en tiempo real
- 🗺️ **Mapas Interactivos**: Visualización de rutas y ubicaciones
- 🔐 **Sistema de Autenticación**: Control de acceso por roles y permisos

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/6edda64b-b235-438d-8e34-57c05fb211f2) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Tecnologías utilizadas

Este proyecto está construido con:

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Framework**: shadcn/ui + Tailwind CSS
- **Estado**: React Query (TanStack Query)
- **Formularios**: React Hook Form + Zod
- **Mapas**: Mapbox GL JS
- **Drag & Drop**: @dnd-kit
- **Iconos**: Lucide React
- **Gráficos**: Recharts

## Despliegue

### Desarrollo local

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

### Despliegue con Docker

```bash
# Build con limpieza de cache
npm run docker:build:clean

# Despliegue completo
npm run docker:deploy
```

### Scripts disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run docker:build` - Build de imagen Docker
- `npm run docker:deploy` - Despliegue completo con Docker
- `npm run clean` - Limpiar cache local

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
