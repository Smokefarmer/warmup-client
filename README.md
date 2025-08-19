# 🔥 Warmup Client

A modern React TypeScript dashboard for managing wallet warmup operations. Built with Vite, Tailwind CSS, and React Query for optimal performance and developer experience.

## ✨ Features

### 🎯 **Core Functionality**
- **Dashboard Overview** - Real-time statistics and system health monitoring
- **Wallet Management** - Complete CRUD operations for wallet collection
- **Process Monitoring** - Track warmup processes with live updates
- **Funding Interface** - Manage wallet funding operations
- **Real-time Updates** - Live data synchronization with your backend

### 🎨 **Modern UI/UX**
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **Dark/Light Mode Ready** - Built with Tailwind CSS for easy theming
- **Professional Interface** - Clean, modern dashboard design
- **Interactive Components** - Smooth animations and transitions

### ⚡ **Performance**
- **React Query** - Intelligent caching and background updates
- **TypeScript** - Full type safety and better developer experience
- **Vite** - Lightning-fast development and build times
- **Optimized Bundles** - Tree-shaking and code splitting

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Your warmup backend server running

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd warmup-client
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp env.example .env.local
```

Edit `.env.local` and set your API URL:
```env
VITE_API_URL=http://localhost:3000
```

4. **Start development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to `http://localhost:5173`

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components (Button, Card, etc.)
│   ├── Dashboard/      # Dashboard-specific components
│   ├── Wallets/        # Wallet management components
│   ├── Processes/      # Process monitoring components
│   └── Funding/        # Funding interface components
├── hooks/              # React Query hooks for data fetching
│   ├── useWallets.ts
│   ├── useWarmupProcesses.ts
│   └── useFunding.ts
├── services/           # API service layer
│   ├── api.ts         # Base API configuration
│   ├── walletService.ts
│   ├── warmupService.ts
│   └── fundingService.ts
├── types/              # TypeScript type definitions
│   ├── wallet.ts
│   ├── warmup.ts
│   └── funding.ts
├── utils/              # Utility functions
│   ├── formatters.ts
│   └── validators.ts
├── pages/              # Page components
│   ├── Dashboard.tsx
│   ├── Wallets.tsx
│   ├── Processes.tsx
│   └── Funding.tsx
└── App.tsx             # Main application component
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Your backend API URL | `http://localhost:3000` |
| `VITE_DEBUG` | Enable debug mode | `false` |
| `VITE_DEFAULT_CHAIN_ID` | Default blockchain chain ID | `1` |

### API Integration

The client is designed to work with your existing warmup backend API. Make sure your backend provides these endpoints:

#### Wallet Management
- `GET /wallets` - List wallets with filters
- `POST /wallets` - Create single wallet
- `POST /wallets/batch` - Create batch wallets
- `PUT /wallets/:id/status` - Update wallet status
- `DELETE /wallets/:id` - Delete wallet

#### Warmup Processes
- `GET /warmup` - List warmup processes
- `POST /warmup` - Create warmup process
- `POST /warmup/:id/start` - Start process
- `POST /warmup/:id/stop` - Stop process

#### Funding
- `GET /funding/funder` - Get funder info
- `POST /funding/fund` - Fund wallets
- `GET /funding/history` - Get funding history

## 🎨 Customization

### Styling
The project uses Tailwind CSS with custom components. You can customize:

1. **Colors** - Edit `tailwind.config.js` color palette
2. **Components** - Modify component styles in `src/index.css`
3. **Themes** - Add dark mode or custom themes

### Adding New Features
1. **New API Endpoint** - Add to appropriate service file
2. **New Hook** - Create in `src/hooks/` directory
3. **New Page** - Add to `src/pages/` and update routing
4. **New Component** - Add to `src/components/` directory

## 📱 Responsive Design

The dashboard is fully responsive with:
- **Desktop** - Full sidebar navigation
- **Tablet** - Collapsible sidebar
- **Mobile** - Hamburger menu with overlay

## 🔒 Security

- **Environment Variables** - Sensitive data stored in `.env.local`
- **Input Validation** - Client-side validation with TypeScript
- **API Security** - CORS and authentication ready
- **Error Handling** - Graceful error handling and user feedback

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway up
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

## 🧪 Testing

### Run Tests
```bash
npm run test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

## 📊 Performance Monitoring

The dashboard includes:
- **Real-time Statistics** - Live updates from your backend
- **Performance Metrics** - Transaction times and success rates
- **System Health** - API and database status monitoring
- **Error Tracking** - Comprehensive error logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you need help:
1. Check the documentation
2. Search existing issues
3. Create a new issue with details
4. Contact the development team

---

**Built with ❤️ for the crypto community**
