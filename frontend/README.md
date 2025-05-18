# Next.js Multi-Tenant Frontend

This is the frontend application for the Multi-Tenant Platform, built with Next.js 15+, React 19, TypeScript, Tailwind CSS, and React Query.

## Features

- **Multi-tenant Architecture**: Supports subdomain-based tenant routing
- **Authentication & Authorization**: Complete auth flows with JWT and role-based access control
- **React Query Integration**: For efficient data fetching and state management
- **Tailwind CSS**: For styling with a modern component library
- **TypeScript**: For type safety and improved developer experience
- **Internationalization**: Support for multiple languages
- **Theme Customization**: Support for light/dark mode and tenant branding

### System Admin Dashboard
- **Dashboard Overview**: KPI metrics, tenant growth, revenue, and system-wide analytics
- **Tenant Management**: Create, view, edit, and manage tenant accounts
- **Package Management**: Configure and compare subscription packages
- **Module Marketplace**: Browse, enable/disable, and configure modules
- **Domain Management**: Verify domains and manage SSL certificates

### Tenant Admin Dashboard (Coming Soon)
- User and permission management
- Team collaboration tools
- White-labeling and customization options
- Module configuration screens

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend services running (Auth Service, Tenant Service, etc.)

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```bash
   cd d:\www\multi-tenant\frontend
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Create a `.env.local` file with the necessary environment variables (see `.env.local` for reference)

### Development

To start the development server:

```bash
npm run dev
```

This will start the Next.js development server at http://localhost:3001.

### Docker Development

To start the frontend with Docker:

```bash
docker-compose up
```

This will build and run the frontend container, making it available at http://localhost:3001.

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js App Router
│   │   ├── (auth)/      # Authentication routes
│   │   ├── (system)/    # System admin routes
│   │   ├── (tenant)/    # Tenant-specific routes
│   │   ├── api/         # API routes
│   │   └── layout.tsx   # Root layout
│   ├── components/      # React components
│   │   ├── forms/       # Form components
│   │   ├── layouts/     # Layout components
│   │   └── ui/          # UI components
│   ├── lib/             # Utility functions and hooks
│   │   ├── api/         # API client
│   │   ├── auth/        # Authentication logic
│   │   ├── hooks/       # Custom hooks
│   │   ├── i18n/        # Internationalization
│   │   ├── providers/   # Context providers
│   │   └── utils.ts     # Utility functions
│   └── types/           # TypeScript type definitions
├── .env.local           # Environment variables
├── next.config.mjs      # Next.js configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

## Authentication Flow

The application uses JWT-based authentication with the following flow:

1. User logs in through the `/login` page
2. Auth Service returns JWT token and refresh token
3. Tokens are stored in localStorage
4. Axios interceptors automatically add token to requests
5. Token refresh is handled transparently when a 401 is received

## Multi-Tenant Support

The application handles multi-tenancy through:

1. Subdomain detection in middleware (`middleware.ts`)
2. Tenant-specific routing based on user roles
3. Separate layouts for different user types (System Admin, Tenant Admin, User)

## Deployment

The application can be deployed using Docker:

```bash
docker build -t multi-tenant-frontend .
docker run -p 3001:3001 multi-tenant-frontend
```

## Integration with Backend Services

The frontend communicates with the following backend services:

- **Auth Service**: For authentication and user management
- **Tenant Service**: For tenant-specific operations
- **User Service**: For user management within tenants
- **File Service**: For file uploads and management
- **Other module services**: For specific business logic

## Customization

Tenants can customize their experience through:

- Branding (logo, colors)
- Domain settings
- Module activation/deactivation
- User roles and permissions

## License

This project is licensed under the MIT License - see the LICENSE file for details.
