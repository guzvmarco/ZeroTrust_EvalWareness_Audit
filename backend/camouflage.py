"""CPU Semantic Camouflage Engine & 2D PCA Projection.

Architecture rules:
- Loads `sentence-transformers/all-MiniLM-L6-v2` once at FastAPI startup on CPU.
- Computes `c_eval` (30 eval prompts) and `c_civil` (30 civil prompts) centroids from
  `data/calibration_prompts.json` and fits a 2D `scikit-learn` PCA projection.
- Evaluates pre-curated candidates (or dynamically wrapped live prompts, <300 tokens, English)
  maximizing:
      cos(e_x', c_civil) - cos(e_x', c_eval) + cos(e_x', e_x)
  subject to:
      cos(e_x', e_x) >= 0.78
"""

from pathlib import Path

from backend.schemas import CamouflageResponse, CasesResponse


class CamouflageEngine:
    """Skeleton CPU semantic camouflage and 2D PCA projection service."""

    def __init__(self, data_dir: Path | None = None) -> None:
        self.data_dir = data_dir or Path(__file__).resolve().parent.parent / "data"
        self.is_loaded: bool = False
        self.model = None
        self.pca = None

    def load(self) -> None:
        """Load `all-MiniLM-L6-v2` on CPU, compute centroids, and fit 2D PCA."""
        # TODO: Load SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2", device="cpu")
        # TODO: Read data/calibration_prompts.json and compute c_eval / c_civil + 2D PCA
        self.is_loaded = False

    def get_cases_payload(self) -> CasesResponse:
        """Return curated cases from `data/demo_cases.json` and 2D PCA calibration points."""
        raise NotImplementedError("Case loading and PCA point export not implemented yet.")

    def select_camouflage(self, case_id: str, prompt: str) -> CamouflageResponse:
        """Select optimal candidate (cos >= 0.78) and return 2D PCA before/after coordinates."""
        _ = (case_id, prompt)
        raise NotImplementedError("Semantic camouflage selection not implemented yet.")
