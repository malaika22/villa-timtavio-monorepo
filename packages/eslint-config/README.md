# `@villa-timtavio/eslint-config`

Collection of internal ESLint configurations for the Villa Timtavio monorepo.

## Usage

### For Next.js projects (like owner-dashboard)

In your `eslint.config.js`:

```javascript
import { nextJsConfig } from "@villa-timtavio/eslint-config/next";

export default nextJsConfig;
```

### For base projects

```javascript
import { config } from "@villa-timtavio/eslint-config/base";

export default config;
```

## Running the Owner Dashboard

```bash
cd apps/owner-dashboard
npm run dev
```
