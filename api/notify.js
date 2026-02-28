// This Vercel Serverless Function proxy securely sends a Telegram message without exposing credentials
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message } = req.body;

        // Vercel Environment Variables
        const botToken = process.env.BOT_TOKEN;
        const chatId = process.env.CHAT_ID;

        if (!botToken || !chatId) {
            return res.status(500).json({ error: 'Server configuration error: Telegram credentials not set' });
        }

        // Setup Telegram URL
        const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

        // Split chat IDs by comma to support multiple users (e.g., "ID1,ID2,ID3")
        const chatIds = chatId.split(',').map(id => id.trim()).filter(id => id);

        if (chatIds.length === 0) {
            return res.status(500).json({ error: 'No valid chat IDs found in configuration' });
        }

        // Send to all chat IDs in parallel
        const sendPromises = chatIds.map(async (id) => {
            const response = await fetch(telegramUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: id,
                    text: message,
                    parse_mode: 'HTML'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error(`Failed to send Telegram message to ${id}:`, data.description);
                return { success: false, id, error: data.description };
            }
            return { success: true, id, data };
        });

        // Wait for all messages to be sent
        const results = await Promise.all(sendPromises);

        // Check if all failed
        const failures = results.filter(r => !r.success);
        if (failures.length === chatIds.length && chatIds.length > 0) {
            throw new Error(`Failed to send to any chat IDs. First error: ${failures[0].error}`);
        }

        return res.status(200).json({ 
            success: true, 
            message: `Sent to ${chatIds.length - failures.length} of ${chatIds.length} chats`,
            results 
        });
    } catch (error) {
        console.error('Telegram API error:', error);
        return res.status(500).json({ error: error.message });
    }
}
