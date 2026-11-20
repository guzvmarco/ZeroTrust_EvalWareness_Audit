"""Standalone offline forensic dossier verifier.

Uses Unicode NFC + Trail of Bits rfc8785.dumps() + pure-Python RFC 6962 Merkle Tree
(0x00 leaf prefix, 0x01 internal node prefix) to verify an exported audit_dossier.json.
Returns one of three states: VERIFIED | TAMPERED | INCOMPLETE.
"""
