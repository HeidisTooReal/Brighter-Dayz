from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
import secrets
from datetime import datetime, timezone, timedelta, date

import jwt
import bcrypt
from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from bson import ObjectId

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
from emergentintegrations.llm.openai import OpenAITextToSpeech

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
JWT_SECRET = os.environ.get('JWT_SECRET', 'dev-secret-change-me')
JWT_ALGORITHM = "HS256"
MIN_SELF_SIGNUP_AGE = 13   # Google Play / COPPA minimum age for self sign-up without a parent

app = FastAPI(title="Brighter Dayz API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("brighterdayz")

# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email,
               "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def set_auth_cookie(response: Response, token: str):
    response.set_cookie(key="access_token", value=token, httponly=True,
                        secure=False, samesite="lax", max_age=604800, path="/")

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not signed in")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid session")

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class RegisterInput(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "parent"          # parent | teen
    age: Optional[int] = None     # required for teen self-signup

class PinInput(BaseModel):
    pin: str

class PrayerInput(BaseModel):
    text: str
    kind: str = "prayer"   # prayer | thanks | request

class PrayerGenInput(BaseModel):
    feeling: Optional[str] = None
    about: Optional[str] = None
    age: int = 8

class LoginInput(BaseModel):
    email: EmailStr
    password: str

class ChildInput(BaseModel):
    name: str
    age: int
    avatar: str = "lamb"

class MoodInput(BaseModel):
    mood: str          # struggling | anxious | okay | better | grateful
    note: Optional[str] = ""

class ChatInput(BaseModel):
    message: str

class AffirmationInput(BaseModel):
    age: int = 8
    feeling: Optional[str] = None

class StoryInput(BaseModel):
    kind: str = "biblical"      # biblical | reallife
    topic: Optional[str] = None
    age: int = 8

class TTSInput(BaseModel):
    text: str
    voice: str = "coral"

class ActivityInput(BaseModel):
    type: str          # breathing | game | story | affirmation | chat
    detail: Optional[str] = ""

# ---------------------------------------------------------------------------
# Daily faith content (kid friendly, rotates by day of year)
# ---------------------------------------------------------------------------
DAILY_VERSES = [
    {"text": "I can do all things through Christ who gives me strength.", "ref": "Philippians 4:13"},
    {"text": "Be strong and brave. Do not be afraid, for the Lord your God is with you wherever you go.", "ref": "Joshua 1:9"},
    {"text": "God is my helper. I will not be afraid.", "ref": "Psalm 118:6"},
    {"text": "Cast all your worries on Him, because He cares about you.", "ref": "1 Peter 5:7"},
    {"text": "The Lord is my shepherd; I have everything I need.", "ref": "Psalm 23:1"},
    {"text": "God made you wonderfully. You are special!", "ref": "Psalm 139:14"},
    {"text": "Let the little children come to me, said Jesus.", "ref": "Matthew 19:14"},
    {"text": "Be kind to one another, tender-hearted and forgiving.", "ref": "Ephesians 4:32"},
    {"text": "God is close to you when you feel sad.", "ref": "Psalm 34:18"},
    {"text": "Give thanks to the Lord, for He is good!", "ref": "Psalm 107:1"},
    {"text": "When I am afraid, I put my trust in God.", "ref": "Psalm 56:3"},
    {"text": "Do everything in love.", "ref": "1 Corinthians 16:14"},
    {"text": "God's love for you never, ever ends.", "ref": "Psalm 136:1"},
    {"text": "You are the light of the world. Let your light shine!", "ref": "Matthew 5:14"},
    {"text": "Come to me when you are tired, and I will give you rest.", "ref": "Matthew 11:28"},
]
DAILY_AFFIRMATIONS = [
    "I am loved by God, exactly as I am.",
    "I am brave, even when things feel hard.",
    "God made me special and good.",
    "I can be kind to myself and to others today.",
    "It's okay to feel my feelings. God is with me.",
    "I am never alone — God is always near.",
    "Today is a brand new chance to shine.",
    "I am calm. I can take a deep breath.",
    "My family and God love me very much.",
    "I am strong, and I can ask for help when I need it.",
    "God has good plans for me.",
    "I matter, and my feelings matter.",
    "I can do hard things with God's help.",
    "I choose to be thankful for today.",
    "I am safe, I am loved, I am enough.",
]

def todays_index(n: int) -> int:
    return date.today().timetuple().tm_yday % n

# ---------------------------------------------------------------------------
# Scripture library — comforting verses grouped by feeling (kid-friendly)
# ---------------------------------------------------------------------------
SCRIPTURE_LIBRARY = [
    {"id": "scared", "label": "When I'm Scared", "emoji": "😨", "color": "#FFD9D4", "verses": [
        {"text": "When I am afraid, I will trust in You.", "ref": "Psalm 56:3"},
        {"text": "Do not be afraid, for I am with you.", "ref": "Isaiah 41:10"},
        {"text": "God has not given us a spirit of fear, but of power and love.", "ref": "2 Timothy 1:7"},
        {"text": "Be strong and brave. The Lord your God is with you wherever you go.", "ref": "Joshua 1:9"},
    ]},
    {"id": "sad", "label": "When I'm Sad", "emoji": "😢", "color": "#CDEAFE", "verses": [
        {"text": "The Lord is close to the brokenhearted.", "ref": "Psalm 34:18"},
        {"text": "He heals the brokenhearted and bandages their wounds.", "ref": "Psalm 147:3"},
        {"text": "God will wipe away every tear.", "ref": "Revelation 21:4"},
        {"text": "Weeping may stay for the night, but joy comes in the morning.", "ref": "Psalm 30:5"},
    ]},
    {"id": "worried", "label": "When I'm Worried", "emoji": "😟", "color": "#FFE3B3", "verses": [
        {"text": "Give all your worries to God, because He cares for you.", "ref": "1 Peter 5:7"},
        {"text": "Do not worry about tomorrow. God will take care of you.", "ref": "Matthew 6:34"},
        {"text": "Do not be anxious. Pray, and God's peace will guard your heart.", "ref": "Philippians 4:6-7"},
        {"text": "Come to me when you are tired, and I will give you rest.", "ref": "Matthew 11:28"},
    ]},
    {"id": "lonely", "label": "When I'm Lonely", "emoji": "🥺", "color": "#E8DFF5", "verses": [
        {"text": "I am with you always.", "ref": "Matthew 28:20"},
        {"text": "God sets the lonely in families.", "ref": "Psalm 68:6"},
        {"text": "I will never leave you nor forsake you.", "ref": "Hebrews 13:5"},
        {"text": "The Lord is my shepherd; I have all that I need.", "ref": "Psalm 23:1"},
    ]},
    {"id": "angry", "label": "When I'm Angry", "emoji": "😤", "color": "#FFC7B8", "verses": [
        {"text": "Be quick to listen, slow to speak, and slow to get angry.", "ref": "James 1:19"},
        {"text": "A gentle answer turns away anger.", "ref": "Proverbs 15:1"},
        {"text": "Be kind and forgiving to one another.", "ref": "Ephesians 4:32"},
        {"text": "Let God's peace rule in your heart.", "ref": "Colossians 3:15"},
    ]},
    {"id": "brave", "label": "When I Need Courage", "emoji": "🦁", "color": "#FFE08A", "verses": [
        {"text": "I can do all things through Christ who gives me strength.", "ref": "Philippians 4:13"},
        {"text": "God is my strength and my shield.", "ref": "Psalm 28:7"},
        {"text": "Be strong and courageous. Do not be afraid.", "ref": "Deuteronomy 31:6"},
        {"text": "The Lord is my light and my salvation—whom shall I fear?", "ref": "Psalm 27:1"},
    ]},
    {"id": "thankful", "label": "When I'm Thankful", "emoji": "😄", "color": "#A0E7B0", "verses": [
        {"text": "Give thanks to the Lord, for He is good!", "ref": "Psalm 107:1"},
        {"text": "Every good gift comes from God.", "ref": "James 1:17"},
        {"text": "This is the day the Lord has made; let us rejoice!", "ref": "Psalm 118:24"},
        {"text": "Give thanks in all circumstances.", "ref": "1 Thessalonians 5:18"},
    ]},
    {"id": "loved", "label": "When I Forget I'm Loved", "emoji": "💛", "color": "#FFD8E4", "verses": [
        {"text": "I have loved you with an everlasting love.", "ref": "Jeremiah 31:3"},
        {"text": "You are wonderfully made.", "ref": "Psalm 139:14"},
        {"text": "See how much the Father loves us—He calls us His children!", "ref": "1 John 3:1"},
        {"text": "Nothing can ever separate us from God's love.", "ref": "Romans 8:38-39"},
    ]},
]

# ---------------------------------------------------------------------------
# AI helpers
# ---------------------------------------------------------------------------

def buddy_system_prompt(child_name: str, age: int) -> str:
    return (
        f"You are Sunny, a gentle, cheerful cartoon lamb who is a caring friend to {child_name}, "
        f"a {age}-year-old child, in a Christian faith-based kids app called Brighter Dayz. "
        "You speak warmly, simply, and with lots of encouragement, the way a kind Sunday-school teacher "
        "would talk to a young child. Use short sentences and easy words appropriate for the child's age. "
        "Gently weave in God's love, hope, and simple Bible truths when it fits naturally, without being preachy. "
        "Help the child name and understand their feelings, and suggest small healthy coping ideas like "
        "deep breaths, talking to a trusted grown-up, drawing, or saying a short prayer. "
        "You are NOT a therapist or doctor and never give medical or diagnosis advice. "
        "SAFETY: If the child mentions wanting to hurt themselves or others, being hurt or abused, or being in danger, "
        "respond with calm warmth, tell them it is brave to share, and gently and clearly encourage them to tell a "
        "trusted grown-up right away (a parent, teacher, or counselor) and that they can tap the 'Get Help' button. "
        "Never use scary language. Keep replies brief (2-5 short sentences). Avoid emojis overload; one or two at most. "
        "Always be safe, positive, age-appropriate, and loving."
    )

def make_chat(session_id: str, system_prompt: str) -> LlmChat:
    return LlmChat(api_key=EMERGENT_LLM_KEY, session_id=session_id,
                   system_message=system_prompt).with_model("anthropic", "claude-sonnet-4-6")

# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------

@api_router.post("/auth/register")
async def register(data: RegisterInput, response: Response):
    email = data.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    role = data.role if data.role in ("parent", "teen") else "parent"
    child_id = None

    if role == "teen":
        if not data.age or data.age < MIN_SELF_SIGNUP_AGE:
            raise HTTPException(status_code=400,
                detail=f"You need a parent or guardian to set up your account. Kids under {MIN_SELF_SIGNUP_AGE} can ask a grown-up to create one for them.")

    doc = {"email": email, "password_hash": hash_password(data.password),
           "name": data.name.strip(), "role": role, "age": data.age,
           "created_at": datetime.now(timezone.utc).isoformat()}
    res = await db.users.insert_one(doc)
    uid = str(res.inserted_id)

    if role == "teen":
        child = {"id": str(uuid.uuid4()), "parent_id": uid, "name": data.name.strip(),
                 "age": data.age, "avatar": "🦊", "stars": 0, "streak": 0,
                 "last_active": None, "badges": [], "self": True,
                 "created_at": datetime.now(timezone.utc).isoformat()}
        await db.children.insert_one(child)
        child_id = child["id"]

    token = create_access_token(uid, email)
    set_auth_cookie(response, token)
    return {"id": uid, "name": doc["name"], "email": email, "role": role,
            "child_id": child_id, "has_pin": False, "token": token}

@api_router.post("/auth/login")
async def login(data: LoginInput, response: Response):
    email = data.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Wrong email or password.")
    uid = str(user["_id"])
    token = create_access_token(uid, email)
    set_auth_cookie(response, token)
    return {"id": uid, "name": user.get("name"), "email": email, "role": user.get("role", "parent"),
            "has_pin": bool(user.get("pin_hash")), "token": token}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"id": user["_id"], "name": user.get("name"), "email": user.get("email"),
            "role": user.get("role", "parent"), "has_pin": bool(user.get("pin_hash"))}

