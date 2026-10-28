# Job Hunt Assistant Mobile

Expo SDK 58, React Native, Expo Router, and TypeScript mobile client.

## Run locally

Use the Node version declared at the repository root, then start Expo:

```bash
nvm use
npm install
npm start
```

Create `apps/mobile/.env.local` from `.env.example` and set the backend URL:

```bash
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:8000
```

Use your computer's LAN IP for a physical phone. For an Android emulator, use
`http://10.0.2.2:8000`; an iOS simulator can use `http://127.0.0.1:8000`.

Start the backend so it is reachable on your network:

```bash
cd apps/api
../../.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Routes live in `src/app`. Expo Router turns each route file into an app screen.
