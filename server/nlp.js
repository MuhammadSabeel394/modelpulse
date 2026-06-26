import dotenv from 'dotenv';

dotenv.config();

/**
 * Classifies the model event type, extracts structured fields, and generates a summary.
 * Supports a live Gemini API completion call if a key is provided, or falls back to
 * a local rule-based heuristic classifier.
 * 
 * @param {string} title - The article title
 * @param {string} articleText - The full article/changelog text
 * @returns {Promise<object>} Structured classification details
 */
export async function classifyAndSummarize(title, articleText) {
  const fullText = `${title}\n\n${articleText}`;
  const apiKey = process.env.GEMINI_API_KEY;

  // Check if a real key was supplied (and not the template placeholder)
  const isLiveKey = apiKey && apiKey !== 'your_key_here' && apiKey.trim().length > 10;

  if (isLiveKey) {
    try {
      console.log('NLP Layer: Attempting live Gemini API completion...');
      
      const prompt = `
        You are an expert analyst and database classification system. Given the following article about an AI model event, classify it into one of these event types:
        - launch
        - update
        - deprecation
        - restriction
        - pricing_change

        Extract the following fields precisely:
        1. provider_id: lowercase id (openai | anthropic | google | meta | mistral)
        2. model_id: lowercase slug for model (gpt-4o | gpt-4-turbo | gpt-3.5-turbo | gpt-4o-mini | claude-3-5-sonnet | claude-3-opus | claude-3-haiku | gemini-1-5-pro | gemini-1-5-flash | llama-3-1-405b | llama-3-1-70b | mistral-large-2 | codestral)
        3. event_type: launch | update | deprecation | restriction | pricing_change
        4. summary: a concise 2-3 sentence neutral, factual summary of the event
        5. impact_score: major | minor
        6. region_affected: specific affected region (e.g. European Union, China, Global)

        Input Article:
        ${fullText}

        Return ONLY a raw valid JSON object with NO markdown formatting (do NOT wrap in \`\`\`json \`\`\`), containing exactly these keys:
        {
          "provider_id": "string",
          "model_id": "string",
          "event_type": "string",
          "summary": "string",
          "impact_score": "string",
          "region_affected": "string"
        }
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API responded with status ${response.status}`);
      }

      const resData = await response.json();
      const textResponse = resData.candidates[0].content.parts[0].text;
      
      // Parse structured JSON
      const parsedData = JSON.parse(textResponse.trim());
      console.log('✓ NLP Layer: Live classification succeeded:', parsedData.event_type);
      return parsedData;

    } catch (err) {
      console.warn('NLP Layer Warning: Gemini API request failed. Falling back to local heuristic classifier.', err.message);
    }
  }

  // Local rule-based fallback NLP engine
  return runLocalHeuristicClassifier(title, articleText);
}

