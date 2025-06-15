/**
 * Action Verbs for Bloom's Taxonomy
 * 
 * This file contains action verbs associated with each Bloom's Taxonomy level.
 */

import { BloomsTaxonomyLevel, ActionVerb } from '../types';

/**
 * Action verbs for the Remember level
 */
export const REMEMBER_VERBS: ActionVerb[] = [
  { verb: 'Define', level: BloomsTaxonomyLevel.REMEMBER, examples: ['Define the term photosynthesis.'] },
  { verb: 'Describe', level: BloomsTaxonomyLevel.REMEMBER, examples: ['Describe the water cycle.'] },
  { verb: 'Identify', level: BloomsTaxonomyLevel.REMEMBER, examples: ['Identify the parts of a cell.'] },
  { verb: 'List', level: BloomsTaxonomyLevel.REMEMBER, examples: ['List the planets in our solar system.'] },
  { verb: 'Name', level: BloomsTaxonomyLevel.REMEMBER, examples: ['Name the first five presidents.'] },
  { verb: 'Recall', level: BloomsTaxonomyLevel.REMEMBER, examples: ['Recall the formula for calculating area.'] },
  { verb: 'Recognize', level: BloomsTaxonomyLevel.REMEMBER, examples: ['Recognize the different types of triangles.'] },
  { verb: 'State', level: BloomsTaxonomyLevel.REMEMBER, examples: ['State Newton\'s laws of motion.'] },
  { verb: 'Label', level: BloomsTaxonomyLevel.REMEMBER, examples: ['Label the parts of a plant.'] },
  { verb: 'Match', level: BloomsTaxonomyLevel.REMEMBER, examples: ['Match the vocabulary words with their definitions.'] },
];

/**
 * Action verbs for the Understand level
 */
export const UNDERSTAND_VERBS: ActionVerb[] = [
  { verb: 'Explain', level: BloomsTaxonomyLevel.UNDERSTAND, examples: ['Explain how a bill becomes a law.'] },
  { verb: 'Interpret', level: BloomsTaxonomyLevel.UNDERSTAND, examples: ['Interpret the meaning of the poem.'] },
  { verb: 'Summarize', level: BloomsTaxonomyLevel.UNDERSTAND, examples: ['Summarize the main points of the article.'] },
  { verb: 'Classify', level: BloomsTaxonomyLevel.UNDERSTAND, examples: ['Classify these animals by their characteristics.'] },
  { verb: 'Compare', level: BloomsTaxonomyLevel.UNDERSTAND, examples: ['Compare mitosis and meiosis.'] },
  { verb: 'Contrast', level: BloomsTaxonomyLevel.UNDERSTAND, examples: ['Contrast democracy and dictatorship.'] },
  { verb: 'Discuss', level: BloomsTaxonomyLevel.UNDERSTAND, examples: ['Discuss the causes of World War I.'] },
  { verb: 'Paraphrase', level: BloomsTaxonomyLevel.UNDERSTAND, examples: ['Paraphrase the author\'s main argument.'] },
  { verb: 'Predict', level: BloomsTaxonomyLevel.UNDERSTAND, examples: ['Predict what will happen next in the story.'] },
  { verb: 'Translate', level: BloomsTaxonomyLevel.UNDERSTAND, examples: ['Translate the paragraph into your own words.'] },
];

/**
 * Action verbs for the Apply level
 */
export const APPLY_VERBS: ActionVerb[] = [
  { verb: 'Apply', level: BloomsTaxonomyLevel.APPLY, examples: ['Apply the Pythagorean theorem to solve this problem.'] },
  { verb: 'Calculate', level: BloomsTaxonomyLevel.APPLY, examples: ['Calculate the area of the irregular shape.'] },
  { verb: 'Demonstrate', level: BloomsTaxonomyLevel.APPLY, examples: ['Demonstrate how to perform CPR.'] },
  { verb: 'Develop', level: BloomsTaxonomyLevel.APPLY, examples: ['Develop a budget for a small business.'] },
  { verb: 'Implement', level: BloomsTaxonomyLevel.APPLY, examples: ['Implement the scientific method to test your hypothesis.'] },
  { verb: 'Modify', level: BloomsTaxonomyLevel.APPLY, examples: ['Modify the recipe to serve 12 people.'] },
  { verb: 'Solve', level: BloomsTaxonomyLevel.APPLY, examples: ['Solve the quadratic equation.'] },
  { verb: 'Use', level: BloomsTaxonomyLevel.APPLY, examples: ['Use the periodic table to determine the atomic mass.'] },
  { verb: 'Illustrate', level: BloomsTaxonomyLevel.APPLY, examples: ['Illustrate the concept of supply and demand with a graph.'] },
  { verb: 'Practice', level: BloomsTaxonomyLevel.APPLY, examples: ['Practice using the new vocabulary in sentences.'] },
];

/**
 * Action verbs for the Analyze level
 */
