# French Départements App

A simple React Native app to search and explore French départements by number or name.

## Features

- 📍 Complete list of all 101 French départements (including overseas territories)
- 🔍 Search by département number, name, or region
- 📱 Clean and intuitive mobile interface
- 🎯 Tap on any département to see detailed information
- 🇫🇷 French language interface

## Installation & Setup

1. Make sure you have Node.js and npm installed
2. Install Expo CLI globally (if not already installed):
   ```bash
   npm install -g @expo/cli
   ```

3. Navigate to the project directory:
   ```bash
   cd french-departements
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

## Running the App

### Development Mode

```bash
npm start
```

This will open the Expo developer tools. You can then:
- Scan the QR code with the Expo Go app on your phone
- Press `i` to run on iOS simulator
- Press `a` to run on Android emulator
- Press `w` to run in web browser

### Platform-specific commands

```bash
# iOS
npm run ios

# Android  
npm run android

# Web
npm run web
```

## Usage

1. **Browse**: Scroll through the complete list of French départements
2. **Search**: Use the search bar to find départements by:
   - Number (e.g., "75" for Paris)
   - Name (e.g., "Seine" to find all départements containing "Seine")
   - Region (e.g., "Bretagne" to find all départements in Brittany)
3. **View Details**: Tap on any département to see its detailed information
4. **Navigate Back**: Use the "Retour" button to return to the main list

## Data Structure

Each département contains:
- `number`: Official département number (e.g., "75", "2A")
- `name`: Official département name
- `region`: The région it belongs to

## Project Structure

```
french-departements/
├── App.js                 # Main app component
├── data/
│   └── departements.js    # Complete list of French départements
├── package.json
└── README.md
```

## Technologies Used

- **React Native**: Mobile app framework
- **Expo**: Development platform and tools
- **JavaScript**: Programming language

## Contributing

Feel free to contribute by:
- Adding new features
- Improving the UI/UX  
- Fixing bugs
- Adding tests

## License

This project is open source and available under the MIT License.

