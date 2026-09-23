# Simulynx

**Inclusive Decisions. Simulated Before Implementation.**

Simulynx is a workforce decision intelligence prototype. It helps HR leaders, founders and managers simulate how a workplace decision may land across a digital workforce — before it is implemented.

> We use an LLM for reasoning and multi-agent interaction, while structured ML models and deterministic scoring handle quantitative evaluation.

We do **not** train a language model from scratch. Quantitative scores are deterministic for the same scenario. The XGBoost layer is a prototype trained on synthetic/curated labeled data.

## Demo flow (2–3 minutes)

1. Dashboard → “Should we move from hybrid work to a 5-day office policy?” → **Simulate**
2. Digital Workforce comes alive (12 personas)
3. Conversation — Maya, Daniel, Priya, Liam, Aisha
4. Red Team — risks, including accessibility and career equity
5. What if? — slide 5 days → 3 days and watch metrics move
6. Decision Intelligence — 3-day hybrid as strongest simulated balance
7. Simulation vs Reality — predicted 78% / actual 74%

Finish with: *We don't replace the workforce's voice. We help organizations hear the risks before they become reality.*

## Live demo

Production: [https://hack-delta-henna.vercel.app](https://hack-delta-henna.vercel.app)

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional API:

```bash
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```

## Architecture

```
Application (Next.js)
  → AI / simulation core (deterministic scoring + XGBoost-ready service)
  → RAG-ready retrieval (chunk → embed → pgvector)
  → Analytics (group-level statistics)
  → Real-world calibration
```

Personas are synthetic. The product never ranks real employees, never recommends firing, never infers protected characteristics, and never makes promotion or hiring decisions about individuals.

Simulated workforce insights are directional and should be validated with real employees and appropriate HR/legal processes.
