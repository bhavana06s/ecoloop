# 🗑️ ecoloop Community

## Turn Trash into Treasure

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-18.0+-blue.svg)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com)
[![Blockchain](https://img.shields.io/badge/Blockchain-Polygon-purple.svg)](https://polygon.technology)

An **AI-powered, blockchain-enabled waste management ecosystem** that detects waste using image recognition, rewards responsible disposal, and connects volunteers with nearby cleanup tasks.

## 🌟 The Problem

Cities struggle with three major issues:
- ❌ Waste is improperly disposed
- ❌ Authorities cannot identify litter hotspots quickly  
- ❌ Citizens lack incentives to report or clean waste

**Traditional systems are reactive and slow.**

## 💡 Our Solution

**ecoloop** creates a complete ecosystem where:
1. 📸 **Citizens report waste** using AI-powered image recognition
2. 🗺️ **Waste appears on live map** in real-time
3. 👥 **Volunteers accept nearby tasks**
4. ✅ **Cleanup is verified** with location check
5. 💰 **Both parties earn blockchain tokens**

## 🎯 Key Features

### 🤖 Smart Waste Detection
- AI classifies: Plastic, Metal, Glass, Organic, E-waste, Paper
- 85%+ accuracy using ResNet50 model
- Instant recycling recommendations

### 🗺️ Live Waste Map
- Real-time waste hotspots visualization
- coded markers 
- Volunteer route optimization

### 💰 Blockchain Rewards
- **Reporters earn 2 W2E tokens** per valid report
- **Volunteers earn 5 W2E tokens** per verified cleanup
- **Fake report penalty**: Reporters lose 5 tokens
- **Compensation**: Volunteers earn 2 tokens for finding fake reports

### ✅ Verification System
- Location-based verification (must be within 100m)
- Before/after confirmation
- Prevents fraud and fake reporting

### 🏆 Leaderboard
- Top waste warriors by token balance
- Real-time updates
- Gamification encourages participation

### 👥 Dual User Roles

| Role | Actions | Rewards |
|------|---------|---------|
| **Reporter** | Upload waste photos, describe issue, report location | 2 tokens per report |
| **Volunteer** | View map, accept tasks, clean waste, verify location | 5 tokens per cleanup |

## 🏗️ Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18, Leaflet, CSS3 | User interface, maps |
| **Backend** | FastAPI (Python) | API server, business logic |
| **AI Model** | ResNet50 / MobileNetV2 | Waste classification |
| **Blockchain** | Polygon (Mumbai Testnet) | Token rewards |
| **Storage** | JSON (MVP) / MongoDB Ready | Data persistence |
| **Maps** | OpenStreetMap / Leaflet | Location services |

### System Flow
