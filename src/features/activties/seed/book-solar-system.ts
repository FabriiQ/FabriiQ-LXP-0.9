'use client';

import { BookActivity, BookSection, BookCheckpoint } from '../models/book';
import { generateId } from '../models/base';

/**
 * Solar System Book Activity Seed
 * 
 * This file provides a complete example of a Book activity about the Solar System
 * with multiple sections and embedded checkpoint activities.
 */

export const solarSystemBookActivity: BookActivity = {
  id: generateId(),
  title: 'Our Solar System: A Journey Through Space',
  description: 'Explore our solar system, from the Sun at its center to the planets, dwarf planets, and other objects that orbit it.',
  instructions: 'Read through each section and complete the checkpoint activities to test your knowledge.',
  activityType: 'book',
  learningActivityType: 'BOOK',
  sections: [
    // Section 1: Introduction to the Solar System
    {
      id: generateId(),
      title: 'Introduction to the Solar System',
      content: `
        <h2>Our Solar System</h2>
        <p>The solar system consists of the Sun and everything that orbits around it, including planets, dwarf planets, moons, asteroids, comets, and other objects.</p>
        
        <p>Our solar system formed about 4.6 billion years ago from a dense cloud of interstellar gas and dust. The cloud collapsed, possibly due to the shockwave of a nearby exploding star, called a supernova.</p>
        
        <figure>
          <img src="https://science.nasa.gov/wp-content/uploads/2023/05/solar-system-illustration.jpg" alt="Illustration of our solar system" style="width: 100%; max-width: 600px;" />
          <figcaption>An illustration of our solar system showing the Sun and planets (not to scale)</figcaption>
        </figure>
        
        <p>The solar system includes:</p>
        <ul>
          <li>The Sun - A yellow dwarf star at the center</li>
          <li>Eight planets - Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune</li>
          <li>Dwarf planets - Including Pluto, Ceres, Eris, Haumea, and Makemake</li>
          <li>Moons - Natural satellites that orbit planets and dwarf planets</li>
          <li>Asteroids - Rocky objects primarily found in the asteroid belt between Mars and Jupiter</li>
          <li>Comets - Icy bodies that release gas and dust when they approach the Sun</li>
          <li>Kuiper Belt and Oort Cloud - Regions containing icy bodies beyond Neptune</li>
        </ul>
      `,
      checkpoints: [
        {
          id: generateId(),
          activityId: '',
          title: 'Solar System Formation',
          description: 'Test your knowledge about how our solar system formed.',
          activityType: 'MULTIPLE_CHOICE',
          isRequired: true,
          position: 'after',
          content: {
            questions: [
              {
                id: generateId(),
                text: 'How old is our solar system?',
                options: [
                  { id: generateId(), text: '4.6 million years', isCorrect: false },
                  { id: generateId(), text: '4.6 billion years', isCorrect: true },
                  { id: generateId(), text: '13.8 billion years', isCorrect: false },
                  { id: generateId(), text: '100 million years', isCorrect: false }
                ],
                explanation: 'Our solar system formed approximately 4.6 billion years ago from a cloud of gas and dust.'
              },
              {
                id: generateId(),
                text: 'What likely triggered the collapse of the gas and dust cloud that formed our solar system?',
                options: [
                  { id: generateId(), text: 'A black hole', isCorrect: false },
                  { id: generateId(), text: 'A supernova shockwave', isCorrect: true },
                  { id: generateId(), text: 'A meteor impact', isCorrect: false },
                  { id: generateId(), text: 'Solar flares', isCorrect: false }
                ],
                explanation: 'Scientists believe a shockwave from a nearby supernova (exploding star) may have triggered the collapse of the gas and dust cloud.'
              }
            ]
          }
        }
      ]
    },
    
    // Section 2: The Sun - Our Star
    {
      id: generateId(),
      title: 'The Sun - Our Star',
      content: `
        <h2>The Sun: The Heart of Our Solar System</h2>
        
        <figure>
          <img src="https://science.nasa.gov/wp-content/uploads/2023/04/sun.jpg" alt="The Sun" style="width: 100%; max-width: 600px;" />
          <figcaption>The Sun as seen through NASA's Solar Dynamics Observatory</figcaption>
        </figure>
        
        <p>The Sun is a yellow dwarf star at the center of our solar system. It is a nearly perfect sphere of hot plasma, with internal convective motion that generates a magnetic field.</p>
        
        <h3>Key Facts About the Sun:</h3>
        <ul>
          <li>Diameter: About 1.4 million kilometers (865,000 miles)</li>
          <li>Mass: 333,000 times the mass of Earth</li>
          <li>Temperature: Core: 15 million °C (27 million °F); Surface: 5,500 °C (10,000 °F)</li>
          <li>Composition: Primarily hydrogen (73%) and helium (25%)</li>
          <li>Age: About 4.6 billion years old (middle-aged for a star)</li>
          <li>Expected lifespan: Another 5 billion years before becoming a red giant</li>
        </ul>
        
        <p>The Sun's energy comes from nuclear fusion in its core, where hydrogen atoms combine to form helium, releasing enormous amounts of energy in the process. This energy travels outward from the core and eventually reaches Earth as light and heat.</p>
        
        <p>The Sun's surface features include sunspots (cooler, darker regions associated with magnetic activity), solar flares (sudden releases of energy), and coronal mass ejections (large expulsions of plasma and magnetic field).</p>
      `,
      checkpoints: [
        {
          id: generateId(),
          activityId: '',
          title: 'Sun Facts Check',
          description: 'Test your knowledge about the Sun.',
          activityType: 'TRUE_FALSE',
          isRequired: true,
          position: 'after',
          content: {
            questions: [
              {
                id: generateId(),
                text: 'The Sun is composed primarily of hydrogen and helium.',
                isTrue: true,
                explanation: 'Correct! The Sun is composed of approximately 73% hydrogen and 25% helium, with the remaining 2% consisting of other elements.'
              },
              {
                id: generateId(),
                text: 'The Sun is a red giant star.',
                isTrue: false,
                explanation: 'Incorrect. The Sun is currently a yellow dwarf star. It will become a red giant in about 5 billion years.'
              },
              {
                id: generateId(),
                text: 'The Sun\'s energy comes from chemical reactions.',
                isTrue: false,
                explanation: 'Incorrect. The Sun\'s energy comes from nuclear fusion in its core, where hydrogen atoms combine to form helium.'
              }
            ]
          }
        }
      ]
    },
    
    // Section 3: The Planets
    {
      id: generateId(),
      title: 'The Planets',
      content: `
        <h2>The Eight Planets</h2>
        
        <p>Our solar system has eight official planets, which are divided into two groups:</p>
        
        <h3>Inner Planets (Terrestrial Planets)</h3>
        <p>The four inner planets are small, rocky worlds with solid surfaces:</p>
        <ul>
          <li><strong>Mercury</strong> - The smallest and closest planet to the Sun</li>
          <li><strong>Venus</strong> - Similar in size to Earth with a thick, toxic atmosphere</li>
          <li><strong>Earth</strong> - Our home planet, the only known world with liquid water on its surface</li>
          <li><strong>Mars</strong> - Known as the "Red Planet" due to iron oxide (rust) on its surface</li>
        </ul>
        
        <figure>
          <img src="https://science.nasa.gov/wp-content/uploads/2023/04/pia22232.jpg" alt="The inner planets" style="width: 100%; max-width: 600px;" />
          <figcaption>The inner planets: Mercury, Venus, Earth, and Mars (not to scale)</figcaption>
        </figure>
        
        <h3>Outer Planets (Gas and Ice Giants)</h3>
        <p>The four outer planets are much larger and don't have solid surfaces:</p>
        <ul>
          <li><strong>Jupiter</strong> - The largest planet, a gas giant with a distinctive Great Red Spot</li>
          <li><strong>Saturn</strong> - Famous for its beautiful ring system</li>
          <li><strong>Uranus</strong> - An ice giant that rotates on its side</li>
          <li><strong>Neptune</strong> - The windiest planet with speeds up to 2,100 km/h (1,300 mph)</li>
        </ul>
        
        <figure>
          <img src="https://science.nasa.gov/wp-content/uploads/2023/04/outer-planets.jpg" alt="The outer planets" style="width: 100%; max-width: 600px;" />
          <figcaption>The outer planets: Jupiter, Saturn, Uranus, and Neptune (not to scale)</figcaption>
        </figure>
      `,
      checkpoints: [
        {
          id: generateId(),
          activityId: '',
          title: 'Planet Classification',
          description: 'Match each planet to its correct classification.',
          activityType: 'MATCHING',
          isRequired: true,
          position: 'middle',
          content: {
            instructions: 'Match each planet to its correct classification.',
            items: [
              {
                id: generateId(),
                prompt: 'Mercury',
                match: 'Terrestrial Planet'
              },
              {
                id: generateId(),
                prompt: 'Jupiter',
                match: 'Gas Giant'
              },
              {
                id: generateId(),
                prompt: 'Earth',
                match: 'Terrestrial Planet'
              },
              {
                id: generateId(),
                prompt: 'Uranus',
                match: 'Ice Giant'
              },
              {
                id: generateId(),
                prompt: 'Venus',
                match: 'Terrestrial Planet'
              },
              {
                id: generateId(),
                prompt: 'Saturn',
                match: 'Gas Giant'
              }
            ]
          }
        },
        {
          id: generateId(),
          activityId: '',
          title: 'Planet Facts',
          description: 'Fill in the blanks about planet facts.',
          activityType: 'FILL_IN_THE_BLANKS',
          isRequired: true,
          position: 'after',
          content: {
            questions: [
              {
                id: generateId(),
                text: 'Complete these facts about the planets:',
                blanks: [
                  {
                    id: generateId(),
                    before: 'The planet with rings is ',
                    answer: ['Saturn'],
                    after: '.',
                    caseSensitive: false
                  },
                  {
                    id: generateId(),
                    before: 'The largest planet in our solar system is ',
                    answer: ['Jupiter'],
                    after: '.',
                    caseSensitive: false
                  },
                  {
                    id: generateId(),
                    before: 'The planet known as the Red Planet is ',
                    answer: ['Mars'],
                    after: '.',
                    caseSensitive: false
                  },
                  {
                    id: generateId(),
                    before: 'Earth is the ',
                    answer: ['third', '3rd'],
                    after: ' planet from the Sun.',
                    caseSensitive: false
                  }
                ]
              }
            ]
          }
        }
      ]
    },
    
    // Section 4: Space Exploration
    {
      id: generateId(),
      title: 'Space Exploration',
      content: `
        <h2>Exploring Our Solar System</h2>
        
        <p>Humans have been exploring space since the mid-20th century, sending both robotic missions and human astronauts to learn about our cosmic neighborhood.</p>
        
        <h3>Key Milestones in Space Exploration:</h3>
        <ul>
          <li><strong>1957</strong> - Sputnik 1, the first artificial satellite, launched by the Soviet Union</li>
          <li><strong>1961</strong> - Yuri Gagarin becomes the first human in space</li>
          <li><strong>1969</strong> - Apollo 11 mission lands humans on the Moon</li>
          <li><strong>1976</strong> - Viking landers conduct experiments on Mars</li>
          <li><strong>1977</strong> - Voyager 1 and 2 spacecraft launched to study outer planets</li>
          <li><strong>1990</strong> - Hubble Space Telescope launched</li>
          <li><strong>1997</strong> - Mars Pathfinder delivers first rover to Mars</li>
          <li><strong>2004</strong> - Cassini-Huygens mission arrives at Saturn</li>
          <li><strong>2015</strong> - New Horizons spacecraft flies by Pluto</li>
          <li><strong>2021</strong> - Perseverance rover lands on Mars with the Ingenuity helicopter</li>
        </ul>
        
        <figure>
          <img src="https://science.nasa.gov/wp-content/uploads/2023/04/perseverance-rover-mars.jpg" alt="Mars Perseverance Rover" style="width: 100%; max-width: 600px;" />
          <figcaption>NASA's Perseverance rover on Mars</figcaption>
        </figure>
        
        <p>Today, numerous missions continue to explore our solar system, including orbiters around Mars, Jupiter, and Saturn, rovers on Mars, and spacecraft studying the Sun, asteroids, and other celestial bodies.</p>
        
        <p>Future missions plan to return humans to the Moon, send astronauts to Mars, and explore potentially habitable moons like Europa and Enceladus.</p>
      `,
      checkpoints: [
        {
          id: generateId(),
          activityId: '',
          title: 'Space Exploration Timeline',
          description: 'Arrange these space exploration events in chronological order.',
          activityType: 'SEQUENCE',
          isRequired: true,
          position: 'after',
          content: {
            instructions: 'Arrange these space exploration events in chronological order, from earliest to most recent.',
            items: [
              {
                id: generateId(),
                text: 'Sputnik 1 launched',
                correctPosition: 0
              },
              {
                id: generateId(),
                text: 'First human in space (Yuri Gagarin)',
                correctPosition: 1
              },
              {
                id: generateId(),
                text: 'Apollo 11 Moon landing',
                correctPosition: 2
              },
              {
                id: generateId(),
                text: 'Voyager spacecraft launched',
                correctPosition: 3
              },
              {
                id: generateId(),
                text: 'Hubble Space Telescope launched',
                correctPosition: 4
              },
              {
                id: generateId(),
                text: 'New Horizons flies by Pluto',
                correctPosition: 5
              }
            ]
          }
        },
        {
          id: generateId(),
          activityId: '',
          title: 'Space Exploration Knowledge Check',
          description: 'Test your knowledge about space exploration.',
          activityType: 'MULTIPLE_RESPONSE',
          isRequired: true,
          position: 'after',
          content: {
            questions: [
              {
                id: generateId(),
                text: 'Which of the following spacecraft have visited or studied Mars? (Select all that apply)',
                options: [
                  { id: generateId(), text: 'Viking', isCorrect: true },
                  { id: generateId(), text: 'Perseverance', isCorrect: true },
                  { id: generateId(), text: 'Cassini', isCorrect: false },
                  { id: generateId(), text: 'Curiosity', isCorrect: true },
                  { id: generateId(), text: 'New Horizons', isCorrect: false }
                ],
                explanation: 'Viking, Perseverance, and Curiosity all explored Mars. Cassini studied Saturn, and New Horizons studied Pluto and the Kuiper Belt.'
              }
            ]
          }
        }
      ]
    }
  ],
  settings: {
    showTableOfContents: true,
    enableTextToSpeech: true,
    enableHighlighting: true,
    enableNotes: true,
    readingTimeEstimate: 30,
    showProgressBar: true,
    fontSizeAdjustable: true,
    checkpointStyle: 'inline',
    requireCheckpointCompletion: true,
    showCheckpointFeedback: true
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

export default solarSystemBookActivity;
