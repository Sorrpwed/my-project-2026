import os
import httpx
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import json

app = FastAPI()

# 挂载静态文件目录
app.mount("/static", StaticFiles(directory="static"), name="static")

# 智谱 AI 配置
ZHIPU_API_KEY = os.getenv("ZHIPU_API_KEY", "36e7360c21a54116a5760bba496a72ce.LkUOK41zqZNR9HvZ")
ZHIPU_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"


@app.get("/", response_class=HTMLResponse)
async def index():
    with open("static/index.html", encoding="utf-8") as f:
        return f.read()


@app.post("/chat")
async def chat(request: Request):
    data = await request.json()
    user_message = data.get("message", "")

    if not user_message:
        return JSONResponse({"error": "消息不能为空"}, status_code=400)

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            ZHIPU_API_URL,
            headers={
                "Authorization": f"Bearer {ZHIPU_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "glm-4-flash",
                "messages": [
                    {"role": "system", "content": "你是一个有用的AI助手，回答简洁专业。"},
                    {"role": "user", "content": user_message},
                ],
                "temperature": 0.7,
            },
        )

    if resp.status_code != 200:
        return JSONResponse(
            {"error": f"API调用失败: {resp.status_code}"}, status_code=500
        )

    result = resp.json()
    reply = result["choices"][0]["message"]["content"]
    return JSONResponse({"reply": reply})
