# CarbonEx mobile and iPad update

Local branch: `local/mobile-ipad-responsive`. Changes have not been pushed or deployed.

## Review locally

Install Node.js 20.9+ (or a supported newer LTS). Extract this source archive into a separate folder, open a terminal there and run:

```sh
npm ci
node scripts/start-mobile-review.mjs
```

Open http://localhost:3000/login and select a recruiter demo role. The launcher creates an ephemeral local session key. It makes no deployment changes. Restarting requires entering the demo again. Existing demo write restrictions remain in force.

For a phone or iPad on your own trusted Wi-Fi:

```sh
node scripts/start-mobile-review.mjs --lan
```

Find the laptop's IPv4 address with `ipconfig` on Windows, then visit `http://LAPTOP_IP:3000/login` from the device. Campus Wi-Fi may block peer connections; a private hotspot can help. Only allow private-network firewall access. Do not expose this development server to the public internet.

## Changes

- Mobile/iPad navigation drawer below 1024px with role-specific links, current-page labels, Escape dismissal, route-selection dismissal and automatic closure when resizing to desktop.
- Full-height desktop sidebar retained at 1024px and above; its navigation area scrolls on short screens.
- Dynamic viewport heights, safe-area padding and reachable actions around iPhone notches/home indicator.
- 16px touch form inputs to avoid Safari's automatic focus zoom, without disabling pinch zoom.
- Larger touch buttons, selectors, tabs and modal close controls.
- Dashboard/card padding reduced on narrow screens, charts sized to their containers, wrapping chart headers.
- Tablet metric grids use two columns rather than four cramped columns.
- Tables scroll inside their containers rather than forcing the entire page wider.
- Dialogs and secure transaction overlay scroll within the visible screen.
- Passport document preview reflows to screen width and stacks document columns on phones.
- Login form fits short screens without its previous fixed minimum height.

## Verification

- Production Next.js build: passed after the final changes.
- React DOM navigation checks: passed (drawer entry, role links, current-page label, Escape close, link close, desktop collapse).
- `git diff --check`: passed.
- Standalone TypeScript check: existing error in unchanged `app/api/auth/login/route.ts:92` (TS2367, comparison of narrowed `is_demo` value). The existing build configuration skips type errors; this error was not changed as part of the responsive work.
- Real visual/device testing remains pending. Browser engines could not be installed in the execution environment. DOM tests do not verify layout, viewport overflow or actual iOS Safari behaviour.

To rerun the optional navigation test, install `jsdom` locally with `npm install --no-save --package-lock=false jsdom`, then run `node tests/mobile-navigation.cjs`.

## Device review checklist before publishing

Review at 320/375/390/430px phone widths; 768/820/1024px tablet widths, portrait and landscape; 1280/1440px desktop widths. Test login keyboard behaviour, navigation drawer/focus, both company and regulator demos, charts, all tab groups, trade/receipt dialogs, audit tables, passport preview/printing and sign-out. The fixed shell should match the visible Safari viewport. Verify no unintended horizontal page scrolling and that wide tables can scroll independently.
