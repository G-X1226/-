#!/usr/bin/env bash
set -euo pipefail
pnpm prisma migrate reset --schema prisma/schema.prisma
