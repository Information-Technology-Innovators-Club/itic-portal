import { Ionicons } from "@expo/vector-icons";

export const FACULTIES = [
  "School of Natural Sciences & Mathematics",
  "School of Art & Design",
  "School of Entrepreneurship & Business Sciences",
  "School of Engineering Science & Technology",
  "Graduate Business School",
  "School of Wildlife & Environmental Science",
  "School of Hospitality and Tourism",
  "Institute of Lifelong Learning & Development Studies",
  "Institute of Materials Science, Processing and Engineering Technology",
  "School of Agricultural Sciences & Technology",
  "School of Health Sciences & Technology",
];

// Icon + accent tag shown on each faculty card
export const FACULTY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  "School of Natural Sciences & Mathematics": "flask-outline",
  "School of Art & Design": "color-palette-outline",
  "School of Entrepreneurship & Business Sciences": "briefcase-outline",
  "School of Engineering Science & Technology": "construct-outline",
  "Graduate Business School": "school-outline",
  "School of Wildlife & Environmental Science": "leaf-outline",
  "School of Hospitality and Tourism": "restaurant-outline",
  "Institute of Lifelong Learning & Development Studies": "book-outline",
  "Institute of Materials Science, Processing and Engineering Technology":
    "hardware-chip-outline",
  "School of Agricultural Sciences & Technology": "nutrition-outline",
  "School of Health Sciences & Technology": "medkit-outline",
};
export const DEPARTMENTS: Record<string, string[]> = {
  "School of Natural Sciences & Mathematics": [
    "Department of Biology",
    "Department of Physics",
    "Department of Chemistry",
    "Department of Mathematics",
  ],

  "School of Art & Design": [
    "Creative Art and Design",
    "Clothing and Textile Technology",
  ],

  "School of Entrepreneurship & Business Sciences": [
    "Entrepreneurship and Business Management",
    "Accounting and Finance",
    "Supply Chain Management",
    "Marketing",
    "Consumer Science and Retail Management",
  ],

  "School of Engineering Science & Technology": [
    "Mechatronics Engineering",
    "Production Engineering",
    "ICT and Electronics",
    "Environmental Engineering",
    "Fuels and Energy Engineering",
  ],

  "Graduate Business School": ["Strategic Management", "Big Data Analytics"],

  "School of Wildlife & Environmental Science": [
    "Department of Wildlife Ecology and Conservation",
    "Department of Freshwater and Fishery Science",
    "Environmental Conservation and Geo-informatics",
    "Environmental Science and Technology",
  ],

  "School of Hospitality and Tourism": [
    "Department of Hospitality and Tourism",
    "Department of Travel and Recreation",
  ],

  "Institute of Lifelong Learning & Development Studies": [
    "Centre for Development Studies",
    "Skills Training and Development Programme",
    "Centre for Indigenous Knowledge and Living Heritage",
    "Centre for Language and Communication Studies",
  ],

  "Institute of Materials Science, Processing and Engineering Technology": [
    "Materials Science and Engineering",
  ],

  "School of Agricultural Sciences & Technology": [
    "Agricultural Engineering",
    "Food Science and Technology",
    "Crop Science and Post Harvest Technology",
  ],

  "School of Health Sciences & Technology": ["Biotechnology"],
};
