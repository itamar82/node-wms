# WMS API - Inventory Management System

A bare-bones inventory management system designed to be extended into a larger Warehouse Management System (WMS). This system provides core functionality for inventory tracking, pallet management, receiving, and putaway operations.

## Features

- **License Plate Number (LPN) Tracking**: Unique identifier system for containers/pallets
- **Container Hierarchy**: Support for nested containers (Pallet → Case → Each)
- **Pallet Management**: 
  - Automatic pallet creation during receiving
  - Mixed and single-SKU pallet strategies
  - Capacity management (weight, volume, items)
  - Pallet movement and location tracking
- **Receiving Operations**:
  - Purchase order based receiving
  - Automatic palletization strategies
  - Receipt line item tracking
- **Inventory Tracking**:
  - Real-time inventory by location and container
  - Transaction history
  - Lot and expiry date tracking
- **Task Management**:
  - Putaway tasks
  - Pallet movement tasks
  - Priority-based task assignment

## Project Structure

```
wms-api/
├── src/
│   ├── entities/          # TypeORM entities
│   │   ├── Container.entity.ts
│   │   ├── Item.entity.ts
│   │   ├── Location.entity.ts
│   │   ├── Task.entity.ts
│   │   └── ...
│   ├── services/          # Business logic
│   │   ├── PalletService.ts
│   │   └── ReceivingService.ts
│   ├── repositories/      # Data access layer
│   │   └── DatabaseRepository.ts
│   ├── config/           # Configuration
│   │   └── database.ts
│   ├── types/            # Type definitions
│   │   ├── enums.ts
│   │   └── interfaces.ts
│   ├── demo/             # Demo scripts
│   │   └── palletDemo.ts
│   └── index.ts          # Main exports
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### Running the Demo

```bash
# Run the pallet management demo
npm run demo
```

### Basic Usage

```typescript
import { InventoryManagementSystem, initializeDatabase } from 'wms-api';

async function main() {
  // Initialize database
  const dataSource = await initializeDatabase();
  
  // Create system instance
  const wms = new InventoryManagementSystem(dataSource);
  
  // Initialize test data
  await wms.initializeTestData();
  
  // Create a pallet
  const pallet = await wms.palletService.createPallet(
    'PALLET',
    'RECV-01',
    'USER-001'
  );
  
  // Add items to pallet
  await wms.palletService.addItemToPallet(
    pallet.lpn,
    'WIDGET-001',
    100,
    'LOT-001',
    new Date('2025-12-31')
  );
}
```

## Key Entities

### Container
- Represents physical containers (pallets, cases, totes, boxes)
- Tracks capacity (weight, volume, items)
- Supports nested hierarchy
- Has unique LPN (License Plate Number)

### Item
- Product master data
- Includes pallet configuration (cases per pallet, units per case)
- Storage requirements and classifications

### Location
- Warehouse locations (receiving, storage, shipping)
- Pallet position tracking
- Capacity management

### Task
- Work instructions for warehouse operations
- Supports various types: putaway, pick, move, pallet operations
- Priority-based execution

## Development

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Run tests
npm test

# Development mode
npm run dev
```

## Environment Variables

- `DATABASE_PATH`: Path to SQLite database file (default: `inventory_wms.db`)
- `DATABASE_LOGGING`: Enable query logging (`true`/`false`)
- `NODE_ENV`: Environment (`development`/`production`)

## Extending the System

This system is designed to be extended. Key extension points:

1. **Add new entities**: Create new entities in `src/entities/`
2. **Add services**: Implement business logic in `src/services/`
3. **Custom repositories**: Extend `DatabaseRepository` for specialized queries
4. **New transaction types**: Add to the `TransactionType` enum
5. **API layer**: Add REST/GraphQL API on top of services

## License

MIT