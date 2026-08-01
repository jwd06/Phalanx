import os, requests, json, sys 

#Check for certain keywords to avoid giving wrong advice
danger_words = [
    "heartattack",
    "heart-attack",
    "heart attack",
    "stroke",
    "chest pain",
    "suicide",
    "suicidal",
    "cannot breathe",
    "cant breathe",
    "can't breathe"
]

#function to catch the words
def check_msg(user_msg):
    msg = user_msg.lower()
    return any(words in msg for words in danger_words)


data = json.loads(sys.stdin.read())
message = data.get("message", "")
context = data.get("context", "")

api_key = os.getenv("PHALANX_AI")

system_prompt = """You are a helpful fitness coach and nutritionist.

Your goal is to provide FAST, actionable advice.
Follow these rules strictly:
1. START with the direct answer in BOLD.
2. Use a maximum of 3 bullet points for explanation.
3. Max answer of 100-200 words unless explicitly told to give more.
4. Do NOT provide tables unless explicitly asked for.
5. Give food list or what to eat for each meal (e.g., breakfast, lunch, snacks, dinner) based on the context and conversation data.

Safety rules:
1. If the user mentions a life-threatening emergency (heart attack, stroke, etc.) immediately tell them to call 911 or their local emergency services.
2. You are a language model, not a doctor. For specific medical conditions always include a brief disclaimer to consult a healthcare professional.
"""

ai_prompt = system_prompt
if context:
    ai_prompt += f"\n\nHere is the user's current app data:\n{context}"

if check_msg(message):
    print("Please call 911 or your local emergency services immediately. This AI cannot provide emergency medical assistance.", flush=True)
    sys.exit()


response = requests.post(
    url = "https://openrouter.ai/api/v1/chat/completions",
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    },

    data = json.dumps({
        "model" : "openai/gpt-oss-120b:free",
        "messages" : [
            {
                "role" : "system",
                "content": ai_prompt
            },
            {
                "role": "user",
                "content" : message
            }
        ],
        "stream": True
    }),
    stream=True
)

for line in response.iter_lines(chunk_size=1):
    if line:
        line = line.decode("utf-8")
        if line.startswith("data: "):
            payload = line[6:]
            if payload == "[DONE]":
                break
            try:
                chunk = json.loads(payload)
                delta = chunk["choices"][0]["delta"].get("content", "")
                if delta:
                    print(delta, end="", flush=True)
            except:
                pass

#result = response.json()
#reply = result["choices"][0]["message"]["content"]

#print(json.dumps({ "response": reply }))