# customer_pulse
<div align="center">

```
 ██████╗██╗   ██╗███████╗████████╗ ██████╗ ███╗   ███╗███████╗██████╗ 
██╔════╝██║   ██║██╔════╝╚══██╔══╝██╔═══██╗████╗ ████║██╔════╝██╔══██╗
██║     ██║   ██║███████╗   ██║   ██║   ██║██╔████╔██║█████╗  ██████╔╝
██║     ██║   ██║╚════██║   ██║   ██║   ██║██║╚██╔╝██║██╔══╝  ██╔══██╗
╚██████╗╚██████╔╝███████║   ██║   ╚██████╔╝██║ ╚═╝ ██║███████╗██║  ██║
 ╚═════╝ ╚═════╝ ╚══════╝   ╚═╝    ╚═════╝ ╚═╝     ╚═╝╚══════╝╚═╝  ╚═╝
                                                                         
██████╗ ██╗   ██╗██╗     ███████╗███████╗                               
██╔══██╗██║   ██║██║     ██╔════╝██╔════╝                               
██████╔╝██║   ██║██║     ███████╗█████╗                                 
██╔═══╝ ██║   ██║██║     ╚════██║██╔══╝                                 
██║     ╚██████╔╝███████╗███████║███████╗                               
╚═╝      ╚═════╝ ╚══════╝╚══════╝╚══════╝                               
```

### 🫀 *Know what your customers feel. In real time.*

<br/>

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)

<br/>

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-customer--pulse--rho.vercel.app-00e5ff?style=flat-square)](https://customer-pulse-rho.vercel.app)
[![GitHub Stars](https://img.shields.io/github/stars/swaraj-d3v/customer_pulse?style=flat-square&color=f59e0b)](https://github.com/swaraj-d3v/customer_pulse/stargazers)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](./LICENSE)

</div>

---

## 📌 What is CustomerPulse?

**CustomerPulse** is a full-stack, AI-powered customer intelligence platform that ingests customer feedback, runs it through a sentiment analysis pipeline, and surfaces real-time insights on a clean analytics dashboard.

Built with a **Python backend**, **JavaScript frontend**, a **SQL data layer**, and a fully automated **data pipeline** — deployed on **Railway** (backend) and **Vercel** (frontend), containerized with **Docker**.

> *Stop guessing what your customers think. Start knowing.*

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧠 **AI Sentiment Analysis** | Classifies feedback as positive, neutral, or negative using ML |
| ⚡ **Real-Time Pipeline** | Streaming data pipeline for instant insight delivery |
| 📊 **Analytics Dashboard** | Live charts, KPIs, and trend visualizations |
| 🔌 **REST API** | Clean versioned endpoints for ingestion & querying |
| 🗄️ **SQL Data Layer** | Normalized schema with migrations for efficient querying |
| 🐳 **Docker Ready** | One-command containerized deployment |
| ☁️ **Cloud Deployed** | Vercel (frontend) + Railway (backend) out of the box |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        USER / CLIENT                     │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│         FRONTEND  (JavaScript / CSS) — Vercel            │
│              Interactive Analytics Dashboard             │
└────────────────────────┬────────────────────────────────┘
                         │  HTTP / REST
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  API LAYER  (/api)                        │
│           Versioned REST Endpoints (Python)              │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
           ▼                          ▼
┌─────────────────────┐   ┌──────────────────────────────┐
│  PYTHON BACKEND     │   │    DATA PIPELINE             │
│  Business Logic     │   │    Ingestion → Processing    │
│  Auth / Services    │   │    → Sentiment → Storage     │
└─────────┬───────────┘   └──────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                  SQL DATABASE (PostgreSQL)                │
│          Normalized Tables · Migrations · Queries        │
└─────────────────────────────────────────────────────────┘
```

---

## 🗂️ Project Structure

```
customer_pulse/
├── 📁 frontend/          # JavaScript UI — deployed to Vercel
├── 📁 backend/           # Python core — business logic & services
├── 📁 api/               # REST API endpoints
├── 📁 pipeline/          # Data ingestion & sentiment pipeline
├── 📁 sql/               # SQL schema, migrations, queries
├── 📁 scripts/           # Utility & setup scripts
├── 🐳 Dockerfile         # Container config
├── ⚙️  railway.json       # Railway deployment config
├── 📦 requirements.txt   # Python dependencies
├── 🔒 .env.example       # Environment variable template
└── 📄 README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- Docker (optional)
- PostgreSQL

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/swaraj-d3v/customer_pulse.git
cd customer_pulse
```

### 2️⃣ Setup Environment Variables

```bash
cp .env.example .env
# Fill in your DB credentials, API keys, etc.
```

### 3️⃣ Install Backend Dependencies

```bash
pip install -r requirements.txt
```

### 4️⃣ Run the Backend

```bash
cd backend
python main.py
```

### 5️⃣ Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

### 🐳 Or run everything with Docker

```bash
docker build -t customer-pulse .
docker run -p 8000:8000 customer-pulse
```

---

## 🛠️ Tech Stack

### Frontend
![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/-CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![Vercel](https://img.shields.io/badge/-Vercel-000?style=flat&logo=vercel)

### Backend
![Python](https://img.shields.io/badge/-Python-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/-FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![Railway](https://img.shields.io/badge/-Railway-0B0D0E?style=flat&logo=railway)

### Data & AI
![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-336791?style=flat&logo=postgresql&logoColor=white)
![SQL](https://img.shields.io/badge/-SQL-CC2927?style=flat&logo=microsoftsqlserver&logoColor=white)
![NLP](https://img.shields.io/badge/-Sentiment_Analysis-8B5CF6?style=flat)

### DevOps
![Docker](https://img.shields.io/badge/-Docker-2496ED?style=flat&logo=docker&logoColor=white)
![Git](https://img.shields.io/badge/-Git-F05032?style=flat&logo=git&logoColor=white)

---

## 📈 Resume Points

> Copy-paste ready for your CV / portfolio

- **Architected and deployed** a full-stack AI customer analytics platform using **Python (backend)** and **JavaScript (frontend)**, deployed across **Railway** and **Vercel** with Docker containerization
- **Built a real-time data pipeline** that ingests customer feedback, applies **NLP-based sentiment analysis**, and stores structured results in a normalized **PostgreSQL** database
- **Designed and implemented a RESTful API layer** with versioned endpoints to serve the frontend dashboard and support third-party integrations for feedback ingestion
- **Engineered a SQL data layer** with schema migrations and optimized queries enabling efficient analytics over large-scale customer feedback datasets
- **Containerized the entire application** using Docker and configured **CI/CD deployment** via Railway (backend) and Vercel (frontend), reducing deployment time to a single command
- **Developed an interactive analytics dashboard** in JavaScript with real-time KPI tracking, sentiment trend charts, and customer segmentation visualizations

---

## 🌐 Live Demo

👉 **[customer-pulse-rho.vercel.app](https://customer-pulse-rho.vercel.app)**

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

```bash
# Fork → Clone → Branch → PR
git checkout -b feature/your-feature
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

**Made with 🫀 by [swaraj-d3v](https://github.com/swaraj-d3v)**

⭐ *Star this repo if you found it useful!*

</div>
