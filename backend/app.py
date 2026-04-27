from fastapi import FastAPI, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import hashlib
from datetime import datetime
import json
import os

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ JSON PERSISTENCE - ADDED CODE ============
# File paths for persistent storage
USERS_FILE = "users_data.json"
TASKS_FILE = "tasks_data.json"
PENALTIES_FILE = "penalties_data.json"
COUNTER_FILE = "counter_data.json"

# Load data from files on startup
def load_data():
    global users, tasks, reporter_penalties, task_counter
    
    try:
        if os.path.exists(USERS_FILE):
            with open(USERS_FILE, 'r') as f:
                users.clear()
                users.update(json.load(f))
            print(f"✅ Loaded {len(users)} users from file")
        else:
            print("📝 No existing users file, starting fresh")
        
        if os.path.exists(TASKS_FILE):
            with open(TASKS_FILE, 'r') as f:
                tasks.clear()
                tasks.update(json.load(f))
            print(f"✅ Loaded {len(tasks)} tasks from file")
        
        if os.path.exists(PENALTIES_FILE):
            with open(PENALTIES_FILE, 'r') as f:
                reporter_penalties.clear()
                reporter_penalties.update(json.load(f))
            print(f"✅ Loaded penalties data")
        
        if os.path.exists(COUNTER_FILE):
            with open(COUNTER_FILE, 'r') as f:
                counter_data = json.load(f)
                task_counter = counter_data.get("task_counter", 1)
            print(f"✅ Loaded task_counter: {task_counter}")
    except Exception as e:
        print(f"⚠️ Error loading data: {e}")

# Save data to files
def save_data():
    try:
        with open(USERS_FILE, 'w') as f:
            json.dump(users, f, indent=2, default=str)
        with open(TASKS_FILE, 'w') as f:
            json.dump(tasks, f, indent=2, default=str)
        with open(PENALTIES_FILE, 'w') as f:
            json.dump(reporter_penalties, f, indent=2, default=str)
        with open(COUNTER_FILE, 'w') as f:
            json.dump({"task_counter": task_counter}, f, indent=2)
        print(f"💾 Data saved: {len(users)} users, {len(tasks)} tasks")
    except Exception as e:
        print(f"⚠️ Error saving data: {e}")

# In-memory storage
users = {}
tasks = {}
task_counter = 1
reporter_penalties = {}  # Track reporter penalties

# Load existing data on startup
load_data()

# ============ END OF JSON PERSISTENCE CODE ============

# ============ TEST ENDPOINTS ============

@app.get("/")
def root():
    return {"message": "Waste2Earn API is running!", "status": "active"}

@app.get("/api/test")
def test():
    return {"success": True, "message": "Backend is working!", "timestamp": datetime.now().isoformat()}

# ============ AUTHENTICATION ENDPOINTS ============

@app.post("/api/register")
async def register(
    email: str = Form(...),
    name: str = Form(...),
    password: str = Form(...),
    role: str = Form(...)
):
    print(f"📝 Registering: {email}")
    
    # Check if email exists
    if email in users:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": "Email already registered"}
        )
    
    # Generate unique wallet
    unique_string = f"{email}{name}{datetime.now().timestamp()}"
    wallet = f"W2E_{hashlib.md5(unique_string.encode()).hexdigest()[:12].upper()}"
    
    # Create user
    users[email] = {
        "email": email,
        "name": name,
        "password": password,  # In production, hash this!
        "role": role,
        "wallet": wallet,
        "token_balance": 0,
        "reports_count": 0,
        "cleanups_count": 0,
        "created_at": datetime.now().isoformat()
    }
    
    save_data()  # ADDED: Save after registration
    
    print(f"✅ User registered: {email} -> Wallet: {wallet}")
    
    return {
        "success": True,
        "user": {
            "email": email,
            "name": name,
            "wallet": wallet,
            "role": role,
            "token_balance": 0,
            "reports_count": 0,
            "cleanups_count": 0
        }
    }

