# Alimator - BOQ Cost Estimator

A portable desktop application for managing historical Bill of Quantities (BOQ) and estimating project costs based on historical data.

## Features

✅ **Project Management**: Create and organize BOQs by project and date
✅ **Data Import**: Import BOQs from Excel files with validation
✅ **Manual Entry**: Add items manually with real-time calculation
✅ **Search & History**: Search items and view complete price history
✅ **Cost Analysis**: View average, min, and max prices for any item
✅ **Inflation Adjustment**: Apply inflation % to historical prices
✅ **Portable**: Single executable file, no installation required

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: React (coming soon)
- **Database**: SQLite3
- **Desktop**: Electron (coming soon)
- **Data Processing**: XLSX for Excel handling

## Project Structure

```
Alimator/
├── server/
│   ├── database/
│   │   └── init.js          # Database initialization & queries
│   ├── routes/
│   │   ├── projects.js      # Project CRUD endpoints
│   │   ├── items.js         # Item CRUD endpoints
│   │   ├── search.js        # Search & autocomplete
│   │   └── import.js        # Excel import & template
│   └── index.js             # Main server file
├── client/                  # React frontend (coming soon)
├── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/AliAbdulMuhsen/Alimator.git
cd Alimator
```

2. Install dependencies
```bash
npm install
```

3. Start the server
```bash
npm run dev
```

The server will run on `http://localhost:5000`

## API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get project with items
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Items
- `GET /api/items/project/:projectId` - Get items for project
- `POST /api/items` - Create item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Search
- `GET /api/search/autocomplete?q=keyword` - Search item descriptions
- `GET /api/search/item?description=name` - Get price history
- `GET /api/search/all-items` - Get all unique items

### Import
- `POST /api/import/preview` - Preview Excel file
- `POST /api/import/execute` - Execute import
- `GET /api/import/template` - Download Excel template

## Next Steps (Phase 2-5)

- [ ] React frontend development
- [ ] Excel import feature
- [ ] Search & analysis features
- [ ] Inflation adjustment calculations
- [ ] Electron packaging for desktop

## License

MIT
