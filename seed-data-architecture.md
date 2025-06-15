# Seed Data Architecture

This document outlines the comprehensive seed data structure for a complete school institute with multiple campuses, programs, courses, subjects, and users.

## Institution Structure

### Institution
- **Name**: Sunshine International School
- **Code**: SIS
- **Status**: ACTIVE

### Campuses
1. **Boys Campus**
   - **Name**: Sunshine Boys Campus
   - **Code**: SIS-BOYS
   - **Status**: ACTIVE
   - **Address**: 123 Education Street, Education City
   - **Contact**: boys@sunshine.edu, +1-555-123-4567

2. **Girls Campus**
   - **Name**: Sunshine Girls Campus
   - **Code**: SIS-GIRLS
   - **Status**: ACTIVE
   - **Address**: 456 Learning Avenue, Education City
   - **Contact**: girls@sunshine.edu, +1-555-765-4321

## Academic Structure

### Academic Cycle
- **Name**: Academic Year 2024-2025
- **Code**: AY-2024-2025
- **Start Date**: August 1, 2024
- **End Date**: June 30, 2025
- **Status**: ACTIVE

### Terms
1. **Term 1**
   - **Name**: Fall Term 2024
   - **Code**: FALL-2024
   - **Start Date**: August 1, 2024
   - **End Date**: December 20, 2024
   - **Status**: ACTIVE

2. **Term 2**
   - **Name**: Spring Term 2025
   - **Code**: SPRING-2025
   - **Start Date**: January 10, 2025
   - **End Date**: June 30, 2025
   - **Status**: ACTIVE

### Programs
- **Name**: Primary Years Program
- **Code**: PYP
- **Description**: Comprehensive primary education program for grades 1-5
- **Status**: ACTIVE

### Courses
- **Name**: Class 3
- **Code**: PYP-CL3
- **Description**: Third grade curriculum for primary students
- **Credits**: 5
- **Status**: ACTIVE

### Subjects
1. **Mathematics**
   - **Code**: PYP-CL3-MATH
   - **Name**: Mathematics for Class 3
   - **Credits**: 1.0
   - **Status**: ACTIVE

2. **English**
   - **Code**: PYP-CL3-ENG
   - **Name**: English for Class 3
   - **Credits**: 1.0
   - **Status**: ACTIVE

3. **Science**
   - **Code**: PYP-CL3-SCI
   - **Name**: Science for Class 3
   - **Credits**: 1.0
   - **Status**: ACTIVE

4. **Physical Education**
   - **Code**: PYP-CL3-PE
   - **Name**: Physical Education for Class 3
   - **Credits**: 0.5
   - **Status**: ACTIVE

### Subject Topics

#### Mathematics Topics
1. **Chapter 1: Numbers and Operations**
   - **Code**: PYP-CL3-MATH-CH1
   - **NodeType**: CHAPTER
   - **Topics**:
     - **Addition and Subtraction** (PYP-CL3-MATH-CH1-T1)
       - **Context**: Addition and subtraction are fundamental arithmetic operations that form the basis for more advanced mathematical concepts. In Class 3, students build on their previous knowledge to work with larger numbers and develop mental math strategies.
       - **Learning Outcomes**:
         1. Add three-digit numbers with and without regrouping
         2. Subtract three-digit numbers with and without borrowing
         3. Solve word problems involving addition and subtraction
         4. Use mental math strategies for quick calculations
         5. Estimate sums and differences
       - **Subtopics**:
         - **Adding Three-Digit Numbers** (PYP-CL3-MATH-CH1-T1-S1)
           - **Context**: Adding three-digit numbers builds on students's previous knowledge of place value and requires understanding of the regrouping (carrying) process.
           - **Learning Outcomes**:
             1. Add three-digit numbers without regrouping
             2. Add three-digit numbers with regrouping in the ones place
             3. Add three-digit numbers with regrouping in both ones and tens places
             4. Use column addition method correctly
             5. Check addition by using the inverse operation (subtraction)
         - **Subtracting Three-Digit Numbers** (PYP-CL3-MATH-CH1-T1-S2)
     - **Multiplication and Division** (PYP-CL3-MATH-CH1-T2)
       - **Subtopics**:
         - **Multiplication Tables (1-10)** (PYP-CL3-MATH-CH1-T2-S1)
         - **Division Basics** (PYP-CL3-MATH-CH1-T2-S2)

2. **Chapter 2: Geometry and Measurement**
   - **Code**: PYP-CL3-MATH-CH2
   - **NodeType**: CHAPTER
   - **Topics**:
     - **2D Shapes** (PYP-CL3-MATH-CH2-T1)
       - **Subtopics**:
         - **Polygons** (PYP-CL3-MATH-CH2-T1-S1)
         - **Circles** (PYP-CL3-MATH-CH2-T1-S2)
     - **Measurement** (PYP-CL3-MATH-CH2-T2)
       - **Subtopics**:
         - **Length and Distance** (PYP-CL3-MATH-CH2-T2-S1)
         - **Weight and Volume** (PYP-CL3-MATH-CH2-T2-S2)

#### English Topics
1. **Chapter 1: Reading Comprehension**
   - **Code**: PYP-CL3-ENG-CH1
   - **NodeType**: CHAPTER
   - **Topics**:
     - **Story Elements** (PYP-CL3-ENG-CH1-T1)
       - **Subtopics**:
         - **Characters and Setting** (PYP-CL3-ENG-CH1-T1-S1)
         - **Plot and Theme** (PYP-CL3-ENG-CH1-T1-S2)
     - **Reading Strategies** (PYP-CL3-ENG-CH1-T2)
       - **Subtopics**:
         - **Predicting and Inferring** (PYP-CL3-ENG-CH1-T2-S1)
         - **Summarizing** (PYP-CL3-ENG-CH1-T2-S2)

