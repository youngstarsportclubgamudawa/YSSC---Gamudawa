# Young Star Sports Club Gamudawa | තරුණ තරු ක්‍රීඩා සමාජය ගම්උදාව

Official Sports Club Administration, Member Registry, Weekly Dues Tracking, and Live Tournament Match Center for Young Star Sports Club Gamudawa, Sri Lanka (Reg No: DS/SP/2018/14).

## Run & Operate

- `npm run dev` — run the web application development server (port 3000)
- `npm run build` — build client distribution bundle via Vite
- `npx tsx --test src/utils/sportsLogic.test.ts` — execute pure sports calculations and financial test suite
- `npm run lint` — check TypeScript types without emitting code
- Official Contact: `youngstarsportclubgamudawa@gmail.com`

## Stack

- Runtime & Framework: Vite 8, React 19, TypeScript
- Styling: Tailwind CSS v4 (`@tailwindcss/vite`), Plus Jakarta Sans & Noto Sans Sinhala fonts
- Icons & Animation: Lucide React, Motion
- QR Code Generation: `qrcode` for member passes and payment receipt verification slips
- Testing: Node test runner (`node:test`, `node:assert/strict`) via `tsx`

## Where things live

- `src/types/index.ts` — Type definitions for Members, Squads, Matches, Dues Ledger, Media & Committee
- `src/utils/sportsLogic.ts` — Core calculation algorithms (Overs, Run Rates, Strike Rates, Economy, Tournament Points, Member Arrears)
- `src/utils/sportsLogic.test.ts` — Comprehensive unit test coverage for scoring and ledger math
- `src/data/initialData.ts` — Default persistent seed data for Gamudawa squads, players, fixtures, and financial transactions
- `src/components/Header.tsx` — Top bar with government registration, bilingual language switcher (English / සිංහල), and WhatsApp sharing
- `src/components/LiveScorecard.tsx` — Ball-by-ball match scorer console, real-time live cricket scorecard, and commentary stream
- `src/components/MemberManagement.tsx` — Member registry, search/filter, digital pass with scannable QR code, and registration form
- `src/components/TeamSquads.tsx` — Team rosters (Cricket, Volleyball, Football, Carrom), lineup manager, and captaincy assignment
- `src/components/TournamentsFixtures.tsx` — Match schedule, fixture scheduler, and live tournament standings points table
- `src/components/FinancialTracker.tsx` — Weekly dues tracking (LKR 100/wk), printable receipts with QR code, and Google Sheet sync simulation
- `src/components/MediaGallery.tsx` — Match photos, victory celebrations, and upload modal with lightbox viewer
- `src/components/CommitteeDocuments.tsx` — Management committee directory, official constitution, and BOC bank deposit details

## Architecture decisions

- **Decoupled Business Logic**: All sports rules (overs conversion, required run rate, tournament points) and ledger calculations are decoupled into pure TypeScript functions for instant unit testing without browser overhead.
- **Client-Side Persistence**: State automatically persists to `localStorage` so registrations, ball-by-ball match scores, and dues receipts survive browser restarts.
- **Bilingual Support**: First-class English and Sinhala (සිංහල) translations to serve local community members, committee officials, and mobile visitors.
- **Mobile-First & WhatsApp Sharing**: Formatted one-click WhatsApp sharing for match scorecards, team lineups, and dues slips to streamline communication in club chat groups.

## Product Capabilities

- **Live Cricket Scoring Center**: Real-time ball-by-ball updates (`0`, `1`, `2`, `3`, `4`, `6`, `W`, `Wd`, `Nb`), batsman/bowler statistics, required run rate, target tracking, and live commentary.
- **Sportsman & Member Directory**: Complete profile cards, sports filters (Cricket, Volleyball, Football, Carrom, Badminton, Athletics), dues status tracking, and printable digital ID cards with QR codes.
- **Weekly Dues & Treasury Ledger**: LKR 100/week member dues tracking, arrears status, cash/bank payment recording, official printable receipts with treasurer signature and QR code, plus Google Sheets CSV export and sync.
- **Team Lineups & Squad Management**: Squad allocation, playing XI line-up management, and captaincy designation.
- **Tournament Fixture Scheduler & Points Table**: Tournament calendar and automated league points calculation.
- **Club Documents & Committee Directory**: Official constitution, code of conduct, AGM minutes, and Bank of Ceylon club deposit account info.
