const { OpenAI } = require('openai');
require('dotenv').config();

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

async function testAPI() {
  try {
    const completion = await client.chat.completions.create({
      model: "deepseek/deepseek-chat-v3.1:free",
      messages: [
        {
          role: "user",
          content: "Hello, please respond with just 'API working'"
        }
      ],
      max_tokens: 10
    });
    
    console.log('API Test Success:', completion.choices[0].message.content);
  } catch (error) {
    console.error('API Test Failed:', error);
  }
}

testAPI();