2. **Chapter 2: Writing Skills**
   - **Code**: PYP-CL3-ENG-CH2
   - **NodeType**: CHAPTER
   - **Topics**:
     - **Sentence Structure** (PYP-CL3-ENG-CH2-T1)
       - **Subtopics**:
         - **Types of Sentences** (PYP-CL3-ENG-CH2-T1-S1)
         - **Punctuation** (PYP-CL3-ENG-CH2-T1-S2)
     - **Paragraph Writing** (PYP-CL3-ENG-CH2-T2)
       - **Subtopics**:
         - **Topic Sentences** (PYP-CL3-ENG-CH2-T2-S1)
         - **Supporting Details** (PYP-CL3-ENG-CH2-T2-S2)

#### Science Topics
1. **Chapter 1: Living Things**
   - **Code**: PYP-CL3-SCI-CH1
   - **NodeType**: CHAPTER
   - **Topics**:
     - **Plants** (PYP-CL3-SCI-CH1-T1)
       - **Context**: Plants are essential living organisms that provide food, oxygen, and habitats for animals. Understanding plant structures and functions helps students appreciate the importance of plants in ecosystems and develop environmental awareness. This topic introduces students to the basic concepts of botany through hands-on observations and experiments.
       - **Learning Outcomes**:
         1. Identify and describe the main parts of a plant (roots, stem, leaves, flowers, fruits, seeds)
         2. Explain the function of each plant part
         3. Describe the life cycle of flowering plants
         4. Understand how plants make their own food through photosynthesis
         5. Recognize the importance of plants in our daily lives and ecosystems
         6. Conduct simple experiments to demonstrate plant growth requirements
       - **Subtopics**:
         - **Plant Parts and Functions** (PYP-CL3-SCI-CH1-T1-S1)
         - **Plant Life Cycle** (PYP-CL3-SCI-CH1-T1-S2)
     - **Animals** (PYP-CL3-SCI-CH1-T2)
       - **Subtopics**:
         - **Animal Classification** (PYP-CL3-SCI-CH1-T2-S1)
         - **Animal Habitats** (PYP-CL3-SCI-CH1-T2-S2)

2. **Chapter 2: Earth and Space**
   - **Code**: PYP-CL3-SCI-CH2
   - **NodeType**: CHAPTER
   - **Topics**:
     - **Weather and Climate** (PYP-CL3-SCI-CH2-T1)
       - **Subtopics**:
         - **Weather Patterns** (PYP-CL3-SCI-CH2-T1-S1)
         - **Seasons** (PYP-CL3-SCI-CH2-T1-S2)
     - **Solar System** (PYP-CL3-SCI-CH2-T2)
       - **Subtopics**:
         - **Planets** (PYP-CL3-SCI-CH2-T2-S1)
         - **Day and Night** (PYP-CL3-SCI-CH2-T2-S2)

#### Physical Education Topics
1. **Chapter 1: Movement Skills**
   - **Code**: PYP-CL3-PE-CH1
   - **NodeType**: CHAPTER
   - **Topics**:
     - **Locomotor Skills** (PYP-CL3-PE-CH1-T1)
       - **Subtopics**:
         - **Running and Jumping** (PYP-CL3-PE-CH1-T1-S1)
         - **Skipping and Hopping** (PYP-CL3-PE-CH1-T1-S2)
     - **Ball Skills** (PYP-CL3-PE-CH1-T2)
       - **Subtopics**:
         - **Throwing and Catching** (PYP-CL3-PE-CH1-T2-S1)
         - **Kicking and Dribbling** (PYP-CL3-PE-CH1-T2-S2)

2. **Chapter 2: Team Games**
   - **Code**: PYP-CL3-PE-CH2
   - **NodeType**: CHAPTER
   - **Topics**:
     - **Cooperative Games** (PYP-CL3-PE-CH2-T1)
       - **Subtopics**:
         - **Team Building Activities** (PYP-CL3-PE-CH2-T1-S1)
         - **Problem Solving Games** (PYP-CL3-PE-CH2-T1-S2)
     - **Sports Introduction** (PYP-CL3-PE-CH2-T2)
       - **Subtopics**:
         - **Mini Soccer** (PYP-CL3-PE-CH2-T2-S1)
         - **Mini Basketball** (PYP-CL3-PE-CH2-T2-S2)

## Classes

### Boys Campus Classes
1. **Class 3A**
   - **Code**: SIS-BOYS-CL3A
   - **Course**: Class 3
   - **Capacity**: 25
   - **Status**: ACTIVE

2. **Class 3B**
   - **Code**: SIS-BOYS-CL3B
   - **Course**: Class 3
   - **Capacity**: 25
   - **Status**: ACTIVE

### Girls Campus Classes
1. **Class 3A**
   - **Code**: SIS-GIRLS-CL3A
   - **Course**: Class 3
   - **Capacity**: 25
   - **Status**: ACTIVE

2. **Class 3B**
   - **Code**: SIS-GIRLS-CL3B
   - **Course**: Class 3
   - **Capacity**: 25
   - **Status**: ACTIVE

## User Roles

### System Admin
- **Email**: admin@sunshine.edu
- **Name**: System Administrator
- **Username**: sys_admin
- **UserType**: SYSTEM_ADMIN
- **AccessScope**: SYSTEM
- **Status**: ACTIVE