function runLocalHeuristicClassifier(title, articleText) {
  const combined = `${title} ${articleText}`.toLowerCase();
  
  // 1. Detect Provider
  let providerId = 'openai';
  if (combined.includes('anthropic') || combined.includes('claude')) {
    providerId = 'anthropic';
  } else if (combined.includes('google') || combined.includes('deepmind') || combined.includes('gemini')) {
    providerId = 'google';
  } else if (combined.includes('meta') || combined.includes('llama') || combined.includes('facebook')) {
    providerId = 'meta';
  } else if (combined.includes('mistral') || combined.includes('codestral')) {
    providerId = 'mistral';
  }

  // 2. Detect Model
  let modelId = '';
  if (providerId === 'openai') {
    if (combined.includes('mini') || combined.includes('gpt-4o-mini')) modelId = 'gpt-4o-mini';
    else if (combined.includes('gpt-4o') || combined.includes('4o')) modelId = 'gpt-4o';
    else if (combined.includes('turbo') || combined.includes('gpt-4-turbo')) modelId = 'gpt-4-turbo';
    else if (combined.includes('3.5') || combined.includes('gpt-3.5')) modelId = 'gpt-3.5-turbo';
    else modelId = 'gpt-4o';
  } else if (providerId === 'anthropic') {
    if (combined.includes('sonnet') || combined.includes('3.5 sonnet')) modelId = 'claude-3-5-sonnet';
    else if (combined.includes('opus') || combined.includes('complex')) modelId = 'claude-3-opus';
    else if (combined.includes('haiku') || combined.includes('fast')) modelId = 'claude-3-haiku';
    else modelId = 'claude-3-5-sonnet';
  } else if (providerId === 'google') {
    if (combined.includes('flash') || combined.includes('8b')) modelId = 'gemini-1-5-flash';
    else if (combined.includes('pro') || combined.includes('experimental')) modelId = 'gemini-1-5-pro';
    else modelId = 'gemini-1-5-pro';
  } else if (providerId === 'meta') {
    if (combined.includes('405b') || combined.includes('large weights')) modelId = 'llama-3-1-405b';
    else if (combined.includes('70b') || combined.includes('guard')) modelId = 'llama-3-1-70b';
    else modelId = 'llama-3-1-70b';
  } else if (providerId === 'mistral') {
    if (combined.includes('codestral') || combined.includes('mamba')) modelId = 'codestral';
    else if (combined.includes('large 2') || combined.includes('flagship')) modelId = 'mistral-large-2';
    else modelId = 'mistral-large-2';
  }

  // 3. Detect Event Type
  let eventType = 'update';
  if (combined.includes('price') || combined.includes('pricing') || combined.includes('slashes') || combined.includes('cost') || combined.includes('cheaper') || combined.includes('reduces cost')) {
    eventType = 'pricing_change';
  } else if (combined.includes('deprecate') || combined.includes('sunset') || combined.includes('retire') || combined.includes('eol') || combined.includes('turns off') || combined.includes('turn off')) {
    eventType = 'deprecation';
  } else if (combined.includes('restrict') || combined.includes('block') || combined.includes('ban') || combined.includes('suspend') || combined.includes('compliance') || combined.includes('geofencing') || combined.includes('sanction')) {
    eventType = 'restriction';
  } else if (combined.includes('launch') || combined.includes('release') || combined.includes('introduces') || combined.includes('unveil') || combined.includes('presents')) {
    eventType = 'launch';
  }

  // 4. Region
  let regionAffected = 'Global';
  if (combined.includes('china')) {
    regionAffected = 'China';
  } else if (combined.includes('european union') || combined.includes('eu') || combined.includes('europe')) {
    regionAffected = 'European Union';
  } else if (combined.includes('sanctioned')) {
    regionAffected = 'Sanctioned Nations';
  }

  // 5. Impact Score
  let impactScore = 'minor';
  if (combined.includes('major') || combined.includes('flagship') || combined.includes('groundbreaking') || combined.includes('deprecation') || combined.includes('restrict') || combined.includes('launch') || combined.includes('405b') || combined.includes('sonnet') || combined.includes('pro')) {
    impactScore = 'major';
  }

  // 6. Generate 2-3 sentence summary
  let summary = '';
  const cleanTitle = title.replace(/[.#]/g, '');
  if (eventType === 'launch') {
    summary = `Announcement regarding the launch of ${modelId.toUpperCase().replace(/-/g, ' ')} by ${providerId.charAt(0).toUpperCase() + providerId.slice(1)}. This new model is released to expand capabilities in the frontier space. It is classified as a ${impactScore} event.`;
  } else if (eventType === 'pricing_change') {
    summary = `New pricing changes are announced for ${modelId.toUpperCase().replace(/-/g, ' ')}. The model developers are adjusting the API and tokens billing structures, modifying developer rate overhead.`;
  } else if (eventType === 'deprecation') {
    summary = `The deprecation program has been officially scheduled for ${modelId.toUpperCase().replace(/-/g, ' ')}. Developers are urged to migrate workloads to newer available versions.`;
  } else if (eventType === 'restriction') {
    summary = `API access is restricted for ${modelId.toUpperCase().replace(/-/g, ' ')} in ${regionAffected}. Compliance blocks and geofencing adjustments have been enacted by the provider.`;
  } else {
    // default update
    summary = `An operational update is released for ${modelId.toUpperCase().replace(/-/g, ' ')} by ${providerId.charAt(0).toUpperCase() + providerId.slice(1)}. The modifications include enhancements to instructions following, math or code logic.`;
  }

  // Try to append first sentence of article for realistic flavor
  const sentences = articleText.split(/[.!?]\s+/);
  if (sentences.length > 0 && sentences[0].length > 10) {
    summary = `${cleanTitle}: ${sentences[0].trim()}. This operational event is classified under ${eventType.replace('_', ' ')}.`;
  }

  return {
    provider_id: providerId,
    model_id: modelId,
    event_type: eventType,
    summary: summary,
    impact_score: impactScore,
    region_affected: regionAffected
  };
}
