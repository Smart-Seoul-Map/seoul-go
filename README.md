# 서울고(Seoul Go)

서울고는 Vite + React + TypeScript 기반의 인터랙티브 서울 숨은 명소 탐색 서비스입니다. 사용자는 지도 위에서 장소를 발견하고, 발견한 장소를 스탬프로 저장해 코스로 정리합니다.

## 기술 스택

| 영역       | 기술                                     |
| ---------- | ---------------------------------------- |
| 프론트엔드 | Vite, React, TypeScript, HTML/CSS        |
| 지도       | MapLibre GL JS                           |
| 데이터     | 스마트서울맵 테마 OpenAPI                |
| 배포       | Cloudflare Pages                         |
| 품질       | ESLint, Prettier, Vitest, GitHub Actions |

## 개발 명령

요구사항:

- Node.js 22+
- pnpm 11.7.0

```bash
pnpm install
pnpm dev
```

검증 명령:

```bash
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run test:run
pnpm run build
```

## 배포 기준

Cloudflare Pages Git integration을 기본 배포 방식으로 사용합니다.

- Build command: `pnpm run build`
- Build output directory: `dist`
- Production branch: `main`
- Development integration branch: `dev`
