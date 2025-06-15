# Question Bank Architecture

This document provides a detailed overview of the Question Bank architecture.

## System Architecture

The Question Bank feature is built using a modern, layered architecture that follows best practices for scalability, maintainability, and performance.

### Architectural Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                        │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Management    │  │   Integration   │  │    Analytics    │  │
│  │   Components    │  │   Components    │  │   Components    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                           API Layer                              │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Question Bank  │  │     Question    │  │  Question Usage │  │
│  │     Router      │  │     Router      │  │     Router      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Service Layer                            │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Question Bank  │  │     Question    │  │  Question Usage │  │
│  │     Service     │  │     Service     │  │     Service     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Data Layer                              │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Question Bank  │  │     Question    │  │  Question Usage │  │
│  │     Models      │  │     Models      │  │     Models      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Presentation Layer

The presentation layer consists of React components that provide the user interface for interacting with the Question Bank feature. These components are organized into three categories:

1. **Management Components**: For creating, viewing, and managing question banks and questions
2. **Integration Components**: For integrating question banks with other features like activities
3. **Analytics Components**: For viewing analytics and insights about question usage

### API Layer

The API layer uses tRPC to expose endpoints for interacting with the Question Bank feature. These endpoints are organized into routers:

1. **Question Bank Router**: Endpoints for managing question banks
2. **Question Router**: Endpoints for managing questions
3. **Question Usage Router**: Endpoints for tracking and analyzing question usage

### Service Layer

The service layer contains the business logic for the Question Bank feature. These services handle operations like:

1. **Question Bank Service**: Creating, updating, and deleting question banks
2. **Question Service**: Creating, updating, and deleting questions
3. **Question Usage Service**: Recording and analyzing question usage

### Data Layer

The data layer uses Prisma to interact with the database. The models include:

1. **Question Bank Models**: For storing question banks
2. **Question Models**: For storing questions
3. **Question Usage Models**: For storing question usage data

## Component Architecture

### Management Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     Question Bank Management                     │
│                                                                 │
│  ┌─────────────────┐       ┌─────────────────────────────────┐  │
│  │                 │       │                                 │  │
│  │ QuestionBankList│──────▶│        QuestionBankDetail       │  │
│  │                 │       │                                 │  │
│  └─────────────────┘       └─────────────────────────────────┘  │
│          │                                   │                   │
│          │                                   │                   │
│          ▼                                   ▼                   │
│  ┌─────────────────┐       ┌─────────────────────────────────┐  │
│  │                 │       │                                 │  │
│  │QuestionBankForm │       │           QuestionList          │  │
│  │                 │       │                                 │  │
│  └─────────────────┘       └─────────────────────────────────┘  │
│                                          │                       │
│                                          │                       │
│                                          ▼                       │
│                            ┌─────────────────────────────────┐  │
│                            │                                 │  │
│                            │         QuestionDetail          │  │
│                            │                                 │  │
│                            └─────────────────────────────────┘  │
│                                          │                       │
│                                          │                       │
│                                          ▼                       │
│                            ┌─────────────────────────────────┐  │
│                            │                                 │  │
│                            │          QuestionForm           │  │
│                            │                                 │  │
│                            └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Integration Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     Question Bank Integration                    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │                  QuestionBankSelector                   │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                               │                                  │
│                               │                                  │
│                               ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │                      QuizEditor                         │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                               │                                  │
│                               │                                  │
│                               ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │                      QuizViewer                         │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Analytics Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     Question Bank Analytics                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │                 QuestionUsageAnalytics                  │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                               │                                  │
│                               │                                  │
│                               ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │                  QuestionClassUsage                     │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Question Creation Flow

1. User navigates to the Question Bank management interface
2. User selects a Question Bank or creates a new one
3. User clicks "Add Question" and fills out the Question Form
4. The form submits the question data to the `questionBank.createQuestion` endpoint
5. The Question Service validates the data and creates the question in the database
6. The UI updates to show the new question in the list

### Question Selection Flow

1. Teacher creates a new activity or edits an existing one
2. Teacher clicks "Add from Question Bank" to open the Question Bank Selector
3. Teacher browses and filters questions in the selector
4. Teacher selects questions and clicks "Add Selected Questions"
5. The selected questions are added to the activity with references to the original questions
6. The activity is saved with the selected questions

### Question Usage Tracking Flow

1. Student starts an activity with questions from the Question Bank
2. Student answers a question
3. The answer is submitted to the `questionUsage.recordQuestionUsage` endpoint
4. The Question Usage Service records the answer and updates usage statistics
5. The usage data is stored in the database for later analysis

### Question Analytics Flow

1. Teacher or coordinator navigates to a question's detail view
2. The system loads usage statistics from the `questionUsage.getQuestionUsageStats` endpoint
3. The system loads class usage data from the `questionUsage.getQuestionClassUsage` endpoint
4. The UI displays analytics about the question's usage and performance
5. The teacher can use this information to improve the question or make decisions about future use