### Program Coordinator
- **Email**: coordinator@sunshine.edu
- **Name**: Alex Johnson
- **Username**: alex_johnson
- **UserType**: COORDINATOR
- **AccessScope**: MULTI_CAMPUS
- **Status**: ACTIVE
- **Assigned Programs**: Primary Years Program
- **Assigned Campuses**: Boys Campus, Girls Campus

### Campus Admins
1. **Boys Campus Admin**
   - **Email**: boys_admin@sunshine.edu
   - **Name**: Michael Smith
   - **Username**: michael_smith
   - **UserType**: CAMPUS_ADMIN
   - **AccessScope**: SINGLE_CAMPUS
   - **Status**: ACTIVE
   - **Assigned Campus**: Boys Campus

2. **Girls Campus Admin**
   - **Email**: girls_admin@sunshine.edu
   - **Name**: Sarah Williams
   - **Username**: sarah_williams
   - **UserType**: CAMPUS_ADMIN
   - **AccessScope**: SINGLE_CAMPUS
   - **Status**: ACTIVE
   - **Assigned Campus**: Girls Campus

### Teachers
1. **Mathematics Teacher (Boys)**
   - **Email**: math_boys@sunshine.edu
   - **Name**: Robert Brown
   - **Username**: robert_brown
   - **UserType**: TEACHER
   - **AccessScope**: SINGLE_CAMPUS
   - **Status**: ACTIVE
   - **Assigned Campus**: Boys Campus
   - **Subject Qualifications**: Mathematics
   - **Class Teacher**: Class 3A (Boys)

2. **Mathematics Teacher (Girls)**
   - **Email**: math_girls@sunshine.edu
   - **Name**: Jennifer Davis
   - **Username**: jennifer_davis
   - **UserType**: TEACHER
   - **AccessScope**: SINGLE_CAMPUS
   - **Status**: ACTIVE
   - **Assigned Campus**: Girls Campus
   - **Subject Qualifications**: Mathematics
   - **Class Teacher**: Class 3A (Girls)

3. **English Teacher (Boys)**
   - **Email**: english_boys@sunshine.edu
   - **Name**: David Wilson
   - **Username**: david_wilson
   - **UserType**: TEACHER
   - **AccessScope**: SINGLE_CAMPUS
   - **Status**: ACTIVE
   - **Assigned Campus**: Boys Campus
   - **Subject Qualifications**: English

4. **English Teacher (Girls)**
   - **Email**: english_girls@sunshine.edu
   - **Name**: Emily Taylor
   - **Username**: emily_taylor
   - **UserType**: TEACHER
   - **AccessScope**: SINGLE_CAMPUS
   - **Status**: ACTIVE
   - **Assigned Campus**: Girls Campus
   - **Subject Qualifications**: English

5. **Science Teacher (Both Campuses)**
   - **Email**: science@sunshine.edu
   - **Name**: James Anderson
   - **Username**: james_anderson
   - **UserType**: TEACHER
   - **AccessScope**: MULTI_CAMPUS
   - **Status**: ACTIVE
   - **Assigned Campuses**: Boys Campus, Girls Campus
   - **Subject Qualifications**: Science

6. **PE Teacher (Both Campuses)**
   - **Email**: pe@sunshine.edu
   - **Name**: Lisa Martinez
   - **Username**: lisa_martinez
   - **UserType**: TEACHER
   - **AccessScope**: MULTI_CAMPUS
   - **Status**: ACTIVE
   - **Assigned Campuses**: Boys Campus, Girls Campus
   - **Subject Qualifications**: Physical Education

### Students
1. **Boys Campus - Class 3A (10 students)**
   - Student 1: John Smith (john_smith@student.sunshine.edu)
   - Student 2: William Johnson (william_johnson@student.sunshine.edu)
   - Student 3: Thomas Brown (thomas_brown@student.sunshine.edu)
   - Student 4: Daniel Davis (daniel_davis@student.sunshine.edu)
   - Student 5: Matthew Wilson (matthew_wilson@student.sunshine.edu)
   - Student 6: Andrew Taylor (andrew_taylor@student.sunshine.edu)
   - Student 7: Christopher Anderson (christopher_anderson@student.sunshine.edu)
   - Student 8: Joseph Martinez (joseph_martinez@student.sunshine.edu)
   - Student 9: Ryan Thompson (ryan_thompson@student.sunshine.edu)
   - Student 10: Nicholas Garcia (nicholas_garcia@student.sunshine.edu)

2. **Girls Campus - Class 3A (10 students)**
   - Student 1: Emma Smith (emma_smith@student.sunshine.edu)
   - Student 2: Olivia Johnson (olivia_johnson@student.sunshine.edu)
   - Student 3: Sophia Brown (sophia_brown@student.sunshine.edu)
   - Student 4: Isabella Davis (isabella_davis@student.sunshine.edu)
   - Student 5: Charlotte Wilson (charlotte_wilson@student.sunshine.edu)
   - Student 6: Amelia Taylor (amelia_taylor@student.sunshine.edu)
   - Student 7: Mia Anderson (mia_anderson@student.sunshine.edu)
   - Student 8: Harper Martinez (harper_martinez@student.sunshine.edu)
   - Student 9: Evelyn Thompson (evelyn_thompson@student.sunshine.edu)
   - Student 10: Abigail Garcia (abigail_garcia@student.sunshine.edu)

## Activity Types

### Learning Activities
1. **Reading Activity**
   - **ID**: reading
   - **Purpose**: LEARNING
   - **Description**: Text-based reading materials with optional checkpoints
   - **Capabilities**: Not gradable, has submission, has interaction

