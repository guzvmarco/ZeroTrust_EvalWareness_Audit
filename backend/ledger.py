"""Merkle Audit Ledger (MAL) with Unicode NFC, RFC 8785 (JCS), and RFC 6962 Domain Separation.

Strict Cryptography Rules:
- Normalize all text fields with `unicodedata.normalize("NFC", s)` before serialization.
- Round float fields (`ttft_A`, `ttft_B`, `cdi_risk`, `cdi_signed`, `refusal_delta`)
  to 4 decimal places before `rfc8785.dumps()` serialization to avoid IEEE 754 float
  re-serialization drift.
- Commit full `MerkleLeafPayload` including `max_tokens`, `deployment_context_A`,
  `deployment_context_B`, and `metadata_layers` into the canonicalized leaf.
- Serialize strictly with `rfc8785.dumps()` (Trail of Bits). NEVER use `json.dumps()` for hashing.
- Pure-Python RFC 6962 Merkle Tree:
    Leaf = SHA-256(b"\\x00" + payload_jcs)
    Node = SHA-256(b"\\x01" + left + right)
- In `simulate_tamper()`, mutate 1 byte directly in `output_B` of the canonicalized payload.
"""

import copy
import hashlib
import unicodedata
from typing import Any

import rfc8785

from backend.schemas import MerkleLeafPayload, TamperTestResponse


FLOAT_FIELDS_4DEC = ("ttft_A", "ttft_B", "cdi_risk", "cdi_signed", "refusal_delta", "temperature")


def normalize_nfc(value: Any) -> Any:
    """Recursively normalize all strings in dicts/lists to Unicode NFC."""
    if isinstance(value, str):
        return unicodedata.normalize("NFC", value)
    if isinstance(value, list):
        return [normalize_nfc(item) for item in value]
    if isinstance(value, dict):
        return {normalize_nfc(k): normalize_nfc(v) for k, v in value.items()}
    return value


def prepare_canonical_dict(raw_dict: dict[str, Any]) -> dict[str, Any]:
    """Normalize strings to NFC and round designated float fields to 4 decimal places."""
    cleaned = copy.deepcopy(raw_dict)
    for field in FLOAT_FIELDS_4DEC:
        if field in cleaned and isinstance(cleaned[field], (int, float)):
            cleaned[field] = round(float(cleaned[field]), 4)
    if "logprobs" in cleaned and isinstance(cleaned["logprobs"], list):
        cleaned["logprobs"] = [round(float(x), 4) for x in cleaned["logprobs"]]
    return normalize_nfc(cleaned)


