# MongoDB Setup Instructions

## Option 1: Local MongoDB Installation

### For macOS:
```bash
# Install MongoDB using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community

# Or start manually
mongod --config /usr/local/etc/mongod.conf
```

### For Ubuntu/Linux:
```bash
# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb

# Start MongoDB service
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### For Windows:
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Install and run as Windows Service
3. MongoDB will be available at `mongodb://localhost:27017`

## Option 2: MongoDB Atlas (Cloud - Recommended for production)

1. Go to https://www.mongodb.com/atlas
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update `.env.local` with your MongoDB Atlas URI:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/municipal_services?retryWrites=true&w=majority
```

## Verify Connection

Once MongoDB is running, your app will automatically:
- Connect to the database
- Create the `municipal_services` database
- Create the `complaints` collection
- Start saving complaint data

## View Stored Data

1. Access the complaints dashboard: http://localhost:3000/complaints-view
2. Or use MongoDB Compass to connect to your database
3. Or use the MongoDB shell: `mongosh`

## Environment Variables

Make sure your `.env.local` file contains:
```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=municipal_services
```