2. **Video Activity**
   - **ID**: video
   - **Purpose**: LEARNING
   - **Description**: Share video content with optional interactions
   - **Capabilities**: Not gradable, has submission, has interaction

3. **H5P Activity**
   - **ID**: h5p
   - **Purpose**: LEARNING
   - **Description**: Create interactive H5P content for learners
   - **Capabilities**: Gradable, has submission, has interaction

### Assessment Activities
1. **Multiple Choice Quiz**
   - **ID**: multiple-choice
   - **Purpose**: ASSESSMENT
   - **Description**: Create a quiz with multiple choice questions where only one answer is correct for each question
   - **Capabilities**: Gradable, has submission, has interaction

2. **Multiple Response Quiz**
   - **ID**: multiple-response
   - **Purpose**: ASSESSMENT
   - **Description**: Create a question with multiple options where students select all correct answers
   - **Capabilities**: Gradable, has submission, has interaction

3. **True/False Quiz**
   - **ID**: true-false
   - **Purpose**: ASSESSMENT
   - **Description**: Create a quiz with multiple statements that students must identify as true or false
   - **Capabilities**: Gradable, has submission, has interaction

4. **Fill in the Blanks Quiz**
   - **ID**: fill-in-the-blanks
   - **Purpose**: ASSESSMENT
   - **Description**: Create a quiz with multiple text passages containing blanks that students must complete
   - **Capabilities**: Gradable, has submission, has interaction

5. **Drag the Words**
   - **ID**: drag-the-words
   - **Purpose**: ASSESSMENT
   - **Description**: Create an activity where students drag words to fill in blanks in a text
   - **Capabilities**: Gradable, has submission, has interaction

6. **Matching Activity**
   - **ID**: matching
   - **Purpose**: ASSESSMENT
   - **Description**: Create a matching activity where students match items from two columns
   - **Capabilities**: Gradable, has submission, has interaction

7. **Interactive Quiz**
   - **ID**: quiz
   - **Purpose**: ASSESSMENT
   - **Description**: Create interactive quizzes with various question types including multiple choice, matching, drag-and-drop, hotspot, and more
   - **Capabilities**: Gradable, has submission, has interaction
   - **Question Types**: Multiple choice, multiple answer, short answer, true/false, fill in the blanks, matching, sequence, hotspot, drag and drop, drag the words, drop down, numeric, Likert scale, essay

## Activities and Assessments

### Mathematics Activities
1. **Addition and Subtraction Quiz**
   - **Type**: MULTIPLE_CHOICE
   - **Purpose**: ASSESSMENT
   - **Max Score**: 20
   - **Passing Score**: 12
   - **Due Date**: September 15, 2024
   - **Content**: 10 multiple choice questions on addition and subtraction with detailed explanations for each answer

2. **Multiplication Tables Fill in the Blanks**
   - **Type**: FILL_IN_BLANKS
   - **Purpose**: ASSESSMENT
   - **Max Score**: 10
   - **Passing Score**: 7
   - **Due Date**: September 30, 2024
   - **Content**: 10 fill-in-the-blank questions on multiplication tables 1-10
   - **Example Questions**:
     1. 3 × ___ = 24 (Answer: 8)
     2. ___ × 7 = 42 (Answer: 6)
     3. 5 × ___ = 45 (Answer: 9)
     4. ___ × 4 = 36 (Answer: 9)
     5. 8 × ___ = 64 (Answer: 8)
     6. ___ × 6 = 54 (Answer: 9)
     7. 7 × ___ = 49 (Answer: 7)
     8. ___ × 9 = 81 (Answer: 9)
     9. 10 × ___ = 70 (Answer: 7)
     10. ___ × 8 = 56 (Answer: 7)

3. **Geometry Shapes Drag and Drop**
   - **Type**: DRAG_AND_DROP
   - **Purpose**: ASSESSMENT
   - **Max Score**: 10
   - **Passing Score**: 7
   - **Due Date**: October 10, 2024
   - **Content**: Drag each shape to its correct name and properties
   - **Example Items**:
     - Triangle → 3 sides, 3 angles
     - Square → 4 equal sides, 4 right angles
     - Rectangle → 4 sides, 4 right angles, opposite sides equal
     - Circle → Round shape, all points equidistant from center
     - Pentagon → 5 sides, 5 angles
     - Hexagon → 6 sides, 6 angles
     - Octagon → 8 sides, 8 angles
     - Rhombus → 4 equal sides, opposite angles equal
     - Trapezoid → 4 sides, exactly one pair of parallel sides
     - Oval → Elongated circle

3. **Geometry Project**
   - **Type**: ASSIGNMENT
   - **Purpose**: ASSESSMENT
   - **Max Score**: 50
   - **Passing Score**: 30
   - **Due Date**: October 15, 2024
   - **Content**: Create 2D and 3D shapes using provided materials

4. **Math Concepts Matching**
   - **Type**: MATCHING
   - **Purpose**: LEARNING
   - **Max Score**: 15
   - **Passing Score**: 10
   - **Due Date**: September 22, 2024
   - **Content**: Match mathematical terms with their definitions

### English Activities
1. **Reading Comprehension Test**
   - **Type**: MULTIPLE_CHOICE
   - **Purpose**: ASSESSMENT
   - **Max Score**: 25
   - **Passing Score**: 15
   - **Due Date**: September 20, 2024
   - **Content**: Multiple choice questions based on a short story

2. **Story Writing Assignment**
   - **Type**: ASSIGNMENT
   - **Purpose**: LEARNING
   - **Due Date**: October 5, 2024
   - **Content**: Write a creative story using provided prompts