@app.post("/api/login")
async def login(
    email: str = Form(...),
    password: str = Form(...)
):
    print(f"🔐 Login attempt: {email}")
    
    # Find user by email
    if email not in users:
        return JSONResponse(
            status_code=404,
            content={"success": False, "error": "Email not found"}
        )
    
    user = users[email]
    
    # Check password
    if user["password"] != password:
        return JSONResponse(
            status_code=401,
            content={"success": False, "error": "Invalid password"}
        )
    
    print(f"✅ Login successful: {email}")
    
    return {
        "success": True,
        "user": {
            "email": user["email"],
            "name": user["name"],
            "wallet": user["wallet"],
            "role": user["role"],
            "token_balance": user["token_balance"],
            "reports_count": user["reports_count"],
            "cleanups_count": user["cleanups_count"]
        }
    }

@app.get("/api/users")
def list_users():
    """List all registered users (for debugging)"""
    user_list = []
    for email, user in users.items():
        user_list.append({
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "wallet": user["wallet"]
        })
    return {"users": user_list, "count": len(user_list)}

@app.get("/api/user-stats/{wallet}")
def get_user_stats(wallet: str):
    """Get user stats by wallet address"""
    for email, user in users.items():
        if user["wallet"] == wallet:
            return {
                "email": user["email"],
                "name": user["name"],
                "wallet": user["wallet"],
                "role": user["role"],
                "token_balance": user["token_balance"],
                "reports_count": user["reports_count"],
                "cleanups_count": user["cleanups_count"]
            }
    return JSONResponse(
        status_code=404,
        content={"error": "User not found"}
    )

# ============ WASTE DETECTION ============

@app.post("/api/detect-waste")
async def detect_waste(file: UploadFile = File(...)):
    """AI waste detection - Improved for food vs plastic"""
    contents = await file.read()
    
    # Save temporarily to analyze
    from PIL import Image
    import io
    import numpy as np
    
    try:
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        image = image.resize((200, 200))
        img_array = np.array(image)
        
        # Calculate color features
        avg_color = img_array.mean(axis=(0, 1))
        avg_r, avg_g, avg_b = avg_color
        
        # Calculate texture (edge detection)
        from scipy import ndimage
        gray = np.mean(img_array, axis=2)
        edges = np.abs(ndimage.sobel(gray))
        edge_density = np.mean(edges)
        
        # FOOD/ORGANIC detection (brown, green, mixed colors, irregular shapes)
        is_brownish = avg_r > 80 and avg_g > 50 and avg_g < 120 and avg_b < 80
        is_greenish = avg_g > avg_r * 1.1 and avg_g > avg_b * 1.1
        has_high_texture = edge_density > 25
        
        if (is_brownish or is_greenish) and has_high_texture:
            waste_type = "organic"
            confidence = 0.85
            recommendations = [
                "🌱 This appears to be FOOD/ORGANIC waste!",
                "✅ Great for composting",
                "🍽️ Start a compost bin at home",
                "🚫 Don't mix with plastic recycling"
            ]
        # PLASTIC detection (smooth, bright colors, artificial look)
        elif (avg_r > 150 or avg_g > 150 or avg_b > 150) and edge_density < 20:
            waste_type = "plastic"
            confidence = 0.78
            recommendations = [
                "⚠️ This appears to be PLASTIC",
                "♻️ Check recycling symbol",
                "🧼 Clean before recycling",
                "🚫 Avoid single-use plastics"
            ]
        # METAL detection (gray/silver tones)
        elif abs(avg_r - avg_g) < 30 and abs(avg_g - avg_b) < 30 and avg_r < 150:
            waste_type = "metal"
            confidence = 0.72
            recommendations = [
                "🥫 This appears to be METAL",
                "♻️ Metal is infinitely recyclable",
                "💰 Has scrap value",
                "🥫 Crush cans to save space"
            ]
        # GLASS detection (transparent look, blue/green tint)
        elif avg_b > avg_r * 1.2 or (avg_g > avg_r * 1.1 and avg_b > avg_r * 1.1):
            waste_type = "glass"
            confidence = 0.70
            recommendations = [
                "🍾 This appears to be GLASS",
                "♻️ Glass never loses quality",
                "🍾 Rinse before recycling",
                "🔘 Remove metal lids"
            ]
        # PAPER detection (high brightness)
        elif avg_r > 200 and avg_g > 200 and avg_b > 200:
            waste_type = "paper"
            confidence = 0.75
            recommendations = [
                "📄 This appears to be PAPER",
                "📦 Flatten cardboard boxes",
                "♻️ Paper can be recycled 5-7 times",
                "💧 Keep dry for recycling"
            ]
        else:
            waste_type = "general_waste"
            confidence = 0.65
            recommendations = [
                "♻️ Sort waste properly",
                "🗑️ Use correct bin",
                "💚 Reduce, Reuse, Recycle"
            ]
        
        return {
            "waste_type": waste_type,
            "confidence": round(confidence, 2),
            "confidence_level": "high" if confidence > 0.75 else "medium",
            "recommendations": recommendations,
            "analysis_details": {
                "colors": {"r": round(avg_r), "g": round(avg_g), "b": round(avg_b)},
                "texture": "rough" if edge_density > 20 else "smooth"
            }
        }
        
    except Exception as e:
        print(f"Detection error: {e}")
        return {
            "waste_type": "general_waste",
            "confidence": 0.5,
            "confidence_level": "low",
            "recommendations": ["Try taking a clearer photo of the waste"]
        }

