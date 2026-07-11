# Gestionale Macchine

Progetto ricreato direttamente in:

`/Users/massimilianozaniboni/web_app/gestionale_macchine`

Questa cartella contiene sia la web app Next.js locale completa sia la versione Streamlit pensata per pubblicazione su Streamlit Community Cloud con database Supabase.

## File principali

- `streamlit_app.py`: applicazione Streamlit
- `requirements.txt`: dipendenze Python per Streamlit Cloud
- `src/`: applicazione Next.js locale
- `prisma/`: schema SQLite locale e seed demo
- `supabase/schema.sql`: schema Postgres per Supabase
- `supabase/seed.sql`: dati demo
- `.streamlit/secrets.toml.example`: template secrets

## Avvio Next.js locale

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Setup Supabase

Nel progetto Supabase apri SQL Editor ed esegui:

1. `supabase/schema.sql`
2. `supabase/seed.sql`

Lo schema abilita RLS su tutte le tabelle e usa la service role key solo lato server Streamlit.

## Secrets Streamlit

Su Streamlit Community Cloud configura:

```toml
SUPABASE_URL = "https://your-project-ref.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"
APP_PASSWORD = "choose-a-private-password"
```

## Avvio locale

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
streamlit run streamlit_app.py
```

## GitHub e Streamlit

```bash
git add -A
git commit -m "Initial gestionale macchine streamlit app"
git branch -M main
git remote add origin https://github.com/TUO-UTENTE/gestionale_macchine.git
git push -u origin main
```

Su Streamlit Cloud scegli:

- Repository: `gestionale_macchine`
- Main file path: `streamlit_app.py`

## Verifica

```bash
python3 -m py_compile streamlit_app.py
```
