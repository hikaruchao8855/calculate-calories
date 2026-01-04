export default async function handler(req, res) {
    // 1. 檢查方法
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 2. 獲取資料 (這裡最容易出錯，確保前端傳的是 foodText)
    const { foodText } = req.body;

    // 3. 檢查變數是否存在
    if (!foodText) {
        return res.status(400).json({ error: '未接收到 foodText 內容' });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    
    // 構建 Prompt
    const prompt = `你是一個營養學專家。請分析以下食物列表並計算熱量： "${foodText}"。請以 JSON 格式回傳，格式如下： { "total_calories": 數字, "items": [ {"name": "名稱", "quantity": "數量", "calories": 數字, "is_fattening": true/false, "note": "說明"} ] }`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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

        const data = await response.json();
        const result = JSON.parse(data.choices[0].message.content);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: 'AI 解析失敗: ' + error.message });
    }
}
