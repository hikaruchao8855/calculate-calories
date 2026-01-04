export default async function handler(req, res) {
    // 1. 強制檢查是否為 POST 請求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '請使用 POST 方法' });
    }

    try {
        // 2. 取得並檢查 foodText (增加預設值避免報錯)
        const body = req.body || {};
        const foodText = body.foodText;

        // 如果真的沒拿到資料，直接回報具體錯誤，不要往下執行
        if (!foodText) {
            return res.status(400).json({ error: '後端未接收到 foodText，請檢查前端傳輸格式。' });
        }

        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        
        // 3. 組合 Prompt (確保在這裡變數 foodText 一定存在)
        const prompt = `你是一個營養學專家。請分析以下食物列表並計算熱量： "${foodText}"。請以 JSON 格式回傳，不要有額外的解釋。格式如下： { "total_calories": 數字, "items": [ {"name": "名稱", "quantity": "數量", "calories": 數字, "is_fattening": true, "note": "說明"} ] }`;

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
        
        if (data.choices && data.choices[0]) {
            const aiResult = JSON.parse(data.choices[0].message.content);
            return res.status(200).json(aiResult);
        } else {
            throw new Error('Groq API 回傳格式異常');
        }

    } catch (error) {
        // 將具體錯誤顯示在前端，方便 debug
        return res.status(500).json({ error: '後端執行失敗: ' + error.message });
    }
}
