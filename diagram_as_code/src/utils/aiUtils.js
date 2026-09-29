export const generateDynamicContent = async (prompt, modelId, currentConfig) => {
  try {
    const modelConfig = currentConfig.genai_models?.find(m => m.id === modelId);
    if (!modelConfig) {
      throw new Error('Model configuration not found');
    }

    const response = await fetch(modelConfig.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelId,
        messages: [{
          role: 'user',
          content: `Generate a new infrastructure component for: "${prompt}".
Return ONLY a JSON object with these fields:
{
  "title": "Component Name",
  "description": "Brief description",
  "icon": "database|server|brain|shield|globe|code",
  "color": "blue|green|purple|orange|red|indigo",
  "details": ["Detail 1", "Detail 2", "Detail 3"]
}`
        }],
        max_tokens: 300,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    return content;

  } catch (error) {
    console.error('Error generating dynamic content:', error);
    throw error;
  }
};