@api_router.post("/auth/set-pin")
async def set_pin(data: PinInput, user: dict = Depends(get_current_user)):
    pin = (data.pin or "").strip()
    if not (pin.isdigit() and 4 <= len(pin) <= 6):
        raise HTTPException(status_code=400, detail="PIN must be 4 to 6 numbers.")
    await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": {"pin_hash": hash_password(pin)}})
    return {"ok": True}

@api_router.post("/auth/verify-pin")
async def verify_pin(data: PinInput, user: dict = Depends(get_current_user)):
    full = await db.users.find_one({"_id": ObjectId(user["_id"])})
    if not full or not full.get("pin_hash") or not verify_password((data.pin or "").strip(), full["pin_hash"]):
        raise HTTPException(status_code=401, detail="That PIN isn't right. Try again.")
    return {"ok": True}

# ---------------------------------------------------------------------------
# Child profile routes
# ---------------------------------------------------------------------------

async def get_owned_child(child_id: str, user: dict) -> dict:
    child = await db.children.find_one({"id": child_id, "parent_id": user["_id"]})
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found")
    child.pop("_id", None)
    return child

@api_router.post("/children")
async def create_child(data: ChildInput, user: dict = Depends(get_current_user)):
    doc = {"id": str(uuid.uuid4()), "parent_id": user["_id"], "name": data.name.strip(),
           "age": data.age, "avatar": data.avatar, "stars": 0, "streak": 0,
           "last_active": None, "badges": [],
           "created_at": datetime.now(timezone.utc).isoformat()}
    await db.children.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/children")
