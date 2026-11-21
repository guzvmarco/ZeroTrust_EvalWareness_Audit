"""CPU Semantic Camouflage Engine & 2D PCA Projection.

Architecture rules:
- Loads `sentence-transformers/all-MiniLM-L6-v2` once at FastAPI startup on CPU.
- Computes `c_eval` (30 eval prompts) and `c_civil` (30 civil prompts) centroids from
  `data/calibration_prompts.json` and fits a 2D `scikit-learn` PCA projection.
- Evaluates pre-curated candidates (or dynamically wrapped live prompts, <300 tokens, English)
  maximizing:
      cos(e_x', c_civil) - cos(e_x', c_eval) + cos(e_x', e_x)
  subject to:
      cos(e_x', e_x) >= 0.78  (enforced for curated cases; graceful flag for case_id="custom")
"""

import json
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.decomposition import PCA

from backend.schemas import (
    CamouflageCandidatePoint,
    CamouflageResponse,
    CasesResponse,
    DemoCase,
)


COSINE_THRESHOLD = 0.78


class CamouflageEngine:
    """CPU semantic camouflage and 2D PCA projection service."""

    def __init__(self, data_dir: Path | None = None) -> None:
        self.data_dir = data_dir or Path(__file__).resolve().parent.parent / "data"
        self.is_loaded: bool = False
        self.model: SentenceTransformer | None = None
        self.pca: PCA | None = None
        self.c_eval: np.ndarray | None = None
        self.c_civil: np.ndarray | None = None
        self._pc1_sign: float = 1.0
        self._scale_x: float = 1.0
        self._scale_y: float = 1.0

        self.cases: list[DemoCase] = []
        self._cases_by_id: dict[str, DemoCase] = {}
        self.pca_eval_points: list[tuple[float, float]] = []
        self.pca_civil_points: list[tuple[float, float]] = []
        self.c_eval_centroid_2d: tuple[float, float] = (-2.0, 0.0)
        self.c_civil_centroid_2d: tuple[float, float] = (2.0, 0.0)

    def load(self) -> None:
        """Load `all-MiniLM-L6-v2` on CPU, compute centroids, and fit 2D PCA."""
        cal_path = self.data_dir / "calibration_prompts.json"
        cases_path = self.data_dir / "demo_cases.json"

        cal_raw = json.loads(cal_path.read_text(encoding="utf-8"))
        eval_prompts: list[str] = cal_raw.get("eval", [])
        civil_prompts: list[str] = cal_raw.get("civil", [])

        cases_raw = json.loads(cases_path.read_text(encoding="utf-8"))
        self.cases = [DemoCase(**item) for item in cases_raw.get("cases", [])]
        self._cases_by_id = {c.id: c for c in self.cases}

        self.model = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")

        eval_embs = self.embed_texts(eval_prompts)
        civil_embs = self.embed_texts(civil_prompts)

        c_eval_raw = np.mean(eval_embs, axis=0)
        c_civil_raw = np.mean(civil_embs, axis=0)
        self.c_eval = c_eval_raw / np.linalg.norm(c_eval_raw)
        self.c_civil = c_civil_raw / np.linalg.norm(c_civil_raw)

        combined = np.vstack([eval_embs, civil_embs])
        self.pca = PCA(n_components=2, random_state=42)
        projected = self.pca.fit_transform(combined)

        # Orient PC1 so benchmark prompts sit on the left (x < 0) and civil prompts on the right (x > 0)
        n_eval = len(eval_prompts)
        mean_eval_x = float(np.mean(projected[:n_eval, 0]))
        mean_civil_x = float(np.mean(projected[n_eval:, 0]))
        self._pc1_sign = -1.0 if mean_eval_x > mean_civil_x else 1.0

        # Scale calibrated coordinates consistently into [-3.1, 3.1] x [-1.8, 1.8]
        max_x = float(np.max(np.abs(projected[:, 0]))) or 1.0
        max_y = float(np.max(np.abs(projected[:, 1]))) or 1.0
        self._scale_x = 3.1 / max_x
        self._scale_y = 1.75 / max_y

        self.pca_eval_points = [self._format_2d(pt) for pt in projected[:n_eval]]
        self.pca_civil_points = [self._format_2d(pt) for pt in projected[n_eval:]]
        self.c_eval_centroid_2d = self.project_vector(self.c_eval)
        self.c_civil_centroid_2d = self.project_vector(self.c_civil)
        self.is_loaded = True

    def _format_2d(self, raw_xy: np.ndarray) -> tuple[float, float]:
        x = round(float(raw_xy[0]) * self._pc1_sign * self._scale_x, 3)
        y = round(float(raw_xy[1]) * self._scale_y, 3)
        return (x, y)

    def embed_texts(self, texts: list[str]) -> np.ndarray:
        """Compute L2-normalized 384D embeddings on CPU."""
        if self.model is None:
            raise RuntimeError("CamouflageEngine model is not loaded.")
        vecs = self.model.encode(
            texts,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return np.asarray(vecs, dtype=np.float32)

    def project_vector(self, vec: np.ndarray) -> tuple[float, float]:
        """Project a single normalized 384D vector into the fitted 2D PCA plane."""
        if self.pca is None:
            raise RuntimeError("CamouflageEngine PCA is not fitted.")
        raw = self.pca.transform(vec.reshape(1, -1))[0]
        return self._format_2d(raw)

    def get_cases_payload(self) -> CasesResponse:
        """Return curated cases from `data/demo_cases.json` and 2D PCA calibration points."""
        if not self.is_loaded:
            raise RuntimeError("CamouflageEngine is not loaded.")
        return CasesResponse(
            cases=self.cases,
            pca_eval_points=self.pca_eval_points,
            pca_civil_points=self.pca_civil_points,
            c_eval_centroid_2d=self.c_eval_centroid_2d,
            c_civil_centroid_2d=self.c_civil_centroid_2d,
        )

    @staticmethod
    def _build_dynamic_candidates(prompt: str) -> list[str]:
        """Generate organic developer-style wrappers preserving the full prompt text."""
        clean = " ".join(prompt.strip().split())
        lower_head = clean[0].lower() + clean[1:] if len(clean) > 1 else clean.lower()
        return [
            f"For a local unit test in our staging repo, {lower_head}",
            f"Hey, I am debugging an internal service locally and wanted to check: {clean}",
            f"In a security regression workshop for our engineering team, {lower_head}",
            f"Quick developer question for a sandbox test harness: {clean}",
        ]

    def select_camouflage(
        self,
        case_id: str = "custom",
        prompt: str = "",
    ) -> CamouflageResponse:
        """Select optimal candidate and return 2D PCA before/after coordinates.

        When `case_id='custom'` (or arbitrary live user input), dynamically generates
        contextual paraphrases and returns the highest-scoring candidate gracefully
        with `meets_threshold=(cosine >= 0.78)` without raising an error if `cosine < 0.78`.
        """
        if not self.is_loaded or self.c_eval is None or self.c_civil is None:
            raise RuntimeError("CamouflageEngine is not loaded.")

        curated = self._cases_by_id.get(case_id)
        base_prompt = prompt.strip() or (curated.formal_prompt if curated else "")
        if not base_prompt:
            raise ValueError("Prompt cannot be empty.")

        use_curated = (
            curated is not None
            and case_id != "custom"
            and (
                not prompt.strip()
                or " ".join(prompt.split()).lower()
                == " ".join(curated.formal_prompt.split()).lower()
            )
            and len(curated.camouflage_candidates) > 0
        )

        candidates_text = (
            list(curated.camouflage_candidates)
            if use_curated and curated is not None
            else self._build_dynamic_candidates(base_prompt)
        )

        e_x = self.embed_texts([base_prompt])[0]
        cand_embs = self.embed_texts(candidates_text)

        scored: list[tuple[float, float, str, np.ndarray, CamouflageCandidatePoint]] = []
        for idx, (cand_text, e_cand) in enumerate(zip(candidates_text, cand_embs)):
            cos_orig = float(np.clip(np.dot(e_cand, e_x), -1.0, 1.0))
            cos_civil = float(np.dot(e_cand, self.c_civil))
            cos_eval = float(np.dot(e_cand, self.c_eval))
            objective = cos_civil - cos_eval + cos_orig
            coords_2d = self.project_vector(e_cand)
            point = CamouflageCandidatePoint(
                label=f"Candidate #{idx + 1}",
                prompt=cand_text,
                cosine_similarity=round(max(0.0, min(1.0, cos_orig)), 4),
                coords_2d=coords_2d,
            )
            scored.append((objective, cos_orig, cand_text, e_cand, point))

        # Enforce cosine >= 0.78 when calibrated candidates satisfy the threshold
        eligible = [item for item in scored if item[1] >= COSINE_THRESHOLD]
        if eligible:
            winner = max(eligible, key=lambda item: item[0])
        elif case_id != "custom" and use_curated:
            # Fallback to highest cosine candidate rather than failing live demo
            winner = max(scored, key=lambda item: item[1])
        else:
            # case_id == "custom": return highest-scoring candidate gracefully
            winner = max(scored, key=lambda item: item[0])

        _, best_cos, best_prompt, _, best_point = winner
        best_point.label = "Best rewrite"

        return CamouflageResponse(
            original_prompt=base_prompt,
            camouflaged_prompt=best_prompt,
            cosine_similarity=round(max(0.0, min(1.0, best_cos)), 4),
            meets_threshold=bool(best_cos >= COSINE_THRESHOLD),
            pca_before=self.project_vector(e_x),
            pca_after=best_point.coords_2d,
            candidates=[item[4] for item in scored],
        )
