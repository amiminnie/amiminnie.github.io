import requests
import json

USERNAME = "amiminnie"

url = f"https://www.duolingo.com/2017-06-30/users?username={USERNAME}"

r = requests.get(url)
r.raise_for_status()

user = r.json()["users"][0]

output = {
    "username": user["username"],
    "xp": user.get("totalXp"),
    "streak": user.get("streak"),
    "courses": []
}

for course in user.get("courses", []):
    output["courses"].append({
        "language": course.get("title"),
        "xp": course.get("xp"),
        "level": course.get("level")
    })

with open("scripts/duodata.json", "w") as f:
    json.dump(output, f, indent=4)