async def list_children(user: dict = Depends(get_current_user)):
    children = await db.children.find({"parent_id": user["_id"]}, {"_id": 0}).to_list(50)
    return children

@api_router.get("/children/{child_id}")
async def get_child(child_id: str, user: dict = Depends(get_current_user)):
    return await get_owned_child(child_id, user)

@api_router.delete("/children/{child_id}")
async def delete_child(child_id: str, user: dict = Depends(get_current_user)):
    await get_owned_child(child_id, user)
    await db.children.delete_one({"id": child_id})
    await db.moods.delete_many({"child_id": child_id})
    await db.chat_messages.delete_many({"child_id": child_id})
    await db.stories.delete_many({"child_id": child_id})
    await db.activities.delete_many({"child_id": child_id})
    await db.prayers.delete_many({"child_id": child_id})
    return {"ok": True}

# ---------------------------------------------------------------------------
# Rewards helper
# ---------------------------------------------------------------------------
BADGES = [
    {"id": "first_step", "label": "First Step", "stars": 1},
    {"id": "rising_sun", "label": "Rising Sun", "stars": 10},
    {"id": "brave_heart", "label": "Brave Heart", "stars": 25},
    {"id": "shining_star", "label": "Shining Star", "stars": 50},
    {"id": "sunshine_hero", "label": "Sunshine Hero", "stars": 100},
]