3. **Grammar True/False Quiz**
   - **Type**: TRUE_FALSE
   - **Purpose**: ASSESSMENT
   - **Max Score**: 10
   - **Passing Score**: 6
   - **Due Date**: October 25, 2024
   - **Content**: True/false questions about grammar rules
   - **Example Questions**:
     1. A noun is a word that describes an action. (False)
     2. A sentence must have a subject and a verb. (True)
     3. Adjectives describe verbs. (False)
     4. A proper noun always starts with a capital letter. (True)
     5. A verb is a word that shows action or state of being. (True)
     6. A pronoun replaces an adjective in a sentence. (False)
     7. Every sentence ends with a period. (False)
     8. A compound sentence contains two independent clauses joined by a conjunction. (True)
     9. Adverbs can modify adjectives. (True)
     10. A preposition always comes at the end of a sentence. (False)

4. **Grammar Drag the Words Activity**
   - **Type**: DRAG_THE_WORDS
   - **Purpose**: ASSESSMENT
   - **Max Score**: 13
   - **Passing Score**: 9
   - **Due Date**: October 12, 2024
   - **Content**: 5 sentences with blanks where students must drag the correct words
   - **Example Questions**:
     1. The [quick] brown fox [jumps] over the [lazy] dog.
     2. A [noun] is a person, place, thing, or [idea], while a [verb] shows action or state of being.
     3. An [adjective] describes a noun, while an [adverb] can modify a verb, adjective, or another adverb.
     4. A [complete] sentence must have a [subject] and a [predicate].
     5. A [compound] sentence contains two independent clauses joined by a [conjunction] like "and," "but," or "or."

### Science Activities
1. **Plant Life Cycle Interactive**
   - **Type**: H5P
   - **Purpose**: LEARNING
   - **Due Date**: September 25, 2024
   - **Content**: Interactive H5P content showing plant life cycle stages

2. **Solar System Document Activity**
   - **Type**: DOCUMENT
   - **Purpose**: LEARNING
   - **Due Date**: October 1, 2024
   - **Content**: Comprehensive document about the solar system with reading checkpoints
   - **Document Sections**:
     - Introduction to the solar system
     - The Sun
     - Inner planets (Mercury, Venus, Earth, Mars)
     - Outer planets (Jupiter, Saturn, Uranus, Neptune)
     - Dwarf planets and other objects
     - Space exploration
   - **Reading Checkpoints**:
     1. What percentage of the solar system's mass is contained in the Sun? (99.8%)
     2. Which planet is known as Earth's "sister planet"? (Venus)
     3. How many moons does Jupiter have? (at least 79)
   - **Activities**:
     1. Create a planet fact card
     2. Order the planets from closest to farthest from the sun
     3. Compare and contrast inner and outer planets
     4. Research a space mission

3. **Solar System Matching Activity**
   - **Type**: MATCHING
   - **Purpose**: ASSESSMENT
   - **Max Score**: 10
   - **Passing Score**: 7
   - **Due Date**: October 5, 2024
   - **Content**: Match planets and celestial bodies with their characteristics
   - **Example Pairs**:
     1. Mercury - The smallest planet and closest to the Sun
     2. Venus - The hottest planet with thick clouds of sulfuric acid
     3. Earth - The only planet known to support life
     4. Mars - The "Red Planet" with polar ice caps
     5. Jupiter - The largest planet with a Great Red Spot
     6. Saturn - Known for its spectacular ring system
     7. Uranus - The planet that rotates on its side
     8. Neptune - The windiest planet with the strongest storms
     9. Pluto - A dwarf planet beyond Neptune
     10. The Sun - The star at the center of our solar system

4. **Animal Classification Project**
   - **Type**: QUIZ
   - **Purpose**: ASSESSMENT
   - **Max Score**: 40
   - **Passing Score**: 24
   - **Due Date**: October 10, 2024
   - **Content**: Mixed question types about animal classification

3. **Weather Observation Journal**
   - **Type**: ASSIGNMENT
   - **Purpose**: PRACTICE
   - **Due Date**: October 20, 2024
   - **Content**: Daily weather observations recorded in a digital journal

4. **Solar System Video Lesson**
   - **Type**: VIDEO
   - **Purpose**: LEARNING
   - **Due Date**: October 8, 2024
   - **Content**: Educational video about the solar system with interactive checkpoints

5. **Plant Life Cycle Sequence Activity**
   - **Type**: SEQUENCE
   - **Purpose**: ASSESSMENT
   - **Max Score**: 14
   - **Passing Score**: 10
   - **Due Date**: October 15, 2024
   - **Content**: Two sequence activities about plant life cycles and photosynthesis
   - **Example Sequences**:
     1. Bean Plant Life Cycle (8 steps):
        - Seed → Germination → Seedling → Young Plant → Mature Plant with Flowers → Pollination → Fruit/Pod Development → Seed Dispersal
     2. Photosynthesis Process (6 steps):
        - Plants absorb sunlight through chlorophyll → Plants take in carbon dioxide through stomata → Plants absorb water through roots → Light energy converts water and carbon dioxide into glucose and oxygen → Oxygen is released through stomata → Glucose is used for energy or stored as starch

### Physical Education Activities
1. **Basic Skills Assessment**
   - **Type**: MULTIPLE_RESPONSE
   - **Purpose**: ASSESSMENT
   - **Max Score**: 20
   - **Passing Score**: 12
   - **Due Date**: September 18, 2024
   - **Content**: Questions about proper techniques for various physical activities

