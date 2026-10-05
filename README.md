# LocalFix

On-demand marketplace connecting customers with trusted local service professionals in India
(electricians, plumbers, mechanics, carpenters, painters, AC technicians). All prices in ₹ (INR).

**Stack:** Node.js · Express (MVC) · EJS + express-ejs-layouts · Tailwind CSS v3 · MongoDB/Mongoose ·
bcryptjs · express-session + connect-mongo · multer

## Quick start

```bash
npm install
cp .env.example .env        # then edit MONGO_URI / SESSION_SECRET if needed
npm run css:build           # compiles public/css/input.css -> output.css
npm run seed                # demo data (wipes users, worker profiles, reviews)
npm start                   # http://localhost:3000
```

Development (Tailwind watch + nodemon): `npm run dev`

## Demo logins (after `npm run seed`)

| Role     | Email                | Password       |
|----------|----------------------|----------------|
| Admin    | admin@localfix.in    | Admin@12345    |
| Customer | priya@example.com    | Password@123   |
| Worker   | ramesh@example.com   | Password@123   |

## Routes

| Route | Description |
|-------|-------------|
| `GET /` | Landing: hero search (service + pincode/city), categories, featured pros, how it works |
| `GET /services` | Directory with category, pincode/city, ₹ price range, min rating, availability, sort |
| `GET /workers/:id` | Profile with ₹ rates, pincodes served, reviews, Call Now / WhatsApp to Book |
| `POST /workers/:id/reviews` | Customer 1–5★ review (one per customer; resubmitting updates it) |
| `GET/POST /auth/register`, `/auth/login` | Auth with Customer / Worker toggle; `POST /auth/logout` |
| `GET/POST /dashboard/worker` | Worker panel: availability, rates, contact, profile, photo |
| `GET /admin` | Verify/hide listings and delete reviews |
