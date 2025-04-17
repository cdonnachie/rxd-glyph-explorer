# RDX Glyph Explorer

An explorer for Radiant (RXD) blockchain glyphs, allowing users to browse, search, and view details of glyphs stored on the Radiant blockchain.

![RDX Glyph Explorer](https://glyph.blockminerz.com/radiant-logo.png?height=100&width=800&text=RDX+Glyph+Explorer)

## Features

- Browse and search glyphs by name, description, or creator
- Filter glyphs by token type (NFT, FT, DAT)
- Sort glyphs by various criteria (newest, oldest, alphabetical)
- View detailed information about each glyph
- Dashboard with blockchain statistics
- Admin panel for managing blockchain import process
- Real-time blockchain data import

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Blockchain Integration**: Direct RPC calls to Radiant node

## Prerequisites

- Node.js (v18 or higher)
- MongoDB instance
- Radiant blockchain node with RPC access

## Installation

1. Clone the repository:

```bash
git clone https://github.com/cdonnachie/rxd-glyph-explorer.git
cd rxd-glyph-explorer

2. Install dependencies:


```shellscript
pnpm install
```

3. Create a `.env` file in the root directory with the following variables:


```plaintext
# MongoDB connection string
MONGODB_URI=mongodb://username:password@localhost:27017/rxd-glyph-explorer

# Radiant RPC configuration
RADIANT_RPC_HOST=127.0.0.1
RADIANT_RPC_PORT=8332
RADIANT_RPC_USER=your_rpc_username
RADIANT_RPC_PASSWORD=your_rpc_password
RADIANT_NETWORK=mainnet

# Admin API key for protected routes
ADMIN_API_KEY=your_secure_admin_key

# Logging configuration
LOG_LEVEL=info

NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_RXD_EXPLORER_TX_URL=https://radiantexplorer.com/tx/
NEXT_PUBLIC_RXD_EXPLORER_BLOCK_URL=https://radiantexplorer.com/block/
```

## Running the Application

### Development Mode

```shellscript
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Production Mode

```shellscript
pnpm build
pnpm start
```

## Blockchain Import Process

The application includes scripts to import blockchain data into the MongoDB database.

### Running the Import Script Manually

```shellscript
pnpm import
```

This will start the import process from the last imported block.

### Scheduling Automatic Imports

To set up automatic imports every 5 minutes:

```shellscript
pnpm import:schedule
```

### Setting up PM2
pm2 start "pnpm start" --name rxd-glyph-explorer
pm2 start "pnpm tsx scripts/schedule-import.ts" --name schedule-import

## Project Structure

```plaintext
rxd-glyph-explorer/
├── app/                    # Next.js app directory
│   ├── api/                # API routes
│   ├── admin/              # Admin pages
│   ├── globals.css         # Global styles
│   └── layout.tsx          # Root layout
├── components/             # React components
│   ├── admin/              # Admin components
│   ├── ui/                 # UI components (shadcn)
│   └── ...                 # Other components
├── lib/                    # Library code
│   ├── db/                 # Database models and repositories
│   │   ├── models/         # Mongoose models
│   │   ├── repositories/   # Repository pattern implementations
│   │   └── connect.ts      # Database connection
│   ├── services/           # Service layer
│   └── utils/              # Utility functions
├── scripts/                # Import scripts
│   ├── utils/              # Script utilities
│   ├── config.ts           # Script configuration
│   ├── import-blockchain.ts # Main import logic
│   ├── run-import.ts       # Script entry point
│   └── schedule-import.ts  # Scheduler
├── public/                 # Static assets
├── .env                    # Environment variables
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

## API Endpoints

### Public Endpoints

- `GET /api/glyphs` - Get all glyphs with pagination and filtering
- `GET /api/glyphs/:id` - Get a specific glyph by ID
- `GET /api/txos` - Get transaction outputs with pagination and filtering
- `GET /api/block-headers` - Get block headers with pagination
- `GET /api/stats` - Get blockchain statistics


### Protected Admin Endpoints

- `GET /api/admin/import` - Get current import state
- `POST /api/admin/import` - Start or reset the import process


## Admin Panel

The admin panel is available at `/admin` and requires authentication with the API key. It provides:

- Import status monitoring
- Manual import controls
- Reset functionality
- Database statistics


## Development

### Adding New Features

1. Create new components in the `components` directory
2. Add new API routes in the `app/api` directory
3. Create new pages in the `app` directory


### Database Models

The application uses the following main models:

- `Glyph` - Represents a glyph on the blockchain
- `TxO` - Represents a transaction output
- `BlockHeader` - Represents a block header
- `ImportState` - Tracks the state of the import process


## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request


## License

This project is licensed under the MIT License - see the LICENSE file for details.