@app.post("/api/report-waste")
async def report_waste(
    file: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    wallet_address: str = Form(...),
    description: str = Form(None)
):
    """Report waste and create task"""
    global task_counter
    
    # Find user by wallet
    user = None
    for u in users.values():
        if u["wallet"] == wallet_address:
            user = u
            break
    
    if not user:
        return JSONResponse(
            status_code=404,
            content={"success": False, "error": "User not found"}
        )
    
    # Create task
    task_id = str(task_counter)
    task_counter += 1
    
    tasks[task_id] = {
        "id": task_id,
        "latitude": latitude,
        "longitude": longitude,
        "waste_type": "plastic",
        "description": description,
        "status": "pending",
        "reported_by": wallet_address,
        "accepted_by": None,
        "created_at": datetime.now().isoformat()
    }
    
    # Award tokens to reporter
    user["token_balance"] += 2
    user["reports_count"] += 1
    
    save_data()  # ADDED: Save after reporting waste
    
    return {
        "success": True,
        "task_id": task_id,
        "waste_type": "plastic",
        "tokens_awarded": 2
    }

@app.get("/api/nearby-tasks")
def get_nearby_tasks(lat: float, lng: float, radius: float = 10):
    """Get nearby waste tasks"""
    pending_tasks = []
    for task in tasks.values():
        if task["status"] == "pending":
            # Calculate approximate distance
            distance = abs(lat - task["latitude"]) * 111
            if distance <= radius:
                task_copy = task.copy()
                task_copy["distance_km"] = round(distance, 2)
                pending_tasks.append(task_copy)
    
    return {"tasks": pending_tasks}

@app.post("/api/accept-task/{task_id}")
async def accept_task(task_id: str, wallet_address: str = Form(...)):
    """Accept a cleanup task"""
    if task_id not in tasks:
        return JSONResponse(
            status_code=404,
            content={"success": False, "error": "Task not found"}
        )
    
    if tasks[task_id]["status"] != "pending":
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": "Task already taken"}
        )
    
    tasks[task_id]["status"] = "accepted"
    tasks[task_id]["accepted_by"] = wallet_address
    tasks[task_id]["accepted_at"] = datetime.now().isoformat()
    
    save_data()  # ADDED: Save after accepting task
    
    return {"success": True, "message": "Task accepted"}

