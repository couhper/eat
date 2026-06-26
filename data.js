/**
 * Restaurant data.
 *
 * To add/remove a place, just edit the arrays below.
 * Only `name` is required to display; the rest are optional and future-friendly.
 *
 * Shape of a restaurant:
 * {
 *   name:      "In-N-Out",
 *   category:  "food",         // set automatically below — leave it off when editing
 *   latitude:  34.0522,        // optional, needed only for distance filtering
 *   longitude: -118.2437,      // optional
 *   address:   "",             // optional
 *   rating:    0,              // optional (0–5)
 *   notes:     ""              // optional
 * }
 */

// Coordinates are rough LA-area samples so the distance filter has something to chew on.
const RESTAURANTS = {
  food: [
    { name: "In-N-Out",     latitude: 34.0410, longitude: -118.2640, rating: 4.6, notes: "Animal style, obviously." },
    { name: "Chick-fil-A",  latitude: 34.0689, longitude: -118.4452, rating: 4.5 },
    { name: "Chipotle",     latitude: 34.0505, longitude: -118.2551, rating: 4.2 },
    { name: "Shake Shack",  latitude: 34.0633, longitude: -118.3590, rating: 4.4 },
    { name: "Raising Cane's", latitude: 34.0211, longitude: -118.2860, rating: 4.5 },
    { name: "Kura Sushi",   latitude: 34.0577, longitude: -118.3010, rating: 4.3, notes: "Conveyor belt fun." },
    { name: "Din Tai Fung", latitude: 34.1455, longitude: -118.1520, rating: 4.7, notes: "Get the soup dumplings." },
  ],
  boba: [
    { name: "Gong Cha",          latitude: 34.0590, longitude: -118.2780, rating: 4.4 },
    { name: "Sharetea",          latitude: 34.0668, longitude: -118.3000, rating: 4.3 },
    { name: "Happy Lemon",       latitude: 34.0490, longitude: -118.2400, rating: 4.2 },
    { name: "Sunright Tea Studio", latitude: 34.1390, longitude: -118.1280, rating: 4.6, notes: "Tiger sugar boba." },
    { name: "TP Tea",            latitude: 34.0700, longitude: -118.2900, rating: 4.4 },
    { name: "Yi Fang",           latitude: 34.0620, longitude: -118.3080, rating: 4.5, notes: "Fruit teas." },
  ],
  dessert: [
    { name: "SomiSomi",        latitude: 34.0625, longitude: -118.3010, rating: 4.6, notes: "Ah-boong + soft serve." },
    { name: "Meet Fresh",      latitude: 34.1420, longitude: -118.1300, rating: 4.5, notes: "Taro everything." },
    { name: "85°C Bakery",     latitude: 34.0560, longitude: -118.2700, rating: 4.4 },
    { name: "Beard Papa's",    latitude: 34.0690, longitude: -118.2950, rating: 4.3, notes: "Cream puffs." },
    { name: "Cold Stone",      latitude: 34.0480, longitude: -118.2520, rating: 4.2 },
    { name: "Pinkberry",       latitude: 34.0710, longitude: -118.3650, rating: 4.1 },
  ],
};

// Stamp each restaurant with its category so the rest of the app doesn't have to track it.
for (const [category, list] of Object.entries(RESTAURANTS)) {
  list.forEach((r) => (r.category = category));
}
