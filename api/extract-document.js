// Vercel Serverless Function to securely communicate with the Gemini API for document extraction
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, mimeType, apiKey, model, settings } = req.body;

    if (!image || !mimeType) {
      return res.status(400).json({ error: 'Missing image data or mimeType' });
    }

    const finalApiKey = apiKey || process.env.GEMINI_API_KEY;
    if (!finalApiKey) {
      return res.status(400).json({ error: 'Gemini API Key is not configured. Please configure it in AI Settings.' });
    }

    // Use the model sent by the client directly, defaulting to gemini-3.5-flash
    const finalModel = model || 'gemini-3.5-flash';

    // Construct prompt extra instructions
    let extraInstructions = "";
    if (settings) {
      if (settings.normalizeDates) {
        extraInstructions += "- Normalize all extracted dates to YYYY-MM-DD format (e.g. '12 April 2006' -> '2006-04-12').\n";
      }
      if (settings.mergeNames) {
        extraInstructions += "- Merge names (first name, given name, family name) into a single FULL NAME field where applicable.\n";
      }
    }

    const promptText = `You are an OCR and document extraction assistant.
Analyze the uploaded document.
Extract all readable information.

Specific instructions:
${extraInstructions}
- Identify the document type automatically (e.g. Passport, ID Card, Diploma, Certificate, Visa, Transcript).
- The "FULL_NAME" field MUST be constructed as the concatenation of: Surname + Given Names + Father's Name (patronymic / Otasining ismi) if present on the document, in that exact order (e.g., combining Surname + Given Names + Otasining ismi like "ISAKJONOV MUKHAMMADIYOR NAVRUZBEK UGLI" or "ABDUKHOSHIMOV DONIYORBEK SIROJIDDIN UGLI"). Ensure no part of the name (like Father's name / Otasining ismi) is omitted.
- Extract the sex/gender field as "SEX" (value must be exactly "M" or "F").
- Extract only meaningful fields (e.g. FULL NAME, PASSPORT NUMBER, DATE OF BIRTH, DATE OF ISSUE, DATE OF EXPIRATION, SEX, etc.).
- Ignore watermarks, decorative branding, or irrelevant numbers.
- Provide a full raw OCR text in the "ocr_text" property.

Return JSON only. Do not explain anything. Output must be exactly in this JSON format:
{
  "document_type": "...",
  "ocr_text": "...",
  "fields": {
    "FULL_NAME": "...",
    "PASSPORT_NUMBER": "...",
    "DATE_OF_BIRTH": "...",
    "DATE_OF_ISSUE": "...",
    "DATE_OF_EXPIRATION": "...",
    "SEX": "..."
  }
}`;

    // Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${finalModel}:generateContent?key=${finalApiKey}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptText },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: image
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API response error:', data);
      const errMsg = data.error?.message || 'Error communicating with Gemini API';
      return res.status(response.status).json({ error: errMsg });
    }

    const candidates = data.candidates || [];
    if (candidates.length === 0 || !candidates[0].content?.parts?.[0]?.text) {
      return res.status(500).json({ error: 'No content returned from Gemini' });
    }

    const resultText = candidates[0].content.parts[0].text;
    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText);
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON output:', resultText);
      return res.status(500).json({
        error: 'Gemini output was not valid JSON',
        rawOutput: resultText
      });
    }

    return res.status(200).json(parsedResult);

  } catch (err) {
    console.error('Serverless function error:', err);
    return res.status(500).json({ error: err.message });
  }
}