export const ANALYZE_VERBS: ActionVerb[] = [
  { verb: 'Analyze', level: BloomsTaxonomyLevel.ANALYZE, examples: ['Analyze the character\'s motivation in the story.'] },
  { verb: 'Categorize', level: BloomsTaxonomyLevel.ANALYZE, examples: ['Categorize the organisms based on their characteristics.'] },
  { verb: 'Differentiate', level: BloomsTaxonomyLevel.ANALYZE, examples: ['Differentiate between fact and opinion in the article.'] },
  { verb: 'Examine', level: BloomsTaxonomyLevel.ANALYZE, examples: ['Examine the factors that led to the Great Depression.'] },
  { verb: 'Investigate', level: BloomsTaxonomyLevel.ANALYZE, examples: ['Investigate the relationship between temperature and pressure.'] },
  { verb: 'Organize', level: BloomsTaxonomyLevel.ANALYZE, examples: ['Organize the data into meaningful categories.'] },
  { verb: 'Outline', level: BloomsTaxonomyLevel.ANALYZE, examples: ['Outline the structure of the argument.'] },
  { verb: 'Research', level: BloomsTaxonomyLevel.ANALYZE, examples: ['Research the impact of social media on teenagers.'] },
  { verb: 'Distinguish', level: BloomsTaxonomyLevel.ANALYZE, examples: ['Distinguish between the different literary devices used in the poem.'] },
  { verb: 'Infer', level: BloomsTaxonomyLevel.ANALYZE, examples: ['Infer the author\'s purpose based on the text.'] },
];

/**
 * Action verbs for the Evaluate level
 */
export const EVALUATE_VERBS: ActionVerb[] = [
  { verb: 'Assess', level: BloomsTaxonomyLevel.EVALUATE, examples: ['Assess the effectiveness of the marketing campaign.'] },
  { verb: 'Critique', level: BloomsTaxonomyLevel.EVALUATE, examples: ['Critique the scientific methodology used in the study.'] },
  { verb: 'Evaluate', level: BloomsTaxonomyLevel.EVALUATE, examples: ['Evaluate the credibility of the sources.'] },
  { verb: 'Judge', level: BloomsTaxonomyLevel.EVALUATE, examples: ['Judge the validity of the argument.'] },
  { verb: 'Justify', level: BloomsTaxonomyLevel.EVALUATE, examples: ['Justify your solution to the problem.'] },
  { verb: 'Recommend', level: BloomsTaxonomyLevel.EVALUATE, examples: ['Recommend the best course of action based on the data.'] },
  { verb: 'Support', level: BloomsTaxonomyLevel.EVALUATE, examples: ['Support your position with evidence from the text.'] },
  { verb: 'Validate', level: BloomsTaxonomyLevel.EVALUATE, examples: ['Validate the experimental results.'] },
  { verb: 'Defend', level: BloomsTaxonomyLevel.EVALUATE, examples: ['Defend your interpretation of the historical event.'] },
  { verb: 'Prioritize', level: BloomsTaxonomyLevel.EVALUATE, examples: ['Prioritize the factors that influence climate change.'] },
];

/**
 * Action verbs for the Create level
 */
export const CREATE_VERBS: ActionVerb[] = [
  { verb: 'Create', level: BloomsTaxonomyLevel.CREATE, examples: ['Create a model that demonstrates the concept.'] },
  { verb: 'Design', level: BloomsTaxonomyLevel.CREATE, examples: ['Design an experiment to test your hypothesis.'] },
  { verb: 'Develop', level: BloomsTaxonomyLevel.CREATE, examples: ['Develop a new solution to the environmental problem.'] },
  { verb: 'Compose', level: BloomsTaxonomyLevel.CREATE, examples: ['Compose a piece of music that expresses a specific emotion.'] },
  { verb: 'Construct', level: BloomsTaxonomyLevel.CREATE, examples: ['Construct a 3D model of a molecule.'] },
  { verb: 'Formulate', level: BloomsTaxonomyLevel.CREATE, examples: ['Formulate a theory that explains the observed phenomena.'] },
  { verb: 'Generate', level: BloomsTaxonomyLevel.CREATE, examples: ['Generate a research question for your project.'] },
  { verb: 'Invent', level: BloomsTaxonomyLevel.CREATE, examples: ['Invent a device that solves a common household problem.'] },
  { verb: 'Plan', level: BloomsTaxonomyLevel.CREATE, examples: ['Plan a community service project to address a local issue.'] },
  { verb: 'Produce', level: BloomsTaxonomyLevel.CREATE, examples: ['Produce a documentary about an important social issue.'] },
];

/**
 * All action verbs grouped by Bloom's Taxonomy level
 */
export const ACTION_VERBS_BY_LEVEL: Record<BloomsTaxonomyLevel, ActionVerb[]> = {
  [BloomsTaxonomyLevel.REMEMBER]: REMEMBER_VERBS,
  [BloomsTaxonomyLevel.UNDERSTAND]: UNDERSTAND_VERBS,
  [BloomsTaxonomyLevel.APPLY]: APPLY_VERBS,
  [BloomsTaxonomyLevel.ANALYZE]: ANALYZE_VERBS,
  [BloomsTaxonomyLevel.EVALUATE]: EVALUATE_VERBS,
  [BloomsTaxonomyLevel.CREATE]: CREATE_VERBS,
};

/**
 * All action verbs in a flat array
 */
export const ALL_ACTION_VERBS: ActionVerb[] = [
  ...REMEMBER_VERBS,
  ...UNDERSTAND_VERBS,
  ...APPLY_VERBS,
  ...ANALYZE_VERBS,
  ...EVALUATE_VERBS,
  ...CREATE_VERBS,
];
