from zhipuai import ZhipuAI

API_KEY = "36e7360c21a54116a5760bba496a72ce.LkUOK41zqZNR9HvZ"

client = ZhipuAI(api_key=API_KEY)

response = client.chat.completions.create(
    model="glm-4-flash",
    messages=[
        {"role": "user", "content": "你好，请用一句话介绍一下你自己。"}
    ]
)

print(response.choices[0].message.content)
