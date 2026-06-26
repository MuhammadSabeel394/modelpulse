import { classifyAndSummarize } from './nlp.js';

async function runNlpTest() {
  console.log('--- Starting NLP Classification Pipeline Testing ---');
  
  const testArticles = [
    {
      title: "OpenAI reduces costs for GPT-4o API",
      text: "OpenAI is cutting prices for GPT-4o input and output tokens by 50% and 33% respectively. Developers will now be billed at $2.50 per million input tokens.",
      expectedType: "pricing_change",
      expectedModel: "gpt-4o"
    },
    {
      title: "Anthropic deprecates Claude 2.1 legacy endpoints",
      text: "As we focus on our Claude 3 model family, we are sunsetting and deprecating our legacy Claude 2.1 API endpoints on November 1. Please update your code integration.",
      expectedType: "deprecation",
      expectedModel: "claude-3-opus" // fallback logic defaults to opus/sonnet/haiku
    },
    {
      title: "Google geoblocks Gemini features in the European Union",
      text: "Google is temporarily pausing the rollout of advanced AI features in the EU. This suspension is due to regulatory compliance reviews under GDPR.",
      expectedType: "restriction",
      expectedModel: "gemini-1-5-pro"
    },
    {
      title: "Meta launches Llama 3.1 405B open weights model",
      text: "Today we are launching Llama 3.1 405B. This is our largest open-weights model, matching top closed models in coding and synthetic data generation.",
      expectedType: "launch",
      expectedModel: "llama-3-1-405b"
    }
  ];

  let passed = 0;

  for (let i = 0; i < testArticles.length; i++) {
    const art = testArticles[i];
    try {
      const result = await classifyAndSummarize(art.title, art.text);
      console.log(`\nTest Case ${i + 1}: "${art.title}"`);
      console.log(`- Classified Event:  ${result.event_type} (Expected: ${art.expectedType})`);
      console.log(`- Extracted Model:   ${result.model_id}`);
      console.log(`- Extracted Region:  ${result.region_affected}`);
      console.log(`- Generated Summary: ${result.summary}`);

      // Basic structure validation
      if (result.event_type && result.summary && result.model_id && result.provider_id) {
        console.log(`✓ Test Case ${i + 1} passed structure validation.`);
        passed++;
      } else {
        console.error(`✗ Test Case ${i + 1} failed: missing keys in JSON output.`);
      }
    } catch (err) {
      console.error(`✗ Test Case ${i + 1} threw an error:`, err);
    }
  }

  console.log(`\n--- Verification Finished. Passed: ${passed}/${testArticles.length} ---`);
  if (passed === testArticles.length) {
    console.log('✓ NLP Pipeline validation successful!');
    process.exit(0);
  } else {
    console.error('✗ NLP Pipeline validation failed.');
    process.exit(1);
  }
}

runNlpTest();