2. **Team Game Participation**
   - **Type**: ACTIVITY
   - **Purpose**: PRACTICE
   - **Due Date**: Ongoing (Weekly)
   - **Content**: Participation in team sports and games

## Attendance Data (One Week Sample)

### Week of September 1-5, 2024

#### Boys Campus - Class 3A
- **Monday (Sept 1)**
  - Present: 9 students
  - Absent: 1 student (Nicholas Garcia)
- **Tuesday (Sept 2)**
  - Present: 10 students
- **Wednesday (Sept 3)**
  - Present: 8 students
  - Absent: 2 students (Thomas Brown, Andrew Taylor)
- **Thursday (Sept 4)**
  - Present: 9 students
  - Absent: 1 student (Joseph Martinez)
- **Friday (Sept 5)**
  - Present: 10 students

#### Girls Campus - Class 3A
- **Monday (Sept 1)**
  - Present: 10 students
- **Tuesday (Sept 2)**
  - Present: 9 students
  - Absent: 1 student (Harper Martinez)
- **Wednesday (Sept 3)**
  - Present: 10 students
- **Thursday (Sept 4)**
  - Present: 8 students
  - Absent: 2 students (Emma Smith, Abigail Garcia)
- **Friday (Sept 5)**
  - Present: 9 students
  - Absent: 1 student (Sophia Brown)

## Timetable (Weekly Schedule)

### Boys Campus - Class 3A
- **Monday**
  - 8:00-8:45: Mathematics
  - 8:50-9:35: English
  - 9:40-10:25: Science
  - 10:30-11:15: Break
  - 11:20-12:05: Mathematics
  - 12:10-12:55: English
- **Tuesday**
  - 8:00-8:45: Science
  - 8:50-9:35: Mathematics
  - 9:40-10:25: English
  - 10:30-11:15: Break
  - 11:20-12:05: PE
  - 12:10-12:55: Science
- **Wednesday**
  - 8:00-8:45: English
  - 8:50-9:35: Mathematics
  - 9:40-10:25: Science
  - 10:30-11:15: Break
  - 11:20-12:05: English
  - 12:10-12:55: PE
- **Thursday**
  - 8:00-8:45: Mathematics
  - 8:50-9:35: Science
  - 9:40-10:25: English
  - 10:30-11:15: Break
  - 11:20-12:05: Mathematics
  - 12:10-12:55: Science
- **Friday**
  - 8:00-8:45: PE
  - 8:50-9:35: English
  - 9:40-10:25: Mathematics
  - 10:30-11:15: Break
  - 11:20-12:05: Science
  - 12:10-12:55: English

### Girls Campus - Class 3A
- **Monday**
  - 8:00-8:45: English
  - 8:50-9:35: Mathematics
  - 9:40-10:25: PE
  - 10:30-11:15: Break
  - 11:20-12:05: Science
  - 12:10-12:55: English
- **Tuesday**
  - 8:00-8:45: Mathematics
  - 8:50-9:35: Science
  - 9:40-10:25: English
  - 10:30-11:15: Break
  - 11:20-12:05: Mathematics
  - 12:10-12:55: Science
- **Wednesday**
  - 8:00-8:45: Science
  - 8:50-9:35: English
  - 9:40-10:25: Mathematics
  - 10:30-11:15: Break
  - 11:20-12:05: PE
  - 12:10-12:55: Science
- **Thursday**
  - 8:00-8:45: English
  - 8:50-9:35: Mathematics
  - 9:40-10:25: Science
  - 10:30-11:15: Break
  - 11:20-12:05: English
  - 12:10-12:55: Mathematics
- **Friday**
  - 8:00-8:45: Mathematics
  - 8:50-9:35: Science
  - 9:40-10:25: English
  - 10:30-11:15: Break
  - 11:20-12:05: PE
  - 12:10-12:55: Science

## Gradebook Data

### Mathematics - Addition and Subtraction Quiz
- **Boys Class 3A**
  - John Smith: 18/20
  - William Johnson: 16/20
  - Thomas Brown: 14/20
  - Daniel Davis: 19/20
  - Matthew Wilson: 15/20
  - Andrew Taylor: 17/20
  - Christopher Anderson: 13/20
  - Joseph Martinez: 15/20
  - Ryan Thompson: 18/20
  - Nicholas Garcia: 12/20

- **Girls Class 3A**
  - Emma Smith: 19/20
  - Olivia Johnson: 17/20
  - Sophia Brown: 15/20
  - Isabella Davis: 18/20
  - Charlotte Wilson: 16/20
  - Amelia Taylor: 14/20
  - Mia Anderson: 17/20
  - Harper Martinez: 13/20
  - Evelyn Thompson: 16/20
  - Abigail Garcia: 15/20

### English - Reading Comprehension Test
- **Boys Class 3A**
  - John Smith: 20/25
  - William Johnson: 18/25
  - Thomas Brown: 16/25
  - Daniel Davis: 22/25
  - Matthew Wilson: 19/25
  - Andrew Taylor: 17/25
  - Christopher Anderson: 15/25
  - Joseph Martinez: 18/25
  - Ryan Thompson: 21/25
  - Nicholas Garcia: 14/25

- **Girls Class 3A**
  - Emma Smith: 22/25
  - Olivia Johnson: 20/25
  - Sophia Brown: 19/25
  - Isabella Davis: 23/25
  - Charlotte Wilson: 21/25
  - Amelia Taylor: 18/25
  - Mia Anderson: 20/25
  - Harper Martinez: 17/25
  - Evelyn Thompson: 19/25
  - Abigail Garcia: 18/25

