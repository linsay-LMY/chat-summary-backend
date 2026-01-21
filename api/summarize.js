// 文件：summarize.js
// 位置：chat-summary-backend/api/summarize.js
// 作用：这是你整个项目的“AI大脑”，负责调用百度AI

// 1. 引入必要的“工具包”
// 就像做菜需要锅和铲子，写代码也需要“工具”
const express = require('express');  // express是一个Web框架，帮你处理网络请求
const app = express();  // 创建一个express应用

// 2. 允许跨域访问（重要！）
// 你的插件在浏览器里，API在Vercel上，这是两个不同“地方”
// 需要特别允许才能互相通信
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');  // 允许所有来源访问
  res.header('Access-Control-Allow-Headers', 'Content-Type');  // 允许的请求头
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');  // 允许的请求方法
  if (req.method === 'OPTIONS') {
    return res.status(200).end();  // 处理预检请求
  }
  next();
});

// 3. 解析JSON格式的请求体
// 当插件发送数据过来时，能正确解析
app.use(express.json());

// 4. 定义你的核心API接口
// 当有人访问 /api/summarize 这个地址时，执行下面的代码
app.post('/api/summarize', async (req, res) => {
  console.log('收到分析请求');  // 在控制台打印，方便调试
  
  // 从请求体中获取用户发送的文本
  const { text } = req.body;
  
  // 如果没有文本，返回错误
  if (!text) {
    return res.status(400).json({ error: '没有提供文本' });
  }
  
  try {
    // 5. 获取百度AI的API Key（从环境变量读取，后面会设置）
    // 为什么要用环境变量？因为这是密码，不能公开写在代码里！
    const API_KEY = process.env.BAIDU_API_KEY;
    const SECRET_KEY = process.env.BAIDU_SECRET_KEY;
    
    // 6. 第一步：获取访问令牌
    // 百度AI要求先用API Key换一个临时令牌
    const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${API_KEY}&client_secret=${SECRET_KEY}`;
    
    const tokenRes = await fetch(tokenUrl, { method: 'POST' });
    const tokenData = await tokenRes.json();
    
    if (tokenData.error) {
      throw new Error(`获取Token失败: ${tokenData.error_description}`);
    }
    
    const accessToken = tokenData.access_token;
    
    // 7. 第二步：调用百度AI
    const aiUrl = `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token=${accessToken}`;
    
    // 这是给AI的“指令”，非常重要！它决定了AI如何回答
    const prompt = `你是一个专业的通知信息提取助手。请从以下微信群聊中，提取所有通知类信息。

要求：
1. 只提取活动、任务、会议等通知，忽略闲聊
2. 为每条通知分类：强制（包含"必须"、"全体"等）、可选（包含"欢迎"、"自愿"等）、信息（仅告知）
3. 提取以下信息：主题、时间、地点、要求、截止时间、联系人
4. 用JSON格式输出，如：[{"title":"班会","type":"强制","time":"周五下午2点","location":"教学楼302"}]

群聊记录：${text}`;
    
    const aiRes = await fetch(aiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1
      })
    });
    
    const aiData = await aiRes.json();
    
    // 8. 处理AI返回的结果
    let resultText = 'AI分析结果：\n';
    
    if (aiData.result) {
      resultText += aiData.result;
    } else {
      resultText += 'AI没有返回有效结果';
    }
    
    // 9. 返回给调用者（你的插件）
    res.json({ 
      success: true, 
      summary: resultText,
      raw: aiData 
    });
    
  } catch (error) {
    // 10. 错误处理
    console.error('处理失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 11. 导出这个应用，让Vercel能运行它
module.exports = app;