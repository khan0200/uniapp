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

        const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

        const response = await fetch(telegramUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.description || 'Failed to send Telegram message');
        }

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Telegram API error:', error);
        return res.status(500).json({ error: error.message });
    }
}
