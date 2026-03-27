# Changelog

## [0.0.7](https://github.com/heapoftrash/filetree/compare/v0.0.6...v0.0.7) (2026-03-27)


### Bug Fixes

* **ui:** use Version label in sidebar footer ([5f10449](https://github.com/heapoftrash/filetree/commit/5f10449917dfcae073d3c47330e0c3b6310a6b1b))
* **ui:** use Version label in sidebar footer ([672258f](https://github.com/heapoftrash/filetree/commit/672258f4f55920073fff8af639cca4672a8ecc36))

## [0.0.6](https://github.com/heapoftrash/filetree/compare/v0.0.5...v0.0.6) (2026-03-27)


### Features

* actions auto labeler ([349dd5b](https://github.com/heapoftrash/filetree/commit/349dd5b58a7d0226f3ee9aff11eb9dbb1b8fc4c6))
* add version endpoint and GitHub update notice ([632fabe](https://github.com/heapoftrash/filetree/commit/632fabe66507fe0c3be1763ad33135cd56de38c2))
* **auth:** single password field with plaintext/bcrypt detection ([764ee2b](https://github.com/heapoftrash/filetree/commit/764ee2b9af3b8acc8d9a85b944f1a6fe18f60c39))
* **ci:** add Release Please, remove git-cliff changelog ([676e4ab](https://github.com/heapoftrash/filetree/commit/676e4abfee543be6ebcbd282a9932dc73fc9bad7))
* **ci:** update ci ([36eadbc](https://github.com/heapoftrash/filetree/commit/36eadbc396dcf7a71adc987a61da5ad7c18f88ec))
* **ci:** update lint job ([42d2596](https://github.com/heapoftrash/filetree/commit/42d25968afcede10b6722465a16e993a39fda85a))
* **docs:** added screen record gif for readme and docs ([d4d65b8](https://github.com/heapoftrash/filetree/commit/d4d65b83963eb01c8489ef966c826b25beea984e))
* **docs:** added screen record gif for readme and docs ([224a639](https://github.com/heapoftrash/filetree/commit/224a639e8cdda989f66c4bb9a75b764a5645bd6e))
* **docs:** update docs ([05c4b9f](https://github.com/heapoftrash/filetree/commit/05c4b9ffe76f94c4660cf2decd92ff6778791f81))
* **docs:** update docs site homepage ([6be0cc0](https://github.com/heapoftrash/filetree/commit/6be0cc0503d4a1ce106750e5db39d10df7994bc1))
* move server to app/ and Vite UI to app/web/ to produce single binary with UI assets embeded ([9a28ebd](https://github.com/heapoftrash/filetree/commit/9a28ebdcc5fa572b8475a6d924931997cad63fa0))
* tag release workflow for multi-arch binaries and GHCR ([9f7084f](https://github.com/heapoftrash/filetree/commit/9f7084f7ff8bdd0ddf52a5e5e9b38531ff166938))
* **trash:** trash redesign ([a204e09](https://github.com/heapoftrash/filetree/commit/a204e099b02b13ce666a3c945a90379b2d94db47))
* **ui:** show version and release link in sidebar footer ([a30b5f8](https://github.com/heapoftrash/filetree/commit/a30b5f88fb10de00e0fa53f18b125ae01f7c57ae))
* **ui:** styling changes when content opens in new tab ([5e02d5f](https://github.com/heapoftrash/filetree/commit/5e02d5fc5a7f185293bebd7a8b6eec2955ccecc7))
* **ui:** styling changes when content opens in new tab ([feaad0b](https://github.com/heapoftrash/filetree/commit/feaad0b332c2f490abaee1f03a28dda66f422d2f))
* **versioning:** add github endpoint and version update notice ([d65de42](https://github.com/heapoftrash/filetree/commit/d65de4293a9a3eed405e8b7c01b8443805c30673))


### Bug Fixes

* actions auto labeler change labeler config per v5 closes [#22](https://github.com/heapoftrash/filetree/issues/22) ([0fd0ed0](https://github.com/heapoftrash/filetree/commit/0fd0ed0297dbaf08140fcc8e9a3fd277d48336a9))
* avoid fake Latest badge when version is not semver ([7fa4976](https://github.com/heapoftrash/filetree/commit/7fa49769a26bb128a9a06648b02d80f63cd7f75b))
* avoid poisoning version cache on canceled GitHub fetch ([91bef17](https://github.com/heapoftrash/filetree/commit/91bef17bc3b5ef256370f45e568e6c21d490f357))
* **ci:** build Containerfile frontend stage on native platform only ([9284653](https://github.com/heapoftrash/filetree/commit/9284653410c870243403b2b08799985d9e142aab))
* **ci:** build Containerfile frontend stage on native platform only ([f1a02d1](https://github.com/heapoftrash/filetree/commit/f1a02d10894238fbcba3015ea3cd5c6bb4c33a6c))
* **ci:** labeler branch chechout ([2c936d8](https://github.com/heapoftrash/filetree/commit/2c936d896046597d439d3d1f6fb21270d3cbf607))
* **ci:** labeler branch chechout ([850d7b1](https://github.com/heapoftrash/filetree/commit/850d7b1e1b85db997a0c5e4fdc01b321902f3cef))
* **ci:** labeler branch chechout ([dedde80](https://github.com/heapoftrash/filetree/commit/dedde80f29f21ecfcd0546d8f4cf0472953df4c0))
* **ci:** labeler branch chechout ([22f123c](https://github.com/heapoftrash/filetree/commit/22f123c9fd58df14576220b051f834917b3a5610))
* **ci:** mark GitHub prereleases when tag contains hyphen ([e14023b](https://github.com/heapoftrash/filetree/commit/e14023b86c057df10d592937b2c025314297a05e))
* **ci:** node memory, run ci for tagged push ([4909572](https://github.com/heapoftrash/filetree/commit/49095725026ba1d807088ee23bd5cda056e85eaa))
* **ci:** run changelog workflow on PR head branch ([45a48dc](https://github.com/heapoftrash/filetree/commit/45a48dc8d8b641c4cab625f8dfd9e50f35062b5d))
* **ci:** stop main branch from overwriting GHCR latest ([2740c7e](https://github.com/heapoftrash/filetree/commit/2740c7e245f0e5d579108bf8f5d83e0de725991d))
* **docs:** readme update ([e5ccfcd](https://github.com/heapoftrash/filetree/commit/e5ccfcdf2f07d0f043c534ce0e4f0dc0b25fd62e))
* **docs:** some docs change ([3cee28f](https://github.com/heapoftrash/filetree/commit/3cee28f26281ced27d8bb2874755acf9bd973c84))
* enable lint in ci ([31c3f59](https://github.com/heapoftrash/filetree/commit/31c3f5999716ad209ca9f8272ce35ade6713fcee))
* **frontend:** antd upgrade to v6 cssVar is typed ([cf3399d](https://github.com/heapoftrash/filetree/commit/cf3399d98031385e6d8cf4cb8c6b6ba13834c504))
* **frontend:** sort trash buckets by timestamp, not locale date label ([3881a0a](https://github.com/heapoftrash/filetree/commit/3881a0a2da75c3c68f08bc7402727f88c3e85540))
* **gitignore:** exclude test data dir ([318a559](https://github.com/heapoftrash/filetree/commit/318a55920de2ce405eb48ae328cef20005d1c965))
* handle resp.Body.Close errors in version handler ([7cc86a1](https://github.com/heapoftrash/filetree/commit/7cc86a1065db524fd55ea913af58bec518c5702d))
* moving to github, update go imports from local to github ([c43a239](https://github.com/heapoftrash/filetree/commit/c43a2391982992c04bef732469c59e3db56cfaa0))
* README ([edbc897](https://github.com/heapoftrash/filetree/commit/edbc89718a6e247958f03c6bc7307147896a5cae))
* **ui:** keep sidebar version block pinned to bottom ([ac33eff](https://github.com/heapoftrash/filetree/commit/ac33eff5fc7ee7deb420d68f2220970073b5e6fa))
* **ui:** show Latest as a tag only when up to date ([ccecee4](https://github.com/heapoftrash/filetree/commit/ccecee48774d762c324734ece9df3ac8d59245be))
* Update README to include goreportcard ([48017e3](https://github.com/heapoftrash/filetree/commit/48017e3ec729aa4d0e1fe81c14345a5704dcef3f))


### Reverts

* **ci:** restore changelog workflow push to main ([c9d6c17](https://github.com/heapoftrash/filetree/commit/c9d6c173287a56473bd4c7743b9d7a48247b72e7))

## [0.0.5](https://github.com/heapoftrash/filetree/compare/v0.0.4-beta.2...v0.0.5) (2026-03-27)


### Features

* embed version and commit in builds; `GET /api/version` with GitHub release/tag lookup and update UI

## [0.0.4-beta.2](https://github.com/heapoftrash/filetree/compare/v0.0.4-beta.1...v0.0.4-beta.2) (2026-03-27)


### Bug Fixes

* **ci:** build Containerfile frontend stage on native platform only ([9284653](https://github.com/heapoftrash/filetree/commit/9284653410c870243403b2b08799985d9e142aab))
* **ci:** build Containerfile frontend stage on native platform only ([f1a02d1](https://github.com/heapoftrash/filetree/commit/f1a02d10894238fbcba3015ea3cd5c6bb4c33a6c))

## [0.0.4-beta.1](https://github.com/heapoftrash/filetree/compare/v0.0.4-beta...v0.0.4-beta.1) (2026-03-27)


### Features

* actions auto labeler ([349dd5b](https://github.com/heapoftrash/filetree/commit/349dd5b58a7d0226f3ee9aff11eb9dbb1b8fc4c6))
* **auth:** single password field with plaintext/bcrypt detection ([764ee2b](https://github.com/heapoftrash/filetree/commit/764ee2b9af3b8acc8d9a85b944f1a6fe18f60c39))
* **ci:** add Release Please, remove git-cliff changelog ([676e4ab](https://github.com/heapoftrash/filetree/commit/676e4abfee543be6ebcbd282a9932dc73fc9bad7))
* **ci:** update ci ([36eadbc](https://github.com/heapoftrash/filetree/commit/36eadbc396dcf7a71adc987a61da5ad7c18f88ec))
* **ci:** update lint job ([42d2596](https://github.com/heapoftrash/filetree/commit/42d25968afcede10b6722465a16e993a39fda85a))
* **docs:** added screen record gif for readme and docs ([d4d65b8](https://github.com/heapoftrash/filetree/commit/d4d65b83963eb01c8489ef966c826b25beea984e))
* **docs:** added screen record gif for readme and docs ([224a639](https://github.com/heapoftrash/filetree/commit/224a639e8cdda989f66c4bb9a75b764a5645bd6e))
* **docs:** update docs ([05c4b9f](https://github.com/heapoftrash/filetree/commit/05c4b9ffe76f94c4660cf2decd92ff6778791f81))
* **docs:** update docs site homepage ([6be0cc0](https://github.com/heapoftrash/filetree/commit/6be0cc0503d4a1ce106750e5db39d10df7994bc1))
* move server to app/ and Vite UI to app/web/ to produce single binary with UI assets embeded ([9a28ebd](https://github.com/heapoftrash/filetree/commit/9a28ebdcc5fa572b8475a6d924931997cad63fa0))
* tag release workflow for multi-arch binaries and GHCR ([9f7084f](https://github.com/heapoftrash/filetree/commit/9f7084f7ff8bdd0ddf52a5e5e9b38531ff166938))
* **trash:** trash redesign ([a204e09](https://github.com/heapoftrash/filetree/commit/a204e099b02b13ce666a3c945a90379b2d94db47))
* **ui:** styling changes when content opens in new tab ([5e02d5f](https://github.com/heapoftrash/filetree/commit/5e02d5fc5a7f185293bebd7a8b6eec2955ccecc7))
* **ui:** styling changes when content opens in new tab ([feaad0b](https://github.com/heapoftrash/filetree/commit/feaad0b332c2f490abaee1f03a28dda66f422d2f))


### Bug Fixes

* actions auto labeler change labeler config per v5 closes [#22](https://github.com/heapoftrash/filetree/issues/22) ([0fd0ed0](https://github.com/heapoftrash/filetree/commit/0fd0ed0297dbaf08140fcc8e9a3fd277d48336a9))
* **ci:** labeler branch chechout ([2c936d8](https://github.com/heapoftrash/filetree/commit/2c936d896046597d439d3d1f6fb21270d3cbf607))
* **ci:** labeler branch chechout ([850d7b1](https://github.com/heapoftrash/filetree/commit/850d7b1e1b85db997a0c5e4fdc01b321902f3cef))
* **ci:** labeler branch chechout ([dedde80](https://github.com/heapoftrash/filetree/commit/dedde80f29f21ecfcd0546d8f4cf0472953df4c0))
* **ci:** labeler branch chechout ([22f123c](https://github.com/heapoftrash/filetree/commit/22f123c9fd58df14576220b051f834917b3a5610))
* **ci:** mark GitHub prereleases when tag contains hyphen ([e14023b](https://github.com/heapoftrash/filetree/commit/e14023b86c057df10d592937b2c025314297a05e))
* **ci:** node memory, run ci for tagged push ([4909572](https://github.com/heapoftrash/filetree/commit/49095725026ba1d807088ee23bd5cda056e85eaa))
* **ci:** run changelog workflow on PR head branch ([45a48dc](https://github.com/heapoftrash/filetree/commit/45a48dc8d8b641c4cab625f8dfd9e50f35062b5d))
* **ci:** stop main branch from overwriting GHCR latest ([2740c7e](https://github.com/heapoftrash/filetree/commit/2740c7e245f0e5d579108bf8f5d83e0de725991d))
* **docs:** readme update ([e5ccfcd](https://github.com/heapoftrash/filetree/commit/e5ccfcdf2f07d0f043c534ce0e4f0dc0b25fd62e))
* **docs:** some docs change ([3cee28f](https://github.com/heapoftrash/filetree/commit/3cee28f26281ced27d8bb2874755acf9bd973c84))
* enable lint in ci ([31c3f59](https://github.com/heapoftrash/filetree/commit/31c3f5999716ad209ca9f8272ce35ade6713fcee))
* **frontend:** antd upgrade to v6 cssVar is typed ([cf3399d](https://github.com/heapoftrash/filetree/commit/cf3399d98031385e6d8cf4cb8c6b6ba13834c504))
* **frontend:** sort trash buckets by timestamp, not locale date label ([3881a0a](https://github.com/heapoftrash/filetree/commit/3881a0a2da75c3c68f08bc7402727f88c3e85540))
* **gitignore:** exclude test data dir ([318a559](https://github.com/heapoftrash/filetree/commit/318a55920de2ce405eb48ae328cef20005d1c965))
* moving to github, update go imports from local to github ([c43a239](https://github.com/heapoftrash/filetree/commit/c43a2391982992c04bef732469c59e3db56cfaa0))
* README ([edbc897](https://github.com/heapoftrash/filetree/commit/edbc89718a6e247958f03c6bc7307147896a5cae))
* Update README to include goreportcard ([48017e3](https://github.com/heapoftrash/filetree/commit/48017e3ec729aa4d0e1fe81c14345a5704dcef3f))


### Reverts

* **ci:** restore changelog workflow push to main ([c9d6c17](https://github.com/heapoftrash/filetree/commit/c9d6c173287a56473bd4c7743b9d7a48247b72e7))

## [0.0.3-beta.1](https://github.com/heapoftrash/filetree/compare/v0.0.3-beta...v0.0.3-beta.1) (2026-03-26)


### Features

* **ci:** add Release Please, remove git-cliff changelog ([676e4ab](https://github.com/heapoftrash/filetree/commit/676e4abfee543be6ebcbd282a9932dc73fc9bad7))
* tag release workflow for multi-arch binaries and GHCR ([9f7084f](https://github.com/heapoftrash/filetree/commit/9f7084f7ff8bdd0ddf52a5e5e9b38531ff166938))


### Bug Fixes

* **ci:** mark GitHub prereleases when tag contains hyphen ([e14023b](https://github.com/heapoftrash/filetree/commit/e14023b86c057df10d592937b2c025314297a05e))
* **ci:** run changelog workflow on PR head branch ([45a48dc](https://github.com/heapoftrash/filetree/commit/45a48dc8d8b641c4cab625f8dfd9e50f35062b5d))
* **ci:** stop main branch from overwriting GHCR latest ([2740c7e](https://github.com/heapoftrash/filetree/commit/2740c7e245f0e5d579108bf8f5d83e0de725991d))


### Reverts

* **ci:** restore changelog workflow push to main ([c9d6c17](https://github.com/heapoftrash/filetree/commit/c9d6c173287a56473bd4c7743b9d7a48247b72e7))

## [0.0.3-beta](2026-03-26)

### Features

* Multi-arch release workflow, GHCR images, and embedded-UI binaries for tagged releases.

### Bug Fixes

### Miscellaneous
