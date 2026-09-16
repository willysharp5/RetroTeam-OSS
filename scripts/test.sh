set -e

npm run dev:test &
npm run cypress:headless
exit 0