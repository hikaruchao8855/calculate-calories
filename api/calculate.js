export default async function handler(req, res) {
    // 1. 檢查是否為 POST 請求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 2. 從 req.body 中解構出 foodText
        // 注意：這裡必須確保前端傳過來的 JSON Key 叫做 foodText
        const { foodText } = req.body;

        // 3. 檢查變數是否真的有拿到（防止變數未定義報錯）
        if (!foodText) {
            return res.status(400).json({ error: '接收到的食物內容為空' });
        }

        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

        // 4. 定義 Prompt (確保 foodText 在這裡已經被正確定義)
        const prompt = `你是一個營養學專家。請分析以下食物列表並計算熱量： "${foodText}"。請以 JSON 格式回傳，不要有任何額外的解釋文字。格式如下： { "total_calories": 總熱量數字, "items": [ {"name": "食物名稱", "quantity": 數量, "calories": 數字, "is_fattening": true/false, "note": "簡短說明"} ] }`;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(500).json({ error: 'Groq API 錯誤', details: errorData });
        }

        const data = await response.json();
        const result = JSON.parse(data.choices[0].message.content);

        // 5. 回傳結果給前端
        return res.status(200).json(result);

    } catch (error) {
        // 捕捉任何可能的錯誤並回傳給前端顯示
        console.error('Server Error:', error);
        return res.status(500).json({ error: '伺服器內部錯誤: ' + error.message });
    }
}
