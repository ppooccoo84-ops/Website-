# Website ↔ Telegram Chat Widget

Website pe ek chat widget hai. User "Naya chat shuru karo" click kare to usko ek code milega (jaise `SP$12127`). Uske saare messages tere Telegram pe aayenge. Tu Telegram mein us message ko **Reply** karega, wo reply seedha wapas website wale user ko dikh jayega. User agar page refresh kare aur wahi code dobara daale, to poori purani chat wapas load ho jayegi.

## Kaise kaam karta hai (short mein)
- **Naya chat** → server ek random code banata hai (`SP$xxxxx`) aur SQLite mein save karta hai.
- **User message bhejta hai** → server use DB mein save karta hai + tere Telegram (`ADMIN_CHAT_ID`) pe forward karta hai, header mein code ke saath.
- **Tu Telegram pe reply karta hai** (us forwarded message par right-click / long-press → Reply) → bot pehchan leta hai ki reply kis code ke liye tha, aur wo message website pe deliver ho jata hai.
- **Refresh pe code dalna** → `/api/session/:code/verify` check karta hai code valid hai ya nahi, phir poori history load hoti hai.

## Bot token kahan daalna hai
1. Telegram pe `@BotFather` ko message karo, `/newbot` bhejo, naam do — wo tujhe ek token dega jaisa: `1234567890:AAExampleTokenXXXX`.
2. Project folder mein `.env.example` ko copy karke `.env` banao:
   ```bash
   cp .env.example .env
   ```
3. `.env` file khol ke `BOT_TOKEN=` ke aage apna token paste kar do.
4. `ADMIN_CHAT_ID` abhi khali chhod do — agla step mein milega.

## Apna Telegram chat ID pata karna
1. Server ek baar chala do (neeche "Chalane ka tarika" dekho).
2. Apne bot ko Telegram pe `/start` bhejo.
3. Bot reply karega: "Tera Telegram chat ID hai: 123456789".
4. Wo number `.env` mein `ADMIN_CHAT_ID=123456789` mein daal do, phir server restart karo.

## Chalane ka tarika (local test ke liye)
```bash
npm install
npm start
```
Widget khulega: `http://localhost:3000`

## Deploy karna (Railway ka example, sabse aasan)
1. Is poore folder ko GitHub repo mein push karo.
2. [railway.app](https://railway.app) pe naya project banao → "Deploy from GitHub repo" select karo.
3. Railway ki "Variables" tab mein `BOT_TOKEN` aur `ADMIN_CHAT_ID` daal do (same jo `.env` mein daale the).
4. Deploy hone ke baad Railway ek public URL dega, jaise `https://tera-app.up.railway.app` — wahi tera live website hai.
5. Agar widget ko kisi doosri website mein embed karna hai, `<iframe src="https://tera-app.up.railway.app"></iframe>` use kar sakta hai, ya `public/index.html` mein `API_BASE` variable set karke widget ko alag jagah host kar sakta hai.

Render.com pe bhi bilkul isi tarah deploy hota hai (Web Service → connect repo → env vars → deploy).

## Admin ke commands (apne Telegram se bot ko bhejo)
- `/start` — apna chat ID pata karne ke liye.
- `/active` — pichle 20 active chat codes ki list dekhne ke liye.
- Kisi forwarded message pe **reply** karo — us user ko jawab chala jayega.

## Aage improve karne ke liye (agar chahiye ho)
- Ek admin web-dashboard (sab chats ek jagah dekhne ke liye, sirf Telegram ki jagah).
- Real-time delivery (WebSocket) — abhi widget har 3 second mein naye messages check karta hai (polling), kaafi hai chhoti site ke liye, lekin bade traffic ke liye WebSocket better rahega.
- Code ko user-friendly banane ke liye, verify hone ke baad ek "typing..." indicator.