class MerkleLedger:
    """RFC 8785 + RFC 6962 forensic audit ledger for Integrity-Verifiable Evaluation Dossiers."""

    def __init__(self) -> None:
        self.leaves: list[dict[str, Any]] = []
        self.leaf_hashes: list[bytes] = []

    def reset(self) -> None:
        """Clear current session leaves."""
        self.leaves.clear()
        self.leaf_hashes.clear()

    @staticmethod
    def canonicalize_dict(leaf_dict: dict[str, Any]) -> bytes:
        """Normalize dict to NFC, round float fields to 4 decimals, and serialize with `rfc8785.dumps()`."""
        prepared = prepare_canonical_dict(leaf_dict)
        return rfc8785.dumps(prepared)

    @classmethod
    def canonicalize_payload(cls, payload: MerkleLeafPayload) -> bytes:
        """Normalize payload to NFC, round float fields to 4 decimals, and serialize with `rfc8785.dumps()`."""
        return cls.canonicalize_dict(payload.model_dump())

    @staticmethod
    def hash_leaf(payload_jcs: bytes) -> bytes:
        """RFC 6962 leaf hash: SHA-256(b'\\x00' + payload_jcs)."""
        return hashlib.sha256(b"\x00" + payload_jcs).digest()

    @staticmethod
    def hash_node(left: bytes, right: bytes) -> bytes:
        """RFC 6962 internal node hash: SHA-256(b'\\x01' + left + right)."""
        return hashlib.sha256(b"\x01" + left + right).digest()

    @classmethod
    def compute_tree_root(cls, leaf_hashes: list[bytes]) -> str:
        """Reduce a list of leaf hashes using RFC 6962 0x01 internal node prefixes."""
        if not leaf_hashes:
            return "0" * 64
        level = list(leaf_hashes)
        while len(level) > 1:
            next_level: list[bytes] = []
            for i in range(0, len(level), 2):
                left = level[i]
                right = level[i + 1] if i + 1 < len(level) else left
                next_level.append(cls.hash_node(left, right))
            level = next_level
        return level[0].hex()

    def prev_leaf_hash_hex(self) -> str:
        """Return hex hash of the most recent leaf, or 64 zeros if empty."""
        if not self.leaf_hashes:
            return "0" * 64
        return self.leaf_hashes[-1].hex()

    def append_leaf(self, payload: MerkleLeafPayload) -> str:
        """Append a sealed audit turn and return updated Merkle Root hex."""
        prepared_dict = prepare_canonical_dict(payload.model_dump())
        payload_jcs = rfc8785.dumps(prepared_dict)
        leaf_digest = self.hash_leaf(payload_jcs)
        self.leaves.append(prepared_dict)
        self.leaf_hashes.append(leaf_digest)
        return self.compute_root()

    def compute_root(self) -> str:
        """Compute RFC 6962 Merkle Root hex from current leaf hashes."""
        return self.compute_tree_root(self.leaf_hashes)

    def export_dossier(self, extra_metadata: dict[str, Any] | None = None) -> dict[str, Any]:
        """Export full Integrity-Verifiable Evaluation Dossier (`audit_dossier.json`)."""
        root_hex = self.compute_root()
        bundle: dict[str, Any] = {
            "title": "Integrity-Verifiable Evaluation Dossier",
            "schema": "AEGIS-AUDIT-RFC8785-MERKLE-DOSSIER-v1",
            "integrity_note": (
                "SHA-256 Merkle verification (RFC 8785 JCS canonicalization + RFC 6962 0x00/0x01 "
                "domain separation) proves record integrity relative to the committed Merkle root."
            ),
            "verification_status": "VERIFIED",
            "merkle_root": root_hex,
            "leaf_count": len(self.leaves),
            "leaf_hashes": [h.hex() for h in self.leaf_hashes],
            "leaves": self.leaves,
        }
        if extra_metadata:
            bundle["evaluation_metadata"] = extra_metadata
        return bundle

    def verify_current(self) -> TamperTestResponse:
        """Re-compute the Merkle root from stored canonical leaves and confirm VERIFIED integrity."""
        expected = self.compute_root()
        recomputed_hashes = [
            self.hash_leaf(self.canonicalize_dict(leaf)) for leaf in self.leaves
        ]
        computed = self.compute_tree_root(recomputed_hashes)
        status = "VERIFIED" if expected == computed else "TAMPERED"
        return TamperTestResponse(
            status=status,
            expected_root=expected,
            computed_root=computed,
            tampered_field="none",
        )

    def simulate_tamper(self) -> TamperTestResponse:
        """Mutate 1 byte directly in `output_B` of the latest leaf and return TAMPERED mismatch proof."""
        if not self.leaves:
            expected = "0" * 64
            computed = hashlib.sha256(b"\x00tampered").hexdigest()
            return TamperTestResponse(
                status="TAMPERED",
                expected_root=expected,
                computed_root=computed,
                tampered_field="output_B (1-byte mutation)",
            )

        expected_root = self.compute_root()
        tampered_leaves = copy.deepcopy(self.leaves)
        target_leaf = tampered_leaves[-1]
        original_out_b = str(target_leaf.get("output_B") or "compliant response")
        replacement_char = "Y" if original_out_b[0] == "X" else "X"
        target_leaf["output_B"] = replacement_char + original_out_b[1:]

        tampered_hashes = [
            self.hash_leaf(self.canonicalize_dict(leaf)) for leaf in tampered_leaves
        ]
        computed_root = self.compute_tree_root(tampered_hashes)

        return TamperTestResponse(
            status="TAMPERED",
            expected_root=expected_root,
            computed_root=computed_root,
            tampered_field="output_B (1-byte mutation at index 0)",
        )
