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

Specific instructions:
${extraInstructions}
- Identify the document type automatically (e.g. Passport, ID Card, Diploma, Certificate, Visa, Transcript).
- Generate ONLY necessary structured fields that are meaningful for the identified document type. Do not perform a general OCR of every text block, and do not extract design markings, watermarks, signatures, or noisy metadata.
- If the document is a Passport or ID Card, extract ONLY these fields:
  - "FULL_NAME": Concatenation of Surname + Given Names + Father's Name (patronymic / Otasining ismi) in that exact order (e.g. "ISAKJONOV MUKHAMMADIYOR NAVRUZBEK UGLI").
  - "PASSPORT_NUMBER"
  - "DATE_OF_BIRTH"
  - "DATE_OF_ISSUE"
  - "DATE_OF_EXPIRATION"
  - "SEX" (value must be exactly "M" or "F")
- If the document is a graduation/educational document (e.g. Shahodatnoma, Diploma, Certificate, Transcript):
  - Generate ONLY the primary educational fields available on the document, such as: "GRADUATION_DATE", "YEAR_OF_ISSUE", "NAME_OF_SCHOOL_OR_EDUCATIONAL_INSTITUTION", "MAJOR_OR_SPECIALTY", "DEPARTMENT".
  - The "NAME_OF_SCHOOL_OR_EDUCATIONAL_INSTITUTION" field MUST be translated into English and formatted in all UPPERCASE (e.g. "SPECIALIZED SCHOOL NO. 72 OF MARHAMAT DISTRICT" or "TASHKENT STATE UNIVERSITY").
- If the document is of another type:
  - Automatically detect and generate ONLY the key fields (maximum 5-6 core identifiers or dates) necessary to describe that document. Do not perform a general OCR of every text block.
- Ignore watermarks, decorative branding, or irrelevant numbers.
- Provide a full raw OCR text in the "ocr_text" property.

Return JSON only. Do not explain anything. Output must be exactly in this JSON format:
{
  "document_type": "...",
  "ocr_text": "...",
  "fields": {
    // Generate appropriate fields here dynamically depending on document type.
    // For Passports: FULL_NAME, PASSPORT_NUMBER, DATE_OF_BIRTH, DATE_OF_ISSUE, DATE_OF_EXPIRATION, SEX.
    // For Diplomas/Certificates: NAME_OF_SCHOOL_OR_EDUCATIONAL_INSTITUTION, GRADUATION_DATE, YEAR_OF_ISSUE, MAJOR_OR_SPECIALTY, DEPARTMENT.
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