## Fee Management

### Fee Structures
1. **Primary Program Annual Fee Structure**
   - **Name**: Primary Program Annual Fee 2024-2025
   - **Description**: Annual fee structure for Primary Years Program
   - **Program Campus**: Boys Campus - Primary Years Program
   - **Academic Cycle**: Academic Year 2024-2025
   - **Is Recurring**: false
   - **Fee Components**:
     - **Tuition Fee**: $5,000 (TUITION)
     - **Admission Fee**: $500 (ADMISSION)
     - **Library Fee**: $200 (LIBRARY)
     - **Laboratory Fee**: $300 (LABORATORY)
     - **Sports Fee**: $200 (SPORTS)
     - **Examination Fee**: $300 (EXAMINATION)

2. **Primary Program Monthly Fee Structure**
   - **Name**: Primary Program Monthly Fee 2024-2025
   - **Description**: Monthly fee structure for Primary Years Program
   - **Program Campus**: Girls Campus - Primary Years Program
   - **Academic Cycle**: Academic Year 2024-2025
   - **Is Recurring**: true
   - **Recurring Interval**: MONTHLY
   - **Fee Components**:
     - **Tuition Fee**: $500 (TUITION)
     - **Library Fee**: $20 (LIBRARY)
     - **Laboratory Fee**: $30 (LABORATORY)
     - **Sports Fee**: $20 (SPORTS)

### Discount Types
1. **Sibling Discount**
   - **Name**: Sibling Discount
   - **Description**: Discount for families with multiple children enrolled
   - **Discount Value**: 10%
   - **Is Percentage**: true
   - **Max Amount**: $1,000
   - **Applicable For**: SIBLING

2. **Merit Scholarship**
   - **Name**: Merit Scholarship
   - **Description**: Scholarship for academically outstanding students
   - **Discount Value**: 25%
   - **Is Percentage**: true
   - **Max Amount**: $2,000
   - **Applicable For**: MERIT

3. **Staff Discount**
   - **Name**: Staff Children Discount
   - **Description**: Discount for children of staff members
   - **Discount Value**: 50%
   - **Is Percentage**: true
   - **Max Amount**: $3,000
   - **Applicable For**: STAFF

4. **Early Payment Discount**
   - **Name**: Early Payment Discount
   - **Description**: Discount for fees paid before due date
   - **Discount Value**: 5%
   - **Is Percentage**: true
   - **Max Amount**: $500
   - **Applicable For**: EARLY_PAYMENT

### Enrollment Fees
1. **John Smith - Annual Fee**
   - **Enrollment**: John Smith - Class 3A Boys
   - **Fee Structure**: Primary Program Annual Fee 2024-2025
   - **Base Amount**: $6,500
   - **Discounted Amount**: $6,175 (5% Early Payment Discount)
   - **Final Amount**: $6,175
   - **Due Date**: August 15, 2024
   - **Payment Status**: PAID
   - **Payment Method**: BANK_TRANSFER

2. **William Johnson - Annual Fee with Sibling Discount**
   - **Enrollment**: William Johnson - Class 3A Boys
   - **Fee Structure**: Primary Program Annual Fee 2024-2025
   - **Base Amount**: $6,500
   - **Discounted Amount**: $5,850 (10% Sibling Discount)
   - **Final Amount**: $5,850
   - **Due Date**: August 15, 2024
   - **Payment Status**: PAID
   - **Payment Method**: CREDIT_CARD

3. **Emma Smith - Monthly Fee**
   - **Enrollment**: Emma Smith - Class 3A Girls
   - **Fee Structure**: Primary Program Monthly Fee 2024-2025
   - **Base Amount**: $570
   - **Discounted Amount**: $570 (No discount)
   - **Final Amount**: $570
   - **Due Date**: September 5, 2024
   - **Payment Status**: PAID
   - **Payment Method**: CASH

4. **Sophia Brown - Monthly Fee with Merit Scholarship**
   - **Enrollment**: Sophia Brown - Class 3A Girls
   - **Fee Structure**: Primary Program Monthly Fee 2024-2025
   - **Base Amount**: $570
   - **Discounted Amount**: $427.50 (25% Merit Scholarship)
   - **Final Amount**: $427.50
   - **Due Date**: September 5, 2024
   - **Payment Status**: PENDING
   - **Payment Method**: null

### Fee Discounts
1. **Early Payment Discount - John Smith**
   - **Enrollment Fee**: John Smith - Annual Fee
   - **Discount Type**: Early Payment Discount
   - **Amount**: $325 (5% of $6,500)
   - **Reason**: "Payment received before August 10"
   - **Approved By**: Michael Smith (Boys Campus Admin)

2. **Sibling Discount - William Johnson**
   - **Enrollment Fee**: William Johnson - Annual Fee
   - **Discount Type**: Sibling Discount
   - **Amount**: $650 (10% of $6,500)
   - **Reason**: "Brother Thomas Johnson in Class 5B"
   - **Approved By**: Michael Smith (Boys Campus Admin)

3. **Merit Scholarship - Sophia Brown**
   - **Enrollment Fee**: Sophia Brown - Monthly Fee
   - **Discount Type**: Merit Scholarship
   - **Amount**: $142.50 (25% of $570)
   - **Reason**: "Top performer in previous academic year"
   - **Approved By**: Sarah Williams (Girls Campus Admin)

