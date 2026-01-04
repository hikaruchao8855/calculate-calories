export default async function handler(req, res) {
    // 限制只允許 POST 請求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { foodText } = req.body;

    // 檢查是否有輸入內容
    if (!foodText) {
        return res.status(400).json({ error: '請提供食物名稱' });
    }

    // 從 Vercel 後台的環境變數讀取 API Key
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

    // 構建與原版一致的 Prompt
    const prompt = `
        你是一個營養學專家。請分析以下食物列表並計算熱量：
        "${foodText}"
        
        請以 JSON 格式回傳，不要有任何額外的解釋文字。格式如下：
        {
            "total_calories": 總熱量數字,
            "items": [
                {"name": "食物名稱", "quantity": 數量, "calories": 數字, "is_fattening": true/false, "note": "簡短說明"}
            ]
        }
        "is_fattening" 的判定標準為：高糖、高油脂、高度加工或高熱量密度的食物。
    `;

    try {
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
            console.error('Groq API Error:', errorData);
            return res.status(500).json({ error: '呼叫 Groq API 時發生錯誤' });
        }

        const data = await response.json();
        
        // 解析 AI 回傳的 JSON 字串
        const aiResult = JSON.parse(data.choices[0].message.content);

        // 將結果回傳給前端
        res.status(200).json(aiResult);

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ error: '伺服器內部錯誤' });
    }
}