# Add this new endpoint for volunteers to report fake/missing waste
@app.post("/api/report-fake-task/{task_id}")
async def report_fake_task(
    task_id: str,
    wallet_address: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    reason: str = Form(...)
):
    """Volunteer reports that waste is not at the location (fake report)"""
    
    if task_id not in tasks:
        return JSONResponse(
            status_code=404,
            content={"success": False, "error": "Task not found"}
        )
    
    task = tasks[task_id]
    
    # Check if volunteer is at the location (within 50 meters)
    from math import radians, sin, cos, sqrt, atan2
    lat1, lon1 = radians(task["latitude"]), radians(task["longitude"])
    lat2, lon2 = radians(latitude), radians(longitude)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    distance_meters = 6371 * 2 * atan2(sqrt(a), sqrt(1-a)) * 1000
    
    if distance_meters > 50:
        return {
            "success": False,
            "message": f"You are {distance_meters:.0f}m away. Please go to the exact location to verify."
        }
    
    # Find the reporter
    reporter_wallet = task["reported_by"]
    reporter_user = None
    for user in users.values():
        if user["wallet"] == reporter_wallet:
            reporter_user = user
            break
    
    if reporter_user:
        # Penalize the reporter
        penalty_amount = 5  # Deduct 5 tokens for fake report
        reporter_user["token_balance"] = max(0, reporter_user["token_balance"] - penalty_amount)
        
        # Track penalty
        if reporter_wallet not in reporter_penalties:
            reporter_penalties[reporter_wallet] = []
        
        reporter_penalties[reporter_wallet].append({
            "task_id": task_id,
            "reason": reason,
            "date": datetime.now().isoformat(),
            "penalty": penalty_amount
        })
        
        # Mark task as fraudulent
        tasks[task_id]["status"] = "fraudulent"
        tasks[task_id]["fraud_reason"] = reason
        tasks[task_id]["verified_by"] = wallet_address
        
        # Award a small compensation to the volunteer who verified (2 tokens)
        for volunteer_user in users.values():
            if volunteer_user["wallet"] == wallet_address:
                volunteer_user["token_balance"] += 2
                break
        
        save_data()  # ADDED: Save after fake report
        
        return {
            "success": True,
            "message": f"Fake report confirmed! Reporter lost {penalty_amount} tokens. You received 2 tokens for verification.",
            "penalty_applied": penalty_amount,
            "compensation": 2
        }
    
    return {
        "success": False,
        "message": "Unable to process report"
    }