### Fee Challans
1. **Annual Fee Challan - John Smith**
   - **Enrollment Fee**: John Smith - Annual Fee
   - **Challan No**: SIS-BOYS-2024-001
   - **Issue Date**: August 1, 2024
   - **Due Date**: August 15, 2024
   - **Total Amount**: $6,175
   - **Paid Amount**: $6,175
   - **Payment Status**: PAID
   - **Bank Details**: {"bankName": "Education Bank", "accountNo": "1234567890", "branchCode": "EB001"}

2. **Annual Fee Challan - William Johnson**
   - **Enrollment Fee**: William Johnson - Annual Fee
   - **Challan No**: SIS-BOYS-2024-002
   - **Issue Date**: August 1, 2024
   - **Due Date**: August 15, 2024
   - **Total Amount**: $5,850
   - **Paid Amount**: $5,850
   - **Payment Status**: PAID
   - **Bank Details**: {"bankName": "Education Bank", "accountNo": "1234567890", "branchCode": "EB001"}

3. **Monthly Fee Challan - Emma Smith**
   - **Enrollment Fee**: Emma Smith - Monthly Fee
   - **Challan No**: SIS-GIRLS-2024-001
   - **Issue Date**: September 1, 2024
   - **Due Date**: September 5, 2024
   - **Total Amount**: $570
   - **Paid Amount**: $570
   - **Payment Status**: PAID
   - **Bank Details**: {"bankName": "Education Bank", "accountNo": "0987654321", "branchCode": "EB002"}

4. **Monthly Fee Challan - Sophia Brown**
   - **Enrollment Fee**: Sophia Brown - Monthly Fee
   - **Challan No**: SIS-GIRLS-2024-002
   - **Issue Date**: September 1, 2024
   - **Due Date**: September 5, 2024
   - **Total Amount**: $427.50
   - **Paid Amount**: $0
   - **Payment Status**: PENDING
   - **Bank Details**: {"bankName": "Education Bank", "accountNo": "0987654321", "branchCode": "EB002"}

### Fee Transactions
1. **John Smith - Annual Fee Payment**
   - **Enrollment Fee**: John Smith - Annual Fee
   - **Challan**: SIS-BOYS-2024-001
   - **Amount**: $6,175
   - **Date**: August 10, 2024
   - **Method**: BANK_TRANSFER
   - **Reference**: "TRX123456789"
   - **Notes**: "Full payment for annual fees"

2. **William Johnson - Annual Fee Payment**
   - **Enrollment Fee**: William Johnson - Annual Fee
   - **Challan**: SIS-BOYS-2024-002
   - **Amount**: $5,850
   - **Date**: August 12, 2024
   - **Method**: CREDIT_CARD
   - **Reference**: "CC987654321"
   - **Notes**: "Full payment with sibling discount"

3. **Emma Smith - Monthly Fee Payment**
   - **Enrollment Fee**: Emma Smith - Monthly Fee
   - **Challan**: SIS-GIRLS-2024-001
   - **Amount**: $570
   - **Date**: September 3, 2024
   - **Method**: CASH
   - **Reference**: "CASH001"
   - **Notes**: "Cash payment received by Sarah Williams"

## Enrollment Documents

### Document Types
1. **Birth Certificate**
   - **Name**: Birth Certificate
   - **Description**: Official birth certificate issued by government
   - **Is Required**: true
   - **Verification Required**: true

2. **Previous School Records**
   - **Name**: Previous School Records
   - **Description**: Academic records from previous school
   - **Is Required**: true
   - **Verification Required**: true

3. **Medical Certificate**
   - **Name**: Medical Certificate
   - **Description**: Health certificate from registered doctor
   - **Is Required**: true
   - **Verification Required**: true

4. **Passport Photos**
   - **Name**: Passport Photos
   - **Description**: Recent passport-sized photographs
   - **Is Required**: true
   - **Verification Required**: false

5. **Parent ID**
   - **Name**: Parent ID
   - **Description**: ID proof of parents/guardians
   - **Is Required**: true
   - **Verification Required**: true

## Feedback Data

### Teacher Feedback Examples
1. **Mathematics - John Smith**
   - **Type**: ACADEMIC_PERFORMANCE
   - **Content**: "John has shown excellent progress in multiplication. He consistently completes his work on time and helps his classmates."
   - **Severity**: POSITIVE
   - **Status**: RESOLVED

2. **English - Olivia Johnson**
   - **Type**: ACADEMIC_PERFORMANCE
   - **Content**: "Olivia's reading comprehension skills have improved significantly. She is now able to identify main ideas and supporting details with greater accuracy."
   - **Severity**: POSITIVE
   - **Status**: RESOLVED

3. **Science - Thomas Brown**
   - **Type**: IMPROVEMENT_AREA
   - **Content**: "Thomas needs to focus more during class discussions. He has good ideas but gets distracted easily."
   - **Severity**: CONCERN
   - **Status**: IN_REVIEW

4. **PE - Harper Martinez**
   - **Type**: ATTENDANCE
   - **Content**: "Harper has been consistently late to PE classes. Please ensure timely arrival to maximize participation time."
   - **Severity**: CONCERN
   - **Status**: IN_REVIEW

### Coordinator Feedback Examples
1. **Class 3A Boys - Overall Performance**
   - **Type**: ACADEMIC_PERFORMANCE
   - **Content**: "Class 3A boys are showing good progress in mathematics but need more support in reading comprehension. Recommend additional reading activities."
   - **Severity**: NEUTRAL
   - **Status**: IN_REVIEW

2. **Class 3A Girls - Overall Performance**
   - **Type**: ACHIEVEMENT
   - **Content**: "Class 3A girls have shown excellent teamwork during science projects. Their collaborative skills are exemplary."
   - **Severity**: POSITIVE
   - **Status**: RESOLVED
