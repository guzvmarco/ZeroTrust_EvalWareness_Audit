"""Merkle Audit Ledger (MAL) with Unicode NFC, RFC 8785 (JCS), and RFC 6962 Domain Separation.

Strict Cryptography Rules:
- Normalize all text fields with unicodedata.normalize("NFC", s) before serialization.
- Commit full `MerkleLeafPayload` including `max_tokens`, `deployment_context_A`,
  and `deployment_context_B` into the canonicalized leaf.
- Serialize strictly with rfc8785.dumps() (Trail of Bits). NEVER use json.dumps() for hashing.
- Pure-Python RFC 6962 Merkle Tree:
    Leaf = SHA-256(b"\\x00" + payload_jcs)
    Node = SHA-256(b"\\x01" + left + right)
- Supports export to audit_dossier.json and 1-bit tamper simulation.
"""
