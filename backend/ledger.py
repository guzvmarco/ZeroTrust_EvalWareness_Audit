"""Merkle Audit Ledger (MAL) with Unicode NFC, RFC 8785 (JCS), and RFC 6962 Domain Separation.

Strict Cryptography Rules:
- Normalize all text fields with `unicodedata.normalize("NFC", s)` before serialization.
- Round float fields (`ttft_A`, `ttft_B`, `cdi_risk`, `cdi_signed`, `refusal_delta`)
  to 4 decimal places before `rfc8785.dumps()` serialization to avoid IEEE 754 float
  re-serialization drift.
- Commit full `MerkleLeafPayload` including `max_tokens`, `deployment_context_A`,
  and `deployment_context_B` into the canonicalized leaf.
- Serialize strictly with `rfc8785.dumps()` (Trail of Bits). NEVER use `json.dumps()` for hashing.
- Pure-Python RFC 6962 Merkle Tree:
    Leaf = SHA-256(b"\\x00" + payload_jcs)
    Node = SHA-256(b"\\x01" + left + right)
- In `simulate_tamper()`, mutate 1 byte directly in `output_B` of the canonicalized payload.
"""

import hashlib
import unicodedata
from typing import Any

from backend.schemas import MerkleLeafPayload, TamperTestResponse


def normalize_nfc(value: Any) -> Any:
    """Recursively normalize all strings in dicts/lists to Unicode NFC."""
    if isinstance(value, str):
        return unicodedata.normalize("NFC", value)
    if isinstance(value, list):
        return [normalize_nfc(item) for item in value]
    if isinstance(value, dict):
        return {normalize_nfc(k): normalize_nfc(v) for k, v in value.items()}
    return value


class MerkleLedger:
    """Skeleton RFC 8785 + RFC 6962 forensic audit ledger."""

    def __init__(self) -> None:
        self.leaves: list[dict[str, Any]] = []
        self.leaf_hashes: list[bytes] = []

    @staticmethod
    def canonicalize_payload(payload: MerkleLeafPayload) -> bytes:
        """Normalize payload to NFC, round float fields (`ttft_A`, `ttft_B`, `cdi_risk`, `cdi_signed`, `refusal_delta`) to 4 decimals, and serialize with `rfc8785.dumps()`."""
        _ = payload
        raise NotImplementedError("RFC 8785 canonicalization will use rfc8785.dumps().")

    @staticmethod
    def hash_leaf(payload_jcs: bytes) -> bytes:
        """RFC 6962 leaf hash: SHA-256(b'\\x00' + payload_jcs)."""
        return hashlib.sha256(b"\x00" + payload_jcs).digest()

    @staticmethod
    def hash_node(left: bytes, right: bytes) -> bytes:
        """RFC 6962 internal node hash: SHA-256(b'\\x01' + left + right)."""
        return hashlib.sha256(b"\x01" + left + right).digest()

    def append_leaf(self, payload: MerkleLeafPayload) -> str:
        """Append a sealed audit turn and return updated Merkle Root hex."""
        _ = payload
        raise NotImplementedError("Ledger leaf append not implemented yet.")

    def compute_root(self) -> str:
        """Compute RFC 6962 Merkle Root hex from current leaf hashes."""
        raise NotImplementedError("Merkle tree reduction not implemented yet.")

    def export_dossier(self) -> dict[str, Any]:
        """Export full `audit_dossier.json` bundle (blocks + Merkle root)."""
        raise NotImplementedError("Dossier export not implemented yet.")

    def simulate_tamper(self) -> TamperTestResponse:
        """Mutate 1 byte directly in `output_B` of the canonicalized payload and return TAMPERED mismatch proof."""
        raise NotImplementedError("1-bit tamper simulation not implemented yet.")
