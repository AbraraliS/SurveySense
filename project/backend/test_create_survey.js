const express = require('express');
const { generateSurveyQuestions } = require('./question_generator');

async function testCreateSurvey() {
  try {
    console.log('Testing survey question generation...');
    
    const questions = await generateSurveyQuestions('Customer Satisfaction for public', 5);
    console.log('Generated questions:', JSON.stringify(questions, null, 2));
    
    if (questions && questions.length === 5) {
      console.log('✅ Question generation working!');
    } else {
      console.log('❌ Question generation failed');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCreateSurvey();