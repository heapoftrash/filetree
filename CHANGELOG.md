# Changelog

All notable changes to this project are documented in this file.

This file is **generated** by [git-cliff](https://github.com/orhun/git-cliff) from the git history on each push to `main` (see `.github/workflows/changelog.yml`). Edit commit messages, not this file.

## [unreleased]

### Added

- Tag release workflow for multi-arch binaries and GHCR

### Fixed

- *(ci)* Mark GitHub prereleases when tag contains hyphen
- *(ci)* Stop main branch from overwriting GHCR latest
## [0.0.3-beta] - 2026-03-26

### Added

- *(ui)* Styling changes when content opens in new tab
- *(docs)* Added screen record gif for readme and docs
- *(docs)* Update docs site homepage
- *(trash)* Trash redesign
- Move server to app/ and Vite UI to app/web/ to produce single binary with UI assets embeded

### Fixed

- *(ci)* Labeler branch chechout
- *(ci)* Labeler branch chechout
- *(ci)* Labeler branch chechout
- *(frontend)* Sort trash buckets by timestamp, not locale date label

### Maintenance

- *(docs)* Update readme
- *(docs)* Update readme
## [0.0.2-beta] - 2026-03-23

### Added

- *(docs)* Update docs
- *(auth)* Single password field with plaintext/bcrypt detection
## [0.0.1-beta] - 2026-03-21

### Fixed

- *(ci)* Node memory, run ci for tagged push
- *(docs)* Some docs change
- *(docs)* Readme update
- *(ci)* Labeler branch chechout
- Update README to include goreportcard
## [0.0.1-beta.1] - 2026-03-20

### Added

- *(ci)* Update ci
- *(ci)* Update lint job
- Actions auto labeler

### Fixed

- README
- Enable lint in ci
- Moving to github, update go imports from local to github
- *(gitignore)* Exclude test data dir
- *(frontend)* Antd upgrade to v6 cssVar is typed
- Actions auto labeler change labeler config per v5 closes #22

### Maintenance

- Initial commit, moving to github
- *(deps)* Bump actions/setup-node from 4 to 6
- *(deps)* Bump actions/setup-go from 5 to 6
- *(deps)* Bump actions/checkout from 4 to 6
- *(deps-dev)* Bump @commitlint/cli from 19.8.1 to 20.5.0
- *(deps-dev)* Bump @commitlint/config-conventional
- *(deps)* Bump antd from 5.29.3 to 6.3.3 in /frontend
- *(deps)* Bump github.com/gin-gonic/gin in /backend
- *(deps)* Bump react and @types/react in /frontend
- *(deps)* Bump react-router-dom from 6.30.3 to 7.13.1 in /frontend
- *(deps-dev)* Bump vite from 5.4.21 to 8.0.0 in /frontend
- *(frontend)* React 19 type updates
- *(docs)* Initial commit for docs
- *(docs)* Initial commit for docs - final
- *(docs)* Tweaks for docs frontend
- *(docs)* Add ci for docs and push to github pages
- *(docs)* Add github social in docs footer
- *(docs)* Added assets for docs and the new docs push to github pages
- *(docs)* Change site title
- *(docs)* Added screenshot and gif for docs
- *(docs)* Adjust styling and svg
- *(docs)* Adjust styling and svg
- *(docs)* Adjust styling and svg
- *(docs)* Added a announce system via mkdocs config and styling
- *(docs)* Fix nav bar issue when not sticky
- *(docs)* Readme and docs styling
- *(docs)* Readme with new animated logo
- *(docs)* Final
- *(docs)* Final styling
- *(docs)* Final styling
- *(docs)* Final docs
- *(docs)* Final docs
- *(docs)* Docs content
- *(docs)* Docs content
- *(container)* Adding container support
- *(container)* Restructure ci
- *(container)* Support container image & restructure CI
- Actions auto labeler closes #22
