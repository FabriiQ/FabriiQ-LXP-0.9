'use client';

import { QueryClient } from '@tanstack/react-query';

// Cache durations in milliseconds
export const CACHE_DURATIONS = {
  BRIEF: 1000 * 60 * 1, // 1 minute
  SHORT: 1000 * 60 * 5, // 5 minutes
  MEDIUM: 1000 * 60 * 30, // 30 minutes
  LONG: 1000 * 60 * 60 * 24, // 24 hours
};

// Cache keys for better organization and invalidation
export const CACHE_KEYS = {
  ACTIVITIES: 'activities',
  SUBJECTS: 'subjects',
  CLASSES: 'classes',
  STUDENT: 'student',
  LEADERBOARD: 'leaderboard',
  ACHIEVEMENTS: 'achievements',
  POINTS: 'points',
  CALENDAR: 'calendar',
};

// Educational facts to display during loading
export const EDUCATIONAL_FACTS = [
  // Learning Tips
  "Did you know? The brain processes images 60,000 times faster than text.",
  "Regular study breaks can improve your learning efficiency by up to 20%.",
  "Learning a new skill takes about 20 hours of focused practice to reach basic proficiency.",
  "The 'spacing effect' shows that studying in shorter sessions over time is more effective than cramming.",
  "Writing notes by hand helps you remember information better than typing.",
  "Teaching others what you've learned increases your own understanding by up to 90%.",
  "Your brain continues to process information while you sleep, so studying before bed can be effective.",
  "Reading material out loud improves memory retention by 10-15%.",
  "Changing your study environment occasionally can improve recall by creating multiple memory cues.",
  "The 'testing effect' shows that quizzing yourself improves long-term retention more than re-reading.",
  "Your brain can only maintain focused attention for about 45 minutes before needing a short break.",
  "Visualizing concepts as you learn them activates more areas of your brain, improving memory.",
  "Learning multiple related skills simultaneously can actually speed up mastery of each one.",
  "The 'Pomodoro Technique' of 25-minute focused work periods followed by 5-minute breaks can boost productivity.",
  "Explaining complex concepts in simple terms (the Feynman Technique) reveals gaps in your understanding.",

  // Science Facts
  "Cheetahs reach 112 km/h in just 3 seconds.",
  "Fingernails grow about 3 mm per month.",
  "Neptune's winds exceed 1,100 mph, faster than sound.",
  "Earth orbits the Sun at about 67,000 mph (30 km/s).",
  "Light travels about 300,000 km/s (186,000 mi/s).",
  "The human brain has about 86 billion neurons.",
  "Water covers about 71% of Earth's surface.",
  "Venus's day (243 Earth days) is longer than its year (225 days).",
  "Jupiter could hold about 1,000 Earths inside.",
  "Jupiter's Great Red Spot is larger than Earth.",
  "Saturn's rings are made of water ice and rock.",
  "Butterflies taste with their feet.",
  "Sharks have existed for about 450 million years, before trees.",
  "Botanically, bananas are berries, but strawberries are not.",
  "Honey lasts indefinitely – 3,000-year-old honey was still edible.",
  "About 1.3 million Earths could fit inside the Sun.",
  "One light-year is about 9 trillion kilometers.",
  "The Moon is Earth's only natural satellite.",
  "Earth's air is about 78% nitrogen and 21% oxygen.",
  "Lightning is about 30,000°C – about 5× hotter than the Sun's surface.",
  "A spider's silk is 5 times stronger than steel (by weight).",
  "A giraffe's tongue is dark blue-black and about 45 cm long.",
  "Garden snails have about 14,000 tiny teeth on their tongue.",
  "A shrimp's heart is in its head.",
  "An octopus has three hearts.",

  // Math Facts
  "A circle has infinite lines of symmetry.",
  "Angles in any triangle sum to 180°.",
  "0 is an even number.",
  "All prime numbers (except 2) are odd.",
  "A googol is 10^100 (1 followed by 100 zeros).",
  "π (pi) ≈ 3.14 (the circle ratio).",
  "An octagon has 8 sides.",
  "A circle has no corners (vertices).",
  "Prime numbers have exactly two divisors: 1 and itself.",
  "Binary (base-2) uses only the symbols 0 and 1.",
  "Area of a circle = π × r².",
  "In a right triangle, a² + b² = c² (Pythagorean theorem).",
  "An equilateral triangle has 3 equal sides.",
  "A quadrilateral has 4 sides.",
  "A pentagon has 5 sides.",
  "A hexagon has 6 sides.",

  // History Facts
  "The Great Wall of China spans about 21,200 km in total.",
  "The Great Pyramid of Giza (built c. 2560 BCE) is about 4,500 years old.",
  "Stonehenge (England) was built around 2500 BCE.",
  "The first modern Olympics were held in Athens in 1896.",
  "Apollo 11 landed on the Moon in 1969.",
  "The first powered flight was by the Wright brothers in 1903.",
  "Sputnik, the first artificial satellite, launched in 1957.",
  "Columbus reached the Americas in 1492.",
  "The American Declaration of Independence was signed in 1776.",
  "The printing press was invented by Gutenberg around 1450.",
  "Shakespeare wrote about 38 plays and 154 sonnets.",
  "The first novel is often said to be 'The Tale of Genji' (Japan, c. 1020 AD).",
  "The 'Oxford English Dictionary' contains about 600,000 words.",
  "The phone was patented by Alexander Graham Bell in 1876.",
  "The Statue of Liberty was dedicated in 1886.",
  "Neil Armstrong was the first person on the Moon (1969).",

  // Geography Facts
  "Earth has seven continents.",
  "Earth has five oceans (Pacific, Atlantic, Indian, Arctic, Southern).",
  "Asia is the largest continent by area and population.",
  "Africa is the second largest continent.",
  "Greenland (about 2.17 million km²) is the world's largest island.",
  "Russia is the largest country (by area, about 17 million km²).",
  "The Sahara (North Africa) is the largest hot desert.",
  "Antarctica is the largest cold desert.",
  "The Nile (about 6,650 km) is the longest river on Earth.",
  "The Amazon River has the greatest water flow.",
  "Mount Everest (Nepal/China) is Earth's highest mountain (8,848 m).",
  "Mariana Trench (Pacific) is Earth's deepest point (about 11 km).",
  "The Equator divides Earth into Northern and Southern Hemispheres.",
  "The Prime Meridian (0°) runs through Greenwich, England.",
  "There are 24 main time zones on Earth.",
  "The U.S. has 50 states; 48 are contiguous.",

  // Literature & Language Facts
  "The shortest story ever written (by Hemingway) is: 'For sale: baby shoes, never worn.'",
  "A pangram uses every letter of the alphabet (e.g. 'The quick brown fox…').",
  "'Dr. Seuss' had 44 books; his real name was Theodor Geisel.",
  "A sonnet has 14 lines.",
  "The word 'alphabet' comes from Greek alpha + beta.",
  "The first printed book was the Gutenberg Bible (1455).",
  "The longest English word without a vowel letter is 'rhythm.'",
  "The word 'queue' has 4 silent letters.",
  "No English word rhymes perfectly with 'orange,' 'purple,' or 'silver.'",
  "'I am' is the shortest complete sentence in English.",
  "The word 'set' has over 400 definitions (English has many homonyms).",

  // Technology Facts
  "The first digital computer (ENIAC) was built in 1945.",
  "The Internet (ARPANET) started in 1969.",
  "The World Wide Web was invented in 1989 by Tim Berners-Lee.",
  "The first email was sent in 1971.",
  "GPS became fully operational in 1995.",
  "A smartphone today has more computing power than NASA did for the Apollo moon landings.",
  "The first smartphone (IBM Simon) appeared in 1994.",
  "Edison's light bulb was invented around 1879.",
  "Thomas Edison held over 1,000 patents.",
  "The first microprocessor (Intel 4004) was created in 1971.",
  "Google's first server was made of LEGO bricks.",

  // Art Facts
  "The Mona Lisa has no visible eyebrows (they were removed in cleaning).",
  "Picasso had six toes on one foot.",
  "The Scream (Munch) has four versions.",
  "The Starry Night (Van Gogh) was painted while he was in an asylum.",
  "The world's largest art museum is the Louvre (Paris).",
  "Michelangelo painted the Sistine Chapel ceiling lying on his back.",
  "Leonardo da Vinci wrote mirror-script (right-to-left) notes.",
  "The primary colors are red, blue, and yellow (for pigments).",
  "A rainbow has seven colors: red, orange, yellow, green, blue, indigo, violet.",

  // General Knowledge
  "Octopuses have three hearts and blue blood.",
  "Rainbows have seven colors (ROYGBIV).",
  "A group of crows is called a 'murder.'",
  "Honey never spoils – edible after thousands of years.",
  "90% of the world's volcanic activity occurs underwater.",
  "A day on Mercury is 59 Earth days (one rotation).",
  "Earth is about 4.5 billion years old.",
  "Sunlight takes about 8 minutes 20 seconds to reach Earth.",
  "Earth's core is as hot as the surface of the Sun (about 5,500°C).",
  "Lightning strikes the Earth about 8 million times per day.",
  "Humans share about 60% of their DNA with bananas.",
  "The Eiffel Tower can be 15 cm taller in summer (metal expands).",
  "Bamboo is the fastest-growing plant (up to 91 cm/day).",
  "Koalas sleep about 18–20 hours per day.",
  "A day on Venus is longer than its year.",
  "Antarctica has no reptiles or snakes.",
  "There are more trees on Earth than stars in the Milky Way.",
  "Humans blink about 15–20 times per minute.",
  "An ostrich's eye is larger than its brain.",
  "Venus rotates the opposite way to Earth and most planets."
];

// Create a configured QueryClient with optimal settings for student portal
export function createOptimizedQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: CACHE_DURATIONS.SHORT,
        cacheTime: CACHE_DURATIONS.MEDIUM,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: true,
        retry: 2,
        retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000),
        // Enable suspense mode for React Suspense integration
        suspense: false,
        // Use network mode that works with service worker
        networkMode: 'always',
      },
      mutations: {
        // Retry failed mutations
        retry: 1,
        retryDelay: 1000,
      },
    },
  });
}

// Helper function to get a random educational fact
export function getRandomFact(): string {
  const randomIndex = Math.floor(Math.random() * EDUCATIONAL_FACTS.length);
  return EDUCATIONAL_FACTS[randomIndex];
}

// Helper function to estimate time with slight underestimation (Chronoception)
export function estimateTimeRemaining(actualSeconds: number): number {
  // Underestimate by 5-15% to create positive surprise when loading finishes earlier
  const underestimationFactor = 0.85 + (Math.random() * 0.1);
  return Math.floor(actualSeconds * underestimationFactor);
}
