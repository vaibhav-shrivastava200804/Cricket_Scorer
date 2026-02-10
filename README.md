# 🏏 Cricket Scorer API

A RESTful API for cricket match scoring and management. Built with Node.js, Express, and MySQL.

## 📁 Project Structure

```
Cricket-Scorer/
├── README.md
├── backend/
│   ├── app.js                    # Main application entry point
│   ├── package.json              # Dependencies and scripts
│   ├── .env                       # Environment variables
│   └── src/
│       ├── config/
│       │   └── db.js             # MySQL database connection
│       ├── controllers/          # Request handlers
│       │   ├── auth.controller.js
│       │   ├── batsman.controller.js
│       │   ├── innings.controller.js
│       │   ├── match.controller.js
│       │   ├── opening.controller.js
│       │   ├── over.controller.js
│       │   └── scoring.controller.js
│       ├── middleware/
│       │   ├── auth.middleware.js
│       │   └── error.middleware.js
│       ├── routes/               # API routes
│       │   ├── auth.routes.js
│       │   ├── batsman.routes.js
│       │   ├── innings.routes.js
│       │   ├── match.routes.js
│       │   ├── opening.routes.js
│       │   ├── over.routes.js
│       │   └── scoring.routes.js
│       ├── services/             # Business logic
│       │   ├── bowler.service.js
│       │   ├── innings.service.js
│       │   ├── matchResult.service.js
│       │   └── wicket.service.js
│       └── utils/                # Utility functions
│           ├── innings.utils.js
│           ├── over.utils.js
│           └── strike.utils.js
└── frontend/                     # Frontend application
```

## 🚀 Features

- **Match Management**: Create tournaments, teams, matches
- **innings Control**: Start/manage innings, end innings
- **Ball-by-Ball Scoring**: Record runs, extras (wides, no-balls), wickets
- **Player Management**: Track batting and bowling performances
- **Over Management**: Automatic over completion and bowler rotation
- **Wicket Handling**: Detailed wicket events (BOWLED, CAUGHT, RUN_OUT, etc.)
- **Match Results**: Automatic winner calculation and result generation

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (using mysql2 driver)
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcrypt for password hashing
- **CORS**: cors for cross-origin requests

## 📦 Installation

1. Clone the repository:
```bash
cd Cricket-Scorer/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in `backend/` directory:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cricket_scorer
JWT_SECRET=your_jwt_secret
```

4. Set up the MySQL database:
```sql
CREATE DATABASE cricket_scorer;

-- Run your schema creation scripts here
-- (tables: matches, innings, overs, players, teams, tournaments, 
--  batting_scorecards, bowling_scorecards, wicket_events, users)
```

5. Start the server:
```bash
npm run dev  # Using nodemon
# OR
node app.js  # Production
```

## 🔗 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login and get JWT token |

### Match Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/match/tournament` | Create tournament |
| POST | `/match/team` | Create team |
| POST | `/match/player` | Add player to team |
| POST | `/match/create` | Create new match |

### innings Control
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/innings/start` | Start match (begin innings) |
| POST | `/innings/end` | Manually end innings |
| POST | `/innings/select-new-batsman` | Select new batsman after wicket |

### Opening
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/opening/select` | Set openers (striker, non-striker, bowler) |

### Scoring
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/scoring/ball` | Record a ball (runs, wicket, extras) |

### Over Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/over/next` | Start next over with new bowler |

## 📊 Database Schema

### Main Tables
- **users** - Admin users for authentication
- **tournaments** - Cricket tournaments
- **teams** - Teams within tournaments
- **players** - Players belonging to teams
- **matches** - Match details
- **innings** - innings records (2 per match)
- **overs** - Overs bowled in innings
- **batting_scorecards** - Batting statistics
- **bowling_scorecards** - Bowling statistics
- **wicket_events** - Wicket details

## 🎮 Workflow Example

### Starting a Match
1. Create tournament, teams, and players
2. Create a match with toss details
3. Call `/innings/start` to begin innings 1
4. Call `/opening/select` with striker, non-striker, and bowler IDs

### Scoring a Ball
```javascript
POST /scoring/ball
{
  "inningsId": 1,
  "runs": 4,
  "extraType": null,  // "WIDE", "NO_BALL", or null
  "isWicket": false,
  "wicketType": "BOWLED",  // if isWicket=true
  "outBatsmanId": 5,       // if isWicket=true
  "outEnd": "striker_end"  // if isWicket=true
}
```

### Wicket Fall Flow
1. When `isWicket: true`, response includes:
   - `wicketFallen: true`
   - `eligibleBatsmen` array
2. User selects new batsman
3. Call `/innings/select-new-batsman`:
```javascript
POST /innings/select-new-batsman
{
  "inningsId": 1,
  "newBatsmanId": 7
}
```

### Over Completion
When over completes, response includes:
- `overCompleted: true`
- `eligibleBatsmen` for new batsman selection
- `eligibleBowlers` for new bowler selection

## 🔐 Authentication

All match management endpoints require JWT authentication:
- Header: `Authorization: Bearer <token>`
- Role required: `ADMIN`

## 📝 Response Formats

### Success Response
```json
{
  "message": "Ball recorded",
  "strikerId": 1,
  "nonStrikerId": 2,
  "overCompleted": false,
  "inningsEnded": false,
  "target": null
}
```

### Wicket Response
```json
{
  "message": "Wicket fallen! RUN_OUT",
  "wicketFallen": true,
  "wicketType": "RUN_OUT",
  "outEnd": "striker_end",
  "eligibleBatsmen": [
    { "id": 7, "name": "Virat Kohli" },
    { "id": 8, "name": "Rohit Sharma" }
  ]
}
```

### Match End Response
```json
{
  "message": "match ended",
  "inningsEnded": true,
  "target": 180,
  "matchResult": {
    "winnerTeamId": 2,
    "resultText": "Won by 5 wickets"
  }
}
```

## 🚧 Known Issues

1. **Match Result Not Returned**: The `matchResult()` function is called but its return value is sometimes ignored. Fix in `scoring.controller.js`:
   - Capture return value: `const matchResultData = await matchResult(...)`
   - Include in response: `matchResult: matchResultData`

2. **Unreachable Code**: In END OF OVER LOGIC, the second innings check is after a `return` statement, making it unreachable.

## 📄 License

MIT License

## 👨‍💻 Author

Vaibhav2009