# Update the complete-task endpoint to handle verification
@app.post("/api/complete-task/{task_id}")
async def complete_task(
    task_id: str,
    wallet_address: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    issue_reported: str = Form(None),
    waste_found: str = Form(None)  # Add this parameter
):
    """Complete a cleanup task and award tokens (with verification)"""
    
    print(f"📝 Completing task {task_id} for volunteer {wallet_address}")
    print(f"📍 Location: {latitude}, {longitude}")
    print(f"🗑️ Waste found: {waste_found}")
    
    if task_id not in tasks:
        return JSONResponse(
            status_code=404,
            content={"success": False, "error": "Task not found"}
        )
    
    task = tasks[task_id]
    
    if task["accepted_by"] != wallet_address:
        return JSONResponse(
            status_code=403,
            content={"success": False, "error": "Not authorized"}
        )
    
    # Check if user is near task location (within 100 meters)
    from math import radians, sin, cos, sqrt, atan2
    lat1, lon1 = radians(task["latitude"]), radians(task["longitude"])
    lat2, lon2 = radians(latitude), radians(longitude)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    distance_meters = 6371 * 2 * atan2(sqrt(a), sqrt(1-a)) * 1000
    
    print(f"📏 Distance from task: {distance_meters:.0f} meters")
    
    # Handle issue reporting
    if issue_reported == "no_dustbin":
        tasks[task_id]["status"] = "issue_reported"
        save_data()  # ADDED: Save after issue report
        return {
            "success": False,
            "message": "Issue reported. Municipality will be notified about missing dustbin.",
            "issue_reported": True
        }
    
    # Check if waste was found (REQUIRED)
    if waste_found != "true":
        return {
            "success": False,
            "message": "Please confirm that you found the waste at this location by checking 'Waste Found' option.",
            "require_confirmation": True
        }
    
    # Check if volunteer is at the location
    if distance_meters > 100:
        return {
            "success": False,
            "message": f"You are {distance_meters:.0f}m away from the waste location. Please go to the exact location to verify cleanup.",
            "current_distance": distance_meters
        }
    
    # Find the reporter
    reporter_wallet = task["reported_by"]
    reporter_user = None
    for user in users.values():
        if user.get("wallet") == reporter_wallet:
            reporter_user = user
            break
    
    # Task completed successfully - waste was found and cleaned
    tasks[task_id]["status"] = "completed"
    tasks[task_id]["completed_at"] = datetime.now().isoformat()
    tasks[task_id]["completion_location"] = {"lat": latitude, "lng": longitude}
    
    # Award tokens to volunteer (5 tokens)
    volunteer_user = None
    for user in users.values():
        if user.get("wallet") == wallet_address:
            user["token_balance"] = user.get("token_balance", 0) + 5
            user["cleanups_count"] = user.get("cleanups_count", 0) + 1
            volunteer_user = user
            print(f"💰 Awarded 5 tokens to volunteer {wallet_address}. New balance: {user['token_balance']}")
            break
    
    save_data()  # ADDED: Save after task completion
    
    # Reporter already got their 2 tokens when reporting
    # They keep them because the waste was actually found
    
    return {
        "success": True,
        "message": f"Task completed and verified! You earned 5 W2E tokens!",
        "tokens_awarded": 5,
        "reporter_wallet": reporter_wallet,
        "distance_verified": distance_meters
    }

# Add endpoint to check reporter reputation
@app.get("/api/reporter-reputation/{wallet_address}")
def get_reporter_reputation(wallet_address: str):
    """Get reporter's reputation score and penalty history"""
    
    penalties = reporter_penalties.get(wallet_address, [])
    
    # Calculate reputation score (0-100)
    total_reports = 0
    for user in users.values():
        if user.get("wallet") == wallet_address:
            total_reports = user.get("reports_count", 0)
            break
    
    fake_reports = len(penalties)
    reputation_score = max(0, 100 - (fake_reports * 20))  # Each fake report reduces score by 20
    
    return {
        "wallet": wallet_address,
        "total_reports": total_reports,
        "fake_reports": fake_reports,
        "reputation_score": reputation_score,
        "penalties": penalties,
        "status": "Trusted" if reputation_score > 70 else "Warning" if reputation_score > 40 else "Suspended"
    }

@app.get("/api/leaderboard")
def get_leaderboard():
    """Get top 10 users by token balance"""
    leaderboard = []
    for user in users.values():
        leaderboard.append({
            "name": user["name"],
            "email": user["email"],
            "wallet": user["wallet"],
            "role": user["role"],
            "token_balance": user["token_balance"],
            "reports_count": user["reports_count"],
            "cleanups_count": user["cleanups_count"]
        })
    
    # Sort by token balance (highest first)
    leaderboard.sort(key=lambda x: x["token_balance"], reverse=True)
    
    return {"leaderboard": leaderboard[:10]}

@app.get("/api/my-tasks/{wallet_address}")
def get_my_tasks(wallet_address: str):
    """Get tasks accepted by volunteer"""
    my_tasks = []
    for task in tasks.values():
        if task.get("accepted_by") == wallet_address and task["status"] == "accepted":
            my_tasks.append(task)
    return {"tasks": my_tasks}

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 WASTE2EARN BACKEND STARTING...")
    print("📍 Server: http://localhost:8000")
    print("📝 Test: http://localhost:8000/api/test")
    print("📋 API Docs: http://localhost:8000/docs")
    print("👥 Users endpoint: http://localhost:8000/api/users")
    print("💾 Data will be saved to JSON files (persistent storage)")
    print("="*60 + "\n")
    uvicorn.run(app, host="127.0.0.1", port=8000)