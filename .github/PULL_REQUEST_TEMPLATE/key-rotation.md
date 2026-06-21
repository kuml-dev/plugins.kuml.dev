## Public-Key Rotation for `<plugin-id>`

**Plugin ID:**
**Reason:** (lost key / suspected compromise / scheduled rotation)
**Effective date for new key:** YYYY-MM-DD

### Files in this PR

- [ ] `public/plugins/<id>/kuml-plugin.json` — `signaturePublicKey` updated to new fingerprint
- [ ] Old key documented in a comment or separate `key-history.md` inside the plugin folder

### Attestation

- [ ] All future releases will be signed with the new key.
- [ ] Old releases remain verifiable (their signatures were made with the old key which is documented).
- [ ] I understand that a 24 h manual review window applies to key rotations before this PR can be merged.