async def award_stars(child: dict, amount: int) -> dict:
    today_str = date.today().isoformat()
    last = child.get("last_active")
    streak = child.get("streak", 0)
    if last != today_str:
        if last == (date.today() - timedelta(days=1)).isoformat():
            streak += 1
        else:
            streak = 1
    new_stars = child.get("stars", 0) + amount
    badges = set(child.get("badges", []))
    for b in BADGES:
        if new_stars >= b["stars"]:
            badges.add(b["id"])
    await db.children.update_one({"id": child["id"]},
        {"$set": {"stars": new_stars, "streak": streak, "last_active": today_str,
                  "badges": list(badges)}})
    updated = await db.children.find_one({"id": child["id"]}, {"_id": 0})
    return updated

# ---------------------------------------------------------------------------
# Mood routes
# ---------------------------------------------------------------------------

@api_router.post("/children/{child_id}/moods")
async def log_mood(child_id: str, data: MoodInput, user: dict = Depends(get_current_user)):
    child = await get_owned_child(child_id, user)
    doc = {"id": str(uuid.uuid4()), "child_id": child_id, "mood": data.mood,
           "note": data.note or "", "created_at": datetime.now(timezone.utc).isoformat()}
    await db.moods.insert_one(doc)
    updated = await award_stars(child, 2)
    doc.pop("_id", None)
    return {"mood": doc, "child": updated}

