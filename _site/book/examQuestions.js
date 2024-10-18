// examQuestions.js

const examQuestions = [
  {
    text: "What is a function in R?",
    options: [
      "A type of data structure",
      "A reusable block of code that performs a specific task",
      "A method for creating objects",
      "A special type of variable"
    ]
  },
  {
    text: "What is the purpose of arguments in a function?",
    options: [
      "To name the function",
      "To specify the return value",
      "To provide input values for the function to use",
      "To define the scope of the function"
    ]
  },
  {
    text: "What is Quarto?",
    options: [
      "A new programming language",
      "A tool for combining R code, output, and explanatory text in one document",
      "A statistical package for R",
      "A version control system"
    ]
  },
  {
    text: "Which dplyr function would you use to select specific columns from a dataset?",
    options: [
      "filter()",
      "select()",
      "mutate()",
      "arrange()"
    ]
  },
  {
    text: "If you want to create a new column based on existing data, which function should you use?",
    options: [
      "summarise()",
      "group_by()",
      "mutate()",
      "filter()"
    ]
  },
  {
    text: "Which function allows you to perform operations on grouped data?",
    options: [
      "arrange()",
      "select()",
      "filter()",
      "group_by()"
    ]
  },
  {
    text: "To sort a dataset based on one or more variables, which `dplyr` function would you use?",
    options: [
      "arrange()",
      "sort()",
      "order()",
      "filter()"
    ]
  },
  {
    text: "What is the main purpose of the ggplot2 package in tidyverse?",
    options: [
      "Data manipulation",
      "Data visualization",
      "Statistical analysis",
      "Data import"
    ]
  },
  {
    text: "Which of the following is NOT a core tidyverse package?",
    options: [
      "dplyr",
      "ggplot2",
      "tidyr",
      "base"
    ]
  },
  {
    text: "What does the pipe operator (%>%) do in tidyverse?",
    options: [
      "It creates a new variable",
      "It filters data",
      "It passes the result of one function to another",
      "It sorts data"
    ]
  }
];

const examAnswers = [1, 2, 1, 1, 2, 3, 0, 1, 3, 2];

// Make these variables available globally
window.examQuestions = examQuestions;
window.examAnswers = examAnswers;

