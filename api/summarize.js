 // api/summarize.js - 最小化测试
module.exports = (req, res) => {
  // 设置返回JSON格式
  res.setHeader('Content-Type', 'application/json');
  // 返回一个成功的消息
  res.status(200).send(JSON.stringify({ 
    success: true, 
    message: "🎉 连通性测试成功！服务器正在运行。",
    timestamp: new Date().toISOString(),
    yourPath: req.url,
    yourMethod: req.method
  }, null, 2));
};