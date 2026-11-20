"""CPU Semantic Camouflage Engine & 2D PCA Projection.

Architecture rules:
- Uses sentence-transformers/all-MiniLM-L6-v2 on CPU (inputs < 300 tokens, English).
- Computes c_eval (30 eval prompts) and c_civil (30 civil prompts) centroids from data/calibration_prompts.json.
- Projects calibration space and candidate prompts to 2D via scikit-learn PCA.
- Evaluates pre-curated narrative paraphrases (with frozen technical entities) maximizing:
    cos(e_x', c_civil) - cos(e_x', c_eval) + cos(e_x', e_x)
  subject to:
    cos(e_x', e_x) >= 0.78
"""