@api_router.get("/children/{child_id}/moods")
async def get_moods(child_id: str, user: dict = Depends(get_current_user)):
    await get_owned_child(child_id, user)
    moods = await db.moods.find({"child_id": child_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return moods

# ---------------------------------------------------------------------------
# Activity log (for parent dashboard) + rewards
# ---------------------------------------------------------------------------

@api_router.post("/children/{child_id}/activities")
async def log_activity(child_id: str, data: ActivityInput, user: dict = Depends(get_current_user)):
    child = await get_owned_child(child_id, user)
    doc = {"id": str(uuid.uuid4()), "child_id": child_id, "type": data.type,
           "detail": data.detail or "", "created_at": datetime.now(timezone.utc).isoformat()}
    await db.activities.insert_one(doc)
    updated = await award_stars(child, 3)
    return {"ok": True, "child": updated}

@api_router.get("/children/{child_id}/activities")
async def get_activities(child_id: str, user: dict = Depends(get_current_user)):
    await get_owned_child(child_id, user)
    acts = await db.activities.find({"child_id": child_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return acts

@api_router.get("/children/{child_id}/rewards")
async def get_rewards(child_id: str, user: dict = Depends(get_current_user)):
    child = await get_owned_child(child_id, user)
    return {"stars": child.get("stars", 0), "streak": child.get("streak", 0),
            "badges": child.get("badges", []), "all_badges": BADGES}

# ---------------------------------------------------------------------------
# Daily content
# ---------------------------------------------------------------------------

@api_router.get("/daily")
async def daily():
    return {"verse": DAILY_VERSES[todays_index(len(DAILY_VERSES))],
            "affirmation": DAILY_AFFIRMATIONS[todays_index(len(DAILY_AFFIRMATIONS))],
            "date": date.today().isoformat()}

# ---------------------------------------------------------------------------
# AI Buddy chat (streaming SSE)
# ---------------------------------------------------------------------------

@api_router.get("/children/{child_id}/chat/history")
async def chat_history(child_id: str, user: dict = Depends(get_current_user)):
    await get_owned_child(child_id, user)
    msgs = await db.chat_messages.find({"child_id": child_id}, {"_id": 0}).sort("created_at", 1).to_list(200)
    return msgs

@api_router.post("/children/{child_id}/chat")
async def chat(child_id: str, data: ChatInput, user: dict = Depends(get_current_user)):
    child = await get_owned_child(child_id, user)
    now = datetime.now(timezone.utc).isoformat()
    await db.chat_messages.insert_one({"child_id": child_id, "role": "user",
                                       "text": data.message, "created_at": now})

    history = await db.chat_messages.find({"child_id": child_id}, {"_id": 0}).sort("created_at", 1).to_list(200)
    recent = history[-12:-1] if len(history) > 1 else []
    transcript = "\n".join([f"{'Child' if m['role']=='user' else 'Sunny'}: {m['text']}" for m in recent])

    system = buddy_system_prompt(child["name"], child.get("age", 8))
    if transcript:
        system += "\n\nConversation so far:\n" + transcript

    chat_inst = make_chat(f"buddy-{child_id}", system)

    async def gen():
        full = ""
        try:
            async for ev in chat_inst.stream_message(UserMessage(text=data.message)):
                if isinstance(ev, TextDelta):
                    full += ev.content
                    yield ev.content
                elif isinstance(ev, StreamDone):
                    break
        except Exception as e:
            logger.exception("chat stream failed")
            if not full:
                full = "I'm here for you, friend. Let's take a deep breath together. 🌬️"
                yield full
        await db.chat_messages.insert_one({"child_id": child_id, "role": "assistant",
                                           "text": full, "created_at": datetime.now(timezone.utc).isoformat()})

    return StreamingResponse(gen(), media_type="text/plain",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

# ---------------------------------------------------------------------------
# AI Affirmation
# ---------------------------------------------------------------------------

@api_router.post("/affirmation/generate")
async def gen_affirmation(data: AffirmationInput, user: dict = Depends(get_current_user)):
    feeling = f" The child is feeling {data.feeling}." if data.feeling else ""
    system = ("You write a single short, uplifting, Christian faith-based affirmation for a child "
              f"around {data.age} years old. One sentence, warm, simple words, present tense, first person ('I am...'). "
              "Gently reflect God's love. No quotes, no emojis, no extra text. Just the affirmation sentence.")
    chat_inst = make_chat(f"affirm-{uuid.uuid4()}", system)
    try:
        resp = await chat_inst.send_message(UserMessage(text=f"Write one affirmation.{feeling}"))
        text = (resp or "").strip().strip('"')
    except Exception:
        text = DAILY_AFFIRMATIONS[todays_index(len(DAILY_AFFIRMATIONS))]
    return {"affirmation": text}

# ---------------------------------------------------------------------------
# AI Story
# ---------------------------------------------------------------------------

@api_router.post("/story/generate")
async def gen_story(data: StoryInput, user: dict = Depends(get_current_user)):
    if data.kind == "biblical":
        flavor = ("Tell a short, gentle Bible-based story for a young child that teaches about God's love, "
                  "courage, or kindness (you may retell a simple Bible story or a story inspired by Jesus the Good Shepherd).")
    else:
        flavor = ("Tell a short, gentle real-life story for a young child about an everyday situation they might face "
                  "(like feeling nervous at school, missing a friend, being scared at night, or sharing), and how they "
                  "found comfort, courage, and hope, with a gentle reminder that God is with them.")
    topic = f" The story should relate to: {data.topic}." if data.topic else ""
    system = (f"You are a warm children's storyteller for a Christian kids app. {flavor} "
              f"Write for a child around {data.age} years old. Keep it 150-220 words, simple words, short paragraphs, "
              "a comforting, hopeful ending, and a one-line gentle lesson at the end starting with 'Remember:'. "
              "Start with a short fun title on the first line.")
    chat_inst = make_chat(f"story-{uuid.uuid4()}", system)
    try:
        resp = await chat_inst.send_message(UserMessage(text=f"Write the story now.{topic}"))
        text = (resp or "").strip()
    except Exception:
        raise HTTPException(status_code=503, detail="Story time is resting. Please try again in a moment.")
    lines = [l for l in text.split("\n") if l.strip()]
    title = lines[0].strip("# ").strip() if lines else "A Brighter Day"
    body = "\n".join(lines[1:]).strip() if len(lines) > 1 else text
    return {"title": title, "body": body, "kind": data.kind}

@api_router.post("/children/{child_id}/stories/save")
async def save_story(child_id: str, payload: dict, user: dict = Depends(get_current_user)):
    await get_owned_child(child_id, user)
    doc = {"id": str(uuid.uuid4()), "child_id": child_id, "title": payload.get("title"),
           "body": payload.get("body"), "kind": payload.get("kind"),
           "created_at": datetime.now(timezone.utc).isoformat()}
    await db.stories.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/children/{child_id}/stories")
async def list_stories(child_id: str, user: dict = Depends(get_current_user)):
    await get_owned_child(child_id, user)
    return await db.stories.find({"child_id": child_id}, {"_id": 0}).sort("created_at", -1).to_list(100)

# ---------------------------------------------------------------------------
# Scripture library + Prayer Corner
# ---------------------------------------------------------------------------

@api_router.get("/scriptures")
async def scriptures():
    return {"categories": SCRIPTURE_LIBRARY}

@api_router.post("/prayer/generate")
async def gen_prayer(data: PrayerGenInput, user: dict = Depends(get_current_user)):
    ctx = ""
    if data.feeling:
        ctx += f" The child is feeling {data.feeling}."
    if data.about:
        ctx += f" They want to pray about: {data.about}."
    system = ("You write a short, simple, heartfelt Christian prayer for a child "
              f"around {data.age} years old to say to God. 2-4 short sentences, warm and hopeful, "
              "first person ('Dear God...'), easy words, ending with 'Amen.'. "
              "No extra commentary, just the prayer text.")
    chat_inst = make_chat(f"prayer-{uuid.uuid4()}", system)
    try:
        resp = await chat_inst.send_message(UserMessage(text=f"Write a prayer.{ctx}"))
        text = (resp or "").strip()
    except Exception:
        text = "Dear God, thank You for loving me. Please help me feel safe and brave today. I know You are always with me. Amen."
    return {"prayer": text}

@api_router.post("/children/{child_id}/prayers")
async def add_prayer(child_id: str, data: PrayerInput, user: dict = Depends(get_current_user)):
    child = await get_owned_child(child_id, user)
    doc = {"id": str(uuid.uuid4()), "child_id": child_id, "text": data.text.strip(),
           "kind": data.kind, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.prayers.insert_one(doc)
    updated = await award_stars(child, 2)
    doc.pop("_id", None)
    return {"prayer": doc, "child": updated}

@api_router.get("/children/{child_id}/prayers")
async def list_prayers(child_id: str, user: dict = Depends(get_current_user)):
    await get_owned_child(child_id, user)
    return await db.prayers.find({"child_id": child_id}, {"_id": 0}).sort("created_at", -1).to_list(200)

@api_router.delete("/children/{child_id}/prayers/{prayer_id}")
async def delete_prayer(child_id: str, prayer_id: str, user: dict = Depends(get_current_user)):
    await get_owned_child(child_id, user)
    await db.prayers.delete_one({"id": prayer_id, "child_id": child_id})
    return {"ok": True}

# ---------------------------------------------------------------------------
# Text to speech (read aloud)
# ---------------------------------------------------------------------------

@api_router.post("/tts")
async def tts(data: TTSInput, user: dict = Depends(get_current_user)):
    text = (data.text or "")[:4000]
    if not text.strip():
        raise HTTPException(status_code=400, detail="Nothing to read")
    try:
        engine = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
        audio_b64 = await engine.generate_speech_base64(text=text, model="tts-1", voice=data.voice)
        return {"audio": f"data:audio/mp3;base64,{audio_b64}"}
    except Exception as e:
        logger.exception("tts failed")
        raise HTTPException(status_code=503, detail="Read aloud is unavailable right now.")

# ---------------------------------------------------------------------------
# Parent dashboard summary
# ---------------------------------------------------------------------------

@api_router.get("/parent/overview")
async def parent_overview(user: dict = Depends(get_current_user)):
    children = await db.children.find({"parent_id": user["_id"]}, {"_id": 0}).to_list(50)
    result = []
    for c in children:
        moods = await db.moods.find({"child_id": c["id"]}, {"_id": 0}).sort("created_at", -1).to_list(30)
        acts = await db.activities.count_documents({"child_id": c["id"]})
        result.append({"child": c, "recent_moods": moods[:7], "mood_count": len(moods),
                       "activity_count": acts, "last_mood": moods[0] if moods else None})
    return {"children": result}

@api_router.get("/")
async def root():
    return {"message": "Brighter Dayz API"}

# ---------------------------------------------------------------------------
# App wiring
# ---------------------------------------------------------------------------
app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.children.create_index("parent_id")
    await db.moods.create_index("child_id")
    admin_email = os.environ.get("ADMIN_EMAIL", "parent@brighterdayz.org")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Sunshine123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({"email": admin_email, "password_hash": hash_password(admin_password),
                                   "name": "Demo Parent", "role": "parent",
                                   "created_at": datetime.now(timezone.utc).isoformat()})
        logger.info("Seeded demo parent account")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email},
                                  {"$set": {"password_hash": hash_password(admin_password)}})

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
